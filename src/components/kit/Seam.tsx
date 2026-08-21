import { useEffect, useRef } from "react"
import { motion, useInView, useScroll, useTransform } from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { fieldAngle } from "@/lib/flowField"

/**
 * The join between two bands.
 *
 * Sections here are flat colour blocks stacked directly on each other, which put
 * a hard 1px step between every one of them — the page changed ground mid scroll
 * with no warning and nothing marked the change. A seam ramps one ground into
 * the next, and runs the hero's flow field through the gap while it does.
 *
 * The field is the point. A rule drawn across the join marks it but says nothing;
 * letting the same weather leak through every seam ties the whole page back to
 * the hero, and it is genuinely the same function sampled in the same units at
 * the seam's own place in the document — so each one is a different slice of one
 * continuous field rather than six unrelated decorations.
 */

// Kept as channel triples rather than reading the CSS custom properties: these
// have to be interpolated numerically, and getComputedStyle at render time
// would be both slower and a layout read. They must track --color-* in
// index.css — Seam.test.ts asserts they still do.
export const GROUND = {
  void: [10, 13, 19],
  ink: [17, 23, 34],
  "ink-2": [24, 32, 45],
} as const

export type Ground = keyof typeof GROUND

const STOPS = 8

/**
 * A smoothstep-eased colour ramp.
 *
 * A plain two-stop gradient between two near-blacks bands badly: across ~5rem
 * there are only a handful of representable steps and the eye locks onto the
 * even spacing as stripes. Easing the interpolation and emitting explicit stops
 * hides where each step falls, and it also makes the seam settle into the next
 * band instead of arriving at it at constant speed.
 */
export function ramp(from: Ground, to: Ground): string {
  const a = GROUND[from]
  const b = GROUND[to]
  const stops: string[] = []
  for (let i = 0; i <= STOPS; i++) {
    const t = i / STOPS
    const e = t * t * (3 - 2 * t)
    const c = a.map((v, k) => Math.round(v + (b[k] - v) * e))
    stops.push(`rgb(${c[0]}, ${c[1]}, ${c[2]}) ${(t * 100).toFixed(1)}%`)
  }
  return `linear-gradient(to bottom, ${stops.join(", ")})`
}

// ─── The field that runs through the gap ──────────────────────────────────────

/** Particles per 1000px of seam width, so a phone and a desktop look alike. */
const DENSITY = 130
/** Erased per frame. Lower than the hero's, because a seam is short and a
    stream crosses it in a handful of frames — it needs the whole crossing to
    still be on screen when it leaves. */
const FADE = 0.03
const HUE_START = 352
const HUE_RANGE = 36

interface Streak {
  x: number
  y: number
  speed: number
  hue: number
  life: number
  maxLife: number
}

function SeamField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  // once: false — a seam is passed, scrolled back over, passed again. Unlike an
  // entrance it should be running whenever it is on screen and stopped whenever
  // it is not, or six canvases burn frames off the bottom of the page.
  const live = useInView(hostRef, { once: false, margin: "80px" })

  useEffect(() => {
    if (!live) return
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio ?? 1
    let width = 0
    let height = 0
    let time = 0
    let animId = 0
    let streaks: Streak[] = []

    // Where this seam sits down the page. Feeding it into the noise means each
    // seam samples its own slice of one field instead of every one of them
    // replaying the same pattern.
    const originY = host.offsetTop

    const spawn = (): Streak => {
      const maxLife = 60 + Math.floor(Math.random() * 90)
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 0.9 + Math.random() * 1.4,
        hue: HUE_START + Math.random() * HUE_RANGE,
        life: Math.floor(Math.random() * maxLife),
        maxLife,
      }
    }

    const resize = () => {
      const rect = host.getBoundingClientRect()
      width = Math.max(1, Math.round(rect.width))
      height = Math.max(1, Math.round(rect.height))
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, width, height)
      streaks = Array.from({ length: Math.round((width / 1000) * DENSITY) }, spawn)
    }

    const render = () => {
      time++

      // Fade to transparent, not to a colour. The strip has to sit on top of the
      // CSS ramp underneath it, so the trail erases rather than painting over.
      ctx.globalCompositeOperation = "destination-out"
      ctx.fillStyle = `rgba(0, 0, 0, ${FADE})`
      ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = "source-over"

      for (const p of streaks) {
        const angle = fieldAngle(p.x, p.y + originY, time)
        p.x += Math.cos(angle) * p.speed
        p.y += Math.sin(angle) * p.speed
        p.life++

        if (p.life > p.maxLife) {
          p.x = Math.random() * width
          p.y = Math.random() * height
          p.life = 0
          continue
        }
        if (p.x < 0) p.x += width
        else if (p.x > width) p.x -= width
        if (p.y < 0) p.y += height
        else if (p.y > height) p.y -= height

        const progress = p.life / p.maxLife
        const alpha = Math.min(progress * 8, 1) * Math.min((1 - progress) * 6, 1) * 0.85

        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 92%, 62%, ${alpha})`
        ctx.fill()
      }

      animId = requestAnimationFrame(render)
    }

    resize()
    window.addEventListener("resize", resize)
    render()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener("resize", resize)
    }
  }, [live])

  return (
    <div ref={hostRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          // One radial mask rather than composited edge gradients: it fades the
          // strip out on all four sides in a single layer, so the field has no
          // hard boundary anywhere and needs no mask-composite support.
          maskImage: "radial-gradient(ellipse 62% 130% at 50% 50%, #000 15%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 62% 130% at 50% 50%, #000 15%, transparent 78%)",
        }}
      />
    </div>
  )
}

// ─── Seam ─────────────────────────────────────────────────────────────────────

export interface SeamProps {
  from: Ground
  to: Ground
}

const HEIGHT = "clamp(6rem, 13vh, 10rem)"

export function Seam({ from, to }: SeamProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const reduced = useReducedMotionGate()

  // Scroll-linked rather than triggered: an entrance fires once and is over, but
  // a join wants to arrive as you reach it and leave as you pass it, so the
  // effect is tied to where the seam sits in the viewport.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], reduced ? [1, 1, 1] : [0, 1, 0])
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], reduced ? [0.5, 0.5, 0.5] : [0, 0.5, 0])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative w-full overflow-hidden"
      style={{ height: HEIGHT, background: ramp(from, to) }}
    >
      {/* A wash of the accent under the field, so the join carries a colour even
          on the seam whose two grounds are identical and whose ramp is flat. */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: glow,
          background:
            "radial-gradient(ellipse 55% 150% at 50% 50%, rgba(255,91,79,0.16), transparent 72%)",
        }}
      />
      {!reduced && (
        <motion.div className="absolute inset-0" style={{ opacity }}>
          <SeamField />
        </motion.div>
      )}
    </div>
  )
}
