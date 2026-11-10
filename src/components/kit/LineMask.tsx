import { useEffect, useRef, type ElementType } from "react"
import { animate, splitText, stagger } from "animejs"
import { useInView } from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

export interface LineMaskProps {
  children: string
  as?: ElementType
  className?: string
  delay?: number
}

/**
 * Paragraph reveal by line: every rendered line gets its own clip box and
 * rises out of it. Waits for the real font so the line breaks it measures are
 * the ones the reader sees.
 */
export function LineMask({ children, as: Tag = "p", className, delay = 0 }: LineMaskProps) {
  const ref = useRef<HTMLElement | null>(null)
  const reduced = useReducedMotionGate()
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (reduced || !inView) return
    const el = ref.current
    if (!el) return
    let cancelled = false
    let cleanup = () => {}
    const run = () => {
      if (cancelled) return
      const split = splitText(el, { lines: { wrap: "clip" }, words: false, chars: false, accessible: true })
      const anim = animate(split.lines, {
        y: ["110%", "0%"],
        duration: 900,
        delay: stagger(110, { start: delay * 1000 }),
        ease: "out(4)",
      })
      cleanup = () => { anim.revert(); split.revert() }
    }
    if (document.fonts?.ready) document.fonts.ready.then(run)
    else run()
    return () => { cancelled = true; cleanup() }
  }, [inView, reduced, delay, children])

  return <Tag ref={ref} className={className}>{children}</Tag>
}
