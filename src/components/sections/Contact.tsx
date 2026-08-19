import { ActionButton } from "@/components/kit/ActionButton"

export function Contact() {
  return (
    <section id="contact" className="contact bg-ember text-paper py-20 px-[var(--edge,1.5rem)]">
      <div className="contact-grid grid md:grid-cols-2 gap-16 max-w-[1100px] mx-auto">
        <div className="contact-pitch">
          <p className="eyebrow font-mono text-[0.6875rem] uppercase tracking-wide mb-5">Contact</p>
          <h2 className="contact-title font-display font-extrabold text-5xl mb-6">Say something<br />interesting.</h2>
          <p className="contact-copy max-w-[42ch] mb-8">
            Agents, graph memory, video models, or a problem that doesn&rsquo;t have a name yet — I read everything that comes through here.
          </p>
          <ul className="contact-links flex flex-col gap-3 font-mono text-sm">
            <li><a href="mailto:aahils2019@gmail.com">aahils2019@gmail.com</a></li>
            <li><a href="https://github.com/The007Programmer">GitHub</a></li>
            <li><a href="https://www.linkedin.com/in/aahil-shaikh-04b9ba356/">LinkedIn</a></li>
            <li><a href="/assets/aahil-shaikh-resume.pdf">Résumé (PDF)</a></li>
          </ul>
        </div>

        <form className="form flex flex-col gap-5" action="https://formsubmit.co/aahils2019@gmail.com" method="POST">
          <div className="field flex flex-col gap-1">
            <label htmlFor="name">Name</label>
            <input id="name" type="text" name="name" required autoComplete="name" className="bg-paper text-slate rounded-sm px-3 py-2" />
          </div>
          <div className="field flex flex-col gap-1">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" name="email" required autoComplete="email" className="bg-paper text-slate rounded-sm px-3 py-2" />
          </div>
          <div className="field flex flex-col gap-1">
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows={5} required className="bg-paper text-slate rounded-sm px-3 py-2" />
          </div>
          <input type="text" name="_honey" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />
          <input type="hidden" name="_captcha" value="true" />
          <input type="hidden" name="_subject" value="New Contact Form Submission" />
          <input type="hidden" name="_template" value="table" />
          <input type="hidden" name="_next" value="https://the007programmer.github.io/thanks.html" />
          <input type="hidden" name="_autoresponse" value="Thanks for your message. I'll get back to you soon. — Aahil" />
          <ActionButton type="submit">Send message</ActionButton>
        </form>
      </div>
    </section>
  )
}
