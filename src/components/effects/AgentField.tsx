import { useEffect, useRef } from "react"
import { createField, readBands, readRepulsors, colourAt } from "@/lib/agentField"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

const AGENT_COUNT = 120
const AGENT_RADIUS = 2.2
// Unlinked dots read as dust — random specks over the copy. The links are what
// make the layer legible as a *field*: agents that found each other. Only close
// pairs link, so the structure appears and dissolves as flocks form and break.
const LINK_DIST = 110

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
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    const field = createField({ w: width, h: height, n: AGENT_COUNT, seed: 7 })
    field.setRepulsors(readRepulsors())

    let raf = 0
    let last = performance.now()
    let bandRefreshClock = 0
    let bands = readBands()

    function onResize() {
      width = window.innerWidth
      height = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = width * dpr
      canvas!.height = height * dpr
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      ctx!.scale(dpr, dpr)
      field.setRepulsors(readRepulsors())
      bands = readBands()
    }
    window.addEventListener("resize", onResize)

    function frame(now: number) {
      const dt = Math.min(now - last, 48)
      last = now
      bandRefreshClock += dt

      // Layout only changes on scroll/resize; re-reading every 250ms
      // keeps repulsors and band colours correct without doing a
      // getBoundingClientRect pass on every frame.
      if (bandRefreshClock > 250) {
        bandRefreshClock = 0
        field.setRepulsors(readRepulsors())
        // readBands() forces a synchronous layout; doing it per frame stalled
        // the loop and made the drift stutter. It changes with the same
        // scroll/resize events the repulsors do, so it refreshes with them.
        bands = readBands()
      }

      field.step(dt)

      ctx!.clearRect(0, 0, width, height)

      const agents = field.agents
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i]
        for (let j = i + 1; j < agents.length; j++) {
          const b = agents[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 > LINK_DIST * LINK_DIST) continue
          const closeness = 1 - Math.sqrt(d2) / LINK_DIST
          ctx!.strokeStyle = colourAt(bands, (a.y + b.y) / 2)
          ctx!.globalAlpha = closeness * 0.34 * Math.min(a.trust + b.trust, 1)
          ctx!.lineWidth = 1
          ctx!.beginPath()
          ctx!.moveTo(a.x, a.y)
          ctx!.lineTo(b.x, b.y)
          ctx!.stroke()
        }
      }

      for (const a of agents) {
        ctx!.fillStyle = colourAt(bands, a.y)
        ctx!.globalAlpha = 0.42 + a.trust * 0.38
        ctx!.beginPath()
        ctx!.arc(a.x, a.y, AGENT_RADIUS, 0, Math.PI * 2)
        ctx!.fill()
      }
      ctx!.globalAlpha = 1

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", onResize)
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
