import { useEffect, useRef } from "react"
import { createField, readBands, readRepulsors, colourAt } from "@/lib/agentField"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

const AGENT_COUNT = 70
const AGENT_RADIUS = 1.5
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
      }

      field.step(dt)
      const bands = readBands()

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
          ctx!.globalAlpha = closeness * 0.22 * Math.min(a.trust + b.trust, 1)
          ctx!.lineWidth = 1
          ctx!.beginPath()
          ctx!.moveTo(a.x, a.y)
          ctx!.lineTo(b.x, b.y)
          ctx!.stroke()
        }
      }

      for (const a of agents) {
        ctx!.fillStyle = colourAt(bands, a.y)
        ctx!.globalAlpha = 0.28 + a.trust * 0.32
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
      className="fixed inset-0 z-[1] pointer-events-none"
    />
  )
}
