import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { DESK_Y, ambient, catFx, hovFor, type Ctx, type InputRef } from "./shared"
import { glowTex } from "./proc"

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

/* ------------------------------------------------------------------- cat */
/* One mesh per pose, each a single merged geometry (sit, loaf, two walking frames): the tail is a tube rooted
   inside the haunch, the legs are tapered limbs, nothing floats. One draw call. Frames are only
   requested while she moves; sitting costs a single timer to the end of the step. */
type Step = { p: [number, number]; act: "sit" | "loaf" | "bat"; dur: number; card?: string; y?: number }
const ROUTE: Step[] = [
  { p: [0.82, -0.62], act: "sit", dur: 9 },
  { p: [0.02, -0.25], act: "loaf", dur: 12, y: 0.035 },            // on the keyboard
  { p: [-0.62, 0.0], act: "bat", dur: 2.6, card: "mailsmith" },
  { p: [-1.0, 0.3], act: "sit", dur: 8 },
  { p: [0.55, 0.38], act: "bat", dur: 2.6, card: "hello" },
  { p: [0.3, -0.6], act: "sit", dur: 9 },
]
type V = [number, number, number]
const FUR = "#2a2320", FUR2 = "#3b322d"
function paint(g: THREE.BufferGeometry, color: string) {
  const c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3))
  return g
}
const ell = (p: V, r: V, color = FUR, rx = 0) => {
  const g = new THREE.SphereGeometry(1, 28, 20)
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, 0)), new THREE.Vector3(...r)))
  return paint(g, color)
}
const limb = (a: V, b: V, r0: number, r1: number, color = FUR) => {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), len = va.distanceTo(vb)
  const g = new THREE.CylinderGeometry(r1, r0, len, 16, 1)
  g.applyMatrix4(new THREE.Matrix4().compose(va.clone().add(vb).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()), new THREE.Vector3(1, 1, 1)))
  return paint(g, color)
}
const tube = (pts: V[], r: number) => {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)))
  const t = paint(new THREE.TubeGeometry(curve, 40, r, 12, false), FUR)
  const end = pts[pts.length - 1]
  return [t, ell(end, [r, r, r])]
}
const cone = (p: V, rz: number, rx = 0) => {
  const g = new THREE.ConeGeometry(0.013, 0.032, 12)
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, rz)), new THREE.Vector3(1, 1, 1)))
  return paint(g, FUR)
}
function face(hx: number, hy: number, hz: number, tilt = 0) {
  return [
    ell([hx, hy, hz], [0.036, 0.032, 0.034], FUR, tilt),
    cone([hx - 0.021, hy + 0.034, hz - 0.004], 0.28), cone([hx + 0.021, hy + 0.034, hz - 0.004], -0.28),
    ell([hx - 0.014, hy + 0.004, hz + 0.031], [0.005, 0.005, 0.004], "#c8ff7a"), ell([hx + 0.014, hy + 0.004, hz + 0.031], [0.005, 0.005, 0.004], "#c8ff7a"),
    ell([hx, hy - 0.006, hz + 0.034], [0.005, 0.004, 0.004], "#d99a8e"),
    (() => { const g = new THREE.TorusGeometry(0.031, 0.004, 10, 32); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(hx, hy - 0.026, hz - 0.008), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 + 0.2, 0, 0)), new THREE.Vector3(1, 1, 1))); return paint(g, "#CF5C36") })(),
  ]
}
function buildCat() {
  const m = (parts: THREE.BufferGeometry[]) => mergeGeometries(parts)!
  const sit = m([
    ell([0, 0.05, -0.035], [0.045, 0.05, 0.06]), ell([0, 0.098, 0.018], [0.036, 0.06, 0.04], FUR2, -0.25),
    ...face(0, 0.165, 0.045),
    limb([-0.016, 0.1, 0.04], [-0.016, 0.012, 0.055], 0.012, 0.009), limb([0.016, 0.1, 0.04], [0.016, 0.012, 0.055], 0.012, 0.009),
    ell([-0.016, 0.008, 0.062], [0.012, 0.008, 0.017], FUR2), ell([0.016, 0.008, 0.062], [0.012, 0.008, 0.017], FUR2),
    ell([-0.036, 0.009, 0.0], [0.011, 0.009, 0.028], FUR2), ell([0.036, 0.009, 0.0], [0.011, 0.009, 0.028], FUR2),
    ...tube([[0, 0.03, -0.075], [0, 0.012, -0.13], [0.045, 0.009, -0.158], [0.092, 0.013, -0.125], [0.1, 0.034, -0.085]], 0.009),
  ])
  const loaf = m([
    ell([0, 0.042, 0], [0.05, 0.042, 0.095]), ell([0, 0.034, 0.05], [0.04, 0.034, 0.05], FUR2),
    ...face(0, 0.058, 0.105, 0.2),
    ell([-0.02, 0.009, 0.118], [0.012, 0.009, 0.02], FUR2), ell([0.02, 0.009, 0.118], [0.012, 0.009, 0.02], FUR2),
    ...tube([[0, 0.03, -0.09], [0.045, 0.014, -0.125], [0.075, 0.011, -0.075], [0.068, 0.013, -0.01]], 0.009),
  ])
  const walk = (off: number) => m([
    ell([0, 0.085, 0], [0.034, 0.04, 0.085]), ell([0, 0.092, 0.06], [0.034, 0.042, 0.04], FUR2),
    ell([0, 0.103, 0.088], [0.024, 0.03, 0.03]),
    ...face(0, 0.118, 0.115),
    limb([-0.02, 0.08, 0.06], [-0.02, 0.008, 0.06 + off], 0.012, 0.008), limb([0.02, 0.08, 0.06], [0.02, 0.008, 0.06 - off], 0.012, 0.008),
    limb([-0.02, 0.08, -0.06], [-0.02, 0.008, -0.06 - off], 0.013, 0.008), limb([0.02, 0.08, -0.06], [0.02, 0.008, -0.06 + off], 0.013, 0.008),
    ell([-0.02, 0.007, 0.065 + off], [0.01, 0.007, 0.015], FUR2), ell([0.02, 0.007, 0.065 - off], [0.01, 0.007, 0.015], FUR2),
    ell([-0.02, 0.007, -0.06 - off], [0.01, 0.007, 0.015], FUR2), ell([0.02, 0.007, -0.06 + off], [0.01, 0.007, 0.015], FUR2),
    ...tube([[0, 0.09, -0.075], [0, 0.115, -0.14], [0, 0.17, -0.155], [0.012, 0.205, -0.125]], 0.009),
  ])
  return { sit, loaf, walkA: walk(0.03), walkB: walk(-0.03) }
}

export function Cat({ ctx }: { ctx: Ctx }) {
  const root = useRef<THREE.Group>(null!), mesh = useRef<THREE.Mesh>(null!)
  const geo = useMemo(buildCat, [])
  const st = useRef({ i: 0, t0: performance.now(), walking: false, ph: 0, hop: 0, x: 0.82, z: -0.62, yaw: 0, y: 0, pose: "" })
  const active = !ctx.focus || ctx.focus === "desk"

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.12), s = st.current
    if (!active || ctx.reduced) return
    const g = root.current, step = ROUTE[s.i], now = performance.now()
    let moving = false
    if (s.walking) {
      const dx = step.p[0] - s.x, dz = step.p[1] - s.z, d = Math.hypot(dx, dz)
      if (d < 0.02) { s.walking = false; s.t0 = now } else {
        moving = true
        const sp = 0.13 * dt
        s.x += (dx / d) * Math.min(sp, d); s.z += (dz / d) * Math.min(sp, d)
        let da = Math.atan2(dx, dz) - s.yaw; da = Math.atan2(Math.sin(da), Math.cos(da)); s.yaw += da * Math.min(1, dt * 6)
        s.ph += dt * 7
      }
    } else {
      const t = (now - s.t0) / 1000
      if (step.act === "bat" && step.card) catFx.card = t > 0.6 && t < step.dur - 0.3 ? step.card : null
      if (t > step.dur) { s.i = (s.i + 1) % ROUTE.length; s.walking = true; catFx.card = null }
    }
    const pose = moving ? (Math.sin(s.ph) > 0 ? "walkA" : "walkB") : step.act === "loaf" ? "loaf" : "sit"
    if (pose !== s.pose) { s.pose = pose; mesh.current.geometry = geo[pose as keyof typeof geo] }
    const hopT = s.hop > 0 ? (s.hop -= dt, Math.sin((1 - s.hop / 0.5) * Math.PI) * 0.1) : 0
    const ty = step.y && !s.walking ? step.y : 0
    s.y += (ty - s.y) * Math.min(1, dt * 5)
    g.position.set(s.x, DESK_Y + s.y + hopT + (moving ? Math.abs(Math.sin(s.ph)) * 0.004 : 0), s.z)
    g.rotation.y = s.yaw + (s.hop > 0 ? 0.5 : 0)
    g.rotation.z = step.act === "bat" && !s.walking ? Math.sin(now / 110) * 0.05 : 0
    if (moving || s.hop > 0 || (step.act === "bat" && !s.walking)) ambient.next = Math.min(ambient.next, 66)
    else if (!s.walking) ambient.next = Math.min(ambient.next, Math.max(60, (step.dur - (now - s.t0) / 1000) * 1000 + 20))
  })

  const click = (e: { stopPropagation: () => void; delta: number }) => {
    if (e.delta > 6) return
    e.stopPropagation()
    st.current.hop = 0.5
    ctx.toast(["Mrrp.", "Prrt?", "She allows it."][Math.floor(Math.random() * 3)]) // SPIKE COPY
  }
  return (
    <group ref={root} position={[0.82, DESK_Y, -0.62]} onClick={click} {...hovFor(ctx, "Cat")}>
      <mesh ref={mesh} geometry={geo.sit} castShadow><meshStandardMaterial vertexColors roughness={0.92} /></mesh>
    </group>
  )
}

/* ------------------------------------------------------------ eyes in the dark */
export function Eyes({ ctx, input }: { ctx: Ctx; input: InputRef }) {
  const g = useRef<THREE.Group>(null!), lids = useRef<THREE.Mesh[]>([]), pupils = useRef<THREE.Mesh[]>([])
  const mats = useRef<THREE.MeshBasicMaterial[]>([])
  const s = useRef({ a: 0, hidden: 0, nextBlink: 2, blink: 0 })
  const invalidate = useThree((st) => st.invalidate)
  const dark = ctx.theme === "dark" && !ctx.lamp
  const pos = new THREE.Vector3(-2.05, 1.02, -1.58)
  const tmp = useRef({ d: new THREE.Vector3(), f: new THREE.Vector3() })

  useEffect(() => { invalidate() }, [dark, invalidate])
  useFrame(({ camera, clock }, dtRaw) => {
    const dt = Math.min(dtRaw, 0.1), st = s.current, t = clock.elapsedTime
    camera.getWorldDirection(tmp.current.f)
    tmp.current.d.copy(pos).sub(camera.position).normalize()
    const ang = tmp.current.f.angleTo(tmp.current.d)
    if (ang < 0.2) st.hidden = 2.5
    else st.hidden = Math.max(0, st.hidden - dt)
    const want = dark && st.hidden <= 0 && !ctx.focus ? 1 : 0
    st.a += (want - st.a) * Math.min(1, dt * (want ? 1.2 : 7))
    mats.current.forEach((m) => { m.opacity = st.a })
    g.current.visible = st.a > 0.01
    if (t > st.nextBlink) { st.blink = 0.14; st.nextBlink = t + rnd(2.5, 6) }
    const k = st.blink > 0 ? (st.blink -= dt, 0.08) : 1
    lids.current.forEach((l) => l && (l.scale.y = k))
    pupils.current.forEach((p) => p && p.position.set(-input.current.px * 0.016, -input.current.py * 0.01, 0.03))
    if (dark && !ctx.reduced) ambient.next = Math.min(ambient.next, st.a > 0.01 || want ? 66 : 500)
  })
  return (
    <group ref={g} position={pos} visible={false}>
      {[-0.14, 0.14].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh ref={(m) => { if (m) lids.current[i] = m }} scale={[1, 1, 0.5]}>
            <sphereGeometry args={[0.05, 12, 8]} />
            <meshBasicMaterial ref={(m) => { if (m) mats.current[i * 2] = m }} color="#ffe08a" transparent opacity={0} toneMapped={false} depthWrite={false} />
          </mesh>
          <mesh ref={(m) => { if (m) pupils.current[i] = m }} position={[0, 0, 0.03]} scale={[0.35, 1, 1]}>
            <sphereGeometry args={[0.03, 8, 6]} />
            <meshBasicMaterial ref={(m) => { if (m) mats.current[i * 2 + 1] = m }} color="#05060a" transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* --------------------------------------------------------------- rubber duck */
export function Duck({ ctx }: { ctx: Ctx }) {
  const g = useRef<THREE.Group>(null!), hop = useRef(0)
  const invalidate = useThree((s) => s.invalidate)
  useFrame((_, dt) => {
    if (hop.current > 0) { hop.current = Math.max(0, hop.current - dt); g.current.position.y = 1.67 + Math.sin((1 - hop.current / 0.4) * Math.PI) * 0.07; g.current.rotation.y += dt * 14; invalidate() }
  })
  return (
    <group ref={g} position={[0.42, 1.67, -0.7]} onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); hop.current = 0.4; ctx.toast("Squeak. It has heard worse code.") /* SPIKE COPY */ }} {...hovFor(ctx, "Duck")}>
      <mesh position={[0, 0.03, 0]} castShadow><sphereGeometry args={[0.032, 14, 10]} /><meshStandardMaterial color="#ffd23f" roughness={0.45} /></mesh>
      <mesh position={[0, 0.068, 0.012]} castShadow><sphereGeometry args={[0.02, 12, 8]} /><meshStandardMaterial color="#ffd23f" roughness={0.45} /></mesh>
      <mesh position={[0, 0.066, 0.034]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.008, 0.016, 6]} /><meshStandardMaterial color="#ff8a3d" /></mesh>
    </group>
  )
}

/* soft additive halo, billboarded */
export function Glow({ position, color, size, opacity = 0.5 }: { position: [number, number, number]; color: string; size: number; opacity?: number }) {
  const map = useRef(glowTex()).current
  return (
    <sprite position={position} scale={[size, size, 1]} raycast={() => null}>
      <spriteMaterial map={map} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  )
}
