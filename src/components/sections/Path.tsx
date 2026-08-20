import { useRef } from "react"
import { motion, useInView } from "motion/react"
import { LEDGER_ROWS } from "@/data/path"
import { Reveal, RiseText } from "@/components/kit/Reveal"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

function LedgerRowItem({ row, index }: { row: (typeof LEDGER_ROWS)[number]; index: number }) {
  const ref = useRef<HTMLLIElement | null>(null)
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" })
  const reduced = useReducedMotionGate()
  // The rule draws itself first and the row rides in behind it, so the ledger
  // reads as being ruled and then filled rather than fading in as a block.
  const lead = reduced ? 0 : index * 0.05

  return (
    <li ref={ref} className="ledger-row relative py-6 border-t border-paper/15">
      <motion.span
        aria-hidden="true"
        className="absolute top-0 left-0 h-px bg-coral origin-left"
        initial={reduced ? false : { scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.6, delay: lead, ease: "easeOut" }}
        style={{ width: "100%" }}
      />
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={inView || reduced ? { opacity: 1, y: 0 } : {}}
        transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 130, damping: 21, delay: lead + 0.12 }}
      >
        <p className="ledger-when font-mono text-xs uppercase text-coral mb-1">{row.when}</p>
        <div className="ledger-what">
          <h3 className="font-display font-bold text-xl text-paper">{row.title}</h3>
          <p className="ledger-org text-paper/70 text-sm mt-1">{row.org}</p>
          {row.body && <p className="text-paper/85 mt-2">{row.body}</p>}
        </div>
      </motion.div>
    </li>
  )
}

export function Path() {
  return (
    <section id="path" className="path bg-slate text-paper py-20 px-[var(--edge,1.5rem)]">
      {/* Heading and ledger share one container: centring the list under a
          full-bleed heading left a dead column down the whole section. */}
      <div className="max-w-[1100px] mx-auto">
        <div className="section-head mb-10">
          <Reveal>
            <p className="eyebrow font-mono text-[0.6875rem] uppercase tracking-wide text-paper mb-5">Path</p>
          </Reveal>
          <RiseText
            as="h2"
            delay={0.08}
            className="section-title section-title-light font-display font-extrabold text-[clamp(2.5rem,7vw,5rem)] tracking-[-0.035em] text-paper"
          >
            How it went
          </RiseText>
        </div>
        <ol className="ledger">
          {LEDGER_ROWS.map((row, i) => (
            <LedgerRowItem key={row.id} row={row} index={i} />
          ))}
        </ol>
      </div>
    </section>
  )
}
