import { useRef } from "react"
import { motion, useInView } from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

/**
 * The join between two bands.
 *
 * Sections here are flat colour blocks stacked directly on each other, which
 * put a hard 1px step between every one of them — the page changed ground mid
 * scroll with no warning and nothing marked the change. A seam does two jobs:
 * it ramps one ground into the next so the step disappears, and it draws a rule
 * as it enters view so the change is an event rather than an accident.
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

export interface SeamProps {
  from: Ground
  to: Ground
  /** Hide the rule where a seam is only doing colour work. */
  rule?: boolean
}

const HEIGHT = "clamp(3rem, 6vh, 5rem)"

export function Seam({ from, to, rule = true }: SeamProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const reduced = useReducedMotionGate()
  // No -12% margin here: unlike an entrance, a seam that fires early is worse
  // than one that fires late — the rule should draw as the join reaches the
  // eye, not before it is on screen.
  const inView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" })

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative w-full"
      style={{ height: HEIGHT, background: ramp(from, to) }}
    >
      {rule && (
        <motion.div
          className="absolute inset-x-0 top-1/2 h-px origin-left"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(255,91,79,0.55) 22%, rgba(255,91,79,0.55) 78%, transparent)",
          }}
          initial={reduced ? false : { scaleX: 0, opacity: 0 }}
          animate={inView || reduced ? { scaleX: 1, opacity: 1 } : undefined}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        />
      )}
    </div>
  )
}
