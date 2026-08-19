import { useRef, useState } from "react"
import { motion, useDragControls, useMotionValue, useTransform, frame } from "motion/react"
import { ProjectCard } from "@/components/kit/ProjectCard"
import { ELECTRA, PROJECT_CARDS, OSS_ITEMS, type ProjectCardData } from "@/data/work"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

interface Offset {
  x: number
  y: number
}

interface CardCenter {
  id: string
  cx: number
  cy: number
}

interface WorkCardProps {
  project: ProjectCardData
  reduced: boolean
  expanded: boolean
  onExpand: () => void
  onToggle: () => void
  registerRef: (id: string, el: HTMLDivElement | null) => void
  onReorderStart: () => void
  onReorderEnd: (id: string, offset: Offset) => void
}

function WorkCard({
  project,
  reduced,
  expanded,
  onExpand,
  onToggle,
  registerRef,
  onReorderStart,
  onReorderEnd,
}: WorkCardProps) {
  const controls = useDragControls()
  const didDragRef = useRef(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const zIndex = useTransform<number, number | string>([x, y], ([latestX, latestY]) =>
    latestX || latestY ? 1 : "unset"
  )

  return (
    <motion.div
      ref={(el) => registerRef(project.id, el)}
      drag={!reduced}
      dragListener={false}
      dragControls={controls}
      dragSnapToOrigin
      onDragStart={onReorderStart}
      onDragEnd={(_, info) => onReorderEnd(project.id, info.offset)}
      style={{ x, y, zIndex }}
      layout={reduced ? undefined : true}
      className="relative"
    >
      {!reduced && (
        <button
          type="button"
          className="drag-handle absolute right-3 top-3 z-10 cursor-grab touch-none rounded-sm px-2 py-1 font-mono text-xs text-slate-2 hover:text-ember active:cursor-grabbing"
          onPointerDown={(e) => controls.start(e)}
          aria-label={`Reorder ${project.title}`}
        >
          ⠿
        </button>
      )}
      <motion.div
        drag={reduced ? false : "y"}
        dragConstraints={{ top: 0, bottom: 60 }}
        dragElastic={0.2}
        dragMomentum={false}
        dragSnapToOrigin
        onDragEnd={(_, info) => {
          didDragRef.current = true
          if (info.offset.y > 40) onExpand()
          frame.postRender(() => {
            didDragRef.current = false
          })
        }}
        onTap={() => {
          if (didDragRef.current) return
          onToggle()
        }}
        className={expanded ? "scale-[1.03]" : undefined}
      >
        <ProjectCard
          title={project.title}
          stamp={project.stamp}
          desc={project.desc}
          tags={project.tags}
          link={project.link}
        />
      </motion.div>
    </motion.div>
  )
}

export function Work() {
  const reduced = useReducedMotionGate()
  const [order, setOrder] = useState<ProjectCardData[]>(PROJECT_CARDS)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const itemRefs = useRef(new Map<string, HTMLDivElement>())
  const centersRef = useRef<CardCenter[]>([])

  const registerRef = (id: string, el: HTMLDivElement | null) => {
    if (el) itemRefs.current.set(id, el)
    else itemRefs.current.delete(id)
  }

  // Snapshot every card's untransformed centre in document space. Taken at drag
  // start because by drag end the dragged card's own rect carries the drag
  // transform (and dragSnapToOrigin has begun unwinding it).
  const measureCenters = () => {
    centersRef.current = order.flatMap((p) => {
      const el = itemRefs.current.get(p.id)
      if (!el) return []
      const r = el.getBoundingClientRect()
      return [
        {
          id: p.id,
          cx: r.left + r.width / 2 + window.scrollX,
          cy: r.top + r.height / 2 + window.scrollY,
        },
      ]
    })
  }

  const dropNearest = (id: string, offset: Offset) => {
    const centers = centersRef.current
    const dragged = centers.find((c) => c.id === id)
    if (!dragged) return

    const cx = dragged.cx + offset.x
    const cy = dragged.cy + offset.y
    const distance = (c: CardCenter) => (c.cx - cx) ** 2 + (c.cy - cy) ** 2
    const target = centers.reduce((best, c) => (distance(c) < distance(best) ? c : best))
    if (target.id === id) return

    setOrder((prev) => {
      const from = prev.findIndex((p) => p.id === id)
      const to = prev.findIndex((p) => p.id === target.id)
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }

  return (
    <section id="work" className="work py-24 px-[var(--edge,1.5rem)]">
      <div className="section-head mb-16">
        <p className="eyebrow eyebrow-dark font-mono text-[0.6875rem] uppercase tracking-wide text-ember mb-5">Work</p>
        <h2 className="section-title font-display font-extrabold text-[clamp(2.5rem,7vw,5rem)] tracking-[-0.035em] text-slate">What I shipped</h2>
      </div>

      <article className="feature grid md:grid-cols-2 gap-10 mb-16">
        <div>
          <p className="stamp font-mono text-[0.6875rem] uppercase text-slate-2 mb-2">{ELECTRA.stamp}</p>
          <h3 className="font-display font-extrabold text-3xl text-slate mb-3">{ELECTRA.title}</h3>
          <p className="text-slate-2 mb-3">{ELECTRA.lede}</p>
          <p className="note text-mute text-sm">{ELECTRA.note}</p>
        </div>
        <dl className="spec grid gap-6">
          {ELECTRA.rows.map((row) => (
            <div key={row.label} className="spec-row">
              <dt className="font-mono text-xs uppercase text-ember mb-1">{row.label}</dt>
              <dd className="text-slate-2">{row.body}</dd>
            </div>
          ))}
        </dl>
      </article>

      <div className="cards grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {order.map((p) => (
          <WorkCard
            key={p.id}
            project={p}
            reduced={reduced}
            expanded={expandedId === p.id}
            onExpand={() => setExpandedId(p.id)}
            onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
            registerRef={registerRef}
            onReorderStart={measureCenters}
            onReorderEnd={dropNearest}
          />
        ))}
      </div>

      <div className="oss mt-20">
        <h3 className="oss-head font-display font-extrabold text-2xl text-slate mb-8">On my own time</h3>
        <ul className="oss-list grid gap-6">
          {OSS_ITEMS.map((item) => (
            <li key={item.id} className="oss-item flex justify-between gap-6 border-b border-slate/10 pb-6">
              <div>
                <h4 className="font-display font-bold text-xl text-slate">{item.title}</h4>
                <p className="text-slate-2 mt-1">{item.desc}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="font-mono text-[0.6875rem] uppercase px-2 py-1 rounded-sm bg-paper-2 text-ember">
                  {item.status === "published" ? "Published" : item.status === "in-progress" ? "In progress" : "Private"}
                </span>
                {item.link && (
                  <a href={item.link.href} className="font-mono text-[0.6875rem] uppercase text-ember">
                    {item.link.label} <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
