import { useRef, type ElementType } from "react"
import { motion, useScroll, useTransform, type MotionValue } from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1])
  const y = useTransform(progress, range, [6, 0])
  return (
    <motion.span className="inline-block" style={{ opacity, y }}>
      {children}
    </motion.span>
  )
}

export interface ScrollWordsProps {
  children: string
  as?: ElementType
  className?: string
}

/**
 * Copy that lights up word by word as it scrolls through the reading line.
 * The paragraph keeps its words for assistive tech via aria-label; the visual
 * words are decorative and each one reads a slice of the same scroll progress.
 */
export function ScrollWords({ children, as: Tag = "p", className }: ScrollWordsProps) {
  const ref = useRef<HTMLElement | null>(null)
  const reduced = useReducedMotionGate()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.55"] })

  if (reduced) return <Tag className={className}>{children}</Tag>

  const words = children.split(/\s+/)
  const n = words.length
  return (
    <Tag ref={ref} className={className} aria-label={children}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true">
          <Word progress={scrollYProgress} range={[i / n, Math.min(1, (i + 1.5) / n)]}>{w}</Word>
          {i < n - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  )
}
