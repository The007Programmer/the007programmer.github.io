import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { DESK_Y, ambient, hovFor, shadow, type Ctx, type InputRef } from "./shared"
import { glowTex } from "./proc"

const rnd = (a: number, b: number) => a + Math.random() * (b - a)

/* --------------------------------------------------------- lucky cat figurine
   A still ceramic maneki-neko: lathe-turned pear body, head with inner ears, blush, whiskers, bib, collar and bell,
   a koban coin in the resting paw, and a raised paw that waves when you touch it. One merged mesh plus the waving
   arm. Nothing animates on its own, so it costs nothing while idle. */
type V = [number, number, number]
function paint(g: THREE.BufferGeometry, color: string) {
  const c = new THREE.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b }
  g.setAttribute("color", new THREE.BufferAttribute(a, 3))
  return g
}
const place = (g: THREE.BufferGeometry, p: V, rot: V = [0, 0, 0], sc: V = [1, 1, 1]) => {
  g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new THREE.Vector3(...sc)))
  return g
}
const ell = (p: V, r: V, color: string, rot: V = [0, 0, 0]) => paint(place(new THREE.SphereGeometry(1, 40, 28), p, rot, r), color)
const CREAM = "#F1E8E2", PINK = "#E8A09A", RED = "#C4452B", GOLD = "#E9B957", INK = "#1d1612", GREY = "#b9aea6"
function buildFigurine() {
  // body: one lathe profile, base to neck
  const prof = [[0.001, 0], [0.046, 0], [0.048, 0.006], [0.047, 0.014], [0.05, 0.03], [0.048, 0.05], [0.04, 0.075], [0.03, 0.092], [0.026, 0.1], [0.001, 0.1]].map(([x, y]) => new THREE.Vector2(x, y))
  const body = paint(new THREE.LatheGeometry(prof, 64), CREAM)
  const base = paint(new THREE.CylinderGeometry(0.052, 0.054, 0.012, 64), RED); place(base, [0, 0.006, 0])
  const ear = (x: number) => [
    paint(place(new THREE.ConeGeometry(0.0155, 0.034, 24), [x, 0.165, -0.002], [0, 0, -x * 9]), CREAM),
    paint(place(new THREE.ConeGeometry(0.01, 0.024, 24), [x * 0.98, 0.1625, 0.006], [0, 0, -x * 9]), PINK),
  ]
  const collar = paint(place(new THREE.TorusGeometry(0.031, 0.0055, 16, 56), [0, 0.1, 0.002], [Math.PI / 2 + 0.12, 0, 0]), RED)
  const bib = paint(place(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), [0, 0.092, 0.028], [Math.PI / 2 + 0.3, 0, 0], [0.026, 0.01, 0.026]), RED)
  const whisk = (sx: number, i: number) => {
    const g = new THREE.CylinderGeometry(0.0006, 0.0006, 0.034, 6)
    return paint(place(g, [sx * 0.047, 0.127 + (i - 1) * 0.008, 0.026], [0, 0, Math.PI / 2 + sx * (i - 1) * 0.2], [1, 1, 1]), GREY)
  }
  const coin = [paint(place(new THREE.CylinderGeometry(0.02, 0.02, 0.005, 40), [-0.02, 0.05, 0.047], [Math.PI / 2, 0, 0.2]), GOLD), paint(place(new THREE.TorusGeometry(0.0145, 0.0014, 8, 40), [-0.02, 0.05, 0.0505], [0, 0, 0]), RED)]
  return mergeGeometries([
    body, base, ell([0, 0.128, 0.004], [0.04, 0.034, 0.035], CREAM), ...ear(-0.026), ...ear(0.026),
    collar, bib, ell([0, 0.083, 0.035], [0.0095, 0.0095, 0.009], GOLD), ell([0, 0.0835, 0.0425], [0.0014, 0.0045, 0.0014], INK),
    // face: closed happy eyes, nose, mouth, blush
    ...[-1, 1].map((sx) => paint(place(new THREE.TorusGeometry(0.0062, 0.0011, 8, 20, Math.PI), [sx * 0.0145, 0.1315, 0.0345], [0, 0, 0]), INK)),
    ell([0, 0.1225, 0.0385], [0.0055, 0.0042, 0.0032], PINK),
    ...[-1, 1].map((sx) => ell([sx * 0.026, 0.1185, 0.031], [0.0085, 0.0055, 0.0025], PINK)),
    ...[-1, 1].flatMap((sx) => [0, 1, 2].map((i) => whisk(sx, i))),
    // resting paw holding the coin, feet, tail tucked behind
    ell([-0.022, 0.05, 0.036], [0.013, 0.021, 0.013], CREAM), ...coin,
    ell([-0.02, 0.011, 0.041], [0.016, 0.01, 0.014], CREAM), ell([0.02, 0.011, 0.041], [0.016, 0.01, 0.014], CREAM),
    ell([0.0, 0.035, -0.046], [0.012, 0.024, 0.012], CREAM, [0.4, 0, 0]),
  ])!
}

export function Figurine({ ctx }: { ctx: Ctx }) {
  const arm = useRef<THREE.Group>(null!), paw = useRef<THREE.Group>(null!), wave = useRef(0)
  const geo = useMemo(buildFigurine, [])
  const invalidate = useThree((s) => s.invalidate)
  useFrame((_, dt) => {
    if (wave.current > 0) {
      wave.current = Math.max(0, wave.current - dt)
      // a real beckoning cat swings the paw forward and back from the shoulder (toward you and away),
      // with the wrist flexing the other way, not side to side
      const a = Math.sin(wave.current * 11) * Math.min(1, wave.current * 1.5)
      arm.current.rotation.x = 0.1 + a * 0.5
      paw.current.rotation.x = -a * 0.7
      shadow.dirty = true; invalidate()
    } else if (arm.current.rotation.x !== 0.1) { arm.current.rotation.x = 0.1; paw.current.rotation.x = 0; shadow.dirty = true; invalidate() }
  })
  const click = (e: { stopPropagation: () => void; delta: number }) => {
    if (e.delta > 6) return
    e.stopPropagation(); wave.current = 1.8
    ctx.toast("Lucky.") // SPIKE COPY
    invalidate()
  }
  return (
    <group position={[0.68, DESK_Y, -0.62]} rotation={[0, -0.3, 0]} onClick={click} {...hovFor(ctx, "Lucky cat")}>
      <mesh geometry={geo} castShadow><meshStandardMaterial vertexColors roughness={0.22} metalness={0.02} /></mesh>
      {/* the beckoning paw: a raised forearm hinged at the shoulder, with a paw that flexes at the wrist */}
      <group ref={arm} position={[0.04, 0.066, 0.004]} rotation={[0.1, 0, -0.3]}>
        <mesh position={[0.004, 0.026, 0]} castShadow><capsuleGeometry args={[0.012, 0.035, 8, 20]} /><meshStandardMaterial color={CREAM} roughness={0.22} /></mesh>
        <group ref={paw} position={[0.004, 0.047, 0]}>
          <mesh position={[0, 0.013, 0]} castShadow><sphereGeometry args={[0.0145, 28, 20]} /><meshStandardMaterial color={CREAM} roughness={0.22} /></mesh>
          <mesh position={[0, 0.013, 0.0125]}><sphereGeometry args={[0.0065, 16, 12]} /><meshStandardMaterial color={PINK} roughness={0.4} /></mesh>
        </group>
      </group>
    </group>
  )
}

/* ------------------------------------------------------------ eyes in the dark */
export function Eyes({ ctx, input }: { ctx: Ctx; input: InputRef }) {
  const g = useRef<THREE.Group>(null!), lids = useRef<THREE.Mesh[]>([]), pupils = useRef<THREE.Mesh[]>([])
  const mats = useRef<THREE.MeshBasicMaterial[]>([])
  const s = useRef({ a: 0, hidden: 0, nextBlink: 2, blink: 0, gaze: 0 })
  const invalidate = useThree((st) => st.invalidate)
  const dark = ctx.theme === "dark" && !ctx.lamp
  const pos = new THREE.Vector3(-2.35, 1.02, -1.58)
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
    // they scan: look left, hold, look right, hold, with a little of the cursor on top
    const sweep = Math.sin(t * 0.55) > 0 ? 1 : -1
    st.gaze += (sweep * 0.022 - st.gaze) * Math.min(1, dt * 3.2)
    pupils.current.forEach((p) => p && p.position.set(st.gaze - input.current.px * 0.004, -input.current.py * 0.004, 0.03))
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

/* soft additive halo, billboarded */
export function Glow({ position, color, size, opacity = 0.5 }: { position: [number, number, number]; color: string; size: number; opacity?: number }) {
  const map = useRef(glowTex()).current
  return (
    <sprite position={position} scale={[size, size, 1]} raycast={() => null}>
      <spriteMaterial map={map} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  )
}
