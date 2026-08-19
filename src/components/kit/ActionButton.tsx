import { motion } from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { cn } from "@/lib/utils"
import type { ReactNode, MouseEventHandler } from "react"

export interface ActionButtonProps {
  children: ReactNode
  type?: "button" | "submit"
  onClick?: MouseEventHandler<HTMLButtonElement>
  className?: string
}

export function ActionButton({ children, type = "button", onClick, className }: ActionButtonProps) {
  const reduced = useReducedMotionGate()

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={cn(
        "font-mono text-sm uppercase tracking-wide bg-signal text-paper px-6 py-3 rounded-sm",
        className
      )}
      whileHover={reduced ? undefined : { scale: 1.03, backgroundColor: "#B5241B" }}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
    >
      {children}
    </motion.button>
  )
}
