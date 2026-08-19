import { useEffect, useRef, useState } from "react"
import { motion, useScroll, useSpring } from "motion/react"
import { cn } from "@/lib/utils"

export interface TopbarSection { id: string; label: string }
export interface TopbarProps { sections: TopbarSection[] }

export function Topbar({ sections }: TopbarProps) {
  const [stuck, setStuck] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const navRef = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll()
  const progressScaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 })

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null)
    if (!targets.length || !("IntersectionObserver" in window)) return

    // The marker tracks whichever section owns the MIDDLE of the
    // viewport, not merely what's visible — tracking visibility
    // flickers between two links whenever a boundary crosses the
    // screen, and several sections can be visible at once near the
    // bottom of the page.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [sections])

  return (
    <>
      <a className="skip-link sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-slate focus:text-paper focus:px-4 focus:py-2 font-mono text-xs" href="#main">
        Skip to content
      </a>
      <header
        className={cn(
          "topbar fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-4 px-[clamp(1.25rem,5vw,5.5rem)] py-[1.1rem] transition-colors duration-300",
          stuck && "bg-slate py-[0.85rem]"
        )}
      >
        <a className="font-display font-extrabold text-lg text-paper no-underline" href="#top">AS</a>
        <nav ref={navRef} className="relative flex gap-[clamp(0.9rem,2.5vw,2rem)]" aria-label="Sections">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={cn(
                "font-mono text-[0.6875rem] uppercase tracking-wide text-paper no-underline pb-0.5 border-b border-transparent transition-opacity",
                active && active !== s.id && "opacity-55",
                active === s.id && "opacity-100 border-paper"
              )}
            >
              {s.label}
            </a>
          ))}
        </nav>
        <motion.span
          aria-hidden="true"
          className="absolute left-0 bottom-0 h-0.5 w-full bg-paper origin-left"
          style={{ scaleX: progressScaleX, opacity: stuck ? 1 : 0 }}
        />
      </header>
    </>
  )
}
