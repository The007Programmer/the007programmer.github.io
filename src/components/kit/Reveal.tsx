import { useEffect, useRef, useState, type ReactNode, type ElementType } from "react"
import { motion, useInView, type Variants } from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

// Triggering on a fraction of the element is wrong for full-width blocks: a
// section that is taller than the viewport can never show 25% of itself, so its
// entrance fired late or not at all. Trigger on the top edge crossing 88% of the
// viewport instead, which is where the eye actually lands.
const IN_VIEW = { once: true, margin: "0px 0px -12% 0px" } as const

// Pulling the root's bottom edge up by 12% is what stops entrances from playing
// half off-screen — but it also makes the last 12% of a viewport-height of the
// document unreachable. Anything living there (the footer does, exactly) can
// never intersect and stays at opacity 0 forever. So the gate is "in view, OR
// the reader has hit the end of the page". One shared listener serves every
// instance rather than each of ~30 reveals attaching its own.
let documentEnded = false
const endSubscribers = new Set<() => void>()

function checkDocumentEnd() {
  if (documentEnded) return
  const d = document.documentElement
  if (window.innerHeight + window.scrollY < d.scrollHeight - 2) return
  documentEnded = true
  endSubscribers.forEach((fn) => fn())
}

function useDocumentEnd(): boolean {
  const [ended, setEnded] = useState(documentEnded)
  useEffect(() => {
    if (documentEnded) { setEnded(true); return }
    const fn = () => setEnded(true)
    endSubscribers.add(fn)
    if (endSubscribers.size === 1) window.addEventListener("scroll", checkDocumentEnd, { passive: true })
    checkDocumentEnd()
    return () => {
      endSubscribers.delete(fn)
      if (!endSubscribers.size) window.removeEventListener("scroll", checkDocumentEnd)
    }
  }, [])
  return ended
}
const SPRING = { type: "spring", stiffness: 120, damping: 20 } as const
const EASE_OUT = [0.16, 1, 0.3, 1] as const

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
  const observed = useInView(ref, IN_VIEW)
  const ended = useDocumentEnd()
  const inView = observed || ended
  const reduced = useReducedMotionGate()
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div

  return (
    <MotionTag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      animate={inView || reduced ? { opacity: 1, y: 0 } : {}}
      transition={reduced ? { duration: 0 } : { ...SPRING, delay }}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}

interface StaggerProps {
  children: ReactNode
  /** Seconds between each child. */
  gap?: number
  delay?: number
  as?: ElementType
  className?: string
  [key: string]: unknown
}

/**
 * Parent half of a list entrance. Children marked with <StaggerItem> inherit
 * the run through variant propagation, so the cadence lives in one place
 * instead of every item carrying a hand-computed delay.
 */
export function Stagger({ children, gap = 0.07, delay = 0, as = "div", className, ...rest }: StaggerProps) {
  const ref = useRef<HTMLElement | null>(null)
  const observed = useInView(ref, IN_VIEW)
  const ended = useDocumentEnd()
  const inView = observed || ended
  const reduced = useReducedMotionGate()
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div

  const variants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : gap, delayChildren: reduced ? 0 : delay } },
  }

  return (
    <MotionTag
      ref={ref as React.RefObject<HTMLDivElement>}
      className={className}
      variants={variants}
      initial={reduced ? false : "hidden"}
      animate={inView || reduced ? "show" : "hidden"}
      {...rest}
    >
      {children}
    </MotionTag>
  )
}

interface StaggerItemProps {
  children: ReactNode
  y?: number
  as?: ElementType
  className?: string
  [key: string]: unknown
}

export function StaggerItem({ children, y = 22, as = "div", className, ...rest }: StaggerItemProps) {
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div
  const variants: Variants = {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: SPRING },
  }
  return (
    <MotionTag className={className} variants={variants} {...rest}>
      {children}
    </MotionTag>
  )
}

interface RiseTextProps {
  children: ReactNode
  as?: ElementType
  className?: string
  delay?: number
}

/**
 * A line of type that rises out of its own baseline behind a mask. Fading a
 * headline in is a slide with the volume off — the clip is what makes it read
 * as type being set. The mask needs bottom padding or it shears descenders,
 * and the matching negative margin keeps the extra space out of the layout.
 */
export function RiseText({ children, as = "span", className, delay = 0 }: RiseTextProps) {
  const ref = useRef<HTMLElement | null>(null)
  const observed = useInView(ref, IN_VIEW)
  const ended = useDocumentEnd()
  const inView = observed || ended
  const reduced = useReducedMotionGate()
  const Tag = as as ElementType

  return (
    <Tag ref={ref} className={className}>
      <span className="block overflow-hidden pb-[0.14em] -mb-[0.14em]">
        <motion.span
          className="block"
          initial={reduced ? false : { y: "115%" }}
          animate={inView || reduced ? { y: "0%" } : {}}
          transition={reduced ? { duration: 0 } : { duration: 0.8, ease: EASE_OUT, delay }}
        >
          {children}
        </motion.span>
      </span>
    </Tag>
  )
}
