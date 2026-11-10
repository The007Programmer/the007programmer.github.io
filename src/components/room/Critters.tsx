import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { DESK_Y, ambient, hovFor, shadow, type Ctx, type InputRef } from "./shared"
import { glowTex } from "./proc"

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

/* --------------------------------------------------------- lucky cat figurine
   A still ceramic figurine, one merged mesh plus a paw that waves when you touch it. It never animates on its own,
   so it costs nothing when idle. (It replaces the walking cat, which needed a frame tick and four poses.) */
type V = [number, number, number]
function paint(g: THREE.BufferGeometry, color: string) {
  const c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3))
  return g
}
const ell = (p: V, r: V, color: string, rot: V = [0, 0, 0]) => {
  const g = new THREE.SphereGeometry(1, 32, 24)
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...r)))
  return paint(g, color)
}
const CREAM = "#EEE5E9", RED = "#CF5C36", GOLD = "#EFC88B", INK = "#1d1612"
function buildFigurine() {
  const ear = (x: number) => { const g = new THREE.ConeGeometry(0.014, 0.03, 16); g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, 0.15, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -x * 12)), new THREE.Vector3(1, 1, 1))); return paint(g, CREAM) }
  const collar = new THREE.TorusGeometry(0.03, 0.005, 12, 40); collar.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(0, 0.098, 0.004), new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 + 0.15, 0, 0)), new THREE.Vector3(1, 1, 1)))
  return mergeGeometries([
    ell([0, 0.045, 0], [0.04, 0.05, 0.034], CREAM),
    ell([0, 0.0, 0], [0.043, 0.01, 0.037], RED),                 // base ring
    ell([0, 0.12, 0.004], [0.037, 0.032, 0.033], CREAM),         // head
    ear(-0.024), ear(0.024),
    paint(collar, RED),
    ell([0, 0.088, 0.034], [0.009, 0.009, 0.008], GOLD),         // bell
    ell([-0.014, 0.125, 0.03], [0.0045, 0.0045, 0.003], INK), ell([0.014, 0.125, 0.03], [0.0045, 0.0045, 0.003], INK),
    ell([0, 0.115, 0.036], [0.005, 0.004, 0.003], RED),
    ell([-0.02, 0.06, 0.03], [0.013, 0.02, 0.012], CREAM),       // resting paw
  ])!
}

export function Figurine({ ctx }: { ctx: Ctx }) {
  const arm = useRef<THREE.Group>(null!), wave = useRef(0)
  const geo = useMemo(buildFigurine, [])
  const invalidate = useThree((s) => s.invalidate)
  useFrame((_, dt) => {
    if (wave.current > 0) {
      wave.current = Math.max(0, wave.current - dt)
      arm.current.rotation.z = -0.5 + Math.sin(wave.current * 14) * 0.5 * Math.min(1, wave.current)
      shadow.dirty = true; invalidate()
    }
  })
  const click = (e: { stopPropagation: () => void; delta: number }) => {
    if (e.delta > 6) return
    e.stopPropagation(); wave.current = 1.6
    ctx.toast("Lucky.") // SPIKE COPY
    invalidate()
  }
  return (
    <group position={[0.68, DESK_Y, -0.62]} rotation={[0, -0.3, 0]} onClick={click} {...hovFor(ctx, "Lucky cat")}>
      <mesh geometry={geo} castShadow><meshStandardMaterial vertexColors roughness={0.25} metalness={0.02} /></mesh>
      {/* the waving paw */}
      <group ref={arm} position={[0.028, 0.07, 0.01]} rotation={[0, 0, -0.5]}>
        <mesh position={[0.0, 0.03, 0]} castShadow><capsuleGeometry args={[0.011, 0.04, 6, 16]} /><meshStandardMaterial color={CREAM} roughness={0.25} /></mesh>
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
    <sprite position={position} scale={[size, size, 1]} raycast={() => null}>
      <spriteMaterial map={map} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  )
}
