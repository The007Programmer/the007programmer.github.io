import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { cn } from "@/lib/utils"

/** Wrap v into [min, max). */
const wrap = (min: number, max: number, v: number) => {
  const range = max - min
  return ((((v - min) % range) + range) % range) + min
}

export interface VelocityMarqueeProps {
  words: string[]
  /** Percent of one copy per second at rest. Negative runs right. */
  speed?: number
  /** "outline" strokes the glyphs; "fill" paints them. */
  variant?: "outline" | "fill"
  /** The ground the band sits on: outlined glyphs are filled with it so the
      font's overlapping contours do not show through as inner lines. */
  ground?: "void" | "ink"
  className?: string
}

/**
 * A band of display type that drifts on its own and is shoved by the scroll.
 * Scroll speed adds to the drift (and flips it when you scroll up), and the
 * whole band skews into the direction of travel. Everything is a motion value
 * written from one animation frame callback, so React never re-renders.
 */
export function VelocityMarquee({ words, speed = -4, variant = "outline", ground = "void", className }: VelocityMarqueeProps) {
  const reduced = useReducedMotionGate()
  const base = useMotionValue(0)
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 })
  const push = useTransform(smooth, [-2500, 0, 2500], [-9, 0, 9], { clamp: false })
  const skewX = useTransform(smooth, [-2500, 2500], [10, -10], { clamp: true })

  useAnimationFrame((_, delta) => {
    if (reduced) return
    // Scrolling the way the band already travels speeds it up; scrolling back
    // pushes it through zero and reverses it.
    const move = (speed + push.get() * Math.sign(speed || -1)) * (delta / 1000)
    base.set(wrap(-25, 0, base.get() + move))
  })

  const x = useTransform(base, (v) => `${v}%`)
  const run = words.join(" ")

  const copy = (key: number) => (
    <span key={key} className="flex shrink-0 items-center gap-[0.35em] pr-[0.35em]" aria-hidden="true">
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="flex items-center gap-[0.35em]">
          <span>{w}</span>
          <span className="text-signal text-[0.55em]">{"✶"}</span>
        </span>
      ))}
    </span>
  )

  return (
    <div
      role="presentation"
      title={run}
      style={{ ["--ground" as string]: `var(--color-${ground})` }}
      className={cn("marquee overflow-hidden select-none py-4 leading-none", className)}
    >
      <motion.div
        aria-hidden="true"
        className={cn(
          "flex w-max whitespace-nowrap font-display font-extrabold uppercase tracking-[-0.04em]",
          "text-[clamp(4rem,13vw,11rem)]",
          variant === "outline" ? "marquee-outline" : "text-chalk"
        )}
        style={reduced ? undefined : { x, skewX }}
      >
        {[0, 1, 2, 3].map(copy)}
      </motion.div>
    </div>
  )
}
