import { memo, useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber"
import { ContactShadows, Html, Line, RoundedBox } from "@react-three/drei"
import * as THREE from "three"
import MonitorOS from "./MonitorOS"
import { HOME, PATH_BAND, PATH_GROUPS, splitTitle } from "./content"
import { DESK_ITEMS, SEAT, stationOf, type DeskItem, type SId } from "./stations"
import { DISPLAY, MONO, cover, f, loadImg, useCanvasTex, wrap } from "./tex"
import { PAL } from "./theme"
import { corkTex, noiseTex, woodTex } from "./proc"
import { C, DESK_Y, ambient, catFx, hovFor, setCursor, shadow, type Ctx, type InputRef } from "./shared"
import { Cat, Duck, Eyes, Glow } from "./Critters"

export type { Ctx, Input } from "./shared"
const MONITOR_SCALE = 0.038 // drei CSS3D maps CSS px to world at a fixed ratio; tuned by measuring so 1280px fills the 1.22m screen

/* ---------------------------------------------------------------- helpers */
function Hot({ id, ctx, children, ...rest }: { id: SId; ctx: Ctx; children: React.ReactNode } & Record<string, unknown>) {
  return (
    <group
      {...rest}
      onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); ctx.goto(id) }}
      onPointerOver={(e) => { e.stopPropagation(); setCursor(true); ctx.hover(stationOf(id).label) }}
      onPointerOut={() => { setCursor(false); ctx.hover(null) }}
    >
      {children}
    </group>
  )
}
const RB = RoundedBox

/* -------------------------------------------------------------- camera rig */
const _m = new THREE.Matrix4(), _up = new THREE.Vector3(0, 1, 0), _l = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, "YXZ"), _p = new THREE.Vector3()
function Rig({ ctx, input }: { ctx: Ctx; input: InputRef }) {
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

/* contact shadow is baked once; memoised because drei re-bakes on every re-render */
const Shadows = memo(function Shadows() {
  return <ContactShadows position={[0, DESK_Y + 0.0015, -0.2]} scale={[3, 1.6]} far={0.5} blur={2.4} opacity={0.45} frames={1} resolution={512} />
})

/* ----------------------------------------------------------------- lights */
function Lights({ ctx }: { ctx: Ctx }) {
  const amb = useRef<THREE.AmbientLight>(null!), spot = useRef<THREE.SpotLight>(null!), key = useRef<THREE.DirectionalLight>(null!), warm = useRef<THREE.PointLight>(null!), red = useRef<THREE.PointLight>(null!), mon = useRef<THREE.PointLight>(null!)
  const hemi = useRef<THREE.HemisphereLight>(null!)
  const lvl = useRef(1)
  const { invalidate, scene } = useThree()
  const target = useMemo(() => new THREE.Object3D(), [])
  const light = ctx.theme === "light"
  useEffect(() => { shadow.dirty = true; invalidate() }, [ctx.lamp, ctx.theme, invalidate])
  useFrame((_, dt) => {
    const goal = ctx.lamp ? 1 : 0
    lvl.current += (goal - lvl.current) * (ctx.reduced ? 1 : 1 - Math.exp(-dt * 7))
    const l = lvl.current
    hemi.current.intensity = light ? 0.9 : 0.25 + 0.15 * l
    amb.current.intensity = light ? 0.45 : 0.1 + 0.2 * l
    key.current.intensity = light ? 1.5 : 0.1 + 0.5 * l
    spot.current.intensity = 11 * l * (light ? 0.5 : 1)
    warm.current.intensity = (light ? 0.3 : 0.9) * l
    red.current.intensity = light ? 0.15 : 0.9
    mon.current.intensity = light ? 0.15 : 0.6
    const bg = scene.background as THREE.Color
    if (bg) bg.set(PAL[ctx.theme].bg)
    if (scene.fog) { scene.fog.color.set(PAL[ctx.theme].bg); (scene.fog as THREE.Fog).near = PAL[ctx.theme].fogNear; (scene.fog as THREE.Fog).far = PAL[ctx.theme].fogFar }
    if (Math.abs(goal - l) > 0.002) { shadow.dirty = true; invalidate() }
  })
  return (
    <>
      <ambientLight ref={amb} color={light ? "#fff4e6" : "#8d9ec4"} />
      <directionalLight ref={key} position={[-2, 3.2, 2.5]} color={light ? "#fff1dc" : "#a8b8e0"} />
      <primitive object={target} position={[-0.15, DESK_Y, 0.05]} />
      <spotLight ref={spot} position={[-0.84, 1.36, -0.32]} target={target} angle={0.75} penumbra={0.9} color="#ffc990" decay={1.6} distance={7} castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.0004} />
      <pointLight ref={warm} position={[-0.8, 1.35, 0]} color="#ffb070" distance={4} decay={2} />
      <pointLight ref={mon} position={[0, 1.25, -0.2]} color="#7fa6ff" distance={3} decay={2} />
      <pointLight ref={red} position={[0, 1.9, -1.2]} color={C.signal} distance={2.4} decay={2} />
      {/* the drawer's own light, spilling out of the gap */}
      <pointLight position={[0, 0.62, 0.7]} color="#ff9a6a" intensity={0.6} distance={1.3} decay={2} />
      <hemisphereLight ref={hemi} args={[light ? "#fff6ea" : "#8aa0d8", light ? "#8a7f70" : "#1a1410", 0.3]} />
    </>
  )
}

/* ------------------------------------------------------------------- room */
function Shell({ ctx }: { ctx: Ctx }) {
  const P = PAL[ctx.theme]
  const wood = useMemo(() => woodTex("#3a2a1c", 2, 1), [])
  const woodRough = useMemo(() => noiseTex("#aaaaaa", 0.5, 3, 2, false), [])
  const rug = useMemo(() => noiseTex("#ffffff", 0.22, 6, 6, true, 1), [])
  const wall = useMemo(() => noiseTex("#aaaaaa", 0.25, 5, 3, false), [])
  const floor = useMemo(() => woodTex("#6b5a48", 3, 4), [])
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[9, 8]} /><meshStandardMaterial color={P.floor} map={floor} roughness={0.8} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0.9]} receiveShadow><circleGeometry args={[1.5, 96]} /><meshStandardMaterial color={P.rug} map={rug} roughness={1} /></mesh>
      <mesh position={[0, 1.5, -1.62]} receiveShadow><planeGeometry args={[9, 3]} /><meshStandardMaterial color={P.wall} roughnessMap={wall} roughness={1} /></mesh>
      <mesh position={[-3.2, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[8, 3]} /><meshStandardMaterial color={P.wallSide} roughness={1} /></mesh>
      <mesh position={[3.2, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow><planeGeometry args={[8, 3]} /><meshStandardMaterial color={P.wallSide} roughness={1} /></mesh>
      <mesh position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[9, 8]} /><meshStandardMaterial color={P.ceil} /></mesh>
      <RB args={[9, 0.14, 0.04]} radius={0.01} smoothness={4} position={[0, 0.07, -1.6]}><meshStandardMaterial color={P.base} roughness={0.6} /></RB>
      {/* desk top: bevelled slab, grain map */}
      <RB args={[3.1, 0.06, 1.5]} radius={0.014} smoothness={4} position={[0, DESK_Y - 0.03, -0.25]} castShadow receiveShadow>
        <meshStandardMaterial color="#c9b9a6" map={wood} roughnessMap={woodRough} roughness={0.62} metalness={0.04} />
      </RB>
      <mesh position={[0, DESK_Y - 0.075, -0.25]}><boxGeometry args={[3.05, 0.03, 1.45]} /><meshStandardMaterial color="#1b140e" /></mesh>
      {[[-1.45, -0.9], [1.45, -0.9], [-1.45, 0.4], [1.45, 0.4]].map(([x, z], i) => (
        <RB key={i} args={[0.07, DESK_Y - 0.06, 0.07]} radius={0.01} smoothness={4} position={[x, (DESK_Y - 0.06) / 2, z]} castShadow><meshStandardMaterial color="#10151d" metalness={0.5} roughness={0.4} /></RB>
      ))}
      {/* desk mat: felt */}
      <RB args={[2.2, 0.004, 0.95]} radius={0.002} smoothness={4} position={[0.1, DESK_Y + 0.002, 0.05]} receiveShadow><meshStandardMaterial color="#1a2230" map={rug} roughness={1} /></RB>
    </group>
  )
}

/* ---------------------------------------------------------------- monitor */
function Monitor({ ctx }: { ctx: Ctx }) {
  const light = ctx.theme === "light"
  const tex = useCanvasTex(1280, 720, async (g) => {
    const bg = light ? ["#FAF8F3", "#E8E4DA"] : ["#18202D", "#0A0D13"], ink = light ? "#161A22" : "#EDF2F8", ink2 = light ? "#3A4352" : "#AFBBCB", sig = light ? "#C4261E" : "#FF5B4F", panel = light ? "#E8E4DA" : "#111722"
    const grd = g.createLinearGradient(0, 0, 1280, 720); grd.addColorStop(0, bg[0]); grd.addColorStop(1, bg[1])
    g.fillStyle = grd; g.fillRect(0, 0, 1280, 720)
    g.fillStyle = panel; g.fillRect(0, 0, 1280, 40)
    g.fillStyle = sig; g.font = f(MONO, 20); g.fillText(">_  aahil shaikh", 18, 28)
    g.fillStyle = panel; g.fillRect(0, 40, 200, 680)
    ;["Agents", "Systems", "Side Quests", "Toolkit", "Writing"].forEach((t, i) => {
      g.fillStyle = light ? "#6E6858" : "#617599"; g.fillRect(70, 70 + i * 118, 60, 44); g.fillStyle = ink2; g.font = f(MONO, 20); g.textAlign = "center"; g.fillText(t, 100, 144 + i * 118); g.textAlign = "left"
    })
    g.fillStyle = light ? "#FAF8F3" : "#18202D"; g.fillRect(224, 64, 1032, 632); g.strokeStyle = light ? "#6E6858" : "#617599"; g.lineWidth = 2; g.strokeRect(224, 64, 1032, 632)
    g.fillStyle = sig; g.font = f(MONO, 20); g.fillText(HOME.eyebrow.toUpperCase(), 264, 150)
    g.fillStyle = ink; g.font = f(DISPLAY, 112); g.fillText(HOME.name, 258, 270)
    g.fillStyle = ink; g.font = "600 36px 'Bricolage Grotesque', sans-serif"
    wrap(g, HOME.thesis, 264, 350, 800, 46, 6)
    g.fillStyle = ink2; g.font = f(MONO, 18); g.fillText(HOME.meta, 264, 650)
  }, "monitor" + ctx.theme)
  return (
    <Hot id="monitor" ctx={ctx}>
      <RB args={[0.5, 0.03, 0.26]} radius={0.01} smoothness={4} position={[0, DESK_Y + 0.015, -0.62]} castShadow><meshStandardMaterial color="#10151d" metalness={0.6} roughness={0.35} /></RB>
      <RB args={[0.09, 0.45, 0.05]} radius={0.01} smoothness={4} position={[0, DESK_Y + 0.25, -0.76]} castShadow><meshStandardMaterial color="#10151d" metalness={0.6} roughness={0.35} /></RB>
      <RB args={[1.32, 0.78, 0.07]} radius={0.02} smoothness={4} position={[0, 1.28, -0.68]} castShadow><meshStandardMaterial color="#0c1018" roughness={0.35} metalness={0.4} /></RB>
      <mesh position={[0, 1.28, -0.643]}><planeGeometry args={[1.22, 0.686]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
      {ctx.focus === "monitor" && (
        <Html transform position={[0, 1.28, -0.64]} scale={MONITOR_SCALE} zIndexRange={[20, 10]}>
          <MonitorOS />
        </Html>
      )}
      <mesh position={[0.5, 0.905, -0.642]}><boxGeometry args={[0.025, 0.012, 0.004]} /><meshBasicMaterial color={C.signal} toneMapped={false} /></mesh>
      {ctx.theme === "dark" && <Glow position={[0, 1.28, -0.4]} color="#6a8fd8" size={1.7} opacity={0.14} />}
    </Hot>
  )
}

function Keys() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  useEffect(() => {
    const m = new THREE.Matrix4(), c = new THREE.Color()
    let i = 0
    for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) {
      m.setPosition(-0.2 + k * 0.0305, DESK_Y + 0.026, -0.262 + r * 0.03)
      ref.current.setMatrixAt(i, m)
      ref.current.setColorAt(i, c.set(r === 0 && k === 13 ? C.signal : "#252f42"))
      i++
    }
    ref.current.instanceMatrix.needsUpdate = true
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [])
  return <instancedMesh ref={ref} args={[undefined, undefined, 56]}><boxGeometry args={[0.026, 0.008, 0.026]} /><meshStandardMaterial roughness={0.5} /></instancedMesh>
}

function Peripherals() {
  return (
    <group>
      <RB args={[0.46, 0.022, 0.15]} radius={0.006} smoothness={4} position={[0, DESK_Y + 0.012, -0.22]} castShadow receiveShadow><meshStandardMaterial color="#1a2230" roughness={0.5} metalness={0.2} /></RB>
      <Keys />
      <RB args={[0.06, 0.024, 0.1]} radius={0.012} smoothness={4} position={[0.46, DESK_Y + 0.012, -0.2]} castShadow><meshStandardMaterial color="#1a2230" roughness={0.4} metalness={0.2} /></RB>
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
    <mesh position={[0, 0.0045, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.34, 0.459]} /><meshStandardMaterial map={tex} roughness={0.8} /></mesh>
  )
}

function Card({ item, ctx }: { item: DeskItem; ctx: Ctx }) {
  const g = useRef<THREE.Group>(null!)
  const h = useRef(0), want = useRef(0)
  const invalidate = useThree((s) => s.invalidate)
  const sel = ctx.card === item.id
  useFrame((_, dt) => {
    const bat = catFx.card === item.id
    const goal = sel ? 1.4 : bat ? 0.8 : want.current
    h.current += (goal - h.current) * (ctx.reduced ? 1 : 1 - Math.exp(-dt * 12))
    g.current.position.y = DESK_Y + 0.004 + h.current * 0.05
    g.current.rotation.x = h.current * 0.22
    g.current.rotation.y = item.rot + (bat ? Math.sin(performance.now() / 90) * 0.04 : 0)
    if (Math.abs(goal - h.current) > 0.003) { shadow.dirty = true; invalidate() }
  })
  return (
    <group
      ref={g}
      position={[item.x, DESK_Y + 0.004, item.z]}
      rotation={[0, item.rot, 0]}
      onPointerOver={(e) => { e.stopPropagation(); want.current = 1; setCursor(true); ctx.hover(item.title); invalidate() }}
      onPointerOut={() => { want.current = 0; setCursor(false); ctx.hover(null); invalidate() }}
      onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); ctx.openCard(item.id) }}
    >
      <RB args={[0.34, 0.004, 0.459]} radius={0.0015} smoothness={4} position={[0, 0.002, 0]} castShadow receiveShadow><meshStandardMaterial color="#c9d1dd" roughness={0.9} /></RB>
      <CardFace item={item} />
    </group>
  )
}

function Ring({ ctx }: { ctx: Ctx }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.38, DESK_Y + 0.004, 0.4]} onClick={(e) => { e.stopPropagation(); ctx.toast("That ring is from cold brew. Not a bug.") }} {...hovFor(ctx, "Coffee ring")}>
      <ringGeometry args={[0.04, 0.052, 32]} /><meshStandardMaterial color="#4a3022" transparent opacity={0.7} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ shelf */
function Book({ title, x, y, w = 0.56 }: { title: string; x: number; y: number; w?: number }) {
  const tex = useCanvasTex(512, 96, (g) => {
    g.fillStyle = "#18202D"; g.fillRect(0, 0, 512, 96)
    g.fillStyle = "#FF5B4F"; g.fillRect(0, 0, 14, 96)
    g.fillStyle = "#EDF2F8"; g.font = f(DISPLAY, 54); g.fillText(title.toUpperCase(), 34, 66)
    g.fillStyle = "#8593A6"; g.font = f(MONO, 15); g.fillText("writeup", 400, 56)
  }, title)
  return (
    <group position={[x, y, -1.32]}>
      <RB args={[w, 0.09, 0.3]} radius={0.008} smoothness={4} castShadow><meshStandardMaterial color="#1a2232" roughness={0.65} /></RB>
      <mesh position={[0, 0, 0.1515]}><planeGeometry args={[w - 0.01, 0.082]} /><meshStandardMaterial map={tex} roughness={0.7} /></mesh>
      <mesh position={[0.0, 0, 0]}><boxGeometry args={[w - 0.02, 0.07, 0.29]} /><meshStandardMaterial color="#d8dde6" roughness={0.9} /></mesh>
    </group>
  )
}

function Shelf({ ctx }: { ctx: Ctx }) {
  const wood = useMemo(() => woodTex("#3a2a1c", 1, 1), [])
  const fillers = [[-0.85, 0.3, "#2a3550"], [-0.77, 0.26, "#8E1A13"], [-0.69, 0.32, "#1f2a40"], [-0.6, 0.27, "#44546a"], [-0.52, 0.3, "#C4261E"], [-0.44, 0.24, "#18202D"]] as const
  return (
    <Hot id="shelf" ctx={ctx}>
      <RB args={[2.3, 0.04, 0.4]} radius={0.01} smoothness={4} position={[0, 1.99, -1.4]} castShadow receiveShadow><meshStandardMaterial color="#c9b9a6" map={wood} roughness={0.6} /></RB>
      <mesh position={[0, 1.955, -1.2]}><boxGeometry args={[2.3, 0.02, 0.01]} /><meshBasicMaterial color={C.signal} toneMapped={false} /></mesh>
      {fillers.map(([x, h, c], i) => (
        <RB key={i} args={[0.07, h, 0.25]} radius={0.006} smoothness={4} position={[x - 0.1, 2.01 + h / 2, -1.4]} castShadow><meshStandardMaterial color={c} roughness={0.75} /></RB>
      ))}
      <Book title="SAGE" x={0.1} y={2.065} />
      <Book title="Recurser" x={0.14} y={2.155} w={0.5} />
      <mesh position={[0.9, 2.08, -1.4]} castShadow><cylinderGeometry args={[0.07, 0.055, 0.13, 48]} /><meshStandardMaterial color="#8E1A13" roughness={0.7} /></mesh>
      <mesh position={[0.9, 2.2, -1.4]} castShadow><icosahedronGeometry args={[0.1, 3]} /><meshStandardMaterial color="#2c4a3e" flatShading roughness={0.9} /></mesh>
    </Hot>
  )
}

/* ------------------------------------------------------------- corkboard */
function PathNote({ row, x, y, rot }: { row: (typeof PATH_GROUPS)[number]["rows"][number]; x: number; y: number; rot: number }) {
  const { role, focus } = splitTitle(row.title)
  const tex = useCanvasTex(440, 270, (g) => {
    g.fillStyle = "#DCE2EA"; g.fillRect(0, 0, 440, 270)
    g.fillStyle = "#a1281f"; g.fillRect(0, 0, 440, 10)
    g.fillStyle = "#a1281f"; g.font = f(MONO, 24); g.fillText(row.when, 20, 52)
    g.fillStyle = "#10161f"; g.font = f(DISPLAY, focus.length > 22 ? 32 : 40); wrap(g, focus, 20, 100, 400, focus.length > 22 ? 36 : 44, 3)
    g.fillStyle = "#44546a"; g.font = f(MONO, 18); if (role) wrap(g, role, 20, 196, 400, 22, 1)
    g.fillStyle = "#26334a"; g.font = f(MONO, 18); wrap(g, row.org, 20, 246, 400, 22, 1)
  }, row.id)
  return (
    <group position={[x, y, 0.03]} rotation={[0, 0, rot]}>
      <mesh castShadow><planeGeometry args={[0.44, 0.27]} /><meshStandardMaterial map={tex} roughness={0.9} /></mesh>
      <mesh position={[0, 0.115, 0.01]}><sphereGeometry args={[0.014, 10, 8]} /><meshStandardMaterial color={C.signal} emissive={C.signal} emissiveIntensity={0.25} roughness={0.3} /></mesh>
    </group>
  )
}
function PathHead({ label, x }: { label: string; x: number }) {
  const tex = useCanvasTex(440, 100, (g) => {
    g.fillStyle = "#10161f"; g.fillRect(0, 0, 440, 100)
    g.fillStyle = "#FF5B4F"; g.fillRect(0, 0, 14, 100)
    g.fillStyle = "#EDF2F8"; g.font = f(DISPLAY, 58); g.fillText(label.toUpperCase(), 34, 72)
  }, label)
  return (
    <group position={[x, 0.36, 0.03]}>
      <mesh castShadow><planeGeometry args={[0.44, 0.1]} /><meshStandardMaterial map={tex} roughness={0.8} /></mesh>
      <mesh position={[0, 0.07, 0.01]}><sphereGeometry args={[0.014, 10, 8]} /><meshStandardMaterial color={C.signal} emissive={C.signal} emissiveIntensity={0.25} /></mesh>
    </group>
  )
}

function Board({ ctx }: { ctx: Ctx }) {
  const cork = useMemo(() => corkTex(), [])
  const X = [-0.52, 0, 0.52], Y = [0.12, -0.2]
  const bandTex = useCanvasTex(1500, 100, (g) => {
    g.fillStyle = "#DCE2EA"; g.fillRect(0, 0, 1500, 100)
    g.fillStyle = "#a1281f"; g.fillRect(0, 0, 14, 100)
    g.fillStyle = "#10161f"; g.font = f(DISPLAY, 50); g.fillText("TEXAS A&M", 36, 68)
    g.fillStyle = "#44546a"; g.font = f(MONO, 28); g.fillText(PATH_BAND.when + "  ·  " + PATH_BAND.org, 400, 62)
  }, "band")
  const rot = [[-0.02, 0.015], [0.012, -0.018], [-0.015, 0.02]]
  return (
    <Hot id="board" ctx={ctx} position={[1.85, 1.55, -1.6]}>
      <RB args={[1.68, 1.04, 0.05]} radius={0.015} smoothness={4} position={[0, 0, -0.01]} receiveShadow castShadow><meshStandardMaterial color="#2a1f16" roughness={0.6} /></RB>
      <mesh position={[0, 0, 0.016]} receiveShadow><planeGeometry args={[1.58, 0.94]} /><meshStandardMaterial map={cork} roughness={1} /></mesh>
      {PATH_GROUPS.map((gr, i) => (
        <group key={gr.id}>
          <PathHead label={gr.label} x={X[i]} />
          {gr.rows.map((r, j) => <PathNote key={r.id} row={r} x={X[i]} y={Y[j]} rot={rot[i][j]} />)}
          {/* each cluster hangs on its own thread, between the pins, never across the text */}
          <Line points={[[X[i], 0.31, 0.05], [X[i], Y[0] + 0.115, 0.05]]} color={C.signal} lineWidth={1.4} />
          <Line points={[[X[i], Y[0] - 0.135, 0.05], [X[i], Y[1] + 0.115, 0.05]]} color={C.signal} lineWidth={1.4} />
        </group>
      ))}
      {/* the route: one thread through the three headers, in order */}
      <Line points={X.map((x) => [x, 0.43, 0.05] as [number, number, number])} color={C.signal} lineWidth={2} />
      <group position={[0, -0.405, 0.03]}>
        <mesh castShadow><planeGeometry args={[1.5, 0.1]} /><meshStandardMaterial map={bandTex} roughness={0.9} /></mesh>
      </group>
    </Hot>
  )
}

/* ----------------------------------------------------------------- drawer */
function Drawer({ ctx }: { ctx: Ctx }) {
  const d = useRef<THREE.Group>(null!)
  const o = useRef(0.1)
  const invalidate = useThree((s) => s.invalidate)
  const tex = useCanvasTex(512, 96, (g) => {
    g.fillStyle = "#223048"; g.fillRect(0, 0, 512, 96)
    g.fillStyle = "#EDF2F8"; g.font = f(MONO, 34); g.fillText("SIDE QUESTS", 28, 56)
    g.fillStyle = "#FF5B4F"; g.fillRect(28, 70, 100, 6)
  }, "drawer")
  useEffect(() => { shadow.dirty = true; invalidate() }, [ctx.focus, invalidate])
  useFrame((_, dt) => {
    const goal = ctx.focus === "drawer" ? 0.42 : 0.1
    o.current += (goal - o.current) * (ctx.reduced ? 1 : 1 - Math.exp(-dt * 5))
    d.current.position.z = o.current
    if (Math.abs(goal - o.current) > 0.002) { shadow.dirty = true; invalidate() }
  })
  const folders = ["#8E1A13", "#C4261E", "#617599", "#8593A6", "#2E3A54", "#C4261E", "#617599"]
  // a centre drawer in the desk apron, flush with the front edge, ajar
  return (
    <Hot id="drawer" ctx={ctx} position={[0, 0.66, 0.5]}>
      <RB args={[1.04, 0.15, 0.5]} radius={0.01} smoothness={4} position={[0, 0, -0.25]} castShadow receiveShadow><meshStandardMaterial color="#1b140e" roughness={0.7} /></RB>
      <group ref={d}>
        <RB args={[0.98, 0.13, 0.022]} radius={0.007} smoothness={4} position={[0, 0, 0.011]} castShadow><meshStandardMaterial color="#c9b9a6" map={useMemo(() => woodTex("#3a2a1c", 1, 1), [])} roughness={0.55} /></RB>
        <mesh position={[0, 0, 0.0235]}><planeGeometry args={[0.46, 0.086]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
        <RB args={[0.14, 0.014, 0.02]} radius={0.006} smoothness={4} position={[0.36, 0, 0.032]}><meshStandardMaterial color="#aab4c4" metalness={0.85} roughness={0.25} /></RB>
        <mesh position={[0, -0.05, -0.27]}><boxGeometry args={[0.94, 0.012, 0.52]} /><meshStandardMaterial color="#10161f" /></mesh>
        {folders.map((c, i) => (
          <mesh key={i} position={[-0.36 + i * 0.12, 0.0, -0.2 - (i % 3) * 0.04]} rotation={[0, 0, (i - 3) * 0.04]} castShadow><boxGeometry args={[0.014, 0.1, 0.24]} /><meshStandardMaterial color={c} roughness={0.8} /></mesh>
        ))}
        <mesh position={[0.18, 0.045, -0.08]} rotation={[0.12, 0.2, -0.1]}><boxGeometry args={[0.16, 0.001, 0.2]} /><meshStandardMaterial color="#DCE2EA" roughness={0.9} /></mesh>
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
      <RB args={[0.2, 0.02, 0.27]} radius={0.004} smoothness={4} position={[0, 0.01, 0]} castShadow receiveShadow><meshStandardMaterial color="#c9c39a" roughness={0.9} /></RB>
      <mesh position={[0, 0.0215, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.195, 0.26]} /><meshStandardMaterial map={tex} roughness={0.9} /></mesh>
      <mesh position={[0.17, 0.011, 0.04]} rotation={[0, 0.5, Math.PI / 2]} castShadow><cylinderGeometry args={[0.007, 0.007, 0.17, 8]} /><meshStandardMaterial color={C.signal} roughness={0.4} /></mesh>
    </Hot>
  )
}

/* ------------------------------------------------------------- lamp + mug */
function Lamp({ ctx }: { ctx: Ctx }) {
  const bulb = useRef<THREE.MeshStandardMaterial>(null!), inner = useRef<THREE.MeshStandardMaterial>(null!)
  useEffect(() => { bulb.current.emissiveIntensity = ctx.lamp ? 4 : 0; inner.current.emissiveIntensity = ctx.lamp ? 1.4 : 0 }, [ctx.lamp])
  // weighted base and a bell shade, both turned on a lathe
  const baseGeo = useMemo(() => new THREE.LatheGeometry([[0.001, 0], [0.14, 0], [0.145, 0.006], [0.14, 0.014], [0.11, 0.026], [0.06, 0.038], [0.022, 0.05], [0.016, 0.07]].map(([x, y]) => new THREE.Vector2(x, y)), 64), [])
  const shadeGeo = useMemo(() => {
    const pts: THREE.Vector2[] = []
    for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector2(0.018 + Math.pow(t, 0.7) * 0.125 + Math.sin(t * Math.PI) * 0.012, 0.11 - t * 0.11)) }
    return new THREE.LatheGeometry(pts, 64)
  }, [])
  const arm = (a: [number, number, number], b: [number, number, number]) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), mid = va.clone().add(vb).multiplyScalar(0.5)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize())
    return <mesh position={mid} quaternion={q} castShadow><cylinderGeometry args={[0.009, 0.009, va.distanceTo(vb), 20]} /><meshStandardMaterial color="#aab4c4" metalness={0.9} roughness={0.25} /></mesh>
  }
  const joint = (p: [number, number, number], r = 0.016) => <mesh position={p} castShadow><sphereGeometry args={[r, 24, 16]} /><meshStandardMaterial color="#222c3f" metalness={0.8} roughness={0.3} /></mesh>
  return (
    <group onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); ctx.toggleLamp() }} {...hovFor(ctx, ctx.lamp ? "Lamp: off" : "Lamp: on")}>
      <mesh position={[-1.08, DESK_Y, -0.4]} geometry={baseGeo} castShadow receiveShadow><meshStandardMaterial color="#1a2230" metalness={0.8} roughness={0.28} /></mesh>
      {arm([-1.08, DESK_Y + 0.06, -0.4], [-1.0, 1.25, -0.36])}
      {joint([-1.0, 1.25, -0.36], 0.02)}
      {arm([-1.0, 1.25, -0.36], [-0.89, 1.46, -0.32])}
      {joint([-0.89, 1.46, -0.32])}
      <group position={[-0.89, 1.46, -0.32]} rotation={[0, 0, 0.55]}>
        <mesh geometry={shadeGeo} position={[0, -0.09, 0]} castShadow><meshStandardMaterial color={C.ember} side={THREE.DoubleSide} roughness={0.35} metalness={0.5} /></mesh>
        <mesh geometry={shadeGeo} position={[0, -0.09, 0]} scale={0.96}><meshStandardMaterial ref={inner} color="#ffd9a8" emissive="#ffa860" emissiveIntensity={1.4} side={THREE.BackSide} /></mesh>
        <mesh position={[0, -0.1, 0]}><sphereGeometry args={[0.032, 24, 16]} /><meshStandardMaterial ref={bulb} color="#ffe2b8" emissive="#ffb070" emissiveIntensity={4} /></mesh>
      </group>
      {ctx.lamp && <Glow position={[-0.82, 1.33, -0.32]} color="#ffb070" size={0.8} opacity={0.5} />}
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
    if (Math.abs(goal - v) > 0.003) { shadow.dirty = true; invalidate() }
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
      <group ref={g} position={[0.95 + R, DESK_Y, -0.18]} onClick={click} {...hovFor(ctx, "Mug")}>
        <mesh position={[-R, H / 2, 0]} castShadow><cylinderGeometry args={[R, R * 0.9, H, 64, 1, true]} /><meshStandardMaterial color="#e6e9ee" roughness={0.3} side={THREE.DoubleSide} /></mesh>
        <mesh position={[-R, 0.003, 0]}><cylinderGeometry args={[R * 0.9, R * 0.9, 0.006, 64]} /><meshStandardMaterial color="#e6e9ee" roughness={0.3} /></mesh>
        <mesh position={[-R, H - 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[R * 0.97, 64]} /><meshStandardMaterial color="#2a160d" roughness={0.12} /></mesh>
        {/* handle: a half torus in the mug's own plane, both ends sunk into the wall */}
        <mesh position={[-2 * R + 0.003, H / 2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><torusGeometry args={[0.03, 0.0075, 16, 40, Math.PI]} /><meshStandardMaterial color="#e6e9ee" roughness={0.3} /></mesh>
        <mesh position={[-R, H / 2 + 0.01, R + 0.001]}><planeGeometry args={[0.05, 0.016]} /><meshBasicMaterial color={C.signal} toneMapped={false} /></mesh>
      </group>
      <mesh ref={pud} visible={false} rotation={[-Math.PI / 2, 0, 0]} position={[1.1, DESK_Y + 0.003, -0.15]}>
        <circleGeometry args={[0.1, 32]} /><meshStandardMaterial color="#5a3420" emissive="#2a1208" roughness={0.1} metalness={0.2} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------ light switch */
function LightSwitch({ ctx }: { ctx: Ctx }) {
  const rocker = useRef<THREE.Mesh>(null!)
  useEffect(() => { rocker.current.rotation.x = ctx.theme === "light" ? -0.35 : 0.35 }, [ctx.theme])
  return (
    <group position={[-1.55, 1.3, -1.6]} onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); ctx.toggleTheme() }} {...hovFor(ctx, ctx.theme === "light" ? "Light switch: lights off" : "Light switch: lights on")}>
      <RB args={[0.1, 0.16, 0.014]} radius={0.004} smoothness={4} castShadow><meshStandardMaterial color="#d8dde6" roughness={0.5} /></RB>
      <mesh ref={rocker} position={[0, 0, 0.012]}><boxGeometry args={[0.03, 0.07, 0.016]} /><meshStandardMaterial color="#f3f4f6" roughness={0.4} /></mesh>
    </group>
  )
}

/* tick: critters ask for slow frames, this grants them */
function Ticker() {
  const invalidate = useThree((s) => s.invalidate)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  useFrame(() => {
    const n = ambient.next
    ambient.next = Infinity
    if (n !== Infinity && !timer.current) timer.current = window.setTimeout(() => { timer.current = 0; invalidate() }, n)
  })
  return null
}
function ShadowGate() {
  useFrame(({ gl }) => { gl.shadowMap.needsUpdate = shadow.dirty; shadow.dirty = false })
  return null
}

/* ------------------------------------------------------------------ canvas */
export default function Scene({ ctx, input, onReady }: { ctx: Ctx; input: InputRef; onReady: () => void }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.25]}
      frameloop="demand"
      camera={{ fov: 58, near: 0.05, far: 30, position: SEAT, rotation: [-0.2, 0, 0] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl, invalidate }) => { if (location.search.includes("perf")) (window as unknown as { __gl: THREE.WebGLRenderer }).__gl = gl; input.current.inv = invalidate; gl.shadowMap.autoUpdate = false; gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.15; onReady() }}
    >
      <color attach="background" args={[PAL.dark.bg]} />
      <fog attach="fog" args={[PAL.dark.bg, 3.2, 9]} />
      <Rig ctx={ctx} input={input} />
      <Lights ctx={ctx} />
      <Shell ctx={ctx} />
      <Monitor ctx={ctx} />
      <Peripherals />
      <Hot id="desk" ctx={ctx}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, DESK_Y + 0.001, 0.2]}><planeGeometry args={[2.6, 0.7]} /><meshBasicMaterial visible={false} /></mesh>
        {DESK_ITEMS.map((it) => <Card key={it.id} item={it} ctx={ctx} />)}
        <Ring ctx={ctx} />
      </Hot>
      <Shelf ctx={ctx} />
      <Board ctx={ctx} />
      <Drawer ctx={ctx} />
      <Notepad ctx={ctx} />
      <Lamp ctx={ctx} />
      <Mug ctx={ctx} />
      <LightSwitch ctx={ctx} />
      <Cat ctx={ctx} />
      <Duck ctx={ctx} />
      <Eyes ctx={ctx} input={input} />
      <Shadows />
      <ShadowGate />
      <Ticker />
    </Canvas>
  )
}
