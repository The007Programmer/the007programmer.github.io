
/**
 * The join between two bands.
 *
 * Sections here are flat colour blocks stacked directly on each other, which put
 * a hard 1px step between every one of them — the page changed ground mid scroll
 * with no warning. This ramps one ground into the next, and that is all it does.
 *
 * It used to carry the section transition too: first a rule, then a strip of the
 * hero's flow field, then a light sweeping across. Every one of them looked
 * wrong, and they were all the same mistake — putting the transition in the gap
 * between sections, which is the one part of the page with nothing in it. A
 * glowing smudge in dead space is not an arrival. The transition lives in the
 * heading you are arriving at now; see SplitReveal. This just removes the step.
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

const HEIGHT = "clamp(2.5rem, 5vh, 4rem)"

export function Seam({ from, to }: SeamProps) {
  return (
    <div
      aria-hidden="true"
      className="w-full"
      style={{ height: HEIGHT, background: ramp(from, to) }}
    />
  )
}
