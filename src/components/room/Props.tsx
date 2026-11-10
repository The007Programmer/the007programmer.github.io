import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { RoundedBox } from "@react-three/drei"
import * as THREE from "three"
import { DISPLAY, MONO, f, useCanvasTex } from "./tex"
import { noiseTex } from "./proc"
import { DESK_Y, setCursor, shadow, type Ctx } from "./shared"

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
    const base = ctx.theme === "light" ? 0.12 : 0.8
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
        <mesh position={[0, 0.151, 0.0165]} rotation={[-0.15, 0, 0]}><planeGeometry args={[0.03, 0.017]} /><meshStandardMaterial color="#fff4e0" emissive="#ffe2b8" emissiveIntensity={1.6} toneMapped={false} /></mesh>
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
