import { useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { MONO, f, useCanvasTex } from "./tex"
import { noiseTex } from "./proc"
import { cyl, knurlTex, merge, rbox, type Part } from "./merge"
import { DESK_Y, setCursor, shadow, type Ctx } from "./shared"

export const INSTAGRAM = "https://www.instagram.com/aahil.cr3/"

/* ============================================================ camera: Canon EOS R8 + RF 50mm f/1.8-style lens
   Proportions follow the real body (about 133 x 86 x 70 mm with the hump and grip): compact full-frame body, a deep
   right-hand grip (on the left as seen from the front), a centred EVF hump, the mode dial on the top left as the
   photographer sees it (so on the right from the front), shutter button and control dial on the grip, the RF mount
   with its red alignment dot, and a short 50 mm prime. Fine details (exact button layout, lens markings) are
   approximate. Units are metres, the body sits on y = 0, the lens points +z. Everything static is merged per
   material, so the whole camera is about eight draw calls.
   The little flash on the hot shoe is the owner's addition and is kept. */
const BODY_Y = 0.035 // lens axis height
const MOUNT_Z = 0.007 // front face of the body
type V3 = [number, number, number]

function lensPoints() {
  // (radius, distance in front of the mount face) of the barrel shell under the rings, then the stepped front rim and the filter-thread recess
  return [[0.0300, 0], [0.0316, 0.002], [0.0318, 0.012], [0.0318, 0.026], [0.0322, 0.0262], [0.0322, 0.0375], [0.0312, 0.0376], [0.0312, 0.0392], [0.0302, 0.0404], [0.0286, 0.0408], [0.0270, 0.0408], [0.0270, 0.0394], [0.0258, 0.0394], [0.0258, 0.0372], [0.0246, 0.0372], [0.0246, 0.0335], [0.0001, 0.0335]].map(([r, y]) => new THREE.Vector2(r, y))
}

function useCanonGeometry() {
  return useMemo(() => {
    const lensAt = (z: number): { p: V3; r: V3 } => ({ p: [0, BODY_Y, MOUNT_Z + z], r: [Math.PI / 2, 0, 0] })
    const body: Part[] = [
      { g: rbox(0.1325, 0.070, 0.042, 0.006, 4), p: [0, 0.035, -0.014] }, // main body
      { g: rbox(0.034, 0.069, 0.070, 0.011, 4), p: [-0.0485, 0.0345, 0] }, // deep grip
      { g: rbox(0.050, 0.025, 0.038, 0.011, 4), p: [0, 0.0765, -0.0155] }, // EVF hump
      { g: rbox(0.026, 0.013, 0.008, 0.004, 3), p: [0, 0.074, -0.0375] }, // eyecup
      { g: new THREE.LatheGeometry(lensPoints(), 64), ...lensAt(0) }, // lens barrel
      { g: new THREE.RingGeometry(0.0105, 0.0148, 40), p: [0, BODY_Y, MOUNT_Z + 0.0338] }, // inner element ring
      // the flash on the hot shoe
      { g: rbox(0.034, 0.030, 0.026, 0.004), p: [0, 0.1075, -0.0155] },
      { g: rbox(0.036, 0.022, 0.012, 0.003), p: [0, 0.1255, -0.0035], r: [-0.15, 0, 0] },
    ]
    const metal: Part[] = [
      { g: cyl(0.0335, 0.0335, 0.003, 48), ...lensAt(0.0015) }, // mount flange
      { g: rbox(0.026, 0.004, 0.02, 0.001, 2), p: [0, 0.0905, -0.0155] }, // hot shoe plate
      { g: cyl(0.0095, 0.0095, 0.0008, 32), p: [0.0435, 0.0743, -0.01] }, // mode dial cap
      { g: cyl(0.0067, 0.0067, 0.0014, 24), p: [-0.05, 0.0705, 0.016] }, // shutter button ring
      { g: cyl(0.0045, 0.0045, 0.002, 20), p: [-0.05, 0.0713, 0.016] },
      { g: rbox(0.006, 0.008, 0.008, 0.002), p: [-0.0665, 0.058, -0.01] }, // strap lugs
      { g: rbox(0.006, 0.008, 0.008, 0.002), p: [0.0665, 0.058, -0.01] },
    ]
    const knurl: Part[] = [
      { g: cyl(0.0105, 0.0105, 0.007, 40), p: [0.0435, 0.0735, -0.01] }, // mode dial
      { g: cyl(0.0068, 0.0068, 0.006, 32), p: [-0.044, 0.0725, -0.011] }, // control dial
      { g: new THREE.CylinderGeometry(0.0346, 0.0346, 0.014, 72, 1, true), ...lensAt(0.019) }, // focus ring: the fine knurling
    ]
    // control ring (coarse ridges, its own material) and the branding / distance band between it and the focus ring
    const ctrl: Part[] = [{ g: new THREE.CylinderGeometry(0.034, 0.034, 0.003, 64, 1, true), ...lensAt(0.036) }]
    const band: Part[] = [{ g: new THREE.CylinderGeometry(0.0331, 0.0331, 0.005, 72, 1, true), ...lensAt(0.032) }]
    const ang = (2 * Math.PI) / 3 // 11 o'clock
    const dot = (r: number, z: number): Part => ({ g: new THREE.SphereGeometry(0.0017, 12, 8), p: [Math.cos(ang) * r, BODY_Y + Math.sin(ang) * r, MOUNT_Z + z] })
    const red: Part[] = [
      dot(0.0368, 0.0004), // body alignment dot
      dot(0.0322, 0.0095), // lens alignment dot
      { g: new THREE.BoxGeometry(0.0016, 0.034, 0.0008), p: [-0.0385, 0.036, 0.0352] }, // the red line down the grip
    ]
    // front element: a shallow convex cap, a base on y = 0 so it sits flush in the rim
    const R = 0.04, th = Math.asin(0.0245 / R)
    const cap = new THREE.SphereGeometry(R, 40, 10, 0, Math.PI * 2, 0, th).translate(0, -R * Math.cos(th), 0).scale(1, 0.35, 1)
    return { ctrl: merge(ctrl), band: merge(band), body: merge(body), metal: merge(metal), knurl: merge(knurl), red: merge(red), glass: merge([{ g: cap, ...lensAt(0.0335) }]) }
  }, [])
}

export function Camera({ ctx }: { ctx: Ctx }) {
  const g = useRef<THREE.Group>(null!), lamp = useRef<THREE.PointLight>(null!)
  const h = useRef(0), want = useRef(0), pop = useRef(0)
  const invalidate = useThree((s) => s.invalidate)
  const geo = useCanonGeometry()
  const rough = useMemo(() => noiseTex("#888888", 0.5, 3, 3, false), [])
  const bump = useMemo(() => knurlTex(96), [])
  const bumpCoarse = useMemo(() => knurlTex(28), [])
  // generic markings only: lens name and a distance scale, no logos. u = 0.5 faces up on this cylinder, so the name sits there and the scale on both flanks
  const bandTex = useCanvasTex(2048, 64, (g) => {
    g.fillStyle = "#0b0b0c"; g.fillRect(0, 0, 2048, 64)
    g.textBaseline = "middle"; g.textAlign = "center"; g.fillStyle = "#e8e8e8"; g.font = f(MONO, 26)
    g.fillText("RF 50mm  1:1.8  STM", 1024, 34)
    g.fillStyle = "#c9c9c9"; g.font = f(MONO, 20)
    for (const cx of [512, 1536]) g.fillText("0.3   0.5   1   2   5   \u221e   m", cx, 34)
  }, "lensband")
  const label = useCanvasTex(256, 96, (c) => {
    c.fillStyle = "#f2f2f2"; c.font = "italic 700 52px 'Bricolage Grotesque', Arial, sans-serif"; c.fillText("Canon", 10, 56)
    c.fillStyle = "#b0b0b0"; c.font = f(MONO, 20); c.fillText("EOS R8", 150, 86)
  }, "canon")
  useFrame((_, dt) => {
    h.current += (want.current - h.current) * (ctx.reduced ? 1 : 1 - Math.exp(-dt * 12))
    g.current.position.y = h.current * 0.025
    g.current.rotation.x = -h.current * 0.18
    // the flash: a dim standing glow so the dark room has some fill, and a bright pop on click
    const base = ctx.theme === "light" ? 0.04 : 0.29
    if (pop.current > 0) pop.current = Math.max(0, pop.current - dt * 3.2)
    lamp.current.intensity = base + pop.current * 9
    if (pop.current > 0 || Math.abs(want.current - h.current) > 0.003) { shadow.dirty = true; invalidate() }
  })
  return (
    <group position={[0.98, DESK_Y, -0.12]} rotation={[0, -0.62, 0]} scale={1.15}>
      <group
        ref={g}
        onPointerOver={(e) => { e.stopPropagation(); want.current = 1; setCursor(true); ctx.hover("Photography on Instagram ↗"); invalidate() }}
        onPointerOut={() => { want.current = 0; setCursor(false); ctx.hover(null); invalidate() }}
        onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); pop.current = 1; invalidate(); ctx.toast("Opening Instagram"); window.setTimeout(() => window.open(INSTAGRAM, "_blank", "noopener,noreferrer"), ctx.reduced ? 0 : 280) }}
      >
        <mesh geometry={geo.body} castShadow><meshStandardMaterial color="#141415" roughness={0.55} roughnessMap={rough} metalness={0.15} /></mesh>
        <mesh geometry={geo.metal} castShadow><meshStandardMaterial color="#9a9ea3" metalness={0.9} roughness={0.3} /></mesh>
        <mesh geometry={geo.knurl} castShadow><meshStandardMaterial color="#1b1b1d" metalness={0.5} roughness={0.4} bumpMap={bump} bumpScale={2} /></mesh>
        <mesh geometry={geo.ctrl} castShadow><meshStandardMaterial color="#3a3b3f" metalness={0.6} roughness={0.35} bumpMap={bumpCoarse} bumpScale={3} /></mesh>
        <mesh geometry={geo.band}><meshStandardMaterial map={bandTex} roughness={0.55} /></mesh>
        <mesh geometry={geo.red}><meshStandardMaterial color="#c8201a" roughness={0.4} /></mesh>
        <mesh geometry={geo.glass}><meshPhysicalMaterial color="#0b1a2c" metalness={0.9} roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} emissive="#14281c" emissiveIntensity={0.5} /></mesh>
        <mesh position={[0.05, 0.059, MOUNT_Z + 0.0005]}><planeGeometry args={[0.03, 0.011]} /><meshBasicMaterial map={label} transparent toneMapped={false} /></mesh>
        <mesh position={[0, 0.1255, 0.0030]} rotation={[-0.15, 0, 0]}><planeGeometry args={[0.03, 0.017]} /><meshStandardMaterial color="#fff4e0" emissive="#ffe2b8" emissiveIntensity={0.59} toneMapped={false} /></mesh>
        <pointLight ref={lamp} position={[0, 0.138, 0.012]} color="#ffe6c4" intensity={0.28} distance={3.2} decay={2} />
      </group>
    </group>
  )
}
