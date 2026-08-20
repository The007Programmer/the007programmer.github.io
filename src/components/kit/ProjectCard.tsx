import { motion } from "motion/react"
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

  return (
    <motion.article
      className={cn(
        "project-card rounded-sm border border-line bg-ink-2 p-6 flex flex-col gap-3",
        className
      )}
      whileHover={reduced ? undefined : { y: -4, boxShadow: "0 12px 24px -12px rgba(57,67,79,0.35)" }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
    >
      <p className="font-mono text-[0.6875rem] uppercase tracking-wide text-chalk-2">{stamp}</p>
      <h3 className="card-title font-display font-extrabold text-2xl text-chalk">{title}</h3>
      <p className="card-desc text-chalk-2">{desc}</p>
      {tags.length > 0 && (
        <ul className="flex flex-wrap gap-2 mt-1">
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
