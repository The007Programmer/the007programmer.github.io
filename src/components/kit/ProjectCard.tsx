import { motion, useMotionTemplate, useMotionValue } from "motion/react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { cn } from "@/lib/utils"

export interface ProjectCardProps {
  title: string
  stamp: string
  desc: string
  tags: string[]
  link?: { href: string; label: string }
  className?: string
}

export function ProjectCard({ title, stamp, desc, tags, link, className }: ProjectCardProps) {
  const reduced = useReducedMotionGate()

  // Card-local pointer position, driving a spotlight. Motion values rather than
  // state on purpose: this updates on every pointer move over the card, and
  // re-rendering a grid of these on mousemove is how a page starts dropping
  // frames for a decoration.
  const mx = useMotionValue(-9999)
  const my = useMotionValue(-9999)
  const spotlight = useMotionTemplate`radial-gradient(320px circle at ${mx}px ${my}px, rgba(255,91,79,0.14), transparent 70%)`

  const track = (e: ReactPointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(e.clientX - r.left)
    my.set(e.clientY - r.top)
  }
  // Park it far outside rather than fading it: the gradient is cheap to leave
  // mounted and a transition on the glow would trail the pointer off the card.
  const park = () => {
    mx.set(-9999)
    my.set(-9999)
  }

  return (
    <motion.article
      className={cn(
        "project-card relative isolate overflow-hidden rounded-sm border border-line bg-ink-2 p-7 flex flex-col gap-4",
        className
      )}
      onPointerMove={reduced ? undefined : track}
      onPointerLeave={reduced ? undefined : park}
      whileHover={reduced ? undefined : { y: -4, borderColor: "rgba(255,143,121,0.55)", boxShadow: "0 18px 36px -18px rgba(0,0,0,0.7)" }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
    >
      {!reduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ background: spotlight }}
        />
      )}
      <p className="font-mono text-[0.6875rem] uppercase tracking-wide text-chalk-2">{stamp}</p>
      <h3 className="card-title font-display font-extrabold text-2xl text-chalk">{title}</h3>
      <p className="card-desc text-chalk-2 leading-relaxed">{desc}</p>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2 mt-2">
          {tags.map((tag) => (
            <li key={tag} className="font-mono text-[0.6875rem] uppercase bg-void text-signal px-2 py-1 rounded-sm">
              {tag}
            </li>
          ))}
        </ul>
      )}
      {link && (
        <a href={link.href} className="font-mono text-[0.6875rem] uppercase text-signal mt-auto">
          {link.label} <span aria-hidden="true">↗</span>
        </a>
      )}
    </motion.article>
  )
}
