import { motion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { RiseText } from "@/components/kit/Reveal"
import FlowField from "@/components/kokonutui/flow-field"

export function Hero() {
  const ref = useRef<HTMLDivElement | null>(null)
  const reduced = useReducedMotionGate()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, 120])
  const opacity = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [1, 0])

  return (
    <section id="top" className="hero relative">
      {/* The field is the hero's ground, not a layer floating over the page.
          Confining it here is deliberate: continuous glowing trails behind body
          copy is what made the old scattered-dot layer unreadable. It runs where
          there is nothing to read, and stops where the page starts talking. */}
      <FlowField
        theme="signal"
        density="medium"
        className="min-h-screen items-center justify-start px-[var(--edge,1.5rem)] py-[clamp(7rem,14vh,9rem)]"
      >
      {/* The field is brightest where the copy sits. The stock vignette dims the
          edges, which is the opposite of what a left-aligned hero needs, so this
          lays a scrim from the reading side — the headline never has to compete
          with whatever the noise field happens to be doing behind it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{ background: "linear-gradient(100deg, rgba(10,13,19,0.94) 0%, rgba(10,13,19,0.82) 32%, rgba(10,13,19,0.15) 62%, transparent 82%)" }}
      />
      <motion.div ref={ref} style={{ y, opacity }} className="hero-inner relative z-10 w-full max-w-[1400px] mx-auto">
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="eyebrow font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] mb-5"
        >
          Applied AI &amp; systems
        </motion.p>
        <h1 className="hero-name font-display font-extrabold text-[clamp(4rem,15vw,12rem)] tracking-[-0.055em] leading-[0.95] mb-8">
          <RiseText className="line block" delay={0.08}>Aahil</RiseText>
          <RiseText className="line block" delay={0.2}>Shaikh</RiseText>
        </h1>
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
          className="hero-thesis max-w-[34ch] font-display font-semibold text-[clamp(1.35rem,3.2vw,2.35rem)] leading-[1.15] tracking-[-0.02em]"
        >
          At work it&rsquo;s the parts of agents nobody&rsquo;s solved yet &mdash; drift,
          identity, cooperation. At home it&rsquo;s whatever annoyed me that week. Both
          keep outgrowing what I built them for.
        </motion.p>
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.62 }}
          className="hero-meta font-mono text-xs tracking-wide mt-6"
        >
          Sophomore at Texas A&amp;M · Two terms at TwelveLabs · Bay Area
        </motion.p>
      </motion.div>
      </FlowField>
    </section>
  )
}
