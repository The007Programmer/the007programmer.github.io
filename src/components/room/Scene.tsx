import { memo, useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber"
import { ContactShadows, Html, Line, RoundedBox } from "@react-three/drei"
import * as THREE from "three"
import MonitorOS from "./MonitorOS"
import { HOME, PATH_BAND, PATH_GROUPS, splitTitle } from "./content"
import { DESK_ITEMS, SEAT, stationOf, type DeskItem, type SId } from "./stations"
import { DISPLAY, MONO, cover, f, loadImg, useCanvasTex, wrap } from "./tex"
import { PAL, TOK } from "./theme"
import { corkTex, noiseTex, woodTex } from "./proc"
import { C, DESK_Y, ambient, catFx, hovFor, setCursor, shadow, type Ctx, type InputRef } from "./shared"
import { Cat, Duck, Eyes, Glow } from "./Critters"
import { Camera, Keyboard } from "./Props"

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
    const cam = state.camera as THREE.PerspectiveCamera
    // portrait screens: widen the vertical fov a little and stand back so the same things stay in frame
    const aspect = state.size.width / state.size.height
    const vf = aspect >= 1.3 ? 58 : THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(41)) / aspect)), 58, 80)
    if (Math.abs(cam.fov - vf) > 0.01) { cam.fov = vf; cam.updateProjectionMatrix(); invalidate() }
    const back = aspect >= 1.3 ? 1 : Math.max(1, Math.tan(THREE.MathUtils.degToRad(41)) / (Math.tan(THREE.MathUtils.degToRad(vf / 2)) * aspect))
    if (ctx.focus) {
      const s = stationOf(ctx.focus)
      _p.set(...s.pos)
      _l.set(...s.look)
      _m.lookAt(_p, _l, _up); _q.setFromRotationMatrix(_m)
      const pull = ctx.focus === "monitor" || ctx.focus === "board" || ctx.focus === "shelf" ? back : 1 + (back - 1) * 0.55 // the sheet already narrows the view, so only stand back part way
      _p.sub(_l).multiplyScalar(pull).add(_l)
      // under a bottom sheet, lift the subject into the upper part of the screen
      if (aspect < 1 && ctx.focus === "board") _p.x -= 0.4 * pull // desktop keeps the board left of its side panel; centre it here
      if (aspect < 1) _p.addScaledVector(_up.clone().applyQuaternion(_q), -0.3 * pull)
    } else {
      const { px, py, ox, oy } = input.current
      const yaw = THREE.MathUtils.clamp(-px * 26 + ox, -35, 35)
      // pointer gain stays under ~29 deg per half screen, so what you point at does not slide away from the cursor
      const pitch = THREE.MathUtils.clamp(-9 - py * 20 + oy, -50, 25)
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
    amb.current.intensity = light ? 0.45 : 0.16 + 0.2 * l
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
      <ambientLight ref={amb} color={light ? "#fff4e6" : "#b99c86"} />
      <directionalLight ref={key} position={[-2, 3.2, 2.5]} color={light ? "#fff1dc" : "#d7b999"} />
      <primitive object={target} position={[-0.15, DESK_Y, 0.05]} />
      <spotLight ref={spot} position={[-0.856, 1.402, -0.32]} target={target} angle={0.75} penumbra={0.9} color="#ffc990" decay={1.6} distance={7} castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.0004} />
      <pointLight ref={warm} position={[-0.856, 1.402, -0.32]} color="#ffb070" distance={4} decay={2} />
      <pointLight ref={mon} position={[0, 1.25, -0.2]} color="#e8cfa6" distance={3} decay={2} />
      <pointLight ref={red} position={[0, 1.75, -1.2]} color={C.signal} distance={2.4} decay={2} />
      <hemisphereLight ref={hemi} args={[light ? "#fff6ea" : "#c9a98a", light ? "#8a7f70" : "#1a1410", 0.3]} />
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
        <RB key={i} args={[0.07, DESK_Y - 0.06, 0.07]} radius={0.01} smoothness={4} position={[x, (DESK_Y - 0.06) / 2, z]} castShadow><meshStandardMaterial color="#1a1411" metalness={0.5} roughness={0.4} /></RB>
      ))}
      {/* desk mat: felt */}
      <RB args={[2.2, 0.004, 0.95]} radius={0.002} smoothness={4} position={[0.1, DESK_Y + 0.002, 0.05]} receiveShadow><meshStandardMaterial color="#241c17" map={rug} roughness={1} /></RB>
    </group>
  )
}

/* ---------------------------------------------------------------- monitor */
function Monitor({ ctx }: { ctx: Ctx }) {
  const T = TOK[ctx.theme]
  const tex = useCanvasTex(1280, 720, async (g) => {
    const grd = g.createLinearGradient(0, 0, 1280, 720); grd.addColorStop(0, T.ink2); grd.addColorStop(1, T.void)
    g.fillStyle = grd; g.fillRect(0, 0, 1280, 720)
    g.fillStyle = T.ink; g.fillRect(0, 0, 1280, 40)
    g.fillStyle = T.signal; g.font = f(MONO, 20); g.fillText(">_  aahil shaikh", 18, 28)
    g.fillStyle = T.ink; g.fillRect(0, 40, 200, 680)
    ;["Agents", "Systems", "Side Quests", "Toolkit", "Writing"].forEach((t, i) => {
      g.fillStyle = T.edge; g.fillRect(70, 70 + i * 118, 60, 44); g.fillStyle = T.chalk2; g.font = f(MONO, 20); g.textAlign = "center"; g.fillText(t, 100, 144 + i * 118); g.textAlign = "left"
    })
    g.fillStyle = T.ink2; g.fillRect(224, 64, 1032, 632); g.strokeStyle = T.edge; g.lineWidth = 2; g.strokeRect(224, 64, 1032, 632)
    g.fillStyle = T.signal; g.font = f(MONO, 20); g.fillText(HOME.eyebrow.toUpperCase(), 264, 150)
    g.fillStyle = T.chalk; g.font = f(DISPLAY, 112); g.fillText(HOME.name, 258, 270)
    g.font = "600 36px 'Bricolage Grotesque', sans-serif"
    wrap(g, HOME.thesis, 264, 350, 800, 46, 6)
    g.fillStyle = T.chalk2; g.font = f(MONO, 18); g.fillText(HOME.meta, 264, 650)
  }, "monitor" + ctx.theme)
  return (
    <Hot id="monitor" ctx={ctx}>
      <RB args={[0.5, 0.03, 0.26]} radius={0.01} smoothness={4} position={[0, DESK_Y + 0.015, -0.62]} castShadow><meshStandardMaterial color="#1a1411" metalness={0.6} roughness={0.35} /></RB>
      <RB args={[0.09, 0.45, 0.05]} radius={0.01} smoothness={4} position={[0, DESK_Y + 0.25, -0.76]} castShadow><meshStandardMaterial color="#1a1411" metalness={0.6} roughness={0.35} /></RB>
      <RB args={[1.32, 0.78, 0.07]} radius={0.02} smoothness={4} position={[0, 1.28, -0.68]} castShadow><meshStandardMaterial color="#0e0b09" roughness={0.35} metalness={0.4} /></RB>
      <mesh position={[0, 1.28, -0.643]}><planeGeometry args={[1.22, 0.686]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
      {ctx.focus === "monitor" && !ctx.narrow && (
        <Html transform position={[0, 1.28, -0.64]} scale={MONITOR_SCALE} zIndexRange={[20, 10]}>
          <MonitorOS />
        </Html>
      )}
      <mesh position={[0.5, 0.905, -0.642]}><boxGeometry args={[0.025, 0.012, 0.004]} /><meshBasicMaterial color={C.signal} toneMapped={false} /></mesh>
      {ctx.theme === "dark" && <Glow position={[0, 1.28, -0.4]} color="#e8cfa6" size={1.7} opacity={0.14} />}
    </Hot>
  )
}

function Peripherals() {
  return (
    <group>
      <RB args={[0.06, 0.024, 0.1]} radius={0.012} smoothness={4} position={[0.46, DESK_Y + 0.012, -0.2]} castShadow><meshStandardMaterial color="#241c17" roughness={0.4} metalness={0.2} /></RB>
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
      g.fillStyle = "#1d1612"; g.font = f(DISPLAY, 58); g.fillText("HELLO", 28, 492)
      g.fillStyle = "#6b5a4c"; g.font = f(MONO, 17); g.fillText(item.org, 30, 522)
      return
    }
    g.fillStyle = "#EEE5E9"; g.fillRect(0, 0, 400, 540)
    g.fillStyle = "#E3D3C2"; g.fillRect(0, 0, 400, 54)
    g.fillStyle = "#EEE5E9"; g.fillRect(0, 0, 120, 54)
    g.fillStyle = "#0B0908"; g.font = f(MONO, 22); g.fillText(item.kind, 18, 36)
    g.fillStyle = "#6b5a4c"; g.font = f(MONO, 17); g.fillText(item.org.toUpperCase(), 140, 34)
    g.fillStyle = "#1d1612"; g.font = f(DISPLAY, item.title.length > 11 ? 40 : item.title.length > 8 ? 52 : 66); g.fillText(item.title.toUpperCase(), 22, 132)
    cover(g, img, 22, 160, 356, 220, true)
    g.strokeStyle = "#9A8B7A"; g.lineWidth = 2; g.strokeRect(22, 160, 356, 220)
    g.save(); g.translate(250, 440); g.rotate(-0.14)
    g.strokeStyle = "#B73A27"; g.lineWidth = 3; g.font = f(MONO, 24)
    const w = g.measureText(item.stamp).width + 28
    g.strokeRect(-w / 2, -26, w, 46); g.strokeRect(-w / 2 + 5, -21, w - 10, 36)
    g.fillStyle = "#B73A27"; g.textAlign = "center"; g.fillText(item.stamp, 0, 6); g.restore()
    g.fillStyle = "#4a3a2e"; g.font = f(MONO, 16); g.fillText(item.tags.join(" · "), 22, 512)
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
      <RB args={[0.34, 0.004, 0.459]} radius={0.0015} smoothness={4} position={[0, 0.002, 0]} castShadow receiveShadow><meshStandardMaterial color="#E3D3C2" roughness={0.9} /></RB>
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
    g.fillStyle = "#1D1815"; g.fillRect(0, 0, 512, 96)
    g.fillStyle = "#CF5C36"; g.fillRect(0, 0, 14, 96)
    g.fillStyle = "#EEE5E9"; g.font = f(DISPLAY, 54); g.fillText(title.toUpperCase(), 34, 66)
    g.fillStyle = "#9A9186"; g.font = f(MONO, 15); g.fillText("writeup", 400, 56)
  }, title)
  return (
    <group position={[x, y, -1.32]}>
      <RB args={[w, 0.09, 0.3]} radius={0.008} smoothness={4} castShadow><meshStandardMaterial color="#1a2232" roughness={0.65} /></RB>
      <mesh position={[0, 0, 0.1515]}><planeGeometry args={[w - 0.01, 0.082]} /><meshStandardMaterial map={tex} roughness={0.7} /></mesh>
      <mesh position={[0.0, 0, 0]}><boxGeometry args={[w - 0.02, 0.07, 0.29]} /><meshStandardMaterial color="#E3D8C6" roughness={0.9} /></mesh>
    </group>
  )
}

function Shelf({ ctx }: { ctx: Ctx }) {
  const wood = useMemo(() => woodTex("#3a2a1c", 1, 1), [])
  const fillers = [[-0.85, 0.3, "#515A47"], [-0.77, 0.26, "#8A3A1F"], [-0.69, 0.32, "#3a2a20"], [-0.6, 0.27, "#6b5a4c"], [-0.52, 0.3, "#CD4631"], [-0.44, 0.24, "#1D1815"]] as const
  return (
    <Hot id="shelf" ctx={ctx}>
      <RB args={[2.3, 0.04, 0.4]} radius={0.01} smoothness={4} position={[0, 1.84, -1.4]} castShadow receiveShadow><meshStandardMaterial color="#c9b9a6" map={wood} roughness={0.6} /></RB>
      <mesh position={[0, 1.805, -1.2]}><boxGeometry args={[2.3, 0.02, 0.01]} /><meshBasicMaterial color={C.signal} toneMapped={false} /></mesh>
      {fillers.map(([x, h, c], i) => (
        <RB key={i} args={[0.07, h, 0.25]} radius={0.006} smoothness={4} position={[x - 0.1, 1.86 + h / 2, -1.4]} castShadow><meshStandardMaterial color={c} roughness={0.75} /></RB>
      ))}
      <Book title="SAGE" x={0.1} y={1.915} />
      <Book title="Recurser" x={0.14} y={2.005} w={0.5} />
      <mesh position={[0.9, 1.93, -1.4]} castShadow><cylinderGeometry args={[0.07, 0.055, 0.13, 48]} /><meshStandardMaterial color="#8A3A1F" roughness={0.7} /></mesh>
      <mesh position={[0.9, 2.05, -1.4]} castShadow><icosahedronGeometry args={[0.1, 3]} /><meshStandardMaterial color="#515A47" flatShading roughness={0.9} /></mesh>
    </Hot>
  )
}

/* ------------------------------------------------------------- corkboard */
function PathNote({ row, x, y, rot }: { row: (typeof PATH_GROUPS)[number]["rows"][number]; x: number; y: number; rot: number }) {
  const { role, focus } = splitTitle(row.title)
  const tex = useCanvasTex(440, 270, (g) => {
    g.fillStyle = "#EEE5E9"; g.fillRect(0, 0, 440, 270)
    g.fillStyle = "#B73A27"; g.fillRect(0, 0, 440, 10)
    g.fillStyle = "#B73A27"; g.font = f(MONO, 24); g.fillText(row.when, 20, 52)
    g.fillStyle = "#1d1612"; g.font = f(DISPLAY, focus.length > 22 ? 32 : 40); wrap(g, focus, 20, 100, 400, focus.length > 22 ? 36 : 44, 3)
    g.fillStyle = "#6b5a4c"; g.font = f(MONO, 18); if (role) wrap(g, role, 20, 196, 400, 22, 1)
    g.fillStyle = "#4a3a2e"; g.font = f(MONO, 18); wrap(g, row.org, 20, 246, 400, 22, 1)
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
    g.fillStyle = "#1d1612"; g.fillRect(0, 0, 440, 100)
    g.fillStyle = "#CF5C36"; g.fillRect(0, 0, 14, 100)
    g.fillStyle = "#EEE5E9"; g.font = f(DISPLAY, 58); g.fillText(label.toUpperCase(), 34, 72)
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
    g.fillStyle = "#EEE5E9"; g.fillRect(0, 0, 1500, 100)
    g.fillStyle = "#B73A27"; g.fillRect(0, 0, 14, 100)
    g.fillStyle = "#1d1612"; g.font = f(DISPLAY, 50); g.fillText("TEXAS A&M", 36, 68)
    g.fillStyle = "#6b5a4c"; g.font = f(MONO, 28); g.fillText(PATH_BAND.when + "  ·  " + PATH_BAND.org, 400, 62)
  }, "band")
  const rot = [[-0.02, 0.015], [0.012, -0.018], [-0.015, 0.02]]
  return (
    <Hot id="board" ctx={ctx} position={[2.2, 1.55, -1.6]}>
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
/* folders, binders and a few books standing shoulder to shoulder, one instanced draw call */
function DrawerStock() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const COLORS = ["#8A3A1F", "#CF5C36", "#EFC88B", "#81ADC8", "#515A47", "#9E6240", "#DEA47E", "#3b322d", "#CD4631", "#C9BBA6"]
  const items = useMemo(() => {
    let sd = 7; const r = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647 }
    const out: { x: number; z: number; w: number; h: number; d: number; tilt: number; c: string }[] = []
    for (const [z0, d, rows] of [[-0.14, 0.2, 1], [-0.37, 0.22, 1]] as const) {
      let x = -0.44
      while (x < 0.43 && rows) {
        const w = 0.012 + r() * 0.022, book = r() > 0.78
        out.push({ x: x + w / 2, z: z0 - d / 2 - r() * 0.02, w: book ? w + 0.012 : w, h: book ? 0.1 : 0.075 + r() * 0.03, d: book ? d - 0.02 : d, tilt: (r() - 0.5) * 0.05, c: COLORS[Math.floor(r() * COLORS.length)] })
        x += w + 0.002 + (r() > 0.85 ? 0.01 : 0)
      }
    }
    return out
  }, [])
  useEffect(() => {
    const m = new THREE.Matrix4(), c = new THREE.Color(), q = new THREE.Quaternion(), e = new THREE.Euler()
    items.forEach((it, i) => {
      e.set(0, 0, it.tilt); q.setFromEuler(e)
      m.compose(new THREE.Vector3(it.x, -0.044 + it.h / 2, it.z), q, new THREE.Vector3(it.w, it.h, it.d))
      ref.current.setMatrixAt(i, m); ref.current.setColorAt(i, c.set(it.c))
    })
    ref.current.instanceMatrix.needsUpdate = true; if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true
  }, [items])
  return <instancedMesh ref={ref} args={[undefined, undefined, items.length]} castShadow><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial roughness={0.8} /></instancedMesh>
}

function Drawer({ ctx }: { ctx: Ctx }) {
  const d = useRef<THREE.Group>(null!)
  const o = useRef(0.03)
  const invalidate = useThree((s) => s.invalidate)
  const tex = useCanvasTex(512, 96, (g) => {
    g.fillStyle = "#3a2a20"; g.fillRect(0, 0, 512, 96)
    g.fillStyle = "#EEE5E9"; g.font = f(MONO, 34); g.fillText("SIDE QUESTS", 28, 56)
    g.fillStyle = "#CF5C36"; g.fillRect(28, 70, 100, 6)
  }, "drawer")
  useEffect(() => { shadow.dirty = true; invalidate() }, [ctx.focus, invalidate])
  useFrame((_, dt) => {
    const goal = ctx.focus === "drawer" ? 0.42 : 0.03
    o.current += (goal - o.current) * (ctx.reduced ? 1 : 1 - Math.exp(-dt * 5))
    d.current.position.z = o.current
    if (Math.abs(goal - o.current) > 0.002) { shadow.dirty = true; invalidate() }
  })
  // a centre drawer set into a front apron rail: flush with the desk edge, open just a crack until you ask for it
  const wood = useMemo(() => woodTex("#3a2a1c", 2, 1), [])
  return (
    <Hot id="drawer" ctx={ctx} position={[0, 0.665, 0.49]}>
      <RB args={[3.06, 0.14, 0.03]} radius={0.006} smoothness={4} position={[0, 0.0, 0.0]} castShadow receiveShadow><meshStandardMaterial color="#c9b9a6" map={wood} roughness={0.6} /></RB>
      <RB args={[1.0, 0.13, 0.5]} radius={0.01} smoothness={4} position={[0, 0, -0.25]} receiveShadow><meshStandardMaterial color="#120d09" roughness={0.8} /></RB>
      <group ref={d}>
        <RB args={[0.98, 0.13, 0.022]} radius={0.007} smoothness={4} position={[0, 0, 0.011]} castShadow><meshStandardMaterial color="#c9b9a6" map={wood} roughness={0.55} /></RB>
        <mesh position={[0, 0, 0.0235]}><planeGeometry args={[0.46, 0.086]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
        <RB args={[0.14, 0.014, 0.02]} radius={0.006} smoothness={4} position={[0.36, 0, 0.032]}><meshStandardMaterial color="#C9BBA6" metalness={0.85} roughness={0.25} /></RB>
        <mesh position={[0, -0.05, -0.27]}><boxGeometry args={[0.94, 0.012, 0.52]} /><meshStandardMaterial color="#1d1612" /></mesh>
        <DrawerStock />
      </group>
    </Hot>
  )
}

/* ------------------------------------------------------------ notes (contact) */
function Notepad({ ctx }: { ctx: Ctx }) {
  const tex = useCanvasTex(300, 400, (g) => {
    g.fillStyle = "#E9E4B8"; g.fillRect(0, 0, 300, 400)
    g.fillStyle = "#B73A27"; g.fillRect(0, 0, 300, 10)
    g.fillStyle = "#1d1612"; g.font = f(DISPLAY, 46); g.fillText("CONTACT", 22, 78)
    g.fillStyle = "#6b5a4c"; g.font = f(MONO, 16); g.fillText("I read everything", 24, 108) // SPIKE COPY
    ;[150, 190, 230, 270, 310].forEach((y) => { g.fillStyle = "#9A8B7A"; g.fillRect(24, y, 250, 2) })
    g.fillStyle = "#B73A27"; g.font = f(MONO, 20); g.fillText("email", 24, 144); g.fillText("github", 24, 184); g.fillText("linkedin", 24, 224); g.fillText("resume", 24, 264)
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
  useEffect(() => { bulb.current.emissiveIntensity = ctx.lamp ? 5 : 0; inner.current.emissiveIntensity = ctx.lamp ? 0.9 : 0 }, [ctx.lamp])
  // weighted base and a bell shade, both turned on a lathe
  const baseGeo = useMemo(() => new THREE.LatheGeometry([[0.001, 0], [0.14, 0], [0.145, 0.006], [0.14, 0.014], [0.11, 0.026], [0.06, 0.038], [0.022, 0.05], [0.016, 0.07]].map(([x, y]) => new THREE.Vector2(x, y)), 64), [])
  const shadeGeo = useMemo(() => {
    const pts: THREE.Vector2[] = []
    for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push(new THREE.Vector2(0.02 + Math.pow(t, 0.7) * 0.123 + Math.sin(t * Math.PI) * 0.012, 0.11 - t * 0.11)) }
    return new THREE.LatheGeometry(pts, 64)
  }, [])
  const arm = (a: [number, number, number], b: [number, number, number]) => {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), mid = va.clone().add(vb).multiplyScalar(0.5)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize())
    return <mesh position={mid} quaternion={q} castShadow><cylinderGeometry args={[0.009, 0.009, va.distanceTo(vb), 20]} /><meshStandardMaterial color="#aab4c4" metalness={0.9} roughness={0.25} /></mesh>
  }
  const joint = (p: [number, number, number], r = 0.016) => <mesh position={p} castShadow><sphereGeometry args={[r, 24, 16]} /><meshStandardMaterial color="#2a2320" metalness={0.8} roughness={0.3} /></mesh>
  const J: [number, number, number] = [-0.89, 1.46, -0.32]
  return (
    <group onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); ctx.toggleLamp() }} {...hovFor(ctx, ctx.lamp ? "Lamp: off" : "Lamp: on")}>
      <mesh position={[-1.08, DESK_Y, -0.4]} geometry={baseGeo} castShadow receiveShadow><meshStandardMaterial color="#241c17" metalness={0.8} roughness={0.28} /></mesh>
      {arm([-1.08, DESK_Y + 0.06, -0.4], [-1.0, 1.25, -0.36])}
      {joint([-1.0, 1.25, -0.36], 0.02)}
      {arm([-1.0, 1.25, -0.36], J)}
      {joint(J)}
      {/* head: neck, socket and bulb are one rigid piece with the shade, so nothing floats */}
      <group position={J} rotation={[0, 0, 0.55]}>
        <mesh position={[0, 0.0, 0]} castShadow><cylinderGeometry args={[0.012, 0.012, 0.05, 24]} /><meshStandardMaterial color="#aab4c4" metalness={0.9} roughness={0.25} /></mesh>
        <mesh geometry={shadeGeo} position={[0, -0.09, 0]} castShadow><meshStandardMaterial color={C.ember} side={THREE.DoubleSide} roughness={0.35} metalness={0.5} /></mesh>
        <mesh geometry={shadeGeo} position={[0, -0.09, 0]} scale={0.97}><meshStandardMaterial ref={inner} color="#ffd9a8" emissive="#ffa860" emissiveIntensity={0.9} side={THREE.BackSide} /></mesh>
        <mesh position={[0, -0.025, 0]}><cylinderGeometry args={[0.014, 0.014, 0.03, 24]} /><meshStandardMaterial color="#2a2320" metalness={0.7} roughness={0.4} /></mesh>
        {/* the bulb: the actual light source (the spot and point light sit at its centre) */}
        <mesh position={[0, -0.062, 0]} scale={[1, 1.25, 1]}><sphereGeometry args={[0.022, 32, 24]} /><meshStandardMaterial ref={bulb} color="#fff0d2" emissive="#ffc27a" emissiveIntensity={5} roughness={0.2} /></mesh>
      </group>
      {ctx.lamp && <Glow position={[-0.856, 1.402, -0.32]} color="#ffb070" size={0.55} opacity={0.5} />}
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
        <mesh position={[-R, H / 2, 0]} castShadow><cylinderGeometry args={[R, R * 0.9, H, 64, 1, true]} /><meshStandardMaterial color="#EEE5E9" roughness={0.3} side={THREE.DoubleSide} /></mesh>
        <mesh position={[-R, 0.003, 0]}><cylinderGeometry args={[R * 0.9, R * 0.9, 0.006, 64]} /><meshStandardMaterial color="#EEE5E9" roughness={0.3} /></mesh>
        <mesh position={[-R, H - 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[R * 0.97, 64]} /><meshStandardMaterial color="#2a160d" roughness={0.12} /></mesh>
        {/* handle: a half torus in the mug's own plane, both ends sunk into the wall */}
        <mesh position={[-2 * R + 0.003, H / 2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><torusGeometry args={[0.03, 0.0075, 16, 40, Math.PI]} /><meshStandardMaterial color="#EEE5E9" roughness={0.3} /></mesh>
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
  const dark = ctx.theme === "dark"
  useEffect(() => { rocker.current.rotation.x = ctx.theme === "light" ? -0.4 : 0.4; shadow.dirty = true }, [ctx.theme])
  const label = useCanvasTex(256, 64, (g) => {
    g.fillStyle = dark ? "#EEE5E9" : "#2B1B13"; g.font = f(MONO, 30); g.textAlign = "center"; g.fillText("LIGHTS", 128, 42)
  }, "sw" + ctx.theme)
  // in the gap between the monitor and the corkboard (seen from the seat): bigger than a real switch, high contrast on both walls, the far side of the room from the lamp
  return (
    <group position={[1.15, 1.42, -1.6]} onClick={(e) => { if (e.delta > 6) return; e.stopPropagation(); ctx.toggleTheme() }} {...hovFor(ctx, ctx.theme === "light" ? "Light switch: lights off" : "Light switch: lights on")}>
      <RB args={[0.15, 0.24, 0.016]} radius={0.006} smoothness={4} castShadow><meshStandardMaterial color={dark ? "#EEE5E9" : "#2B1B13"} roughness={0.45} /></RB>
      <mesh ref={rocker} position={[0, 0.02, 0.014]}><boxGeometry args={[0.05, 0.1, 0.02]} /><meshStandardMaterial color={C.signal} roughness={0.35} emissive={C.signal} emissiveIntensity={dark ? 0.35 : 0} /></mesh>
      <mesh position={[0, -0.085, 0.0095]}><planeGeometry args={[0.12, 0.03]} /><meshBasicMaterial map={label} transparent toneMapped={false} /></mesh>
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
      <Keyboard ctx={ctx} />
      <Camera ctx={ctx} />
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
