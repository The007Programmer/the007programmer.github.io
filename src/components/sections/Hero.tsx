import { motion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

export function Hero() {
  const ref = useRef<HTMLDivElement | null>(null)
  const reduced = useReducedMotionGate()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, 120])
  const opacity = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [1, 0])

  return (
    <section id="top" className="hero relative min-h-screen flex items-center bg-signal text-paper px-[var(--edge,1.5rem)] py-[clamp(7rem,14vh,9rem)] overflow-hidden">
      <motion.div ref={ref} style={{ y, opacity }} className="hero-inner w-full max-w-[1400px] mx-auto">
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="eyebrow font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] mb-5"
        >
          Applied AI &amp; systems
        </motion.p>
        <h1 className="hero-name font-display font-extrabold text-[clamp(4rem,15vw,12rem)] tracking-[-0.055em] leading-[0.95] mb-8">
          <motion.span
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
            className="line block"
          >
            Aahil
          </motion.span>
          <motion.span
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.22 }}
            className="line block"
          >
            Shaikh
          </motion.span>
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
    </section>
  )
}
