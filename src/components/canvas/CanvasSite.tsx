import { useCallback, useEffect, useRef, useState } from "react"
import { BOUNDS, CLUSTERS, HERO, ITEMS, clusterBox, type Box, type WItem } from "./world"

interface Cam { cx: number; cy: number; k: number }
type Level = 0 | 1 | 2
const MAXK = 2.6
const levelOf = (k: number): Level => (k < 0.26 ? 0 : k < 0.63 ? 1 : 2)
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches

export default function CanvasSite() {
  const stage = useRef<HTMLDivElement>(null)
  const world = useRef<HTMLDivElement>(null)
  const mmView = useRef<HTMLDivElement>(null)
  const size = useRef({ w: 1200, h: 800 })
  const cam = useRef<Cam>({ cx: 0, cy: 0, k: 1 })
  const raf = useRef(0)
  const [level, setLevel] = useState<Level>(1)
  const [hint, setHint] = useState(true)
  const levelRef = useRef<Level>(1)

  const fitBox = useCallback((b: Box, pad = 0.86): Cam => {
    const { w, h } = size.current
    return { cx: b.x + b.w / 2, cy: b.y + b.h / 2, k: clamp(Math.min((w * pad) / b.w, (h * pad) / b.h), minK(), MAXK) }
  }, [])
  const minK = () => Math.min(size.current.w / BOUNDS.w, size.current.h / BOUNDS.h) * 0.8

  const apply = useCallback(() => {
    const el = world.current
    if (!el) return
    const { cx, cy, k } = cam.current
    const { w, h } = size.current
    el.style.transform = `translate(${w / 2 - cx * k}px,${h / 2 - cy * k}px) scale(${k})`
    el.style.setProperty("--inv", String(1 / k))
    el.style.setProperty("--lab", String(clamp((0.5 - k) / 0.2, 0, 1)))
    const mm = mmView.current
    if (mm) {
      const vx = cx - w / 2 / k, vy = cy - h / 2 / k
      mm.style.left = `${((vx - BOUNDS.x) / BOUNDS.w) * 100}%`
      mm.style.top = `${((vy - BOUNDS.y) / BOUNDS.h) * 100}%`
      mm.style.width = `${(w / k / BOUNDS.w) * 100}%`
      mm.style.height = `${(h / k / BOUNDS.h) * 100}%`
    }
    const lv = levelOf(k)
    if (lv !== levelRef.current) { levelRef.current = lv; setLevel(lv) }
  }, [])

  const fly = useCallback((to: Cam, ms = 1400) => {
    cancelAnimationFrame(raf.current)
    const from = { ...cam.current }
    to = { ...to, k: clamp(to.k, minK(), MAXK) }
    if (reduced()) { cam.current = to; apply(); return }
    const t0 = performance.now()
    const dur = ms
    const step = (now: number) => {
      const u = ease(clamp((now - t0) / dur, 0, 1))
      const k = from.k * Math.pow(to.k / from.k, u)
      // weight keeps the apparent pan speed steady while zooming
      const w = Math.abs(to.k - from.k) < 1e-4 ? u : (1 / k - 1 / from.k) / (1 / to.k - 1 / from.k)
      cam.current = { k, cx: from.cx + (to.cx - from.cx) * w, cy: from.cy + (to.cy - from.cy) * w }
      apply()
      if (u < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }, [apply])

  const home = useCallback(() => fly(fitBox(BOUNDS, 0.94)), [fly, fitBox])

  const zoomAt = useCallback((sx: number, sy: number, f: number) => {
    const c = cam.current
    const { w, h } = size.current
    const wx = c.cx + (sx - w / 2) / c.k, wy = c.cy + (sy - h / 2) / c.k
    const k = clamp(c.k * f, minK(), MAXK)
    cam.current = { k, cx: wx - (sx - w / 2) / k, cy: wy - (sy - h / 2) / k }
    apply()
  }, [apply])

  // setup: size, intro, wheel, pointers, keys
  useEffect(() => {
    const el = stage.current!
    const measure = () => { size.current = { w: el.clientWidth, h: el.clientHeight }; apply() }
    measure()
    cam.current = fitBox(HERO, 0.8)
    apply()
    const intro = setTimeout(() => fly(fitBox(BOUNDS, 0.94), 3200), 1100)
    const ro = new ResizeObserver(measure)
    ro.observe(el)

    const stop = () => { cancelAnimationFrame(raf.current); clearTimeout(intro); setHint(false) }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      stop()
      const r = el.getBoundingClientRect()
      if (e.shiftKey) {
        cam.current.cx += e.deltaY / cam.current.k
        apply()
        return
      }
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0018)))
    }
    el.addEventListener("wheel", onWheel, { passive: false })

    const ptrs = new Map<number, { x: number; y: number }>()
    let dragging = false, sx = 0, sy = 0
    const down = (e: PointerEvent) => {
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (ptrs.size === 1) { sx = e.clientX; sy = e.clientY; dragging = false }
      else { dragging = true; try { el.setPointerCapture(e.pointerId) } catch { /* noop */ } }
    }
    const move = (e: PointerEvent) => {
      const p = ptrs.get(e.pointerId)
      if (!p) return
      if (ptrs.size === 1) {
        if (!dragging && Math.hypot(e.clientX - sx, e.clientY - sy) > 6) {
          dragging = true; stop()
          try { el.setPointerCapture(e.pointerId) } catch { /* noop */ }
          el.style.cursor = "grabbing"
        }
        if (dragging) {
          cam.current.cx -= (e.clientX - p.x) / cam.current.k
          cam.current.cy -= (e.clientY - p.y) / cam.current.k
          apply()
        }
        p.x = e.clientX; p.y = e.clientY
      } else if (ptrs.size === 2) {
        stop()
        const [a, b] = [...ptrs.values()]
        const d0 = Math.hypot(a.x - b.x, a.y - b.y), m0x = (a.x + b.x) / 2, m0y = (a.y + b.y) / 2
        p.x = e.clientX; p.y = e.clientY
        const d1 = Math.hypot(a.x - b.x, a.y - b.y), m1x = (a.x + b.x) / 2, m1y = (a.y + b.y) / 2
        cam.current.cx -= (m1x - m0x) / cam.current.k
        cam.current.cy -= (m1y - m0y) / cam.current.k
        const r = el.getBoundingClientRect()
        if (d0 > 0) zoomAt(m1x - r.left, m1y - r.top, d1 / d0)
      }
    }
    const up = (e: PointerEvent) => { ptrs.delete(e.pointerId); el.style.cursor = ""; if (!ptrs.size) setTimeout(() => (dragging = false), 0) }
    el.addEventListener("pointerdown", down)
    el.addEventListener("pointermove", move)
    el.addEventListener("pointerup", up)
    el.addEventListener("pointercancel", up)

    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches?.("input,textarea")) return
      const c = cam.current, { w, h } = size.current
      const pan = (dx: number, dy: number) => fly({ ...c, cx: c.cx + (dx * w) / c.k, cy: c.cy + (dy * h) / c.k }, 350)
      setHint(false)
      if (e.key === "+" || e.key === "=") fly({ ...c, k: c.k * 1.6 }, 450)
      else if (e.key === "-" || e.key === "_") fly({ ...c, k: c.k / 1.6 }, 450)
      else if (e.key === "ArrowLeft") pan(-0.3, 0)
      else if (e.key === "ArrowRight") pan(0.3, 0)
      else if (e.key === "ArrowUp") pan(0, -0.3)
      else if (e.key === "ArrowDown") pan(0, 0.3)
      else if (e.key === "Escape") home()
      else return
      e.preventDefault()
    }
    window.addEventListener("keydown", key)
    return () => {
      cancelAnimationFrame(raf.current); clearTimeout(intro); ro.disconnect()
      el.removeEventListener("wheel", onWheel)
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move)
      el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up)
      window.removeEventListener("keydown", key)
    }
  }, [apply, fly, fitBox, home, zoomAt])

  const flyItem = (it: WItem) => {
    const f = fitBox(it, 0.9)
    if (cam.current.k < f.k * 0.85 || Math.hypot(cam.current.cx - f.cx, cam.current.cy - f.cy) > it.w) fly(f)
  }

  const mmClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    fly({ ...cam.current, cx: BOUNDS.x + ((e.clientX - r.left) / r.width) * BOUNDS.w, cy: BOUNDS.y + ((e.clientY - r.top) / r.height) * BOUNDS.h }, 900)
  }
  const pct = (b: Box) => ({
    left: `${((b.x - BOUNDS.x) / BOUNDS.w) * 100}%`, top: `${((b.y - BOUNDS.y) / BOUNDS.h) * 100}%`,
    width: `${(b.w / BOUNDS.w) * 100}%`, height: `${(b.h / BOUNDS.h) * 100}%`,
  })

  const hair = "calc(var(--inv) * 1.5px)"
  return (
    <div ref={stage} className="fixed inset-0 overflow-hidden bg-void select-none cursor-grab touch-none" data-level={level}>
      <div ref={world} className="absolute left-0 top-0" style={{ transformOrigin: "0 0", width: 0, height: 0 }}>
        {/* connective tissue */}
        <svg className="absolute overflow-visible pointer-events-none" width="1" height="1">
          {CLUSTERS.map((c) => {
            const b = c.label_box
            return <line key={c.id} x1={0} y1={0} x2={b.x + 300} y2={b.y + b.h / 2} stroke="#2E3A54" strokeWidth="calc(var(--inv) * 2)" style={{ strokeWidth: `calc(var(--inv) * 2px)` }} strokeDasharray="30 30" />
          })}
        </svg>

        {/* hero */}
        <div className="absolute flex flex-col justify-center" style={{ left: HERO.x, top: HERO.y, width: HERO.w, height: HERO.h }}>
          <div className="font-mono text-[28px] text-signal mb-6">Texas A&amp;M · TwelveLabs · Bay Area</div>
          <h1 className="font-display font-extrabold uppercase text-[330px] leading-[0.82] tracking-[-0.055em] text-chalk">
            <Letters>Aahil</Letters><br /><Letters>Shaikh</Letters>
          </h1>
          <p className="font-display text-[56px] mt-10 text-chalk-2 tracking-[-0.02em]">Not another sheep in the herd.</p>
          <p className="font-mono text-[26px] mt-4 text-mute">Pull back. Everything is on the map.</p>
        </div>

        {/* cluster labels */}
        {CLUSTERS.map((c) => (
          <button
            key={c.id}
            onClick={() => fly(fitBox(clusterBox(c), 0.9))}
            aria-label={`Go to ${c.label}`}
            className="absolute text-left font-display font-extrabold uppercase text-[520px] leading-none tracking-[-0.05em] text-chalk whitespace-nowrap bg-transparent border-0 p-0 cursor-pointer"
            style={{ left: c.label_box.x, top: c.label_box.y, opacity: "var(--lab)", pointerEvents: level === 2 ? "none" : "auto", height: c.label_box.h }}
          >
            <Letters>{c.label}</Letters>
          </button>
        ))}

        {/* items */}
        {ITEMS.map((it) => (
          <div
            key={it.id}
            onClick={(e) => { if (!(e.target as HTMLElement).closest("a")) flyItem(it) }}
            className="absolute overflow-hidden bg-ink/80 hover:bg-ink-2/90 transition-colors cursor-pointer"
            style={{ left: it.x, top: it.y, width: it.w, height: it.h, border: `${hair} solid #617599` }}
          >
            <div className="absolute inset-0 p-12 flex flex-col justify-end transition-opacity duration-300" style={{ opacity: level === 1 ? 1 : 0 }}>
              <div className="font-mono text-[26px] text-signal mb-4">{it.kicker}</div>
              <div className="font-display font-extrabold uppercase text-[110px] leading-[0.92] tracking-[-0.04em]">{it.title}</div>
            </div>
            {level === 2 && <div className="absolute inset-0 p-12 overflow-hidden cursor-default animate-[fadein_.4s_ease]">{it.detail}</div>}
          </div>
        ))}
      </div>

      {/* chrome */}
      <div className="absolute left-4 top-4 font-mono text-xs text-chalk-2 pointer-events-none">AAHIL SHAIKH / CANVAS</div>
      <div className="absolute left-4 bottom-4 flex gap-2 font-mono text-sm">
        <button className="border border-edge bg-void/80 px-3 py-2 hover:text-signal" onClick={home}>Zoom out</button>
        <button className="border border-edge bg-void/80 px-3 py-2 hover:text-signal" aria-label="Zoom in" onClick={() => fly({ ...cam.current, k: cam.current.k * 1.6 }, 450)}>+</button>
        <button className="border border-edge bg-void/80 px-3 py-2 hover:text-signal" aria-label="Zoom out" onClick={() => fly({ ...cam.current, k: cam.current.k / 1.6 }, 450)}>-</button>
      </div>
      <div className="absolute right-4 bottom-4 w-[150px] sm:w-[200px] border border-edge bg-void/80 cursor-pointer" style={{ aspectRatio: `${BOUNDS.w} / ${BOUNDS.h}`, maxHeight: "34vh" }} onClick={mmClick}>
        <div className="absolute bg-chalk-2/30" style={pct(HERO)} />
        {CLUSTERS.map((c) => <div key={c.id} className="absolute bg-signal/50" style={pct(c.grid)} />)}
        <div ref={mmView} className="absolute border border-signal pointer-events-none" />
      </div>
      <div className={`absolute left-1/2 -translate-x-1/2 bottom-5 sm:bottom-6 font-mono text-xs sm:text-sm text-chalk bg-void/70 px-4 py-2 pointer-events-none transition-opacity duration-700 text-center ${hint ? "opacity-100" : "opacity-0"}`}>
        scroll or pinch to zoom · drag to pan · click anything
      </div>
    </div>
  )
}

function Letters({ children }: { children: string }) {
  return (
    <>
      {Array.from(children).map((ch, i) => (
        <span key={i} className="inline-block whitespace-pre transition-[transform,color] duration-300 hover:text-signal hover:-translate-y-[0.06em] hover:-rotate-3">{ch}</span>
      ))}
    </>
  )
}
