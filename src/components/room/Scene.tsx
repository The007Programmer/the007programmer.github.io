import { useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from "react"
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber"
import { Html, Line } from "@react-three/drei"
import * as THREE from "three"
import { ELECTRA, PROJECT_CARDS } from "@/data/work"
import { LEDGER_ROWS } from "@/data/path"
import { DESK_ITEMS, SEAT, STATIONS, stationOf, type DeskItem, type SId } from "./stations"
import { DISPLAY, MONO, cover, f, loadImg, useCanvasTex, wrap } from "./tex"

export interface Input { px: number; py: number; ox: number; oy: number; inv?: () => void }
export interface Ctx {
  focus: SId | null
  card: string | null
  lamp: boolean
  reduced: boolean
  goto: (id: SId) => void
  openCard: (id: string) => void
  toggleLamp: () => void
  toast: (m: string) => void
}

const C = { void: "#0A0D13", ink: "#111722", ink2: "#18202D", line: "#2E3A54", edge: "#617599", chalk: "#EDF2F8", signal: "#FF5B4F", ember: "#C4261E" }
const DESK_Y = 0.8

/* ---------------------------------------------------------------- helpers */
function setCursor(on: boolean) { document.body.style.cursor = on ? "pointer" : "" }
const hov = (on: boolean) => ({ onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setCursor(on) }, onPointerOut: () => setCursor(false) })

function Hot({ id, ctx, children, ...rest }: { id: SId; ctx: Ctx; children: ReactNode } & Record<string, unknown>) {
  return (
    <group
      {...rest}
      onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); ctx.goto(id) }}
      onPointerOver={(e) => { e.stopPropagation(); setCursor(true) }}
      onPointerOut={() => setCursor(false)}
    >
      {children}
    </group>
  )
}

/* -------------------------------------------------------------- camera rig */
const _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, "YXZ"), _m = new THREE.Matrix4(), _up = new THREE.Vector3(0, 1, 0), _l = new THREE.Vector3(), _p = new THREE.Vector3()
function Rig({ ctx, input }: { ctx: Ctx; input: MutableRefObject<Input> }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => { invalidate() }, [ctx.focus, invalidate])
  useFrame((state, dt) => {
    const cam = state.camera
    if (ctx.focus) {
      const s = stationOf(ctx.focus)
      _p.set(...s.pos)
      _m.lookAt(_p, _l.set(...s.look), _up); _q.setFromRotationMatrix(_m)
    } else {
      const { px, py, ox, oy } = input.current
      const yaw = THREE.MathUtils.clamp(-px * 26 + ox, -35, 35)
      const pr = py < 0 ? -9 - py * 34 : -9 - py * 41
      const pitch = THREE.MathUtils.clamp(pr + oy, -50, 25)
      _e.set(THREE.MathUtils.degToRad(pitch), THREE.MathUtils.degToRad(yaw), 0)
      _q.setFromEuler(_e)
      _p.set(...SEAT)
    }
    const k = ctx.reduced ? 1 : 1 - Math.exp(-dt * (ctx.focus ? 4.2 : 5))
    cam.position.lerp(_p, k)
    cam.quaternion.slerp(_q, k)
    if (cam.position.distanceTo(_p) > 5e-4 || cam.quaternion.angleTo(_q) > 5e-4) invalidate()
  })
  return null
}

/* ----------------------------------------------------------------- lights */
function Lights({ ctx }: { ctx: Ctx }) {
  const amb = useRef<THREE.AmbientLight>(null!), spot = useRef<THREE.SpotLight>(null!), key = useRef<THREE.DirectionalLight>(null!), warm = useRef<THREE.PointLight>(null!)
  const lvl = useRef(1)
  const invalidate = useThree((s) => s.invalidate)
  const target = useMemo(() => new THREE.Object3D(), [])
  useEffect(() => { invalidate() }, [ctx.lamp, invalidate])
  useFrame((_, dt) => {
    const goal = ctx.lamp ? 1 : 0
    lvl.current += (goal - lvl.current) * (ctx.reduced ? 1 : 1 - Math.exp(-dt * 7))
    const l = lvl.current
    amb.current.intensity = 0.14 + 0.34 * l
    key.current.intensity = 0.1 + 0.55 * l
    spot.current.intensity = 11 * l
    warm.current.intensity = 0.9 * l
    if (Math.abs(goal - l) > 0.002) invalidate()
  })
  return (
    <>
      <ambientLight ref={amb} color="#8d9ec4" />
      <directionalLight ref={key} position={[-2, 3.2, 2.5]} color="#a8b8e0" />
      <primitive object={target} position={[-0.15, DESK_Y, 0.05]} />
      <spotLight ref={spot} position={[-0.88, 1.42, -0.32]} target={target} angle={0.75} penumbra={0.9} color="#ffc990" decay={1.6} distance={7} castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      <pointLight ref={warm} position={[-0.8, 1.35, 0]} color="#ffb070" distance={4} decay={2} />
      {/* monitor spill, always on */}
      <pointLight position={[0, 1.25, -0.2]} color="#7fa6ff" intensity={0.6} distance={3} decay={2} />
      {/* fill for the stations you lean into */}
      <pointLight position={[0, 2.4, -0.4]} color="#9db4e8" intensity={0.8} distance={3.5} decay={2} />
      <pointLight position={[1.7, 1.9, -0.7]} color="#9db4e8" intensity={1.1} distance={3.5} decay={2} />
      <pointLight position={[-1.75, 1.25, -0.35]} color="#b9c8ee" intensity={2.2} distance={3.5} decay={2} />
      {/* signal-red strip under the shelf */}
      <pointLight position={[0, 1.9, -1.2]} color={C.signal} intensity={0.9} distance={2.4} decay={2} />
    </>
  )
}

/* ------------------------------------------------------------------- room */
function Shell() {
  return (
    <group>
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[9, 8]} /><meshStandardMaterial color="#0e131c" roughness={0.9} /></mesh>
      {/* rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0.9]} receiveShadow><circleGeometry args={[1.5, 40]} /><meshStandardMaterial color="#1a222f" roughness={1} /></mesh>
      {/* walls */}
      <mesh position={[0, 1.5, -1.62]} receiveShadow><planeGeometry args={[9, 3]} /><meshStandardMaterial color="#121926" roughness={1} /></mesh>
      <mesh position={[-3.2, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[8, 3]} /><meshStandardMaterial color="#0f1520" roughness={1} /></mesh>
      <mesh position={[3.2, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow><planeGeometry args={[8, 3]} /><meshStandardMaterial color="#0f1520" roughness={1} /></mesh>
      <mesh position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[9, 8]} /><meshStandardMaterial color="#090c12" /></mesh>
      {/* baseboard */}
      <mesh position={[0, 0.07, -1.6]}><boxGeometry args={[9, 0.14, 0.04]} /><meshStandardMaterial color="#1a2332" /></mesh>
      {/* desk */}
      <mesh position={[0, DESK_Y - 0.03, -0.25]} castShadow receiveShadow><boxGeometry args={[3.1, 0.06, 1.5]} /><meshStandardMaterial color="#2b2118" roughness={0.55} metalness={0.05} /></mesh>
      <mesh position={[0, DESK_Y - 0.075, -0.25]}><boxGeometry args={[3.05, 0.03, 1.45]} /><meshStandardMaterial color="#1b140e" /></mesh>
      {[[-1.45, -0.9], [1.45, -0.9], [-1.45, 0.4], [1.45, 0.4]].map(([x, z], i) => (
        <mesh key={i} position={[x, (DESK_Y - 0.06) / 2, z]} castShadow><boxGeometry args={[0.07, DESK_Y - 0.06, 0.07]} /><meshStandardMaterial color="#10151d" metalness={0.4} roughness={0.5} /></mesh>
      ))}
      {/* desk mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, DESK_Y + 0.002, 0.05]} receiveShadow><planeGeometry args={[2.2, 0.95]} /><meshStandardMaterial color="#131a26" roughness={0.95} /></mesh>
      {/* chair back peeking in the corner of view */}
      <mesh position={[0, 0.55, 1.75]}><boxGeometry args={[0.6, 0.05, 0.05]} /><meshStandardMaterial color="#000" /></mesh>
    </group>
  )
}

/* ---------------------------------------------------------------- monitor */
function Monitor({ ctx }: { ctx: Ctx }) {
  const tex = useCanvasTex(1280, 720, async (g) => {
    g.fillStyle = "#0A0D13"; g.fillRect(0, 0, 1280, 720)
    const grd = g.createLinearGradient(0, 0, 1280, 720); grd.addColorStop(0, "#18202D"); grd.addColorStop(1, "#0A0D13")
    g.fillStyle = grd; g.fillRect(0, 0, 1280, 720)
    // title bar
    g.fillStyle = "#111722"; g.fillRect(0, 0, 1280, 56)
    ;["#FF5B4F", "#617599", "#2E3A54"].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(34 + i * 34, 28, 10, 0, 7); g.fill() })
    g.fillStyle = "#AFBBCB"; g.font = f(MONO, 22); g.fillText("electra — agents & systems", 140, 36)
    // sidebar
    g.fillStyle = "#111722"; g.fillRect(0, 56, 260, 664)
    ;["AGENTS", "SYSTEMS", "TOOLKIT"].forEach((t, i) => {
      g.fillStyle = i === 0 ? "#FF5B4F" : "#8593A6"; g.font = f(MONO, 26); g.fillText((i === 0 ? "> " : "  ") + t, 30, 130 + i * 62)
    })
    // main
    g.fillStyle = "#FF5B4F"; g.font = f(MONO, 22); g.fillText(ELECTRA.stamp.toUpperCase(), 310, 130)
    g.fillStyle = "#EDF2F8"; g.font = f(DISPLAY, 150); g.fillText("ELECTRA", 306, 270)
    g.fillStyle = "#AFBBCB"; g.font = "500 30px 'Instrument Sans', sans-serif"
    wrap(g, ELECTRA.lede, 312, 340, 880, 44, 4)
    g.fillStyle = "#617599"; g.font = f(MONO, 22)
    g.fillText("click the screen to open", 312, 620)
    g.fillStyle = "#FF5B4F"; g.fillRect(312 + 336, 598, 14, 28)
  }, "monitor")
  return (
    <Hot id="monitor" ctx={ctx}>
      <mesh position={[0, DESK_Y + 0.015, -0.62]} castShadow><boxGeometry args={[0.5, 0.03, 0.26]} /><meshStandardMaterial color="#10151d" metalness={0.5} roughness={0.4} /></mesh>
      <mesh position={[0, DESK_Y + 0.25, -0.76]} castShadow><boxGeometry args={[0.09, 0.45, 0.05]} /><meshStandardMaterial color="#10151d" metalness={0.5} roughness={0.4} /></mesh>
      <mesh position={[0, 1.28, -0.68]} castShadow><boxGeometry args={[1.32, 0.78, 0.07]} /><meshStandardMaterial color="#0c1018" roughness={0.4} metalness={0.3} /></mesh>
      <mesh position={[0, 1.28, -0.643]}><planeGeometry args={[1.22, 0.686]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
      <mesh position={[0.5, 0.905, -0.642]}><boxGeometry args={[0.025, 0.012, 0.004]} /><meshBasicMaterial color={C.signal} toneMapped={false} /></mesh>
    </Hot>
  )
}

function Peripherals() {
  return (
    <group>
      <mesh position={[0, DESK_Y + 0.012, -0.22]} castShadow receiveShadow><boxGeometry args={[0.46, 0.022, 0.15]} /><meshStandardMaterial color="#1a2230" roughness={0.6} /></mesh>
      {Array.from({ length: 4 }, (_, r) => Array.from({ length: 14 }, (_, c) => (
        <mesh key={r + "-" + c} position={[-0.2 + c * 0.0305, DESK_Y + 0.026, -0.262 + r * 0.03]}><boxGeometry args={[0.026, 0.008, 0.026]} /><meshStandardMaterial color={r === 0 && c === 13 ? C.signal : "#252f42"} /></mesh>
      )))}
      <mesh position={[0.46, DESK_Y + 0.012, -0.2]} castShadow><boxGeometry args={[0.06, 0.024, 0.1]} /><meshStandardMaterial color="#1a2230" /></mesh>
    </group>
  )
}

/* ------------------------------------------------------------ desk surface */
function CardFace({ item }: { item: DeskItem }) {
  const tex = useCanvasTex(400, 540, async (g) => {
    const img = await loadImg(item.img)
    if (item.kind === "HELLO") {
      g.fillStyle = "#E7EAEE"; g.fillRect(0, 0, 400, 540)
      cover(g, img, 24, 24, 352, 400)
      g.fillStyle = "#10161f"; g.font = f(DISPLAY, 58); g.fillText("HELLO", 28, 492)
      g.fillStyle = "#44546a"; g.font = f(MONO, 17); g.fillText(item.org, 30, 522)
      return
    }
    g.fillStyle = "#DCE2EA"; g.fillRect(0, 0, 400, 540)
    g.fillStyle = "#c9d1dd"; g.fillRect(0, 0, 400, 54)
    g.fillStyle = "#EDF2F8"; g.fillRect(0, 0, 120, 54)
    g.fillStyle = "#0A0D13"; g.font = f(MONO, 22); g.fillText(item.kind, 18, 36)
    g.fillStyle = "#44546a"; g.font = f(MONO, 17); g.fillText(item.org.toUpperCase(), 140, 34)
    g.fillStyle = "#10161f"; g.font = f(DISPLAY, item.title.length > 11 ? 40 : item.title.length > 8 ? 52 : 66); g.fillText(item.title.toUpperCase(), 22, 132)
    cover(g, img, 22, 160, 356, 220, true)
    g.strokeStyle = "#8c98ab"; g.lineWidth = 2; g.strokeRect(22, 160, 356, 220)
    g.save(); g.translate(250, 440); g.rotate(-0.14)
    g.strokeStyle = "#a1281f"; g.lineWidth = 3; g.font = f(MONO, 24)
    const w = g.measureText(item.stamp).width + 28
    g.strokeRect(-w / 2, -26, w, 46); g.strokeRect(-w / 2 + 5, -21, w - 10, 36)
    g.fillStyle = "#a1281f"; g.textAlign = "center"; g.fillText(item.stamp, 0, 6); g.restore()
    g.fillStyle = "#26334a"; g.font = f(MONO, 16); g.fillText(item.tags.join(" · "), 22, 512)
  }, item.id)
  return (
    <mesh position={[0, 0.0045, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.34, 0.459]} /><meshStandardMaterial map={tex} roughness={0.85} /></mesh>
  )
}

function Card({ item, ctx }: { item: DeskItem; ctx: Ctx }) {
  const g = useRef<THREE.Group>(null!)
  const h = useRef(0), want = useRef(0)
  const invalidate = useThree((s) => s.invalidate)
  const sel = ctx.card === item.id
  useFrame((_, dt) => {
    const goal = sel ? 1.4 : want.current
    h.current += (goal - h.current) * (ctx.reduced ? 1 : 1 - Math.exp(-dt * 12))
    g.current.position.y = DESK_Y + 0.004 + h.current * 0.05
    g.current.rotation.x = h.current * 0.22
    if (Math.abs(goal - h.current) > 0.003) invalidate()
  })
  return (
    <group
      ref={g}
      position={[item.x, DESK_Y + 0.004, item.z]}
      rotation={[0, item.rot, 0]}
      onPointerOver={(e) => { e.stopPropagation(); want.current = 1; setCursor(true); invalidate() }}
      onPointerOut={() => { want.current = 0; setCursor(false); invalidate() }}
      onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); ctx.openCard(item.id) }}
    >
      <mesh position={[0, 0.002, 0]} castShadow receiveShadow><boxGeometry args={[0.34, 0.004, 0.459]} /><meshStandardMaterial color="#c9d1dd" /></mesh>
      <CardFace item={item} />
    </group>
  )
}

function Ring({ ctx }: { ctx: Ctx }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.38, DESK_Y + 0.004, 0.4]} onClick={(e) => { e.stopPropagation(); ctx.toast("That ring is from cold brew. Not a bug.") }} {...hov(true)}>
      <ringGeometry args={[0.04, 0.052, 32]} /><meshStandardMaterial color="#4a3022" transparent opacity={0.7} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ shelf */
function Book({ title, sub, x, y, w = 0.56 }: { title: string; sub: string; x: number; y: number; w?: number }) {
  const tex = useCanvasTex(512, 96, (g) => {
    g.fillStyle = "#18202D"; g.fillRect(0, 0, 512, 96)
    g.fillStyle = "#FF5B4F"; g.fillRect(0, 0, 14, 96)
    g.fillStyle = "#EDF2F8"; g.font = f(DISPLAY, 54); g.fillText(title.toUpperCase(), 34, 66)
    g.fillStyle = "#8593A6"; g.font = f(MONO, 15); g.fillText(sub, 300, 56)
  }, title)
  const mats = useMemo(() => {
    const paper = new THREE.MeshStandardMaterial({ color: "#d8dde6", roughness: 0.9 }), dark = new THREE.MeshStandardMaterial({ color: "#1a2232", roughness: 0.7 })
    return [paper, paper, dark, dark, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }), dark]
  }, [tex])
  return <mesh position={[x, y, -1.32]} castShadow material={mats}><boxGeometry args={[w, 0.09, 0.3]} /></mesh>
}

function Shelf({ ctx }: { ctx: Ctx }) {
  const fillers = [[-0.85, 0.3, "#2a3550"], [-0.77, 0.26, "#8E1A13"], [-0.69, 0.32, "#1f2a40"], [-0.6, 0.27, "#44546a"], [-0.52, 0.3, "#C4261E"], [-0.44, 0.24, "#18202D"]] as const
  const sage = PROJECT_CARDS.find((p) => p.id === "sage")!, rec = PROJECT_CARDS.find((p) => p.id === "recurser")!
  return (
    <Hot id="shelf" ctx={ctx}>
      <mesh position={[0, 1.99, -1.4]} castShadow receiveShadow><boxGeometry args={[2.3, 0.04, 0.4]} /><meshStandardMaterial color="#2b2118" roughness={0.6} /></mesh>
      <mesh position={[0, 1.955, -1.2]}><boxGeometry args={[2.3, 0.02, 0.01]} /><meshBasicMaterial color={C.signal} toneMapped={false} /></mesh>
      {fillers.map(([x, h, c], i) => (
        <mesh key={i} position={[x - 0.1, 2.01 + h / 2, -1.4]} castShadow><boxGeometry args={[0.07, h, 0.25]} /><meshStandardMaterial color={c} roughness={0.8} /></mesh>
      ))}
      <Book title={sage.title} sub="writeup" x={0.1} y={2.065} />
      <Book title={rec.title} sub="writeup" x={0.14} y={2.155} w={0.5} />
      {/* small plant */}
      <mesh position={[0.9, 2.08, -1.4]} castShadow><cylinderGeometry args={[0.07, 0.055, 0.13, 8]} /><meshStandardMaterial color="#8E1A13" /></mesh>
      <mesh position={[0.9, 2.2, -1.4]} castShadow><icosahedronGeometry args={[0.1, 0]} /><meshStandardMaterial color="#2c4a3e" flatShading /></mesh>
    </Hot>
  )
}

/* ------------------------------------------------------------- corkboard */
function Note({ row, x, y, rot }: { row: (typeof LEDGER_ROWS)[number]; x: number; y: number; rot: number }) {
  const tex = useCanvasTex(320, 220, (g) => {
    g.fillStyle = "#DCE2EA"; g.fillRect(0, 0, 320, 220)
    g.fillStyle = "#a1281f"; g.fillRect(0, 0, 320, 8)
    g.fillStyle = "#44546a"; g.font = f(MONO, 19); g.fillText(row.when, 16, 42)
    g.fillStyle = "#10161f"; g.font = f(DISPLAY, 28); wrap(g, row.title.split(" — ")[0], 16, 82, 288, 30, 3)
    g.fillStyle = "#44546a"; g.font = f(MONO, 16); wrap(g, row.org, 16, 198, 288, 20, 1)
  }, row.id)
  return (
    <group position={[x, y, 0.03 + Math.abs(rot)]} rotation={[0, 0, rot]}>
      <mesh castShadow><planeGeometry args={[0.3, 0.206]} /><meshStandardMaterial map={tex} roughness={0.9} /></mesh>
      <mesh position={[0, 0.085, 0.01]}><sphereGeometry args={[0.012, 8, 6]} /><meshStandardMaterial color={C.signal} emissive={C.signal} emissiveIntensity={0.3} /></mesh>
    </group>
  )
}

function Board({ ctx }: { ctx: Ctx }) {
  const rows = [...LEDGER_ROWS].reverse()
  const pts = rows.map((r, i) => ({ r, x: -0.62 + i * 0.205, y: i % 2 ? -0.17 : 0.16, rot: (i % 3 - 1) * 0.05 }))
  return (
    <Hot id="board" ctx={ctx} position={[1.85, 1.55, -1.6]}>
      <mesh position={[0, 0, -0.01]} receiveShadow><boxGeometry args={[1.62, 1.04, 0.04]} /><meshStandardMaterial color="#1a2332" /></mesh>
      <mesh position={[0, 0, 0.015]} receiveShadow><planeGeometry args={[1.5, 0.92]} /><meshStandardMaterial color="#5e4630" roughness={1} /></mesh>
      {pts.map((p) => <Note key={p.r.id} row={p.r} x={p.x} y={p.y} rot={p.rot} />)}
      <Line points={pts.map((p) => [p.x, p.y + 0.085, 0.07] as [number, number, number])} color={C.signal} lineWidth={1.6} />
    </Hot>
  )
}

/* ----------------------------------------------------------------- drawer */
function Cabinet({ ctx }: { ctx: Ctx }) {
  const d = useRef<THREE.Group>(null!)
  const o = useRef(0)
  const invalidate = useThree((s) => s.invalidate)
  const tex = useCanvasTex(512, 128, (g) => {
    g.fillStyle = "#1a2332"; g.fillRect(0, 0, 512, 128)
    g.fillStyle = "#EDF2F8"; g.font = f(MONO, 30); g.fillText("SIDE QUESTS", 24, 76)
    g.fillStyle = "#FF5B4F"; g.fillRect(24, 92, 90, 6)
  }, "drawer")
  useFrame((_, dt) => {
    const goal = ctx.focus === "drawer" ? 1 : 0
    o.current += (goal - o.current) * (ctx.reduced ? 1 : 1 - Math.exp(-dt * 5))
    d.current.position.z = o.current * 0.42
    if (Math.abs(goal - o.current) > 0.002) invalidate()
  })
  const folders = ["#8E1A13", "#C4261E", "#44546a", "#617599", "#2E3A54"]
  return (
    <Hot id="drawer" ctx={ctx} position={[-1.95, 0, -1.2]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow><boxGeometry args={[0.72, 0.8, 0.6]} /><meshStandardMaterial color="#2a3649" roughness={0.6} metalness={0.2} /></mesh>
      <mesh position={[0, 0.42, 0.302]}><boxGeometry args={[0.66, 0.2, 0.004]} /><meshStandardMaterial color="#1b2536" /></mesh>
      <mesh position={[0, 0.12, 0.302]}><boxGeometry args={[0.66, 0.2, 0.004]} /><meshStandardMaterial color="#1b2536" /></mesh>
      <group ref={d} position={[0, 0.66, 0.3]}>
        <mesh position={[0, 0, 0.012]} castShadow><boxGeometry args={[0.66, 0.2, 0.024]} /><meshStandardMaterial color="#34415a" metalness={0.3} roughness={0.45} /></mesh>
        <mesh position={[0, 0.01, 0.026]}><planeGeometry args={[0.4, 0.1]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
        <mesh position={[0, -0.07, 0.03]}><boxGeometry args={[0.16, 0.016, 0.016]} /><meshStandardMaterial color="#8593A6" metalness={0.8} roughness={0.3} /></mesh>
        <mesh position={[0, -0.09, -0.29]}><boxGeometry args={[0.6, 0.02, 0.56]} /><meshStandardMaterial color="#10161f" /></mesh>
        <mesh position={[0, -0.01, -0.57]}><boxGeometry args={[0.6, 0.16, 0.02]} /><meshStandardMaterial color="#10161f" /></mesh>
        {folders.map((c, i) => (
          <mesh key={i} position={[-0.22 + i * 0.1, -0.02, -0.3]} rotation={[0, 0, (i - 2) * 0.06]}><boxGeometry args={[0.012, 0.15, 0.46]} /><meshStandardMaterial color={c} /></mesh>
        ))}
      </group>
    </Hot>
  )
}

/* ------------------------------------------------------------ notes (contact) */
function Notepad({ ctx }: { ctx: Ctx }) {
  const tex = useCanvasTex(300, 400, (g) => {
    g.fillStyle = "#E9E4B8"; g.fillRect(0, 0, 300, 400)
    g.fillStyle = "#a1281f"; g.fillRect(0, 0, 300, 10)
    g.fillStyle = "#10161f"; g.font = f(DISPLAY, 46); g.fillText("CONTACT", 22, 78)
    g.fillStyle = "#44546a"; g.font = f(MONO, 16); g.fillText("I read everything", 24, 108) // SPIKE COPY
    ;[150, 190, 230, 270, 310].forEach((y) => { g.fillStyle = "#8c98ab"; g.fillRect(24, y, 250, 2) })
    g.fillStyle = "#a1281f"; g.font = f(MONO, 20); g.fillText("email", 24, 144); g.fillText("github", 24, 184); g.fillText("linkedin", 24, 224); g.fillText("resume", 24, 264)
  }, "notes")
  return (
    <Hot id="notes" ctx={ctx} position={[1.1, DESK_Y, 0.3]} rotation={[0, -0.2, 0]}>
      <mesh position={[0, 0.01, 0]} castShadow receiveShadow><boxGeometry args={[0.2, 0.02, 0.27]} /><meshStandardMaterial color="#c9c39a" /></mesh>
      <mesh position={[0, 0.0215, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.195, 0.26]} /><meshStandardMaterial map={tex} /></mesh>
      <mesh position={[0.17, 0.011, 0.04]} rotation={[0, 0.5, Math.PI / 2]} castShadow><cylinderGeometry args={[0.007, 0.007, 0.17, 6]} /><meshStandardMaterial color={C.signal} /></mesh>
    </Hot>
  )
}

/* ------------------------------------------------------------- lamp + mug */
function Lamp({ ctx }: { ctx: Ctx }) {
  const bulb = useRef<THREE.MeshStandardMaterial>(null!)
  useEffect(() => { bulb.current.emissiveIntensity = ctx.lamp ? 3 : 0 }, [ctx.lamp])
  const arm = (a: [number, number, number], b: [number, number, number]) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), mid = va.clone().add(vb).multiplyScalar(0.5)
    const len = va.distanceTo(vb)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize())
    return <mesh position={mid} quaternion={q} castShadow><cylinderGeometry args={[0.012, 0.012, len, 6]} /><meshStandardMaterial color="#222c3f" metalness={0.6} roughness={0.4} /></mesh>
  }
  return (
    <group
      position={[0, 0, 0]}
      onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); ctx.toggleLamp() }}
      {...hov(true)}
    >
      <mesh position={[-1.08, DESK_Y + 0.02, -0.4]} castShadow><cylinderGeometry args={[0.12, 0.14, 0.04, 16]} /><meshStandardMaterial color="#1a2230" metalness={0.6} roughness={0.4} /></mesh>
      {arm([-1.08, DESK_Y + 0.04, -0.4], [-1.0, 1.25, -0.36])}
      {arm([-1.0, 1.25, -0.36], [-0.88, 1.43, -0.32])}
      <mesh position={[-0.88, 1.43, -0.32]} rotation={[0, 0, -0.5]} castShadow><coneGeometry args={[0.13, 0.17, 14, 1, true]} /><meshStandardMaterial color={C.ember} side={THREE.DoubleSide} roughness={0.5} metalness={0.3} /></mesh>
      <mesh position={[-0.89, 1.36, -0.32]}><sphereGeometry args={[0.04, 12, 8]} /><meshStandardMaterial ref={bulb} color="#ffe2b8" emissive="#ffb070" emissiveIntensity={3} /></mesh>
    </group>
  )
}

function Mug({ ctx }: { ctx: Ctx }) {
  const g = useRef<THREE.Group>(null!), pud = useRef<THREE.Mesh>(null!)
  const spilled = useRef(false), p = useRef(0)
  const invalidate = useThree((s) => s.invalidate)
  useFrame((_, dt) => {
    const goal = spilled.current ? 1 : 0
    p.current += (goal - p.current) * (ctx.reduced ? 1 : 1 - Math.exp(-dt * (goal ? 4.5 : 8)))
    const v = p.current
    g.current.rotation.z = -Math.min(1, v * 1.15) * 1.5
    const pv = Math.max(0, (v - 0.25) / 0.75)
    pud.current.scale.set(0.001 + pv * 1.4, 0.001 + pv * 1, 1)
    pud.current.visible = pv > 0.01
    if (Math.abs(goal - v) > 0.003) invalidate()
  })
  const click = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 6) return
    e.stopPropagation()
    spilled.current = !spilled.current
    ctx.toast(spilled.current ? "Well. That happened." : "Mopped. Nobody saw anything.") // SPIKE COPY
    invalidate()
  }
  const R = 0.05, H = 0.1
  return (
    <group>
      <group ref={g} position={[0.95 + R, DESK_Y, -0.18]} onClick={click} {...hov(true)}>
        <mesh position={[-R, H / 2, 0]} castShadow><cylinderGeometry args={[R, R * 0.9, H, 16, 1, true]} /><meshStandardMaterial color="#e6e9ee" roughness={0.35} side={THREE.DoubleSide} /></mesh>
        <mesh position={[-R, 0.003, 0]}><cylinderGeometry args={[R * 0.9, R * 0.9, 0.006, 16]} /><meshStandardMaterial color="#e6e9ee" /></mesh>
        <mesh position={[-R, H - 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[R * 0.97, 16]} /><meshStandardMaterial color="#2a160d" roughness={0.15} /></mesh>
        <mesh position={[-R * 2 - 0.012, H / 2, 0]} rotation={[0, 0, 0]} castShadow><torusGeometry args={[0.028, 0.008, 6, 12, Math.PI]} /><meshStandardMaterial color="#e6e9ee" /></mesh>
        <mesh position={[-R, H / 2 + 0.01, R + 0.001]}><planeGeometry args={[0.05, 0.016]} /><meshBasicMaterial color={C.signal} toneMapped={false} /></mesh>
      </group>
      <mesh ref={pud} visible={false} rotation={[-Math.PI / 2, 0, 0]} position={[1.1, DESK_Y + 0.003, -0.15]}>
        <circleGeometry args={[0.1, 28]} /><meshStandardMaterial color="#5a3420" emissive="#2a1208" roughness={0.1} metalness={0.2} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ labels */
function Labels({ ctx }: { ctx: Ctx }) {
  if (ctx.focus) return null
  return (
    <>
      {STATIONS.map((s) => (
        <Html key={s.id} position={s.label3} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
          <div className="font-mono text-[10px] tracking-[0.14em] uppercase whitespace-nowrap px-2 py-1 bg-void/70 text-chalk-2 border border-line">
            <span className="text-signal">{s.num}</span> {s.label}
          </div>
        </Html>
      ))}
    </>
  )
}

/* ------------------------------------------------------------------ canvas */
export default function Scene({ ctx, input, onReady }: { ctx: Ctx; input: MutableRefObject<Input>; onReady: () => void }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      frameloop="demand"
      camera={{ fov: 58, near: 0.05, far: 30, position: SEAT, rotation: [-0.2, 0, 0] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl, invalidate }) => { input.current.inv = invalidate; gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.15; onReady() }}
    >
      <color attach="background" args={["#07090e"]} />
      <fog attach="fog" args={["#07090e", 3.2, 9]} />
      <Rig ctx={ctx} input={input} />
      <Lights ctx={ctx} />
      <Shell />
      <Monitor ctx={ctx} />
      <Peripherals />
      <Hot id="desk" ctx={ctx}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, DESK_Y + 0.001, 0.2]}><planeGeometry args={[2.6, 0.7]} /><meshBasicMaterial visible={false} /></mesh>
        {DESK_ITEMS.map((it) => <Card key={it.id} item={it} ctx={ctx} />)}
        <Ring ctx={ctx} />
      </Hot>
      <Shelf ctx={ctx} />
      <Board ctx={ctx} />
      <Cabinet ctx={ctx} />
      <Notepad ctx={ctx} />
      <Lamp ctx={ctx} />
      <Mug ctx={ctx} />
      <Labels ctx={ctx} />
    </Canvas>
  )
}
