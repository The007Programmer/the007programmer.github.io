import { useRef } from "react"
import { motion, useInView } from "motion/react"
import { LEDGER_ROWS } from "@/data/path"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

function LedgerRowItem({ row, index }: { row: (typeof LEDGER_ROWS)[number]; index: number }) {
  const ref = useRef<HTMLLIElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const reduced = useReducedMotionGate()

  return (
    <li ref={ref} className="ledger-row relative py-6 border-t border-paper/15">
      <motion.span
        aria-hidden="true"
        className="absolute top-0 left-0 h-px bg-coral origin-left"
        initial={reduced ? false : { scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.6, delay: reduced ? 0 : index * 0.06, ease: "easeOut" }}
        style={{ width: "100%" }}
      />
      <p className="ledger-when font-mono text-xs uppercase text-coral mb-1">{row.when}</p>
      <div className="ledger-what">
        <h3 className="font-display font-bold text-xl text-paper">{row.title}</h3>
        <p className="ledger-org text-paper/70 text-sm mt-1">{row.org}</p>
        {row.body && <p className="text-paper/85 mt-2">{row.body}</p>}
      </div>
    </li>
  )
}

export function Path() {
  return (
    <section id="path" className="path bg-slate py-24 px-[var(--edge,1.5rem)]">
      <div className="section-head mb-16">
        <p className="eyebrow font-mono text-[0.6875rem] uppercase tracking-wide text-paper mb-5">Path</p>
        <h2 className="section-title section-title-light font-display font-extrabold text-[clamp(2.5rem,7vw,5rem)] tracking-[-0.035em] text-paper">How it went</h2>
      </div>
      <ol className="ledger max-w-[900px] mx-auto">
        {LEDGER_ROWS.map((row, i) => (
          <LedgerRowItem key={row.id} row={row} index={i} />
        ))}
      </ol>
    </section>
  )
}
