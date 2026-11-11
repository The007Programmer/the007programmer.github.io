import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { DISPLAY, MONO, f, useCanvasTex } from "./tex"
import { glowTex } from "./proc"
import { cyl, merge, rbox, type Part } from "./merge"
import { DESK_Y, fx, setCursor, shadow, type Ctx } from "./shared"
import { WATCH_AT } from "./stations"

/* ============================================================ the watch (unlocked with the Konami code)
   A Seiko x Initial D AE86 30th-anniversary limited-edition chronograph, as the owner described it. I have not seen
   the real one, so this is a model, not a replica: steel case with a tachymeter-style bezel, crown and two pushers,
   three subdials at 3, 6 and 9, steel bracelet, and a "panda" dial (white with black subdials) with a red accent as the
   nod to the white and black Trueno. Every dial marking, the wordmark, the text and the bracelet pattern are
   APPROXIMATE and no logo is reproduced: send a photo and the dial texture (drawDial) is the one place to fix.
   It lies face up like a flat lay, 12 o'clock toward the monitor. Units are metres before the group scale. */
const R_CASE = 0.0205, R_DIAL = 0.0158, STEEL = "#cfd4db"
const RED = "#c8261c"

/* the dial: canvas covers the dial disc, 1024 px across, canvas up = 12 o'clock */
function drawDial(c: CanvasRenderingContext2D) {
  const C = 512
  c.fillStyle = "#ecebe5"; c.beginPath(); c.arc(C, C, C, 0, 7); c.fill()
  // red accent ring just inside the edge: the Trueno's red line
  c.strokeStyle = RED; c.lineWidth = 9; c.beginPath(); c.arc(C, C, 478, 0, 7); c.stroke()
  const at = (r: number, deg: number): [number, number] => [C + Math.sin((deg * Math.PI) / 180) * r, C - Math.cos((deg * Math.PI) / 180) * r]
  // minute track
  for (let i = 0; i < 60; i++) {
    const [x0, y0] = at(452, i * 6), [x1, y1] = at(i % 5 ? 472 : 440, i * 6)
    c.strokeStyle = "#16161a"; c.lineWidth = i % 5 ? 3 : 7; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke()
  }
  // hour batons
  for (let i = 0; i < 12; i++) {
    if (i === 3 || i === 6 || i === 9) continue // those sit under subdials
    const [x0, y0] = at(350, i * 30), [x1, y1] = at(425, i * 30)
    c.strokeStyle = "#16161a"; c.lineWidth = i === 0 ? 24 : 16; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke()
  }
  // three subdials: 9, 3 and 6
  const sub = (deg: number, hand: number, ticks: number) => {
    const [x, y] = at(262, deg)
    c.fillStyle = "#121215"; c.beginPath(); c.arc(x, y, 148, 0, 7); c.fill()
    c.strokeStyle = "#8b8d93"; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 150, 0, 7); c.stroke()
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2, r0 = 112, r1 = i % (ticks / 4) ? 128 : 136
      c.strokeStyle = "#e7e7e2"; c.lineWidth = 4; c.beginPath(); c.moveTo(x + Math.sin(a) * r0, y - Math.cos(a) * r0); c.lineTo(x + Math.sin(a) * r1, y - Math.cos(a) * r1); c.stroke()
    }
    c.strokeStyle = "#e7e7e2"; c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(hand) * 100, y - Math.cos(hand) * 100); c.stroke()
    c.fillStyle = RED; c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill()
  }
  sub(270, 2.1, 60); sub(90, 5.2, 12); sub(180, 0.5, 30)
  // text, approximate wording
  c.textAlign = "center"; c.fillStyle = "#16161a"; c.font = f(DISPLAY, 56); c.fillText("SEIKO", C, 262)
  c.fillStyle = RED; c.font = f(MONO, 34); c.fillText("AE86", C, 318)
  c.fillStyle = "#4a4a50"; c.font = f(MONO, 22); c.fillText("CHRONOGRAPH", C, 596)
}

/* the bezel ring: black with a tachymeter-style scale (numeral n sits at 21600 / n degrees, the real geometry of the scale) */
function drawBezel(c: CanvasRenderingContext2D) {
  const C = 512
  c.fillStyle = "#0d0d10"; c.fillRect(0, 0, 1024, 1024)
  const at = (r: number, deg: number): [number, number] => [C + Math.sin((deg * Math.PI) / 180) * r, C - Math.cos((deg * Math.PI) / 180) * r]
  for (let i = 0; i < 120; i++) { const [x0, y0] = at(478, i * 3), [x1, y1] = at(i % 2 ? 492 : 500, i * 3); c.strokeStyle = "#cfcfca"; c.lineWidth = i % 2 ? 2 : 3; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke() }
  c.fillStyle = "#f2f1ec"; c.font = f(MONO, 36); c.textAlign = "center"; c.textBaseline = "middle"
  for (const n of [60, 65, 70, 80, 90, 100, 120, 150, 200, 300, 500]) {
    const deg = 21600 / n, [x, y] = at(436, deg)
    c.save(); c.translate(x, y); c.rotate((deg * Math.PI) / 180); c.fillText(String(n), 0, 0); c.restore()
  }
  c.fillStyle = RED; c.beginPath(); const [x, y] = at(436, 0); c.moveTo(x, y - 22); c.lineTo(x - 17, y + 14); c.lineTo(x + 17, y + 14); c.fill()
}

function useWatchGeometry() {
  return useMemo(() => {
    const steel: Part[] = [
      { g: cyl(R_CASE, R_CASE, 0.011, 64), p: [0, 0.0055, 0] }, // case
      { g: new THREE.CylinderGeometry(R_CASE + 0.0003, R_CASE + 0.0003, 0.0028, 64, 1, true), p: [0, 0.0124, 0] }, // bezel edge: the side wall only, so the dial below stays visible
      { g: cyl(0.0014, 0.0014, 0.0022, 12), p: [0, 0.0128, 0] }, // centre pinion
    ]
    // lugs
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) steel.push({ g: rbox(0.0038, 0.0062, 0.0105, 0.0015), p: [sx * 0.0116, 0.0052, sz * 0.0226], r: [sz * 0.1, 0, 0] })
    // crown and the two chronograph pushers on the right, at about 2 and 4 o'clock
    steel.push({ g: cyl(0.0036, 0.0036, 0.0055, 20), p: [R_CASE + 0.0022, 0.0062, 0], r: [0, 0, Math.PI / 2] })
    for (const a of [-0.55, 0.55]) {
      const x = Math.cos(a) * (R_CASE + 0.0006), z = Math.sin(a) * (R_CASE + 0.0006)
      steel.push({ g: cyl(0.0021, 0.0021, 0.0046, 14), p: [x + Math.cos(a) * 0.0017, 0.0062, z + Math.sin(a) * 0.0017], r: [0, -a, Math.PI / 2] })
      steel.push({ g: cyl(0.0027, 0.0027, 0.0012, 14), p: [x + Math.cos(a) * 0.0045, 0.0062, z + Math.sin(a) * 0.0045], r: [0, -a, Math.PI / 2] })
    }
    // hour and minute hands, set to the time you unlocked it
    const now = new Date(), mn = now.getMinutes() + now.getSeconds() / 60, hr = (now.getHours() % 12) + mn / 60
    const hand = (len: number, w: number, deg: number, y: number): Part => { const a = (deg * Math.PI) / 180; return { g: rbox(w, 0.0005, len, 0.0002, 2), p: [Math.sin(a) * len * 0.45, y, -Math.cos(a) * len * 0.45], r: [0, -a, 0] } }
    steel.push(hand(0.0088, 0.0019, hr * 30, 0.0122), hand(0.0128, 0.0014, mn * 6, 0.0127))
    // bracelet: seven links a side, narrowing toward the clasp, drifting into a gentle S so it is lying, not laid out
    for (const side of [-1, 1]) {
      let x = 0, z = side * (R_CASE + 0.0036), phi = 0
      for (let i = 0; i < 7; i++) {
        const dx = -side * Math.sin(phi), dz = side * Math.cos(phi)
        steel.push({ g: rbox(0.0195 - i * 0.0005, 0.0032, 0.0072, 0.0012, 2), p: [x, 0.0017, z], r: [0, Math.atan2(dx, dz), 0] })
        x += dx * 0.0075; z += dz * 0.0075; phi += 0.05
      }
      if (side > 0) steel.push({ g: rbox(0.0165, 0.0042, 0.011, 0.0016, 3), p: [x, 0.0021, z], r: [0, Math.atan2(-side * Math.sin(phi), side * Math.cos(phi)), 0] }) // clasp
    }
    // chronograph seconds hand
    const red: Part[] = [{ g: rbox(0.0007, 0.0005, 0.0146, 0.0002, 2), p: [0, 0.0134, -0.0026] }, { g: cyl(0.0016, 0.0016, 0.0006, 14), p: [0, 0.0134, 0] }]
    return { steel: merge(steel), red: merge(red) }
  }, [])
}

export function Watch({ ctx }: { ctx: Ctx }) {
  const g = useRef<THREE.Group>(null!), lift = useRef<THREE.Group>(null!), glint = useRef<THREE.Sprite>(null!)
  const geo = useWatchGeometry()
  const dial = useCanvasTex(1024, 1024, drawDial, "dial")
  const bezel = useCanvasTex(1024, 1024, drawBezel, "bezel")
  const spark = useMemo(() => glowTex(), [])
  const invalidate = useThree((s) => s.invalidate)
  const t = useRef(fx.watchDrop ? 0 : 99), h = useRef(0), want = useRef(0)
  useEffect(() => { fx.watchDrop = false; shadow.dirty = true; invalidate() }, [invalidate])
  const T = 0.55 // fall time
  useFrame((_, dt) => {
    let busy = false
    if (t.current < T + 1.4) { t.current += ctx.reduced ? 99 : dt; busy = true }
    const tt = t.current
    // drop with a spin, two small bounces, then a glint across the crystal
    const u = Math.min(1, tt / T), after = Math.max(0, tt - T)
    const bounce = after < 1.2 ? 0.03 * Math.exp(-5 * after) * Math.abs(Math.sin(9 * after)) : 0
    const fall = tt < T ? 0.42 * (1 - u * u) : 0
    lift.current.position.y = fall + bounce
    lift.current.rotation.set((1 - u) * 0.8, (1 - u) * (1 - u) * 2.2, 0)
    h.current += (want.current - h.current) * (ctx.reduced ? 1 : 1 - Math.exp(-dt * 12))
    g.current.position.y = DESK_Y + h.current * 0.012
    g.current.rotation.x = -h.current * 0.2
    const gt = (tt - T - 0.12) / 0.7
    glint.current.visible = gt > 0 && gt < 1
    if (glint.current.visible) {
      const k = gt * 2 - 1
      glint.current.position.set(k * 0.019, 0.0165, -k * 0.012)
      ;(glint.current.material as THREE.SpriteMaterial).opacity = Math.sin(gt * Math.PI) * 0.95
      busy = true
    }
    if (busy || Math.abs(want.current - h.current) > 0.003) { shadow.dirty = true; invalidate() }
  })
  return (
    <group
      ref={g} position={[WATCH_AT[0], DESK_Y, WATCH_AT[1]]} rotation={[0, -0.12, 0]} scale={1.6}
      onPointerOver={(e) => { e.stopPropagation(); want.current = 1; setCursor(true); ctx.hover("Seiko × Initial D AE86 chronograph"); invalidate() }}
      onPointerOut={() => { want.current = 0; setCursor(false); ctx.hover(null); invalidate() }}
      onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); ctx.goto("watch") }}
    >
      <group ref={lift}>
        <mesh geometry={geo.steel} castShadow receiveShadow><meshStandardMaterial color={STEEL} metalness={0.75} roughness={0.32} /></mesh>
        <mesh position={[0, 0.0139, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[R_DIAL, R_CASE, 64]} /><meshStandardMaterial map={bezel} roughness={0.4} metalness={0.2} polygonOffset polygonOffsetFactor={-1} /></mesh>
        <mesh position={[0, 0.0111, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[R_DIAL, 64]} /><meshStandardMaterial map={dial} roughness={0.5} /></mesh>
        <mesh geometry={geo.red}><meshStandardMaterial color={RED} roughness={0.4} emissive={RED} emissiveIntensity={0.15} /></mesh>
        <mesh position={[0, 0.0142, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[R_DIAL, 48]} /><meshPhysicalMaterial color="#ffffff" transparent opacity={0.1} roughness={0.03} clearcoat={1} clearcoatRoughness={0.03} depthWrite={false} /></mesh>
        <sprite ref={glint} visible={false} scale={[0.05, 0.012, 1]} raycast={() => null}>
          <spriteMaterial map={spark} color="#fff6e0" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} rotation={0.7} />
        </sprite>
      </group>
    </group>
  )
}
