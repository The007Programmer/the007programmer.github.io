import { useEffect, useRef, type ElementType } from "react"
import { animate, splitText, stagger } from "animejs"
import { useInView } from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

/**
 * A heading that arrives one character at a time.
 *
 * This is the site's section transition. The joins between bands were carrying
 * that job with decoration — a rule, then a strip of the hero's field, then a
 * glow — and all three were the same mistake: putting the transition in the gap
 * between sections, where there is nothing to look at, instead of in the thing
 * you are arriving at.
 *
 * anime.js rather than Motion for this one. Motion animates elements; it has no
 * opinion about text, so per-character work means hand-splitting the string and
 * shipping a heading built out of dozens of spans in the markup. `splitText`
 * does the split at runtime, keeps the original string as the accessible name,
 * and puts it back on revert — so what ships in the HTML is still a heading with
 * words in it.
 */

export interface SplitRevealProps {
  children: string
  as?: ElementType
  className?: string
  /** Seconds before the first character moves. */
  delay?: number
}

export function SplitReveal({ children, as: Tag = "h2", className, delay = 0 }: SplitRevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const reduced = useReducedMotionGate()
  const inView = useInView(ref, { once: true, margin: "0px 0px -14% 0px" })

  useEffect(() => {
    if (reduced || !inView) return
    const el = ref.current
    if (!el) return

    // `wrap: "clip"` gives every character its own overflow box, which is what
    // lets them rise out from behind their own baseline rather than fading in
    // place. `accessible` leaves the whole string on the element as its label,
    // so a screen reader still reads a heading and not a pile of letters.
    const split = splitText(el, {
      chars: { wrap: "clip" },
      words: false,
      accessible: true,
    })

    const animation = animate(split.chars, {
      y: ["115%", "0%"],
      opacity: [0, 1],
      duration: 850,
      delay: stagger(24, { start: delay * 1000 }),
      ease: "out(3)",
    })

    return () => {
      animation.revert()
      split.revert()
    }
  }, [inView, reduced, delay, children])

  // Rendered as plain text. The split happens after mount and is reverted on
  // unmount, so the shipped markup — and anything that reads it without running
  // scripts — sees the heading, not the machinery.
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
