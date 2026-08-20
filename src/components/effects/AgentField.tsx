import { useEffect, useRef } from "react"
import { createField, readBands, readRepulsors, colourAt } from "@/lib/agentField"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

// One agent per this much document area, so a tall page carries a proportionate
// population instead of the same handful of dots smeared over ten screens.
const AREA_PER_AGENT = 12000
const AGENT_CAP = 900
const AGENT_RADIUS = 2.2
// Unlinked dots read as dust — random specks over the copy. The links are what
// make the layer legible as a *field*: agents that found each other. Only close
// pairs link, so the structure appears and dissolves as flocks form and break.
const LINK_DIST = 110
const CULL = 60

function docHeight(): number {
  const d = document.documentElement
  return Math.max(d.scrollHeight, d.offsetHeight, window.innerHeight)
}

function agentCount(w: number, h: number): number {
  // Constant density per pixel leaves a phone nearly bare: a narrow column shows
  // far less area per screen, and most of what it does show is text the agents
  // are pushed out of. Tighten the spacing as the viewport narrows so a screen
  // still carries a legible number of them.
  const density = AREA_PER_AGENT * Math.max(0.45, Math.min(1, w / 1440))
  return Math.min(AGENT_CAP, Math.max(60, Math.round((w * h) / density)))
}

export default function AgentField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reduced = useReducedMotionGate()

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let width = window.innerWidth
    let height = window.innerHeight
    let fieldH = docHeight()
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    function sizeCanvas() {
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      // setTransform, not scale: scale() compounds, so every resize used to
      // multiply the DPR in again and shrink the drawing.
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    sizeCanvas()

    const field = createField({
      w: width,
      h: fieldH,
      n: agentCount(width, fieldH),
      seed: 7,
    })
    field.setRepulsors(readRepulsors())
    // Dev-only handle: the field has no DOM to assert against, so browser
    // checks need a way to read agent positions in document space.
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__agentField = field

    let raf = 0
    let last = performance.now()
    let layoutClock = 0
    let bands = readBands()
    // The canvas is fixed to the viewport but the simulation runs in document
    // space, so the draw pass subtracts the scroll offset. That is what makes
    // the field belong to the page: scroll down and the dots travel up and out
    // of frame, and fresh ones arrive from below.
    let scrollY = window.scrollY

    function onScroll() {
      scrollY = window.scrollY
    }
    window.addEventListener("scroll", onScroll, { passive: true })

    function remeasure() {
      fieldH = docHeight()
      field.setBounds(width, fieldH, agentCount(width, fieldH))
      field.setRepulsors(readRepulsors(), false)
      bands = readBands()
      scrollY = window.scrollY
    }

    function onResize() {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      sizeCanvas()
      remeasure()
    }
    window.addEventListener("resize", onResize)

    function frame(now: number) {
      const dt = Math.min(now - last, 48)
      last = now
      layoutClock += dt

      // Repulsors and bands are document-space now, so scrolling no longer
      // invalidates them — only real layout changes do (fonts settling, a
      // section revealing, a card being reordered). Hence the slow cadence.
      if (layoutClock > 400) {
        layoutClock = 0
        remeasure()
      }

      field.step(dt)

      ctx!.clearRect(0, 0, width, height)

      const top = scrollY - CULL
      const bottom = scrollY + height + CULL
      const visible = field.agents.filter((a) => a.y >= top && a.y <= bottom)

      for (let i = 0; i < visible.length; i++) {
        const a = visible[i]
        for (let j = i + 1; j < visible.length; j++) {
          const b = visible[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 > LINK_DIST * LINK_DIST) continue
          const closeness = 1 - Math.sqrt(d2) / LINK_DIST
          ctx!.strokeStyle = colourAt(bands, (a.y + b.y) / 2)
          ctx!.globalAlpha = closeness * 0.34 * Math.min(a.trust + b.trust, 1)
          ctx!.lineWidth = 1
          ctx!.beginPath()
          ctx!.moveTo(a.x, a.y - scrollY)
          ctx!.lineTo(b.x, b.y - scrollY)
          ctx!.stroke()
        }
      }

      for (const a of visible) {
        ctx!.fillStyle = colourAt(bands, a.y)
        ctx!.globalAlpha = 0.42 + a.trust * 0.38
        ctx!.beginPath()
        ctx!.arc(a.x, a.y - scrollY, AGENT_RADIUS, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onScroll)
    }
  }, [reduced])

  if (reduced) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      // Above <main> (z-2), not below it: every section that paints its own
      // background — hero, timeline, tally, path, contact — hid the field
      // entirely, so it only ever showed through the two sections that inherit
      // the body colour. Sitting above is safe because text is a repulsor in
      // the sim: no agent occupies a pixel a glyph is using.
      className="fixed inset-0 z-[3] pointer-events-none"
    />
  )
}
