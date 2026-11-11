import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { DISPLAY, MONO, f, useCanvasTex } from "./tex"
import { glowTex } from "./proc"
import { cyl, merge, rbox, type Part } from "./merge"
import { DESK_Y, fx, setCursor, shadow, type Ctx } from "./shared"
import { WATCH_AT } from "./stations"

/* ============================================================ the watch (unlocked with the Konami code)
   SEIKO x INITIAL D 30th Anniversary collaboration watch, limited edition (1,995 pieces).
   FROM PUBLISHED DESCRIPTIONS (Gear Patrol, Hypebeast, Japanese Nostalgic Car, 2025): stainless case about 40 mm, 12.8 mm
   thick, 47 mm lug to lug; polished steel tachymeter bezel; panda dial, roughly the top two thirds white and the bottom
   third black (the Trueno's paint split); three black subdials: 9 = 60-minute counter styled as a speedometer ("MIN"),
   3 = 24-hour counter styled as the AE86 tachometer with a headlight icon, 6 = oversized running seconds with a
   stylised "D" and a red hand; black date window at 4:30; "SEIKO" at 12 and small "藤原とうふ店" above 4 o'clock, no other
   dial text; lumed slim baton hands and applied baton indices; polished pump pushers at 2 and 4, crown at 3; brushed
   three-link steel bracelet; closed caseback with the Initial D logo and "XXXX/1995" (underneath, so not modelled).
   APPROXIMATED: exact hand and index shapes, subdial tick layout and numerals, the "D" and headlight glyphs, the date
   numeral, fonts, bracelet link shape, lug chamfers (no logos are reproduced). drawDial() is the one place to fix those.
   It lies face up like a flat lay, 12 o'clock toward the monitor. Units are metres before the group scale. */
const R_CASE = 0.02, R_DIAL = 0.0158, STEEL = "#cfd4db"
const RED = "#c8261c", LUME = "#dfe8d0"
const Y_CASE = 0.01, Y_BEZEL = 0.0118, Y_DIAL = 0.0103

/* the dial: canvas covers the dial disc, 1024 px across, canvas up = 12 o'clock */
function drawDial(c: CanvasRenderingContext2D) {
  const C = 512, SPLIT = 684 // white above, black below: top two thirds of the diameter
  c.save(); c.beginPath(); c.arc(C, C, C, 0, 7); c.clip()
  c.fillStyle = "#ecebe5"; c.fillRect(0, 0, 1024, SPLIT)
  c.fillStyle = "#101012"; c.fillRect(0, SPLIT, 1024, 1024 - SPLIT)
  c.restore()
  const ink = (y: number) => (y > SPLIT ? "#e7e7e2" : "#16161a")
  const at = (r: number, deg: number): [number, number] => [C + Math.sin((deg * Math.PI) / 180) * r, C - Math.cos((deg * Math.PI) / 180) * r]
  // minute track, then slim applied baton indices (lume with a dark edge on the white, plain lume on the black)
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue
    const [x0, y0] = at(458, i * 6), [x1, y1] = at(485, i * 6)
    c.strokeStyle = ink(y1); c.lineWidth = 3; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke()
  }
  for (let i = 0; i < 12; i++) {
    const [x0, y0] = at(412, i * 30), [x1, y1] = at(488, i * 30), low = y1 > SPLIT
    c.lineCap = "butt"
    c.strokeStyle = low ? "#e7e7e2" : "#16161a"; c.lineWidth = i === 0 ? 24 : 20; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke()
    c.strokeStyle = LUME; c.lineWidth = i === 0 ? 14 : 10; c.beginPath(); c.moveTo(x0 + (x1 - x0) * 0.08, y0 + (y1 - y0) * 0.08); c.lineTo(x1 - (x1 - x0) * 0.08, y1 - (y1 - y0) * 0.08); c.stroke()
  }
  // subdials: all black, with a pale ring
  const disc = (x: number, y: number, r: number) => {
    c.fillStyle = "#08080a"; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill()
    c.strokeStyle = "#7d8087"; c.lineWidth = 4; c.beginPath(); c.arc(x, y, r + 2, 0, 7); c.stroke()
  }
  const hand = (x: number, y: number, a: number, len: number, col: string) => {
    c.strokeStyle = col; c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(a) * len, y - Math.cos(a) * len); c.stroke()
    c.fillStyle = col; c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill()
  }
  // a sweep of ticks, darker toward the bottom of the dial
  const sweep = (x: number, y: number, r: number, from: number, to: number, n: number) => {
    for (let i = 0; i <= n; i++) {
      const a = ((from + ((to - from) * i) / n) * Math.PI) / 180, big = i % 2 === 0, bottom = Math.cos(a) < -0.5
      c.strokeStyle = bottom ? "#7a7c82" : "#e7e7e2"; c.lineWidth = big ? 5 : 3
      c.beginPath(); c.moveTo(x + Math.sin(a) * (r - (big ? 30 : 20)), y - Math.cos(a) * (r - (big ? 30 : 20))); c.lineTo(x + Math.sin(a) * (r - 8), y - Math.cos(a) * (r - 8)); c.stroke()
    }
  }
  c.textAlign = "center"; c.textBaseline = "middle"
  // 9: speedometer-style minute counter, open at the bottom, "MIN" where the odometer would be
  const [x9, y9] = [C - 268, C - 6]
  disc(x9, y9, 140); sweep(x9, y9, 140, -120, 120, 12)
  c.fillStyle = "#e7e7e2"; c.font = f(MONO, 22); c.fillText("MIN", x9, y9 + 52)
  hand(x9, y9, 2.0, 100, "#e7e7e2")
  // 3: tachometer-style 24-hour counter with a high-beam icon among the ticks
  const [x3, y3] = [C + 268, C - 6]
  disc(x3, y3, 140); sweep(x3, y3, 140, -130, 130, 13)
  c.strokeStyle = "#e7e7e2"; c.lineWidth = 3; c.beginPath(); c.arc(x3, y3 - 58, 12, Math.PI / 2, Math.PI * 1.5); c.stroke()
  for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x3 + 6, y3 - 58 + k * 9); c.lineTo(x3 + 24, y3 - 58 + k * 9); c.stroke() }
  hand(x3, y3, 0.9, 98, "#e7e7e2")
  // 6: oversized running seconds, a stylised D, red hand
  const [x6, y6] = [C, 792]
  disc(x6, y6, 196); sweep(x6, y6, 196, -180, 168, 60)
  c.fillStyle = "#e7e7e2"; c.font = f(DISPLAY, 80); c.fillText("D", x6, y6 + 58)
  hand(x6, y6, 3.4, 150, RED)
  // date window at 4:30, black
  const [xd, yd] = at(392, 135)
  c.fillStyle = "#050506"; c.fillRect(xd - 44, yd - 32, 88, 64); c.strokeStyle = "#7d8087"; c.lineWidth = 3; c.strokeRect(xd - 44, yd - 32, 88, 64)
  c.fillStyle = "#e7e7e2"; c.font = f(MONO, 38); c.fillText("15", xd, yd + 2)
  // text: only the wordmark and the shop name
  c.fillStyle = "#16161a"; c.font = f(DISPLAY, 54); c.fillText("SEIKO", C, 262)
  const [xj, yj] = at(402, 112)
  c.save(); c.translate(xj, yj); c.rotate((22 * Math.PI) / 180); c.fillStyle = "#16161a"; c.font = '700 30px "Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif'; c.fillText("藤原とうふ店", 0, 0); c.restore()
}

/* the bezel ring: polished steel with a tachymeter scale (numeral n sits at 21600 / n degrees, the real geometry of the scale) */
function drawBezel(c: CanvasRenderingContext2D) {
  const C = 512
  const g = c.createLinearGradient(0, 0, 1024, 1024); g.addColorStop(0, "#e6e9ee"); g.addColorStop(0.5, "#b5bac2"); g.addColorStop(1, "#dfe3e8")
  c.fillStyle = g; c.fillRect(0, 0, 1024, 1024)
  const at = (r: number, deg: number): [number, number] => [C + Math.sin((deg * Math.PI) / 180) * r, C - Math.cos((deg * Math.PI) / 180) * r]
  for (let i = 0; i < 120; i++) { const [x0, y0] = at(478, i * 3), [x1, y1] = at(i % 2 ? 492 : 500, i * 3); c.strokeStyle = "#2a2c31"; c.lineWidth = i % 2 ? 2 : 3; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke() }
  c.fillStyle = "#2a2c31"; c.font = f(MONO, 36); c.textAlign = "center"; c.textBaseline = "middle"
  for (const n of [60, 65, 70, 80, 90, 100, 120, 150, 200, 300, 500]) {
    const deg = 21600 / n, [x, y] = at(436, deg)
    c.save(); c.translate(x, y); c.rotate((deg * Math.PI) / 180); c.fillText(String(n), 0, 0); c.restore()
  }
}

function useWatchGeometry() {
  return useMemo(() => {
    const steel: Part[] = [
      { g: cyl(R_CASE, R_CASE, Y_CASE, 64), p: [0, Y_CASE / 2, 0] }, // case, brushed
      { g: new THREE.CylinderGeometry(R_CASE + 0.0003, R_CASE + 0.0003, 0.0026, 64, 1, true), p: [0, Y_CASE + 0.0007, 0] }, // bezel edge: the side wall only, so the dial below stays visible
      { g: cyl(0.0014, 0.0014, 0.0024, 12), p: [0, Y_DIAL + 0.002, 0] }, // centre pinion
    ]
    // lugs: 47 mm lug to lug
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) steel.push({ g: rbox(0.0038, 0.0062, 0.0095, 0.0015), p: [sx * 0.0116, 0.0052, sz * 0.0188], r: [sz * 0.1, 0, 0] })
    // crown at 3, polished pump-style pushers at about 2 and 4 o'clock
    steel.push({ g: cyl(0.0036, 0.0036, 0.0055, 20), p: [R_CASE + 0.0022, 0.0058, 0], r: [0, 0, Math.PI / 2] })
    for (const a of [-0.55, 0.55]) {
      const x = Math.cos(a) * (R_CASE + 0.0006), z = Math.sin(a) * (R_CASE + 0.0006)
      steel.push({ g: cyl(0.0019, 0.0019, 0.0046, 14), p: [x + Math.cos(a) * 0.0017, 0.0058, z + Math.sin(a) * 0.0017], r: [0, -a, Math.PI / 2] })
      steel.push({ g: cyl(0.0028, 0.0028, 0.0013, 14), p: [x + Math.cos(a) * 0.0045, 0.0058, z + Math.sin(a) * 0.0045], r: [0, -a, Math.PI / 2] })
    }
    // slim baton hour and minute hands, set to the time you unlocked it
    const now = new Date(), mn = now.getMinutes() + now.getSeconds() / 60, hr = (now.getHours() % 12) + mn / 60
    const hand = (len: number, w: number, deg: number, y: number): Part => { const a = (deg * Math.PI) / 180; return { g: rbox(w, 0.0005, len, 0.0002, 2), p: [Math.sin(a) * len * 0.45, y, -Math.cos(a) * len * 0.45], r: [0, -a, 0] } }
    steel.push(hand(0.0088, 0.0016, hr * 30, Y_DIAL + 0.0009), hand(0.0128, 0.0012, mn * 6, Y_DIAL + 0.0013))
    // brushed three-link bracelet: a fine run of rows, each a centre link with a staggered link either side; ten rows a side, drifting into a gentle S. All merged into the one steel mesh.
    for (const side of [-1, 1]) {
      let x = 0, z = side * (R_CASE + 0.0024), phi = 0
      for (let i = 0; i < 10; i++) {
        const dx = -side * Math.sin(phi), dz = side * Math.cos(phi), yaw = Math.atan2(dx, dz), k = 1 - i * 0.015
        steel.push({ g: rbox(0.0078 * k, 0.003, 0.0042, 0.001, 2), p: [x, 0.0016, z], r: [0, yaw, 0] })
        for (const o of [-1, 1]) steel.push({ g: rbox(0.005 * k, 0.003, 0.0042, 0.001, 2), p: [x + dz * o * 0.0067 * k + dx * 0.0023, 0.0016, z - dx * o * 0.0067 * k + dz * 0.0023], r: [0, yaw, 0] })
        x += dx * 0.0046; z += dz * 0.0046; phi += 0.025
      }
      if (side > 0) steel.push({ g: rbox(0.0165, 0.0042, 0.011, 0.0016, 3), p: [x, 0.0021, z], r: [0, Math.atan2(-side * Math.sin(phi), side * Math.cos(phi)), 0] }) // clasp
    }
    // chronograph seconds hand
    const red: Part[] = [{ g: rbox(0.0007, 0.0005, 0.0146, 0.0002, 2), p: [0, Y_DIAL + 0.0017, -0.0026] }, { g: cyl(0.0016, 0.0016, 0.0006, 14), p: [0, Y_DIAL + 0.0017, 0] }]
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
      glint.current.position.set(k * 0.019, Y_BEZEL + 0.003, -k * 0.012)
      ;(glint.current.material as THREE.SpriteMaterial).opacity = Math.sin(gt * Math.PI) * 0.95
      busy = true
    }
    if (busy || Math.abs(want.current - h.current) > 0.003) { shadow.dirty = true; invalidate() }
  })
  return (
    <group
      ref={g} position={[WATCH_AT[0], DESK_Y, WATCH_AT[1]]} rotation={[0, Math.PI / 2 - 0.12, 0]} scale={1.5}
      onPointerOver={(e) => { e.stopPropagation(); want.current = 1; setCursor(true); ctx.hover("Seiko × Initial D AE86 chronograph"); invalidate() }}
      onPointerOut={() => { want.current = 0; setCursor(false); ctx.hover(null); invalidate() }}
      onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); ctx.goto("watch") }}
    >
      <group ref={lift}>
        <mesh geometry={geo.steel} castShadow receiveShadow><meshStandardMaterial color={STEEL} metalness={0.75} roughness={0.32} /></mesh>
        <mesh position={[0, Y_BEZEL + 0.0002, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[R_DIAL, R_CASE, 64]} /><meshStandardMaterial map={bezel} roughness={0.25} metalness={0.55} polygonOffset polygonOffsetFactor={-1} /></mesh>
        <mesh position={[0, Y_DIAL, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[R_DIAL, 64]} /><meshStandardMaterial map={dial} roughness={0.5} /></mesh>
        <mesh geometry={geo.red}><meshStandardMaterial color={RED} roughness={0.4} emissive={RED} emissiveIntensity={0.15} /></mesh>
        <mesh position={[0, Y_BEZEL + 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[R_DIAL, 48]} /><meshPhysicalMaterial color="#ffffff" transparent opacity={0.1} roughness={0.03} clearcoat={1} clearcoatRoughness={0.03} depthWrite={false} /></mesh>
        <sprite ref={glint} visible={false} scale={[0.05, 0.012, 1]} raycast={() => null}>
          <spriteMaterial map={spark} color="#fff6e0" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} rotation={0.7} />
        </sprite>
      </group>
    </group>
  )
}
