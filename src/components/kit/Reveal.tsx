import { useRef, type ReactNode, type ElementType } from "react"
import { motion, useInView } from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

interface RevealProps {
  children: ReactNode
  /** Seconds of delay, for staggering siblings. */
  delay?: number
  /** How far it travels on the way in. */
  y?: number
  as?: ElementType
  className?: string
  /** Anything else lands on the rendered element — a form still needs its
      action and method to survive being wrapped. */
  [key: string]: unknown
}

/**
 * Staggered spring entrance, gated on the element actually coming into view.
 * One place to change how the whole site enters, rather than each section
 * hand-rolling its own useInView.
 */
export function Reveal({ children, delay = 0, y = 18, as = "div", className, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.25 })
  const reduced = useReducedMotionGate()
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div

  return (
    <MotionTag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      animate={inView || reduced ? { opacity: 1, y: 0 } : {}}
      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20, delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}
