import { motion } from "motion/react"
import { TOOLKIT_GROUPS } from "@/data/toolkit"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { cn } from "@/lib/utils"

export function Toolkit() {
  const reduced = useReducedMotionGate()

  return (
    <section id="toolkit" className="toolkit py-24 px-[var(--edge,1.5rem)]">
      <div className="section-head mb-16">
        <p className="eyebrow eyebrow-dark font-mono text-[0.6875rem] uppercase tracking-wide text-ember mb-5">Toolkit</p>
        <h2 className="section-title font-display font-extrabold text-[clamp(2.5rem,7vw,5rem)] tracking-[-0.035em] text-slate">What I reach for</h2>
      </div>
      <div className="kit grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLKIT_GROUPS.map((group) => (
          <motion.div
            key={group.id}
            className={cn(
              "kit-group border rounded-sm p-6",
              group.accent ? "border-signal/40 bg-paper-2" : "border-slate/10"
            )}
            whileHover={reduced ? undefined : { y: -3, borderColor: "#C4261E" }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
          >
            <h3 className="kit-title font-display font-bold text-lg text-slate mb-2">{group.title}</h3>
            <p className="kit-items text-slate-2">{group.items}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
