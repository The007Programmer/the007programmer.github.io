import { useEffect } from "react"
import { motion, useMotionValue, useMotionTemplate, useSpring } from "motion/react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

export default function CursorEffect() {
  const reduced = useReducedMotionGate()
  const x = useMotionValue(-9999)
  const y = useMotionValue(-9999)
  const springX = useSpring(x, { stiffness: 120, damping: 20, mass: 0.4 })
  const springY = useSpring(y, { stiffness: 120, damping: 20, mass: 0.4 })
  // The layer composites over text as well as background, so its alpha is
  // capped at what keeps every shipped pairing above 4.5:1 at the gradient's
  // centre — see the "under the cursor glow" cases in contrast.test.ts.
  const background = useMotionTemplate`radial-gradient(320px circle at ${springX}px ${springY}px, rgba(255,91,79,0.10), transparent 70%)`

  useEffect(() => {
    if (reduced) return
    function onMove(e: PointerEvent) {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener("pointermove", onMove)
    return () => window.removeEventListener("pointermove", onMove)
  }, [reduced, x, y])

  if (reduced) return null

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 z-[3] pointer-events-none"
      style={{ background }}
    />
  )
}
