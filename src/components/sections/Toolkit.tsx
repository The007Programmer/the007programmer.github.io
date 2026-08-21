import { motion } from "motion/react"
import { TOOLKIT_GROUPS } from "@/data/toolkit"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { cn } from "@/lib/utils"
import { Reveal, Stagger, StaggerItem } from "@/components/kit/Reveal"
import { SplitReveal } from "@/components/kit/SplitReveal"

// The data stores each group as one "·"-joined run of text. Rendering it that
// way made the section a wall of grey prose with nothing to look at and nothing
// to animate; the items were always a list, they were just written as a
// sentence. Split here rather than in the data so the source stays readable.
function itemsOf(run: string): string[] {
  return run.split("·").map((s) => s.trim()).filter(Boolean)
}

export function Toolkit() {
  const reduced = useReducedMotionGate()

  return (
    <section id="toolkit" className="toolkit py-28 px-[var(--edge,1.5rem)]">
      <div className="max-w-[1340px] mx-auto">
      <div className="section-head mb-14">
        <Reveal>
          <p className="eyebrow eyebrow-dark font-mono text-[0.6875rem] uppercase tracking-wide text-signal mb-5">Toolkit</p>
        </Reveal>
        <SplitReveal
          as="h2"
          delay={0.08}
          className="section-title font-display font-extrabold text-[clamp(2.5rem,7vw,5rem)] tracking-[-0.035em] text-chalk"
        >
          What I reach for
        </SplitReveal>
      </div>
      <Stagger className="kit grid gap-8 sm:grid-cols-2 lg:grid-cols-3" gap={0.06}>
        {TOOLKIT_GROUPS.map((group) => (
          <StaggerItem
            key={group.id}
            className={cn(
              "kit-group border rounded-sm p-7",
              group.accent ? "border-signal/50 bg-ink-2" : "border-line"
            )}
            whileHover={reduced ? undefined : { y: -4, borderColor: "#FF5B4F" }}
          >
            <h3 className="kit-title font-display font-bold text-lg text-chalk mb-4">{group.title}</h3>
            {/* Each item arrives on its own beat. The stagger is per group, not
                per section, so the delay never runs away on the long lists. */}
            <ul className="kit-items flex flex-wrap gap-2">
              {itemsOf(group.items).map((item, i) => (
                <motion.li
                  key={item}
                  className="font-mono text-[0.6875rem] uppercase tracking-wide rounded-sm border border-line/70 bg-void/60 px-2 py-1 text-chalk-2"
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.035 }}
                  whileHover={reduced ? undefined : { y: -2, borderColor: "#FF5B4F", color: "#FF8F79" }}
                >
                  {item}
                </motion.li>
              ))}
            </ul>
          </StaggerItem>
        ))}
      </Stagger>
      </div>
    </section>
  )
}
