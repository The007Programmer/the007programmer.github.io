import { useMemo } from "react"
import * as THREE from "three"
import { cyl, knurlTex, merge, rbox, type Part } from "./merge"
import { DESK_Y, setCursor, type Ctx } from "./shared"

/* ============================================================ desk mouse
   No model was named, so this is a believable modern right-handed ergonomic mouse, not a specific product:
   a lofted shell (domed palm, a scooped thumb flank, narrower front), split left and right buttons with seam
   grooves, a scroll wheel in a slot, two thumb buttons and a small DPI button behind the wheel.
   Everything dimensional lives in SPEC and the shell is one function (surf), so swapping in a named model
   means changing numbers (or replacing useMouseGeometry), not the scene. A model name or photo would let this match it.
   Units are metres; the mouse points toward -z (the monitor), its origin on the desk. */
const SPEC = {
  L: 0.122, W: 0.068, H: 0.042, // length, width, height of the shell
  buttons: 0.44, // v (0 front .. 1 back) where the L/R buttons end
  wheelV: 0.22, wheelR: 0.0068,
  color: "#454b56", seam: "#050506", accent: "#3d424a",
}
const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

/* a point on the shell: th runs from pi (left flank) over the top (pi/2) to 0 (right flank), v from the front (0) to the back (1) */
function surf(th: number, v: number, out = new THREE.Vector3()) {
  const { L, W, H } = SPEC
  const sv = Math.sin(Math.PI * v), end = Math.pow(sv, v < 0.5 ? 0.26 : 0.5) // a squarer front, a rounder back
  const thumb = Math.exp(-Math.pow((v - 0.52) / 0.17, 2)) // the thumb flank
  const hw = (W / 2) * (0.88 + 0.12 * sm(0, 0.7, v)) * end
  const c = Math.cos(th), s = Math.max(0, Math.sin(th))
  const left = c < 0 ? sm(0, 1, -c) : 0
  const h = H * (0.58 + 0.42 * Math.exp(-Math.pow((v - 0.64) / 0.3, 2))) * Math.pow(sv, v < 0.5 ? 0.35 : 0.6)
  const x = (c < 0 ? hw * (1 + 0.1 * thumb) * c : hw * c) + 0.003 * Math.sin(Math.PI * v)
  const y = h * Math.pow(s, 0.5) * (1 - 0.32 * thumb * left) // flank dips where the thumb rests
  return out.set(x, y, -L / 2 + v * L)
}

function shell() {
  const nu = 40, nv = 48
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3), uv = new Float32Array((nu + 1) * (nv + 1) * 2), idx: number[] = []
  const p = new THREE.Vector3()
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const k = j * (nu + 1) + i
    surf(Math.PI * (1 - i / nu), j / nv, p); pos.set([p.x, p.y, p.z], k * 3); uv.set([i / nu, j / nv], k * 2)
    if (i < nu && j < nv) { const a = k, b = k + 1, c = k + nu + 1, d = k + nu + 2; idx.push(a, c, b, b, c, d) }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

const groove = (pts: THREE.Vector3[]): Part => ({ g: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.0006, 5, false) })

function useMouseGeometry() {
  return useMemo(() => {
    const { buttons, wheelV, wheelR } = SPEC
    const line = (f: (t: number) => THREE.Vector3, n = 24) => Array.from({ length: n + 1 }, (_, i) => f(i / n))
    const lift = (v: THREE.Vector3) => v.add(new THREE.Vector3(0, 0.0002, 0))
    const grooves: Part[] = [
      groove(line((t) => lift(surf(Math.PI / 2, 0.012 + t * (buttons - 0.012))))), // between left and right button
      groove(line((t) => lift(surf(Math.PI - 0.12 - t * (Math.PI - 0.24), buttons)))), // buttons from the palm
      groove(line((t) => lift(surf(2.62, 0.3 + t * 0.5)))), // thumb panel
    ]
    // slot for the wheel
    const sy = surf(Math.PI / 2, wheelV).y
    grooves.push({ g: rbox(0.012, 0.004, 0.022, 0.0015, 2), p: [surf(Math.PI / 2, wheelV).x, sy - 0.0006, surf(Math.PI / 2, wheelV).z] })
    const wheel: Part[] = [{ g: cyl(wheelR, wheelR, 0.0055, 28), p: [surf(Math.PI / 2, wheelV).x, sy + 0.0014, surf(Math.PI / 2, wheelV).z], r: [0, 0, Math.PI / 2] }]
    // side buttons and the DPI button
    const side = (v: number, len: number): Part => { const q = surf(2.72, v); return { g: rbox(0.0045, 0.0075, len, 0.0016, 3), p: [q.x - 0.0007, q.y, q.z], r: [0, 0.05, 0.22] } }
    const dpi = surf(Math.PI / 2, 0.36)
    const small: Part[] = [side(0.33, 0.017), side(0.47, 0.017), { g: cyl(0.0032, 0.0032, 0.0016, 16), p: [dpi.x, dpi.y + 0.0002, dpi.z] }]
    return { shell: shell(), seams: merge(grooves), wheel: merge(wheel), small: merge(small) }
  }, [])
}

export function Mouse({ ctx }: { ctx: Ctx }) {
  const geo = useMouseGeometry()
  const bump = useMemo(() => knurlTex(40), [])
  return (
    <group
      position={[0.37, DESK_Y + 0.0015, -0.195]} rotation={[0, 0.16, 0]} scale={1.1}
      onPointerOver={(e) => { e.stopPropagation(); setCursor(true); ctx.hover("Mouse") }}
      onPointerOut={() => { setCursor(false); ctx.hover(null) }}
      onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); ctx.toast("Click.") }}
    >
      <mesh geometry={geo.shell} castShadow receiveShadow><meshStandardMaterial color={SPEC.color} roughness={0.38} metalness={0.25} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={geo.seams}><meshStandardMaterial color={SPEC.seam} roughness={0.9} /></mesh>
      <mesh geometry={geo.wheel} castShadow><meshStandardMaterial color="#17181b" roughness={0.6} metalness={0.3} bumpMap={bump} bumpScale={2} /></mesh>
      <mesh geometry={geo.small} castShadow><meshStandardMaterial color={SPEC.accent} roughness={0.35} metalness={0.3} /></mesh>
    </group>
  )
}
