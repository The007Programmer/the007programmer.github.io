import { useRef } from "react"
import { motion, useScroll, useTransform } from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

/**
 * The join between two bands.
 *
 * Sections here are flat colour blocks stacked directly on each other, which put
 * a hard 1px step between every one of them — the page changed ground mid scroll
 * with no warning and nothing marked the change. A seam ramps one ground into
 * the next and sweeps a light across the join as you pass it.
 *
 * It ran the hero's flow field through the gap first. That was wrong twice over:
 * it made the hero stop being the one place the field lives, and immediately
 * below the hero it looked broken — the field faded out at the foot of the hero
 * and then abruptly started again a hundred pixels lower, with a hard edge
 * between. The field is the hero's. Everything below it gets light instead.
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

  // Driven as background-position rather than a translated element, because the
  // sweep has to travel the seam's full width and nothing here knows what that
  // width is — a percentage offset resolves against the box at paint time.
  const sweep = useTransform(scrollYProgress, [0, 1], ["-25%", "125%"])
  const glow = useTransform(
    scrollYProgress,
    [0, 0.28, 0.5, 0.72, 1],
    reduced ? [0.55, 0.55, 0.55, 0.55, 0.55] : [0, 0.85, 1, 0.85, 0]
  )

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative w-full overflow-hidden"
      style={{ height: HEIGHT, background: ramp(from, to) }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: glow,
          backgroundImage:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(255,91,79,0.34), rgba(255,143,121,0.10) 45%, transparent 72%)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "62% 210%",
          backgroundPositionY: "center",
          backgroundPositionX: reduced ? "50%" : sweep,
          filter: "blur(14px)",
        }}
      />
    </div>
  )
}
