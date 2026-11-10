import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { RoundedBox } from "@react-three/drei"
import * as THREE from "three"
import { DISPLAY, MONO, f, useCanvasTex } from "./tex"
import { glowTex, noiseTex } from "./proc"
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { DESK_Y, ambient, setCursor, shadow, type Ctx } from "./shared"

export const INSTAGRAM = "https://www.instagram.com/aahil.cr3/"

/* ============================================================ keyboard
   TGR 910 GAF replica: black aluminium case, 65% layout (16u wide, 5 rows), tilted to a typing angle,
   wearing a GMK Matsu-style set. I could not verify the real Matsu colours or the 910's exact layout, so the
   palette below is a placeholder in one place (MATSU) and the layout is the standard 65%. */
const MATSU = { alpha: "#E9E2D0", mod: "#2F3A40", accent: "#C4452B", legend: "#2F3A40", legendMod: "#E9E2D0" }
const P = 0.0238 // key pitch (a touch over a real 19.05 mm so it reads from the seat)
type K = { l: string; w: number; kind: "a" | "m" | "x" }
const row = (keys: [string, number, ("a" | "m" | "x")?][]): K[] => keys.map(([l, w, kind]) => ({ l, w, kind: kind ?? "a" }))
const LAYOUT: K[][] = [
  row([["esc", 1, "x"], ..."1234567890-=".split("").map((c) => [c, 1] as [string, number]), ["bksp", 2, "m"], ["del", 1, "m"]]),
  row([["tab", 1.5, "m"], ..."qwertyuiop[]".split("").map((c) => [c, 1] as [string, number]), ["\\", 1.5, "m"], ["pg↑", 1, "m"]]),
  row([["caps", 1.75, "m"], ..."asdfghjkl;'".split("").map((c) => [c, 1] as [string, number]), ["enter", 2.25, "x"], ["pg↓", 1, "m"]]),
  row([["shift", 2.25, "m"], ..."zxcvbnm,./".split("").map((c) => [c, 1] as [string, number]), ["shift", 1.75, "m"], ["↑", 1, "m"], ["end", 1, "m"]]),
  row([["ctrl", 1.25, "m"], ["win", 1.25, "m"], ["alt", 1.25, "m"], ["", 6.25], ["alt", 1, "m"], ["fn", 1, "m"], ["ctrl", 1, "m"], ["←", 1, "m"], ["↓", 1, "m"], ["→", 1, "m"]]),
]
const W = 16 * P, H = 5 * P

export function Keyboard({ ctx }: { ctx: Ctx }) {
  const g = useRef<THREE.Group>(null!), caps = useRef<THREE.InstancedMesh>(null!)
  const h = useRef(0), want = useRef(0)
  const invalidate = useThree((s) => s.invalidate)
  const sel = ctx.focus === "keyboard"
  const capGeo = useMemo(() => {
    const b = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1)
    const pos = b.attributes.position
    for (let i = 0; i < pos.count; i++) if (pos.getY(i) > 0) pos.setXYZ(i, pos.getX(i) * 0.8, pos.getY(i), pos.getZ(i) * 0.74)
    pos.needsUpdate = true; b.computeVertexNormals()
    return b
  }, [])
  const capH = 0.011
  useEffect(() => {
    const m = new THREE.Matrix4(), c = new THREE.Color(), q = new THREE.Quaternion(), pp = new THREE.Vector3(), sc = new THREE.Vector3()
    let i = 0
    LAYOUT.forEach((r, ri) => {
      let x = 0
      r.forEach((k) => {
        const cx = x + k.w / 2; x += k.w
        pp.set((cx - 8) * P, capH / 2, (ri - 2) * P)
        sc.set(k.w * P * 0.93, capH, P * 0.93)
        m.compose(pp, q, sc); caps.current.setMatrixAt(i, m)
        caps.current.setColorAt(i, c.set(k.kind === "a" ? MATSU.alpha : k.kind === "m" ? MATSU.mod : MATSU.accent)); i++
      })
    })
    caps.current.instanceMatrix.needsUpdate = true; if (caps.current.instanceColor) caps.current.instanceColor.needsUpdate = true
  }, [])
  const legends = useCanvasTex(2048, Math.round((2048 * H) / W), (c) => {
    const u = 2048 / 16
    c.textAlign = "center"; c.textBaseline = "middle"
    LAYOUT.forEach((r, ri) => {
      let x = 0
      r.forEach((k) => {
        if (k.l) { c.fillStyle = k.kind === "a" ? MATSU.legend : MATSU.legendMod; c.font = f(MONO, k.l.length > 2 ? u * 0.24 : u * 0.38); c.fillText(k.l, (x + k.w / 2) * u, (ri + 0.5) * u) }
        x += k.w
      })
    })
  }, "kbd")
  const n = LAYOUT.reduce((a, r) => a + r.length, 0)
  const logo = useCanvasTex(256, 64, (c) => { c.fillStyle = "#8a8a8a"; c.font = f(DISPLAY, 34); c.textAlign = "right"; c.fillText("TGR", 244, 44) }, "tgr")
  useFrame((_, dt) => {
    const goal = sel ? 1.3 : want.current
    h.current += (goal - h.current) * (ctx.reduced ? 1 : 1 - Math.exp(-dt * 12))
    g.current.position.y = DESK_Y + 0.0 + h.current * 0.02
    g.current.rotation.x = 0.1 + h.current * 0.12
    if (Math.abs(goal - h.current) > 0.003) { shadow.dirty = true; invalidate() }
  })
  return (
    <group
      ref={g} position={[0, DESK_Y, -0.22]} rotation={[0.1, 0, 0]}
      onPointerOver={(e) => { e.stopPropagation(); want.current = 1; setCursor(true); ctx.hover("Keyboard: TGR 910 GAF"); invalidate() }}
      onPointerOut={() => { want.current = 0; setCursor(false); ctx.hover(null); invalidate() }}
      onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); ctx.goto("keyboard") }}
    >
      <RoundedBox args={[W + 0.024, 0.022, H + 0.024]} radius={0.007} smoothness={4} position={[0, 0.011, 0]} castShadow receiveShadow><meshStandardMaterial color="#0d0d0e" metalness={0.85} roughness={0.34} /></RoundedBox>
      <mesh position={[0, 0.0225, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[W + 0.008, H + 0.008]} /><meshStandardMaterial color="#050506" roughness={0.9} /></mesh>
      <instancedMesh ref={caps} args={[capGeo, undefined, n]} position={[0, 0.0225, 0]} castShadow><meshStandardMaterial roughness={0.55} /></instancedMesh>
      <mesh position={[0, 0.0225 + capH + 0.0004, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[W, H]} /><meshBasicMaterial map={legends} transparent toneMapped={false} depthWrite={false} /></mesh>
      <mesh position={[W / 2 - 0.02, 0.0105, H / 2 + 0.0125]}><planeGeometry args={[0.04, 0.01]} /><meshBasicMaterial map={logo} transparent toneMapped={false} /></mesh>
    </group>
  )
}

/* ============================================================ camera: Canon EOS R8, links to Instagram */
export function Camera({ ctx }: { ctx: Ctx }) {
  const g = useRef<THREE.Group>(null!), lamp = useRef<THREE.PointLight>(null!)
  const h = useRef(0), want = useRef(0), pop = useRef(0)
  const invalidate = useThree((s) => s.invalidate)
  const rough = useMemo(() => noiseTex("#888888", 0.5, 3, 3, false), [])
  const label = useCanvasTex(256, 96, (c) => {
    c.fillStyle = "#f2f2f2"; c.font = "italic 700 52px 'Bricolage Grotesque', Arial, sans-serif"; c.fillText("Canon", 10, 56)
    c.fillStyle = "#b0b0b0"; c.font = f(MONO, 20); c.fillText("EOS R8", 150, 86)
  }, "canon")
  useFrame((_, dt) => {
    h.current += (want.current - h.current) * (ctx.reduced ? 1 : 1 - Math.exp(-dt * 12))
    g.current.position.y = h.current * 0.025
    g.current.rotation.x = -h.current * 0.18
    // the flash: a dim standing glow so the dark room has some fill, and a bright pop on click
    const base = ctx.theme === "light" ? 0.1 : 0.7
    if (pop.current > 0) pop.current = Math.max(0, pop.current - dt * 3.2)
    lamp.current.intensity = base + pop.current * 9
    if (pop.current > 0 || Math.abs(want.current - h.current) > 0.003) { shadow.dirty = true; invalidate() }
  })
  const body = <meshStandardMaterial color="#141415" roughness={0.55} roughnessMap={rough} metalness={0.15} />
  const dark = <meshStandardMaterial color="#0b0b0c" roughness={0.7} />
  const metal = <meshStandardMaterial color="#9a9ea3" metalness={0.9} roughness={0.3} />
  // real body is 133 x 88 x 70 mm with the lens; scaled 1.15 so it reads on the desk
  return (
    <group position={[0.98, DESK_Y, -0.12]} rotation={[0, -0.35, 0]} scale={1.15}>
      <group
        ref={g}
        onPointerOver={(e) => { e.stopPropagation(); want.current = 1; setCursor(true); ctx.hover("Photography on Instagram ↗"); invalidate() }}
        onPointerOut={() => { want.current = 0; setCursor(false); ctx.hover(null); invalidate() }}
        onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); pop.current = 1; invalidate(); ctx.toast("Opening Instagram"); window.setTimeout(() => window.open(INSTAGRAM, "_blank", "noopener,noreferrer"), ctx.reduced ? 0 : 280) }}
      >
        <RoundedBox args={[0.133, 0.076, 0.05]} radius={0.008} smoothness={4} position={[0, 0.045, 0]} castShadow>{body}</RoundedBox>
        <RoundedBox args={[0.036, 0.076, 0.058]} radius={0.01} smoothness={4} position={[-0.048, 0.045, 0.004]} castShadow>{body}</RoundedBox>
        <RoundedBox args={[0.133, 0.014, 0.05]} radius={0.006} smoothness={3} position={[0, 0.089, 0]} castShadow><meshStandardMaterial color="#1c1c1e" roughness={0.45} metalness={0.3} /></RoundedBox>
        <RoundedBox args={[0.036, 0.02, 0.044]} radius={0.006} smoothness={3} position={[0, 0.102, -0.002]} castShadow>{body}</RoundedBox>
        {/* a small flash on the hot shoe: its head glows softly, and its light is the only fill on this side of the room */}
        <mesh position={[0, 0.116, -0.002]}><boxGeometry args={[0.026, 0.004, 0.02]} />{metal}</mesh>
        <RoundedBox args={[0.034, 0.03, 0.026]} radius={0.004} smoothness={3} position={[0, 0.133, -0.002]} castShadow>{body}</RoundedBox>
        <RoundedBox args={[0.036, 0.022, 0.012]} radius={0.003} smoothness={3} position={[0, 0.151, 0.01]} rotation={[-0.15, 0, 0]}>{body}</RoundedBox>
        <mesh position={[0, 0.151, 0.0165]} rotation={[-0.15, 0, 0]}><planeGeometry args={[0.03, 0.017]} /><meshStandardMaterial color="#fff4e0" emissive="#ffe2b8" emissiveIntensity={1.4} toneMapped={false} /></mesh>
        <pointLight ref={lamp} position={[0, 0.16, 0.04]} color="#ffe6c4" intensity={0.4} distance={3.2} decay={2} />
        <mesh position={[0.04, 0.0975, -0.004]} castShadow><cylinderGeometry args={[0.0115, 0.0115, 0.009, 32]} />{metal}</mesh>
        <mesh position={[-0.052, 0.0975, 0.008]} castShadow><cylinderGeometry args={[0.0065, 0.0065, 0.006, 20]} />{metal}</mesh>
        <mesh position={[0, 0.045, 0.027]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.0375, 0.0375, 0.004, 48]} />{metal}</mesh>
        <mesh position={[0, 0.045, 0.058]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.031, 0.031, 0.056, 48]} />{dark}</mesh>
        <mesh position={[0, 0.045, 0.046]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.0325, 0.0325, 0.014, 48]} /><meshStandardMaterial color="#161617" roughness={0.9} /></mesh>
        {[0.04, 0.046, 0.052].map((z) => <mesh key={z} position={[0, 0.045, z]} rotation={[0, 0, 0]}><torusGeometry args={[0.0325, 0.0007, 8, 48]} />{dark}</mesh>)}
        <mesh position={[0, 0.045, 0.0865]} rotation={[0, 0, 0]}><circleGeometry args={[0.0235, 48]} /><meshStandardMaterial color="#0a1424" metalness={1} roughness={0.06} /></mesh>
        <mesh position={[0, 0.045, 0.0862]}><ringGeometry args={[0.0235, 0.029, 48]} /><meshStandardMaterial color="#050506" /></mesh>
        <mesh position={[-0.004, 0.075, 0.0255]}><planeGeometry args={[0.046, 0.017]} /><meshBasicMaterial map={label} transparent toneMapped={false} /></mesh>
        <mesh position={[-0.0485, 0.052, 0.0335]}><boxGeometry args={[0.0016, 0.03, 0.0008]} /><meshStandardMaterial color="#c8201a" roughness={0.4} /></mesh>
      </group>
    </group>
  )
}


/* ============================================================ coffee puddle
   An irregular pool, not a disc: a lobed outline with a tongue running out of the mug's mouth, a darker pool on a
   wider wet-stain halo, a clear-coat so it catches the lamp, and a few droplets that fly off the edge. The shape's
   origin is the mug mouth, so scaling it makes the coffee spread out from the cup. */
function blob(seed: number, r0: number, tongue: number, cx: number) {
  let sd = seed; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647 }
  const a = r() * 6, b = r() * 6, c = r() * 6
  const sh = new THREE.Shape()
  const N = 72
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * Math.PI * 2
    const wob = 1 + 0.16 * Math.sin(3 * t + a) + 0.1 * Math.sin(5 * t + b) + 0.06 * Math.sin(8 * t + c)
    const tg = tongue * Math.exp(-Math.pow(Math.atan2(Math.sin(t), Math.cos(t)), 2) * 3.2) // a lobe toward +x
    const rr = r0 * wob + tg
    const x = cx + Math.cos(t) * rr, y = Math.sin(t) * rr * 0.82
    if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y)
  }
  return new THREE.ShapeGeometry(sh, 3)
}
export function Puddle({ pv }: { pv: { current: number } }) {
  const root = useRef<THREE.Group>(null!), drops = useRef<THREE.Mesh[]>([])
  const pool = useMemo(() => blob(11, 0.05, 0.05, 0.07), [])
  const halo = useMemo(() => blob(29, 0.058, 0.055, 0.075), [])
  const dropPos = useMemo<[number, number, number][]>(() => [[0.17, 0.0, 0.03], [0.2, 0, -0.045], [0.13, 0, 0.085], [0.235, 0, 0.0], [0.09, 0, -0.095]], [])
  useFrame(() => {
    const v = pv.current, k = Math.max(0, Math.min(1, v))
    const sc = 0.02 + 0.98 * (1 - Math.pow(1 - k, 2.4)) // fast at first, then it settles
    root.current.scale.set(sc * 1.1, sc, sc)
    root.current.visible = k > 0.02
    drops.current.forEach((d, i) => { const q = Math.max(0, (k - 0.35 - i * 0.07) / 0.35); d.scale.setScalar(Math.min(1, q)); d.visible = q > 0.02 })
  })
  return (
    <group ref={root} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={halo}><meshStandardMaterial color="#6b4426" transparent opacity={0.42} roughness={0.7} polygonOffset polygonOffsetFactor={-1} depthWrite={false} /></mesh>
      <mesh geometry={pool} position={[0, 0, 0.0008]}><meshPhysicalMaterial color="#2a160c" roughness={0.12} clearcoat={1} clearcoatRoughness={0.04} metalness={0} polygonOffset polygonOffsetFactor={-2} /></mesh>
      {dropPos.map((d, i) => (
        <mesh key={i} ref={(m) => { if (m) drops.current[i] = m }} position={[d[0], d[2], 0.001]}><circleGeometry args={[0.006 + (i % 3) * 0.003, 20]} /><meshPhysicalMaterial color="#2a160c" roughness={0.12} clearcoat={1} /></mesh>
      ))}
    </group>
  )
}

/* soft wisps that rise and fade; static pose until told to move */
let _glow: THREE.Texture | null = null
export function Steam({ origin, active, vis, tint }: { origin: { current: [number, number, number] }; active: { current: boolean }; vis: { current: number }; tint: string }) {
  const N = 8
  const sp = useRef<THREE.Sprite[]>([])
  const t = useRef(0)
  const map = useMemo(() => (_glow ??= glowTex()), [])
  useFrame((_, dt) => {
    if (active.current) { t.current += dt; ambient.next = Math.min(ambient.next, 50) }
    for (let i = 0; i < N; i++) {
      const s = sp.current[i]; if (!s) continue
      const life = (t.current * 0.2 + i / N) % 1
      const sway = Math.sin(life * 7 + i * 1.9) * 0.012 * (0.4 + life)
      s.position.set(origin.current[0] + sway + Math.sin(i * 2.3) * 0.008, origin.current[1] + life * 0.17, origin.current[2] + Math.cos(i * 1.7) * 0.008)
      s.scale.setScalar(0.022 + life * 0.07)
      ;(s.material as THREE.SpriteMaterial).opacity = Math.sin(life * Math.PI) * 0.3 * vis.current * (active.current ? 1 : 0.55)
    }
  })
  return (
    <group>
      {Array.from({ length: N }, (_, i) => (
        <sprite key={i} ref={(m) => { if (m) sp.current[i] = m }} raycast={() => null}>
          <spriteMaterial map={map} color={tint} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  )
}

/* ============================================================ plant
   A trailing pothos in a terracotta pot: lathe pot with a rim, a soil disc, a leafy crown, and four vines
   that spill over the shelf edge. Every leaf is a heart-shaped instance (one draw call), vines are merged tubes (one). */
export function Plant() {
  const leaves = useRef<THREE.InstancedMesh>(null!)
  const potGeo = useMemo(() => new THREE.LatheGeometry([[0.001, 0], [0.04, 0], [0.056, 0.012], [0.062, 0.09], [0.068, 0.1], [0.068, 0.11], [0.06, 0.11], [0.059, 0.1], [0.001, 0.1]].map(([x, y]) => new THREE.Vector2(x, y)), 48), [])
  const heart = useMemo(() => {
    const sh = new THREE.Shape()
    sh.moveTo(0, 0.12)
    sh.bezierCurveTo(-0.15, 0.0, -0.55, 0.05, -0.55, 0.42); sh.bezierCurveTo(-0.55, 0.76, -0.2, 0.9, 0, 1.0)
    sh.bezierCurveTo(0.2, 0.9, 0.55, 0.76, 0.55, 0.42); sh.bezierCurveTo(0.55, 0.05, 0.15, 0.0, 0, 0.12)
    return new THREE.ShapeGeometry(sh, 10)
  }, [])
  const { vines, items } = useMemo(() => {
    let sd = 5; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647 }
    const curves = [
      [[0.0, 0.1, 0.05], [0.0, 0.095, 0.13], [0.0, 0.03, 0.2], [0.005, -0.07, 0.215], [0.0, -0.17, 0.218], [0.02, -0.27, 0.212]],
      [[0.03, 0.1, 0.04], [0.05, 0.1, 0.12], [0.055, 0.03, 0.2], [0.06, -0.05, 0.213], [0.05, -0.12, 0.214]],
      [[-0.03, 0.1, 0.04], [-0.05, 0.1, 0.12], [-0.055, 0.04, 0.2], [-0.05, -0.04, 0.214], [-0.06, -0.2, 0.213], [-0.05, -0.23, 0.215]],
      [[0.055, 0.09, 0.0], [0.11, 0.07, 0.04], [0.14, 0.0, 0.08], [0.15, -0.08, 0.1]],
    ].map((pts) => new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(q[0], q[1], q[2]))))
    const vg = mergeGeometries(curves.map((c) => { const g = new THREE.TubeGeometry(c, 40, 0.0028, 6, false); const n = g.attributes.position.count; g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3).fill(0.2), 3)); return g }))!
    const items: { p: THREE.Vector3; q: THREE.Quaternion; s: number; c: string }[] = []
    const G = ["#2f5a33", "#3f6b3a", "#4f8a45", "#6aa84f", "#86b85a", "#3a6a3e"]
    const up = new THREE.Vector3(0, 1, 0)
    curves.forEach((c) => {
      const len = c.getLength()
      for (let d = 0.02; d < len; d += 0.034 + r() * 0.012) {
        const u = d / len, p = c.getPointAt(u), tg = c.getTangentAt(u)
        const dir = tg.clone().multiplyScalar(0.8).add(new THREE.Vector3((r() - 0.5) * 0.9, (r() - 0.5) * 0.3, 0.5 + r() * 0.4)).normalize()
        const q = new THREE.Quaternion().setFromUnitVectors(up, dir).multiply(new THREE.Quaternion().setFromAxisAngle(up, (r() - 0.5) * 1.4))
        items.push({ p: p.clone().add(new THREE.Vector3(0, 0, 0.002)), q, s: 0.034 + r() * 0.02 + (1 - u) * 0.01, c: G[Math.floor(r() * G.length)] })
      }
    })
    for (let i = 0; i < 30; i++) {
      const a = r() * Math.PI * 2, rad = 0.012 + r() * 0.04, h = 0.1 + r() * 0.05
      const dir = new THREE.Vector3(Math.cos(a) * (0.5 + r() * 0.5), 0.55 + r() * 0.5, Math.sin(a) * (0.5 + r() * 0.5)).normalize()
      items.push({ p: new THREE.Vector3(Math.cos(a) * rad, h, Math.sin(a) * rad), q: new THREE.Quaternion().setFromUnitVectors(up, dir).multiply(new THREE.Quaternion().setFromAxisAngle(up, r() * 6)), s: 0.05 + r() * 0.025, c: G[Math.floor(r() * G.length)] })
    }
    return { vines: vg, items }
  }, [])
  useEffect(() => {
    const m = new THREE.Matrix4(), c = new THREE.Color()
    items.forEach((it, i) => { m.compose(it.p, it.q, new THREE.Vector3(it.s, it.s, it.s)); leaves.current.setMatrixAt(i, m); leaves.current.setColorAt(i, c.set(it.c)) })
    leaves.current.instanceMatrix.needsUpdate = true; if (leaves.current.instanceColor) leaves.current.instanceColor.needsUpdate = true
  }, [items])
  return (
    <group>
      <mesh geometry={potGeo} castShadow receiveShadow><meshStandardMaterial color="#B4613E" roughness={0.72} /></mesh>
      <mesh position={[0, 0.097, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.058, 32]} /><meshStandardMaterial color="#2b1d14" roughness={1} /></mesh>
      <mesh geometry={vines} castShadow><meshStandardMaterial color="#3f6b3a" roughness={0.7} /></mesh>
      <instancedMesh ref={leaves} args={[heart, undefined, items.length]} castShadow><meshStandardMaterial roughness={0.55} side={THREE.DoubleSide} /></instancedMesh>
    </group>
  )
}
