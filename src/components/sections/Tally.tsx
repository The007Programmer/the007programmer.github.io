import { useRef, useEffect } from "react"
import { motion, useInView, useMotionValue, useTransform, animate } from "motion/react"
import { useLiveRepoCount } from "@/hooks/useLiveRepoCount"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { Reveal } from "@/components/kit/Reveal"
import { ShippingChart } from "./ShippingChart"

function CountUp({ to, decimals = 0, inView, reduced }: { to: number; decimals?: number; inView: boolean; reduced: boolean }) {
  const value = useMotionValue(reduced ? to : 0)
  const rounded = useTransform(value, (v) => v.toFixed(decimals))

  useEffect(() => {
    if (reduced || !inView) return
    const controls = animate(value, to, { duration: 1.4, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [inView, to, reduced, value])

  return <motion.span>{rounded}</motion.span>
}

const ITEMS = [
  { label: "public repositories", note: "My own, not my employer’s. clair installs from a Homebrew tap, UFW Manager from my Ubuntu PPA." },
  { label: "writeups, my byline", note: "SAGE and Recurser, on the TwelveLabs engineering blog." },
  { label: "GPA at Texas A&M", note: "Sophomore, College Station." },
]

export function Tally() {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" })
  const reduced = useReducedMotionGate()
  const repos = useLiveRepoCount(15)
  const values = [
    { to: repos, decimals: 0 },
    { to: 2, decimals: 0 },
    { to: 4.0, decimals: 1 },
  ]

  return (
    <section className="tally py-24 px-[var(--edge,1.5rem)] bg-ink-2" aria-label="By the numbers">
      <div ref={ref} className="tally-inner grid gap-10 sm:grid-cols-3 max-w-[900px] mx-auto text-center">
        {/* Each item observes itself and carries its own delay. An orchestrating
            wrapper would have to be display:contents to stay out of the grid,
            and an element with no box never intersects — IntersectionObserver
            never fires on it, so the whole section stayed at opacity 0. */}
        {ITEMS.map((item, i) => (
          <Reveal key={item.label} className="tally-item" delay={i * 0.12} y={26}>
            <p className="tally-num font-display font-extrabold text-5xl text-signal tabular-nums">
              <CountUp to={values[i].to} decimals={values[i].decimals} inView={inView} reduced={reduced} />
            </p>
            <p className="tally-label font-mono text-xs uppercase mt-2">{item.label}</p>
            <p className="tally-note text-mute text-sm mt-2">{item.note}</p>
          </Reveal>
        ))}
      </div>

      {/* Three counters say how much. The chart says when, off the same facts
          the trajectory figure is drawn from — one dataset, two views, no
          second list to forget to update. */}
      <Reveal className="block mt-20 max-w-[1340px] mx-auto" delay={0.1} y={26}>
        <p className="font-mono text-[0.6875rem] uppercase tracking-wide text-coral mb-1">
          Cumulative, by month
        </p>
        <p className="text-chalk-2 mb-6 max-w-[52ch]">
          Everything above came out of a job or a weekend. This is the running total.
        </p>
        <ShippingChart />
      </Reveal>
    </section>
  )
}
