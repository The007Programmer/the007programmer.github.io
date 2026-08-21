import { motion } from "motion/react"
import { ActionButton } from "@/components/kit/ActionButton"
import { Reveal, Stagger, StaggerItem } from "@/components/kit/Reveal"
import { SplitReveal } from "@/components/kit/SplitReveal"

const LINKS = [
  { href: "mailto:aahils2019@gmail.com", label: "aahils2019@gmail.com" },
  { href: "https://github.com/The007Programmer", label: "GitHub" },
  { href: "https://www.linkedin.com/in/aahil-shaikh-04b9ba356/", label: "LinkedIn" },
  { href: "/assets/aahil-shaikh-resume.pdf", label: "Résumé (PDF)" },
]

// A control needs a boundary you can actually see. `border-transparent` on a
// fill matching the section left these fields literally invisible on the dark
// ground; --color-edge is the token that clears WCAG 1.4.11's 3:1 for
// non-text UI, and the fill is lifted off the section so the box reads as a box.
const FIELD_CLS =
  "bg-ink-2 text-chalk rounded-sm px-3 py-2 outline-none border border-edge " +
  "focus:border-signal focus:ring-1 focus:ring-signal transition-colors"

export function Contact() {
  return (
    <section id="contact" className="contact relative isolate bg-void text-chalk py-24 px-[var(--edge,1.5rem)] overflow-hidden">
      {/* A flat red band would force every ink on this section to be pure chalk
          — coral, chalk-2 and mute all fail AA on ember. A glow keeps the red
          present as light rather than as a surface, so the full palette works. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: "radial-gradient(ellipse 70% 80% at 50% 115%, rgba(255,91,79,0.28), transparent 70%)" }}
      />
      <div className="contact-grid grid md:grid-cols-2 gap-16 max-w-[1100px] mx-auto">
        <div className="contact-pitch">
          <Reveal>
            <p className="eyebrow font-mono text-[0.6875rem] uppercase tracking-wide text-signal mb-5">Contact</p>
          </Reveal>
          <h2 className="contact-title font-display font-extrabold text-5xl mb-6">
            <SplitReveal as="span" className="block" delay={0.06}>Say something</SplitReveal>
            <SplitReveal as="span" className="block" delay={0.28}>interesting.</SplitReveal>
          </h2>
          <Reveal delay={0.24}>
            <p className="contact-copy max-w-[42ch] text-chalk-2 mb-8">
              Agents, graph memory, video models, or a problem that doesn&rsquo;t have a name yet — I read everything that comes through here.
            </p>
          </Reveal>
          <Stagger as="ul" className="contact-links flex flex-col gap-3 font-mono text-sm" gap={0.06} delay={0.3}>
            {LINKS.map((l) => (
              <StaggerItem as="li" key={l.href} y={10}>
                <motion.a
                  href={l.href}
                  className="inline-block hover:text-coral transition-colors"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 26 }}
                >
                  {l.label}
                </motion.a>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <Stagger
          as="form"
          gap={0.08}
          delay={0.1}
          className="form flex flex-col gap-5"
          action="https://formsubmit.co/aahils2019@gmail.com"
          method="POST"
        >
          <StaggerItem className="field flex flex-col gap-1" y={14}>
            <label htmlFor="name">Name</label>
            <input id="name" type="text" name="name" required autoComplete="name" className={FIELD_CLS} />
          </StaggerItem>
          <StaggerItem className="field flex flex-col gap-1" y={14}>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" required autoComplete="email" className={FIELD_CLS} />
          </StaggerItem>
          <StaggerItem className="field flex flex-col gap-1" y={14}>
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={5} required className={FIELD_CLS} />
          </StaggerItem>
          <input type="text" name="_honey" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />
          <input type="hidden" name="_captcha" value="true" />
          <input type="hidden" name="_subject" value="New Contact Form Submission" />
          <input type="hidden" name="_template" value="table" />
          <input type="hidden" name="_next" value="https://the007programmer.github.io/thanks.html" />
          <input type="hidden" name="_autoresponse" value="Thanks for your message. I'll get back to you soon. — Aahil" />
          <StaggerItem y={14}>
            <ActionButton type="submit">Send message</ActionButton>
          </StaggerItem>
        </Stagger>
      </div>
    </section>
  )
}
