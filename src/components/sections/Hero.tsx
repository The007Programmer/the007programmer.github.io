import { animate, motion, useScroll, useSpring, useTransform, useVelocity } from "motion/react"
import { useRef, type PointerEvent } from "react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { ScrambleName } from "@/components/kit/ScrambleName"
import { LineMask } from "@/components/kit/LineMask"
import FlowField from "@/components/kokonutui/flow-field"

// Hoisted so the array identity is stable: ScrambleName takes it as an effect
// dependency, and a fresh array every render would restart the decode forever.
const HERO_NAME = ["Aahil", "Shaikh"]

export function Hero() {
  const ref = useRef<HTMLDivElement | null>(null)
  const reduced = useReducedMotionGate()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, 120])
  const opacity = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [1, 0])

  // Exit: the name swells, loosens its tracking and leans with the scroll speed.
  const scale = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [1, 1.14])
  const tracking = useTransform(scrollYProgress, [0, 1], reduced ? ["-0.055em", "-0.055em"] : ["-0.055em", "0.01em"])
  const { scrollY } = useScroll()
  const skewX = useSpring(useTransform(useVelocity(scrollY), [-2500, 2500], reduced ? [0, 0] : [7, -7], { clamp: true }), {
    stiffness: 300,
    damping: 40,
  })

  // Per-letter hover. The decode builds `.ch` spans by hand, so delegate from
  // the heading instead of binding to elements that come and go.
  const onLetter = (e: PointerEvent<HTMLElement>) => {
    if (reduced) return
    const ch = (e.target as HTMLElement).closest<HTMLElement>(".hero-name .ch")
    if (!ch || ch.dataset.busy || ch.classList.contains("is-noise")) return
    ch.dataset.busy = "1"
    const spin = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 10)
    animate(
      ch,
      { y: ["0em", "-0.16em", "0em"], rotate: [0, spin, 0], scaleY: [1, 1.08, 1], color: ["#EDF2F8", "#FF5B4F", "#EDF2F8"] },
      { duration: 0.75, ease: "easeOut" }
    ).then(() => {
      delete ch.dataset.busy
      ch.style.removeProperty("color")
    })
  }

  return (
    // select-none: the hero is a click surface now — every click sends a
    // shockwave through the field — and a click surface that also selects text
    // means a stray double-click leaves the headline highlighted behind the
    // animation. The copy here is a name and a tagline, not something anyone
    // needs to copy out.
    <section id="top" className="hero relative select-none">
      {/* The field is the hero's ground, not a layer floating over the page.
          Confining it here is deliberate: continuous glowing trails behind body
          copy is what made the old scattered-dot layer unreadable. It runs where
          there is nothing to read, and stops where the page starts talking. */}
      <FlowField
        theme="signal"
        density="dense"
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
        <motion.h1
          onPointerOver={onLetter}
          style={{ scale, letterSpacing: tracking, skewX, transformOrigin: "0% 60%" }}
          className="font-display font-extrabold text-[clamp(4rem,15vw,12rem)] leading-[0.95] mb-8"
        >
          <ScrambleName lines={HERO_NAME} />
        </motion.h1>
        <LineMask
          delay={0.9}
          className="hero-thesis max-w-[34ch] font-display font-semibold text-[clamp(1.35rem,3.2vw,2.35rem)] leading-[1.15] tracking-[-0.02em]"
        >
          {"At work it\u2019s the parts of agents nobody\u2019s solved yet \u2014 drift, identity, cooperation. At home it\u2019s whatever annoyed me that week. Both keep outgrowing what I built them for."}
        </LineMask>
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 1.6 }}
          className="hero-meta font-mono text-xs tracking-wide mt-6"
        >
          Sophomore at Texas A&amp;M · Two terms at TwelveLabs · Bay Area
        </motion.p>
      </motion.div>
      </FlowField>
    </section>
  )
}
