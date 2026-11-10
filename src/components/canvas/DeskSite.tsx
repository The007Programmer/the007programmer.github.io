import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { DESK, FIT, OBJS, ZONES, ZW, ZH, PILE_IDS, RING, Decals, Drawer, Hello, PileButton, ZoneBack, ZoneTab, fanLayout, zoneOf, type ObjSpec } from "./desk"

interface Cam { cx: number; cy: number; k: number }
interface Body {
  spec: ObjSpec; el: HTMLDivElement; face: HTMLDivElement; glare: HTMLDivElement
  x: number; y: number; r: number; s: number; ts: number
  vx: number; vy: number; vr: number
  hvx: number; hvy: number; lastMove: number
  tx: number | null; ty: number; tr: number; delay: number
  tiltX: number; tiltY: number; ttX: number; ttY: number
  ga: number; tga: number; gx: number; gy: number
  held: boolean; z: number; z0: number
}
interface FanState { id: string; titleY: number }
interface OpenState { id: string; from: { dx: number; dy: number; sc: number; r: number } }

const MAXK = 2.4
const FAN_Z = 5000
const XB = DESK.w / 2 + 40, YB = DESK.h / 2 + 40
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches

const Objects = memo(function Objects() {
  return (
    <>
      {OBJS.map((o) => (
        <div
          key={o.id}
          data-obj={o.id}
          className={`absolute left-0 top-0 ${o.bare ? "" : "desk-obj"}`}
          style={{ width: o.w, height: o.h, marginLeft: -o.w / 2, marginTop: -o.h / 2, perspective: 900 }}
        >
          <div data-face className="relative w-full h-full" style={{ transformStyle: "preserve-3d" }}>
            {o.face}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div data-glare className="absolute pointer-events-none" style={{ left: "-50%", top: "-50%", width: "200%", height: "200%", opacity: 0, background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,.22), transparent 22%)" }} />
            </div>
          </div>
        </div>
      ))}
    </>
  )
})

export default function DeskSite() {
  const stage = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const cursor = useRef<HTMLDivElement>(null)
  const curLabel = useRef<HTMLSpanElement>(null)
  const size = useRef({ w: 1200, h: 800 })
  const cam = useRef<Cam>({ cx: 0, cy: 0, k: 0.5 })
  const bodies = useRef<Body[]>([])
  const api = useRef({ tidy: () => {}, fly: (_c: Cam, _ms?: number) => {}, openFrom: (_id: string): OpenState | null => null, home: () => {}, zone: (_i: number) => {}, fan: (_id: string) => {}, unfan: () => {} })
  const [open, setOpen] = useState<OpenState | null>(null)
  const [hint, setHint] = useState(true)
  const [toast, setToast] = useState("")
  const [fan, setFan] = useState<FanState | null>(null)
  const [zoneIdx, setZoneIdx] = useState<number | null>(null)

  const doOpen = useCallback((id: string) => {
    const st = api.current.openFrom(id)
    if (st) setOpen(st)
  }, [])

  useEffect(() => {
    const el = stage.current!
    const wd = world.current!
    const minK = () => Math.min(size.current.w / FIT.w, size.current.h / FIT.h) * 0.7
    const narrow = () => size.current.w < 700
    const zoneCam = (i: number): Cam => {
      const { w, h } = size.current, zn = ZONES[i]
      const k = clamp(Math.min((w * 0.92) / (ZW + 40), (h * (narrow() ? 0.7 : 0.8)) / (ZH + 90)), minK(), MAXK)
      return { cx: zn.cx, cy: zn.cy - 28 + (narrow() ? 40 : 0), k }
    }
    const fitCam = (): Cam => {
      if (narrow()) return zoneCam(0)
      const { w, h } = size.current
      return { cx: FIT.x + FIT.w / 2, cy: FIT.y + FIT.h / 2, k: clamp(Math.min((w * 0.95) / FIT.w, (h * 0.95) / FIT.h), minK(), MAXK) }
    }
    const apply = () => {
      const { cx, cy, k } = cam.current, { w, h } = size.current
      wd.style.transform = `translate(${w / 2 - cx * k}px,${h / 2 - cy * k}px) scale(${k})`
    }
    const toWorld = (sx: number, sy: number): [number, number] => {
      const { cx, cy, k } = cam.current, { w, h } = size.current
      return [cx + (sx - w / 2) / k, cy + (sy - h / 2) / k]
    }

    // ---- bodies
    let zTop = 100
    const els = Array.from(wd.querySelectorAll<HTMLDivElement>("[data-obj]"))
    const byEl = new Map<Element, Body>()
    bodies.current = OBJS.map((spec, i) => {
      const e = els.find((x) => x.dataset.obj === spec.id)!
      const b: Body = {
        spec, el: e, face: e.querySelector("[data-face]") as HTMLDivElement, glare: e.querySelector("[data-glare]") as HTMLDivElement,
        x: spec.x, y: spec.y, r: spec.r, s: 1, ts: 1, vx: 0, vy: 0, vr: 0, hvx: 0, hvy: 0, lastMove: 0,
        tx: null, ty: 0, tr: 0, delay: 0, tiltX: 0, tiltY: 0, ttX: 0, ttY: 0, ga: 0, tga: 0, gx: 50, gy: 50, held: false, z: i + 2, z0: i + 2,
      }
      byEl.set(e, b)
      return b
    })
    const active = new Set<Body>()
    const write = (b: Body) => {
      b.el.style.transform = `translate3d(${b.x.toFixed(1)}px,${b.y.toFixed(1)}px,0) rotate(${b.r.toFixed(2)}deg) scale(${b.s.toFixed(3)})`
    }
    const writeTilt = (b: Body) => {
      b.face.style.transform = `rotateX(${b.tiltX.toFixed(2)}deg) rotateY(${b.tiltY.toFixed(2)}deg)`
      b.glare.style.transform = `translate3d(${((b.gx - 50) * b.spec.w / 100).toFixed(0)}px,${((b.gy - 50) * b.spec.h / 100).toFixed(0)}px,0)`
      b.glare.style.opacity = b.ga.toFixed(2)
    }
    bodies.current.forEach((b) => { b.el.style.zIndex = String(b.z); write(b) })

    // ---- single rAF loop
    let running = false, last = 0
    let anim: { from: Cam; to: Cam; t0: number; dur: number } | null = null
    const kick = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(tick) } }
    const tick = (now: number) => {
      const dt = Math.min(48, now - last); last = now
      let busy = false
      if (anim) {
        const u = ease(clamp((now - anim.t0) / anim.dur, 0, 1))
        const { from, to } = anim
        const k = from.k * Math.pow(to.k / from.k, u)
        const w = Math.abs(to.k - from.k) < 1e-4 ? u : (1 / k - 1 / from.k) / (1 / to.k - 1 / from.k)
        cam.current = { k, cx: from.cx + (to.cx - from.cx) * w, cy: from.cy + (to.cy - from.cy) * w }
        apply()
        if (u >= 1) anim = null
        busy = true
      }
      const fr = Math.pow(0.94, dt / 16.67), fv = Math.pow(0.9, dt / 16.67)
      for (const b of active) {
        let moving = false
        if (b.held) moving = true
        else if (b.tx !== null) {
          if (now >= b.delay) {
            const a = 1 - Math.pow(0.0015, dt / 520)
            b.x += (b.tx - b.x) * a; b.y += (b.ty - b.y) * a; b.r += (b.tr - b.r) * a
            if (Math.abs(b.tx - b.x) + Math.abs(b.ty - b.y) < 0.4 && Math.abs(b.tr - b.r) < 0.1) { b.x = b.tx; b.y = b.ty; b.r = b.tr; b.tx = null }
          }
          moving = true
        } else if (Math.abs(b.vx) + Math.abs(b.vy) > 0.004 || Math.abs(b.vr) > 0.003) {
          b.x += b.vx * dt; b.y += b.vy * dt; b.r += b.vr * dt
          b.vx *= fr; b.vy *= fr; b.vr *= fv
          if (Math.abs(b.x) > XB) { b.x = Math.sign(b.x) * XB; b.vx *= -0.5 }
          if (Math.abs(b.y) > YB) { b.y = Math.sign(b.y) * YB; b.vy *= -0.5 }
          moving = true
        } else { b.vx = b.vy = b.vr = 0 }
        const ds = b.ts - b.s
        if (Math.abs(ds) > 0.001) { b.s += ds * (1 - Math.pow(0.0005, dt / 300)); moving = true } else b.s = b.ts
        const ta = 1 - Math.pow(0.001, dt / 380)
        const dtx = b.ttX - b.tiltX, dty = b.ttY - b.tiltY, dga = b.tga - b.ga
        const tilting = Math.abs(dtx) + Math.abs(dty) + Math.abs(dga) > 0.01
        if (tilting) { b.tiltX += dtx * ta; b.tiltY += dty * ta; b.ga += dga * ta; writeTilt(b) }
        if (moving) write(b)
        if (!moving && !tilting) active.delete(b)
        else busy = true
      }
      if (busy) requestAnimationFrame(tick); else running = false
    }
    const flyTo = (to: Cam, ms = 1000) => {
      to = { ...to, k: clamp(to.k, minK(), MAXK) }
      if (reduced()) { cam.current = to; apply(); return }
      anim = { from: { ...cam.current }, to, t0: performance.now(), dur: ms }
      kick()
    }

    // ---- sizing, intro (cards get tossed on)
    const measure = () => { size.current = { w: el.clientWidth, h: el.clientHeight }; apply() }
    measure()
    cam.current = fitCam(); apply()
    if (!reduced()) {
      const t0 = performance.now()
      bodies.current.forEach((b, i) => {
        b.x = b.spec.x + (Math.sin(i * 12.9) * 600); b.y = b.spec.y - 1100 - (i % 4) * 120; b.r = b.spec.r + ((i % 5) - 2) * 25
        b.tx = b.spec.x; b.ty = b.spec.y; b.tr = b.spec.r; b.delay = t0 + 250 + i * 55
        write(b); active.add(b)
      })
      kick()
    }
    const ro = new ResizeObserver(measure); ro.observe(el)

    // ---- tidy
    const tidy = () => {
      unfan(true)
      const t0 = performance.now()
      bodies.current.forEach((b, i) => {
        b.tx = b.spec.x; b.ty = b.spec.y; b.tr = b.spec.r; b.vx = b.vy = b.vr = 0
        b.delay = t0 + i * 22; b.ts = 1; b.z = b.z0; b.el.style.zIndex = String(b.z)
        active.add(b)
      })
      zTop = 100; kick()
    }

    // ---- piles fan out into a gallery at the centre of the desk
    let fanned: string | null = null, camBeforeFan: Cam | null = null, fanT = 0
    const doFan = (id: string) => {
      if (fanned) return
      const ids = PILE_IDS[id]; if (!ids) return
      const lay = fanLayout(ids, narrow())
      fanT = performance.now(); fanned = id; camBeforeFan = { ...cam.current }
      const t0 = performance.now()
      ids.forEach((bid, i) => {
        const b = bodies.current.find((x) => x.spec.id === bid)!
        b.tx = lay.pts[i].x; b.ty = lay.pts[i].y; b.tr = lay.pts[i].r; b.vx = b.vy = b.vr = 0
        b.delay = t0 + i * 45; b.ts = 1; b.z = FAN_Z + i; b.el.style.zIndex = String(b.z); active.add(b)
      })
      zTop = FAN_Z + 50; kick()
      setFan({ id, titleY: -lay.bh / 2 + 30 })
      const { w, h } = size.current
      flyTo({ cx: 0, cy: narrow() ? 90 : 10, k: Math.min(1, (w * 0.94) / lay.bw, (h * (narrow() ? 0.76 : 0.92)) / lay.bh) }, 800)
    }
    const unfan = (silent = false) => {
      if (!fanned) return
      const ids = PILE_IDS[fanned]
      fanned = null
      const t0 = performance.now()
      ids.forEach((bid, i) => {
        const b = bodies.current.find((x) => x.spec.id === bid)!
        b.tx = b.spec.x; b.ty = b.spec.y; b.tr = b.spec.r; b.delay = t0 + i * 25; b.z = b.z0; b.el.style.zIndex = String(b.z); active.add(b)
      })
      zTop = 100; kick(); setFan(null)
      if (!silent && camBeforeFan) flyTo(camBeforeFan, 700)
      camBeforeFan = null
    }
    const atHome = (b: Body) => Math.hypot(b.x - b.spec.x, b.y - b.spec.y) < 40

    // ---- cursor
    const cur = cursor.current!, lab = curLabel.current!
    let labelNow = "", lastTarget: EventTarget | null = null
    const setLabel = (s: string) => { if (s !== labelNow) { labelNow = s; lab.textContent = s } }
    const labelFor = (t: HTMLElement | null): string => {
      if (!t) return "pan"
      if (t.closest("a")) return "open"
      if (t.closest("[data-zone-fly]")) return "go"
      if (t.closest("[data-scrim]")) return "put back"
      const dr = t.closest("[data-cursor]") as HTMLElement | null
      if (dr?.dataset.cursor === "pull") return "pull"
      const o = t.closest("[data-obj]") as HTMLElement | null
      if (o) { const b = byEl.get(o); if (b?.spec.pile && !fanned && atHome(b)) return "tap · fan out"; return b?.spec.detail ? "grab · 2x open" : "grab" }
      return "pan"
    }

    // ---- pointer
    const ptrs = new Map<number, { x: number; y: number }>()
    let held: Body | null = null, ox = 0, oy = 0, downX = 0, downY = 0, moved = false, panning = false
    let hovered: Body | null = null, lastTap = { id: "", t: 0 }
    const clearHover = () => { if (hovered) { hovered.ttX = hovered.ttY = 0; hovered.tga = 0; active.add(hovered); hovered = null; kick() } }

    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement
      setHint(false)
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (t.closest("a,button,[data-nodrag],[data-zone-fly]")) return
      anim = null
      if (ptrs.size === 1) {
        downX = e.clientX; downY = e.clientY; moved = false
        const o = t.closest("[data-obj]") as HTMLElement | null
        const b = o && byEl.get(o)
        el.setPointerCapture(e.pointerId)
        if (b) {
          held = b
          const [wx, wy] = toWorld(e.clientX, e.clientY)
          ox = wx - b.x; oy = wy - b.y
          b.held = true; b.tx = null; b.vx = b.vy = b.vr = 0; b.ts = 1.07; b.hvx = b.hvy = 0; b.lastMove = e.timeStamp
          b.z = ++zTop; b.el.style.zIndex = String(b.z); b.el.classList.add("lifted")
          b.ttX = b.ttY = 0; b.tga = 0
          active.add(b); kick(); setLabel("holding")
        } else { panning = true; setLabel("panning") }
      } else { panning = true; held = null }
    }
    const move = (e: PointerEvent) => {
      cur.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`
      cur.style.opacity = e.pointerType === "touch" ? "0" : "1"
      const p = ptrs.get(e.pointerId)
      if (!p) {
        if (e.target !== lastTarget) { lastTarget = e.target; setLabel(labelFor(e.target as HTMLElement)) }
        // hover tilt
        const o = (e.target as HTMLElement).closest("[data-obj]") as HTMLElement | null
        const b = (o && byEl.get(o)) || null
        if (hovered && hovered !== b) clearHover()
        if (b && !b.spec.bare) {
          hovered = b
          const [wx, wy] = toWorld(e.clientX, e.clientY)
          const dx = wx - b.x, dy = wy - b.y, c = Math.cos((b.r * Math.PI) / 180), s = Math.sin((b.r * Math.PI) / 180)
          const px = (dx * c + dy * s) / b.spec.w, py = (-dx * s + dy * c) / b.spec.h
          b.ttY = clamp(px, -0.5, 0.5) * 18; b.ttX = -clamp(py, -0.5, 0.5) * 18
          b.gx = (clamp(px, -0.5, 0.5) + 0.5) * 100; b.gy = (clamp(py, -0.5, 0.5) + 0.5) * 100; b.tga = 1
          active.add(b); kick()
        }
        return
      }
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) moved = true
      if (held && ptrs.size === 1) {
        const [wx, wy] = toWorld(e.clientX, e.clientY)
        const nx = wx - ox, ny = wy - oy
        const dtm = Math.max(1, e.timeStamp - held.lastMove)
        held.hvx = held.hvx * 0.55 + ((nx - held.x) / dtm) * 0.45
        held.hvy = held.hvy * 0.55 + ((ny - held.y) / dtm) * 0.45
        held.lastMove = e.timeStamp
        held.x = nx; held.y = ny
        active.add(held); kick()
      } else if (ptrs.size === 1 && panning && moved) {
        cam.current.cx -= (e.clientX - p.x) / cam.current.k
        cam.current.cy -= (e.clientY - p.y) / cam.current.k
        apply()
      } else if (ptrs.size === 2) {
        const [a, b2] = [...ptrs.values()]
        const d0 = Math.hypot(a.x - b2.x, a.y - b2.y), m0x = (a.x + b2.x) / 2, m0y = (a.y + b2.y) / 2
        p.x = e.clientX; p.y = e.clientY
        const d1 = Math.hypot(a.x - b2.x, a.y - b2.y), m1x = (a.x + b2.x) / 2, m1y = (a.y + b2.y) / 2
        cam.current.cx -= (m1x - m0x) / cam.current.k; cam.current.cy -= (m1y - m0y) / cam.current.k
        if (d0 > 0) zoomAt(m1x, m1y, d1 / d0)
        return
      }
      p.x = e.clientX; p.y = e.clientY
    }
    const up = (e: PointerEvent) => {
      ptrs.delete(e.pointerId)
      if (held) {
        const b = held; held = null
        b.held = false; b.ts = 1; b.el.classList.remove("lifted")
        const idle = e.timeStamp - b.lastMove > 90
        if (moved && !idle) {
          const sp = Math.hypot(b.hvx, b.hvy), cap = Math.min(1, 3 / (sp || 1))
          b.vx = b.hvx * cap; b.vy = b.hvy * cap; b.vr = clamp(b.hvx * 0.035, -0.25, 0.25)
        } else if (!moved) {
          if (b.spec.pile && !fanned && atHome(b) && b.spec.zone) { doFan(b.spec.zone); lastTap.id = "" }
          else if (lastTap.id === b.spec.id && e.timeStamp - lastTap.t < 420 && b.spec.detail) { lastTap.id = ""; doOpen(b.spec.id) }
          else lastTap = { id: b.spec.id, t: e.timeStamp }
        }
        active.add(b); kick()
      }
      if (!ptrs.size) { panning = false; lastTarget = null; labelNow = ""; setLabel(labelFor(e.target as HTMLElement)) }
    }
    const onClick = (e: MouseEvent) => {
      if (moved) return
      const t = e.target as HTMLElement
      const f = t.closest("[data-zone-fly]") as HTMLElement | null
      if (f) { const i = Number(f.dataset.zoneFly); unfan(true); setZoneIdx(i); flyTo(zoneCam(i), 1000); return }
      if (t.closest("[data-scrim]") && performance.now() - fanT > 400) unfan()
    }
    const leave = () => { cur.style.opacity = "0"; clearHover() }

    const zoomAt = (sx: number, sy: number, f: number) => {
      const c = cam.current, { w, h } = size.current
      const wx = c.cx + (sx - w / 2) / c.k, wy = c.cy + (sy - h / 2) / c.k
      const k = clamp(c.k * f, minK(), MAXK)
      cam.current = { k, cx: wx - (sx - w / 2) / k, cy: wy - (sy - h / 2) / k }
      apply()
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); anim = null; setHint(false)
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      zoomAt(e.clientX, e.clientY, Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0018)))
    }
    const key = (e: KeyboardEvent) => {
      const c = cam.current
      if (e.key === "+" || e.key === "=") flyTo({ ...c, k: c.k * 1.5 }, 400)
      else if (e.key === "-" || e.key === "_") flyTo({ ...c, k: c.k / 1.5 }, 400)
      else if (e.key === "t") tidy()
      else if (e.key === "Escape") { if (fanned) unfan(); else { setZoneIdx(null); flyTo(fitCam(), 900) } }
      else return
      e.preventDefault()
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up)
    el.addEventListener("pointerleave", leave); el.addEventListener("click", onClick)
    window.addEventListener("keydown", key)

    api.current = {
      tidy,
      fly: flyTo,
      home: () => { unfan(true); setZoneIdx(null); flyTo(fitCam(), 900) },
      zone: (i) => { unfan(true); setZoneIdx(i); flyTo(zoneCam(i), 900) },
      fan: doFan,
      unfan: () => unfan(),
      openFrom: (id) => {
        const b = bodies.current.find((x) => x.spec.id === id)
        if (!b) return null
        const { cx, cy, k } = cam.current, { w, h } = size.current
        b.el.style.visibility = "hidden"
        return { id, from: { dx: w / 2 + (b.x - cx) * k - w / 2, dy: h / 2 + (b.y - cy) * k - h / 2, sc: (b.spec.w * k) / 640, r: b.r } }
      },
    }
    return () => {
      ro.disconnect()
      el.removeEventListener("wheel", onWheel)
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up)
      el.removeEventListener("pointerleave", leave); el.removeEventListener("click", onClick)
      window.removeEventListener("keydown", key)
      running = false
    }
  }, [doOpen])

  const close = useCallback(() => {
    if (!open) return
    const b = world.current!.querySelector<HTMLElement>(`[data-obj="${open.id}"]`)
    if (b) b.style.visibility = ""
    setOpen(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); close() } }
    window.addEventListener("keydown", k, true)
    return () => window.removeEventListener("keydown", k, true)
  }, [open, close])

  // egg: click the stain
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(""), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const spec = open ? OBJS.find((o) => o.id === open.id) : null
  return (
    <div ref={stage} className="fixed inset-0 overflow-hidden bg-void select-none touch-none cursor-grab [@media(hover:hover)]:cursor-none [@media(hover:hover)]:[&_*]:cursor-none">
      <style>{`
        .desk-obj{box-shadow:0 3px 6px -1px rgba(0,0,0,.55),0 10px 18px -8px rgba(0,0,0,.5);transition:box-shadow .25s}
        .desk-obj.lifted{box-shadow:0 30px 40px -8px rgba(0,0,0,.65),0 8px 14px rgba(0,0,0,.4)}
        .desk-obj img{-webkit-user-drag:none}
      `}</style>
      <div ref={world} className="absolute left-0 top-0" style={{ transformOrigin: "0 0", width: 0, height: 0 }}>
        {/* the surface */}
        <div
          className="absolute rounded-[28px] border border-line"
          style={{
            left: DESK.x, top: DESK.y, width: DESK.w, height: DESK.h,
            background:
              "radial-gradient(1400px 900px at 38% 28%, rgba(97,117,153,.14), transparent 70%), repeating-linear-gradient(0deg, rgba(97,117,153,.07) 0 1px, transparent 1px 50px), repeating-linear-gradient(90deg, rgba(97,117,153,.07) 0 1px, transparent 1px 50px), #0F1520",
            boxShadow: "0 0 0 14px #0C111A, 0 0 0 15px #1c2536, 0 40px 120px rgba(0,0,0,.8)",
          }}
        />
        {ZONES.map((zn) => <ZoneBack key={zn.id} zn={zn} />)}
        <Hello />
        <Decals lift={fan?.id === "systems"} />
        <button
          data-nodrag
          aria-label="Coffee ring"
          onClick={() => setToast("That ring is from cold brew. Not a bug.")}
          className="absolute rounded-full bg-transparent border-0 p-0"
          style={{ left: RING.x - 56, top: RING.y - 48, width: 112, height: 112, zIndex: 1 }}
        />
        {ZONES.map((zn, i) => <ZoneTab key={zn.id} zn={zn} i={i} />)}
        {ZONES.filter((zn) => zn.pile).map((zn) => <PileButton key={zn.id} zn={zn} onFan={() => api.current.fan(zn.id)} />)}
        <Drawer />
        <Objects />
        {fan && (
          <>
            <div data-scrim className="absolute" style={{ left: -4000, top: -3000, width: 8000, height: 6000, zIndex: 4000, background: "rgba(6,8,12,.86)" }} />
            <div className="absolute pointer-events-none text-center font-mono font-bold text-chalk" style={{ left: -600, width: 1200, top: fan.titleY - 40, zIndex: 4001, fontSize: 34, letterSpacing: "0.12em" }}>
              {zoneOf(fan.id).title} <span className="text-chalk-2 font-normal tracking-normal">· {zoneOf(fan.id).sub}</span>
            </div>
          </>
        )}
      </div>

      {/* chrome */}
      <div className="absolute left-4 top-4 font-mono text-xs text-chalk-2 pointer-events-none">AAHIL SHAIKH / DESK</div>
      <div className="absolute left-4 right-4 bottom-4 flex flex-col sm:flex-row sm:items-center gap-2 font-mono text-sm items-start">
        <nav aria-label="Desk zones" className="flex items-center gap-1 bg-void/80 border border-edge/60 p-1">
          <button className="px-2 py-1.5 hover:text-signal" aria-label="Previous zone" onClick={() => api.current.zone(((zoneIdx ?? 0) + ZONES.length - 1) % ZONES.length)}>‹</button>
          {ZONES.map((zn, i) => (
            <button key={zn.id} title={zn.title} aria-label={zn.title} aria-current={zoneIdx === i} onClick={() => api.current.zone(i)} className={`min-w-8 px-1.5 py-1.5 ${zoneIdx === i ? "bg-[#E8D9A6] text-void" : "text-chalk-2 hover:text-signal"}`}>{i + 1}</button>
          ))}
          <button className="px-2 py-1.5 hover:text-signal" aria-label="Next zone" onClick={() => api.current.zone(((zoneIdx ?? -1) + 1) % ZONES.length)}>›</button>
          <span className="hidden sm:inline px-3 text-chalk-2 uppercase tracking-widest">{zoneIdx === null ? "whole desk" : ZONES[zoneIdx].title}</span>
        </nav>
        <div className="flex gap-2">
          <button className="border border-edge bg-void/80 px-3 py-2 hover:text-signal" onClick={() => api.current.tidy()}>Tidy desk</button>
          <button className="border border-edge bg-void/80 px-3 py-2 hover:text-signal" onClick={() => api.current.home()}>Whole desk</button>
          <button className="border border-edge bg-void/80 px-3 py-2 hover:text-signal" aria-label="Zoom in" onClick={() => api.current.fly({ ...camNow(), k: camNow().k * 1.5 }, 400)}>+</button>
          <button className="border border-edge bg-void/80 px-3 py-2 hover:text-signal" aria-label="Zoom out" onClick={() => api.current.fly({ ...camNow(), k: camNow().k / 1.5 }, 400)}>-</button>
        </div>
      </div>
      {fan && <button className="absolute right-4 top-4 font-mono text-sm bg-signal text-void px-4 py-2 z-10" onClick={() => api.current.unfan()}>Put the stack back (Esc)</button>}
      <div className={`absolute right-4 bottom-4 hidden xl:block max-w-[24vw] font-mono text-xs text-chalk bg-void/70 px-4 py-2 pointer-events-none transition-opacity duration-700 text-right ${hint && !fan ? "opacity-100" : "opacity-0"}`}>
        tap a stack to fan it out · drag things · double-click to open · T tidies
      </div>
      {toast && <div className="absolute left-1/2 -translate-x-1/2 top-6 font-mono text-sm bg-ink-2 border border-edge px-4 py-2 pointer-events-none">{toast}</div>}

      {open && spec && <Reader key={open.id} state={open} onClose={close}>{spec.detail}</Reader>}

      <div ref={cursor} className="fixed left-0 top-0 z-[60] pointer-events-none opacity-0" style={{ willChange: "transform" }}>
        <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-signal" />
        <span ref={curLabel} className="absolute left-4 top-3 font-mono text-[11px] bg-void/85 border border-edge/60 text-chalk px-1.5 py-0.5 whitespace-nowrap">pan</span>
      </div>
    </div>
  )

  function camNow() { return cam.current }
}

function Reader({ state, onClose, children }: { state: OpenState; onClose: () => void; children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null)
  const back = useRef<HTMLDivElement>(null)
  const closing = useRef(false)
  useLayoutEffect(() => {
    if (reduced()) return
    const f = state.from
    panel.current!.animate(
      [
        { transform: `translate(${f.dx}px,${f.dy}px) scale(${f.sc}) rotate(${f.r}deg) rotateY(90deg)`, opacity: 0.2 },
        { transform: "translate(0,0) scale(1) rotate(0) rotateY(0)", opacity: 1 },
      ],
      { duration: 620, easing: "cubic-bezier(.2,.8,.2,1)" }
    )
    back.current!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, fill: "both" })
  }, [state])
  const shut = () => {
    if (closing.current) return
    closing.current = true
    if (reduced()) return onClose()
    const f = state.from
    const a = panel.current!.animate(
      [{ transform: "translate(0,0) scale(1) rotateY(0)", opacity: 1 }, { transform: `translate(${f.dx}px,${f.dy}px) scale(${f.sc}) rotate(${f.r}deg) rotateY(-90deg)`, opacity: 0.2 }],
      { duration: 420, easing: "cubic-bezier(.5,0,.8,.4)", fill: "forwards" }
    )
    back.current!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, fill: "forwards" })
    a.onfinish = onClose
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ perspective: 1600 }} role="dialog" aria-modal="true">
      <div ref={back} className="absolute inset-0 bg-void/70" onClick={shut} />
      <div ref={panel} className="relative w-[min(640px,94vw)] max-h-[88vh] overflow-y-auto bg-ink-2 border border-edge p-6 sm:p-8 shadow-[0_40px_90px_rgba(0,0,0,.7)] cursor-auto">
        <button onClick={shut} className="absolute right-3 top-2 font-mono text-sm text-chalk-2 hover:text-signal" aria-label="Put it back">put back ✕</button>
        <div className="pt-4">{children}</div>
      </div>
    </div>
  )
}
