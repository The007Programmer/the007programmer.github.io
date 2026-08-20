import { motion } from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { cn } from "@/lib/utils"
import type { ReactNode, MouseEventHandler } from "react"

export interface ActionButtonProps {
  children: ReactNode
  type?: "button" | "submit"
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
  /** "invert" is for buttons sitting on a red ground. The solid red button on
      the ember contact panel was 1.13:1 against it — no visible edge at all —
      and its hover colour was that panel's exact background, so pointing at it
      erased it. */
  variant?: "solid" | "invert"
}

const SURFACE = {
  solid: { className: "bg-signal text-paper", hover: "#B5241B" },
  invert: { className: "bg-paper text-ember", hover: "#FFE4DC" },
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
