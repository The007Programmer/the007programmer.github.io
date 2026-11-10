import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { DESK_Y, ambient, catFx, hovFor, type Ctx, type InputRef } from "./shared"
import { glowTex } from "./proc"

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

/* ------------------------------------------------------------------- cat */
/* Three draw calls: torso+legs, head, tail, each one merged geometry with vertex colours.
   No frames while she is sitting: a timer wakes the scene only when a step ends. */
type Step = { p: [number, number]; act: "sit" | "loaf" | "bat"; dur: number; card?: string; y?: number }
const ROUTE: Step[] = [
  { p: [0.82, -0.62], act: "sit", dur: 9 },
  { p: [0.02, -0.25], act: "loaf", dur: 12, y: 0.035 },            // on the keyboard
  { p: [-0.62, 0.0], act: "bat", dur: 2.6, card: "mailsmith" },
  { p: [-1.0, 0.3], act: "sit", dur: 8 },
  { p: [0.55, 0.38], act: "bat", dur: 2.6, card: "hello" },
  { p: [0.3, -0.6], act: "sit", dur: 9 },
]
const part = (g: THREE.BufferGeometry, color: string, m?: THREE.Matrix4) => {
  const c = g.clone()
  if (m) c.applyMatrix4(m)
  const col = new THREE.Color(color), n = c.attributes.position.count, arr = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b }
  c.setAttribute("color", new THREE.BufferAttribute(arr, 3))
  return c
}
const T = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(1, 1, 1))
function buildCat() {
  const FUR = "#2b2f3a", FUR2 = "#3a3f4d"
  const cap = (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 6, 16)
  const torso = mergeGeometries([
    part(cap(0.04, 0.1), FUR, T(0, 0.06, 0, Math.PI / 2)),
    part(cap(0.032, 0.06), FUR2, T(0, 0.048, 0.03, Math.PI / 2)),
    ...[[-0.025, 0.07], [0.025, 0.07], [-0.025, -0.07], [0.025, -0.07]].map(([x, z]) => part(cap(0.011, 0.04), FUR, T(x, 0.03, z))),
  ])!
  const head = mergeGeometries([
    part(new THREE.SphereGeometry(0.036, 24, 18), FUR),
    part(new THREE.ConeGeometry(0.014, 0.03, 8), FUR, T(-0.022, 0.036, -0.004, 0, 0, 0.3)),
    part(new THREE.ConeGeometry(0.014, 0.03, 8), FUR, T(0.022, 0.036, -0.004, 0, 0, -0.3)),
    part(new THREE.SphereGeometry(0.005, 10, 8), "#c8ff7a", T(-0.014, 0.006, 0.031)),
    part(new THREE.SphereGeometry(0.005, 10, 8), "#c8ff7a", T(0.014, 0.006, 0.031)),
    part(new THREE.TorusGeometry(0.03, 0.005, 8, 24), "#FF5B4F", T(0, -0.03, 0.01, Math.PI / 2)),
  ])!
  const tail = mergeGeometries([
    part(cap(0.01, 0.12), FUR, T(0, 0, -0.06, Math.PI / 2)),
    part(cap(0.009, 0.06), FUR, T(0, 0.03, -0.12, 0.6)),
  ])!
  return { torso, head, tail }
}

export function Cat({ ctx }: { ctx: Ctx }) {
  const root = useRef<THREE.Group>(null!), body = useRef<THREE.Group>(null!), head = useRef<THREE.Group>(null!), tail = useRef<THREE.Group>(null!)
  const geo = useMemo(buildCat, [])
  const st = useRef({ i: 0, t0: performance.now(), walking: false, ph: 0, hop: 0, look: 0, x: 0.82, z: -0.62, yaw: 0, y: 0 })
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
        s.ph += dt * 9
      }
    } else {
      const t = (now - s.t0) / 1000
      if (step.act === "bat" && step.card) catFx.card = t > 0.6 && t < step.dur - 0.3 ? step.card : null
      if (t > step.dur) { s.i = (s.i + 1) % ROUTE.length; s.walking = true; catFx.card = null }
    }
    const sitting = !s.walking && (step.act === "sit" || step.act === "bat")
    const loaf = !s.walking && step.act === "loaf"
    const hopT = s.hop > 0 ? (s.hop -= dt, Math.sin((1 - s.hop / 0.5) * Math.PI) * 0.1) : 0
    const ty = step.y && !s.walking ? step.y : 0
    s.y += (ty - s.y) * Math.min(1, dt * 5)
    g.position.set(s.x, DESK_Y + s.y + hopT, s.z)
    g.rotation.y = s.yaw
    const b = body.current
    b.rotation.x += ((sitting ? -0.55 : 0) - b.rotation.x) * Math.min(1, dt * 6)
    b.scale.y += ((loaf ? 0.8 : 1) - b.scale.y) * Math.min(1, dt * 6)
    b.position.y = moving ? Math.abs(Math.sin(s.ph)) * 0.006 : 0
    b.rotation.z = moving ? Math.sin(s.ph) * 0.05 : 0
    s.look += ((s.hop > 0 ? 1 : 0) - s.look) * dt * 4
    head.current.rotation.y = (sitting ? Math.sin(now / 1800) * 0.25 : 0) + s.look * 0.6
    head.current.rotation.x = sitting ? 0.5 : loaf ? 0.2 : 0
    tail.current.rotation.z = Math.sin(now / (moving ? 260 : 900)) * (moving ? 0.35 : 0.5)
    tail.current.rotation.x = sitting || loaf ? 0.15 : 0.7
    // frames only while something is actually moving; otherwise one timer to the end of the step
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
      <group ref={body}>
        <mesh geometry={geo.torso} castShadow><meshStandardMaterial vertexColors roughness={0.95} /></mesh>
        <group ref={head} position={[0, 0.09, 0.105]}><mesh geometry={geo.head}><meshStandardMaterial vertexColors roughness={0.95} /></mesh></group>
        <group ref={tail} position={[0, 0.06, -0.12]} rotation={[0.7, 0, 0]}><mesh geometry={geo.tail}><meshStandardMaterial vertexColors roughness={0.95} /></mesh></group>
      </group>
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
    <sprite position={position} scale={[size, size, 1]}>
      <spriteMaterial map={map} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  )
}
