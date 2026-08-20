import { motion } from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { cn } from "@/lib/utils"
import type { ReactNode, MouseEventHandler } from "react"

export interface ActionButtonProps {
  children: ReactNode
  type?: "button" | "submit"
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
  /** "invert" is for a button sitting on a red ground, where a red fill would
      have no visible edge. */
  variant?: "solid" | "invert"
}

// Label colour is not a style choice here. Chalk on signal is 2.96:1 — it fails
// AA — while void on signal is 5.83:1, so a red fill takes dark type.
const SURFACE = {
  solid: { className: "bg-signal text-void font-semibold", hover: "#FF6B5F" },
  invert: { className: "bg-chalk text-void font-semibold", hover: "#FFFFFF" },
} as const

export function ActionButton({ children, type = "button", onClick, className, variant = "solid" }: ActionButtonProps) {
  const reduced = useReducedMotionGate()
  const surface = SURFACE[variant]

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={cn(
        "font-mono text-sm uppercase tracking-wide px-6 py-3 rounded-sm",
        surface.className,
        className
      )}
      whileHover={reduced ? undefined : { scale: 1.03, backgroundColor: surface.hover }}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {children}
    </motion.button>
  )
}
