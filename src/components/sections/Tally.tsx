import { useRef, useEffect } from "react"
import { motion, useInView, useMotionValue, useTransform, animate } from "motion/react"
import { useLiveRepoCount } from "@/hooks/useLiveRepoCount"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

function CountUp({ to, decimals = 0, inView, reduced }: { to: number; decimals?: number; inView: boolean; reduced: boolean }) {
  const value = useMotionValue(reduced ? to : 0)
  const rounded = useTransform(value, (v) => v.toFixed(decimals))

  useEffect(() => {
    if (reduced || !inView) return
    const controls = animate(value, to, { duration: 1.1, ease: "easeOut" })
    return () => controls.stop()
  }, [inView, to, reduced, value])

  return <motion.span>{rounded}</motion.span>
}

export function Tally() {
  const ref = useRef<HTMLDivElement | null>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const reduced = useReducedMotionGate()
  const repos = useLiveRepoCount(15)

  return (
    <section className="tally py-20 px-[var(--edge,1.5rem)] bg-paper-2" aria-label="By the numbers">
      <div ref={ref} className="tally-inner grid gap-10 sm:grid-cols-3 max-w-[1000px] mx-auto text-center">
        <div className="tally-item">
          <p className="tally-num font-display font-extrabold text-5xl text-signal tabular-nums">
            <CountUp to={repos} inView={inView} reduced={reduced} />
          </p>
          <p className="tally-label font-mono text-xs uppercase mt-2">public repositories</p>
          <p className="tally-note text-mute text-sm mt-2">My own, not my employer&rsquo;s. clair installs from a Homebrew tap, UFW Manager from my Ubuntu PPA.</p>
        </div>
        <div className="tally-item">
          <p className="tally-num font-display font-extrabold text-5xl text-signal tabular-nums">
            <CountUp to={2} inView={inView} reduced={reduced} />
          </p>
          <p className="tally-label font-mono text-xs uppercase mt-2">writeups, my byline</p>
          <p className="tally-note text-mute text-sm mt-2">SAGE and Recurser, on the TwelveLabs engineering blog.</p>
        </div>
        <div className="tally-item">
          <p className="tally-num font-display font-extrabold text-5xl text-signal tabular-nums">
            <CountUp to={4.0} decimals={1} inView={inView} reduced={reduced} />
          </p>
          <p className="tally-label font-mono text-xs uppercase mt-2">GPA at Texas A&amp;M</p>
          <p className="tally-note text-mute text-sm mt-2">Sophomore, College Station.</p>
        </div>
      </div>
    </section>
  )
}
