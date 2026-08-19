import { useReducedMotion } from "motion/react"

/** The single place site-wide reduced-motion policy lives. Every
 *  Motion-driven component calls this instead of useReducedMotion()
 *  directly, so the policy can change in one place if it ever needs to. */
export function useReducedMotionGate(): boolean {
  return useReducedMotion() ?? false
}
