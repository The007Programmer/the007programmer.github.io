import { motion } from "motion/react"
import { ActionButton } from "@/components/kit/ActionButton"
import { Reveal } from "@/components/kit/Reveal"

const LINKS = [
  { href: "mailto:aahils2019@gmail.com", label: "aahils2019@gmail.com" },
  { href: "https://github.com/The007Programmer", label: "GitHub" },
  { href: "https://www.linkedin.com/in/aahil-shaikh-04b9ba356/", label: "LinkedIn" },
  { href: "/assets/aahil-shaikh-resume.pdf", label: "Résumé (PDF)" },
]

const FIELD_CLS =
  "bg-paper text-slate rounded-sm px-3 py-2 outline-none border border-transparent focus:border-coral transition-colors"

export function Contact() {
  return (
    <section id="contact" className="contact bg-ember text-paper py-20 px-[var(--edge,1.5rem)]">
      <div className="contact-grid grid md:grid-cols-2 gap-16 max-w-[1100px] mx-auto">
        <Reveal className="contact-pitch">
          <p className="eyebrow font-mono text-[0.6875rem] uppercase tracking-wide mb-5">Contact</p>
          <h2 className="contact-title font-display font-extrabold text-5xl mb-6">Say something<br />interesting.</h2>
          <p className="contact-copy max-w-[42ch] mb-8">
            Agents, graph memory, video models, or a problem that doesn&rsquo;t have a name yet — I read everything that comes through here.
          </p>
          <ul className="contact-links flex flex-col gap-3 font-mono text-sm">
            {LINKS.map((l) => (
              <li key={l.href}>
                <motion.a
                  href={l.href}
                  className="inline-block hover:text-coral transition-colors"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 26 }}
                >
                  {l.label}
                </motion.a>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal
          as="form"
          delay={0.1}
          className="form flex flex-col gap-5"
          action="https://formsubmit.co/aahils2019@gmail.com"
          method="POST"
        >
          <div className="field flex flex-col gap-1">
            <label htmlFor="name">Name</label>
            <input id="name" type="text" name="name" required autoComplete="name" className={FIELD_CLS} />
          </div>
          <div className="field flex flex-col gap-1">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" required autoComplete="email" className={FIELD_CLS} />
          </div>
          <div className="field flex flex-col gap-1">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={5} required className={FIELD_CLS} />
          </div>
          <input type="text" name="_honey" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />
          <input type="hidden" name="_captcha" value="true" />
          <input type="hidden" name="_subject" value="New Contact Form Submission" />
          <input type="hidden" name="_template" value="table" />
          <input type="hidden" name="_next" value="https://the007programmer.github.io/thanks.html" />
          <input type="hidden" name="_autoresponse" value="Thanks for your message. I'll get back to you soon. — Aahil" />
          <ActionButton type="submit">Send message</ActionButton>
        </Reveal>
      </div>
    </section>
  )
}
