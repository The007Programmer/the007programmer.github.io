import { useRef, useState } from "react"
import { motion, useDragControls, useMotionValue, useTransform, frame } from "motion/react"
import { ProjectCard } from "@/components/kit/ProjectCard"
import { ELECTRA, PROJECT_CARDS, OSS_ITEMS, type ProjectCardData } from "@/data/work"
import { Reveal, RiseText, Stagger, StaggerItem } from "@/components/kit/Reveal"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { cn } from "@/lib/utils"

export interface Offset {
  x: number
  y: number
}

export interface CardCenter {
  id: string
  cx: number
  cy: number
}

// Which card's slot the dragged card was released over. Ties resolve to the
// earliest card in `centers`, so a drop exactly between two slots is stable
// rather than dependent on iteration order.
export function pickNearest(centers: CardCenter[], id: string, offset: Offset): string | null {
  const dragged = centers.find((c) => c.id === id)
  if (!dragged) return null

  const cx = dragged.cx + offset.x
  const cy = dragged.cy + offset.y
  const distance = (c: CardCenter) => (c.cx - cx) ** 2 + (c.cy - cy) ** 2
  return centers.reduce((best, c) => (distance(c) < distance(best) ? c : best)).id
}

export function moveById<T extends { id: string }>(list: T[], fromId: string, toId: string): T[] {
  const from = list.findIndex((item) => item.id === fromId)
  const to = list.findIndex((item) => item.id === toId)
  if (from === -1 || to === -1 || from === to) return list

  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
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
      className="relative h-full"
    >
      {!reduced && (
        <button
          type="button"
          className="drag-handle absolute right-3 top-3 z-10 cursor-grab touch-none rounded-sm px-2 py-1 font-mono text-xs text-chalk-2 hover:text-signal active:cursor-grabbing"
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
        className={cn("h-full", expanded && "scale-[1.03]")}
      >
        <ProjectCard
          className="h-full"
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

  // Layout-box centres, relative to the offsetParent every card shares. These
  // must exclude transforms: by the time this runs Motion has already flushed
  // the pan-threshold offset to the dragged card, and a previous drop's layout
  // animation may still be settling on the others. offsetLeft/offsetTop are
  // layout-only, so both cases measure the settled position `info.offset` is a
  // delta against.
  const measureCenters = () => {
    centersRef.current = order.flatMap((p) => {
      const el = itemRefs.current.get(p.id)
      if (!el) return []
      return [
        {
          id: p.id,
          cx: el.offsetLeft + el.offsetWidth / 2,
          cy: el.offsetTop + el.offsetHeight / 2,
        },
      ]
    })
  }

  const dropNearest = (id: string, offset: Offset) => {
    const target = pickNearest(centersRef.current, id, offset)
    if (target === null || target === id) return
    setOrder((prev) => moveById(prev, id, target))
  }

  return (
    <section id="work" className="work py-28 px-[var(--edge,1.5rem)]">
      <div className="section-head mb-14">
        <Reveal>
          <p className="eyebrow eyebrow-dark font-mono text-[0.6875rem] uppercase tracking-wide text-signal mb-5">Work</p>
        </Reveal>
        <RiseText
          as="h2"
          delay={0.08}
          className="section-title font-display font-extrabold text-[clamp(2.5rem,7vw,5rem)] tracking-[-0.035em] text-chalk"
        >
          What I shipped
        </RiseText>
      </div>

      <Stagger as="article" className="feature grid md:grid-cols-2 gap-12 lg:gap-20 mb-20" gap={0.09}>
        <StaggerItem>
          <p className="stamp font-mono text-[0.6875rem] uppercase text-chalk-2 mb-2">{ELECTRA.stamp}</p>
          <h3 className="font-display font-extrabold text-3xl text-chalk mb-3">{ELECTRA.title}</h3>
          <p className="text-chalk-2 leading-relaxed mb-4 max-w-[52ch]">{ELECTRA.lede}</p>
          <p className="note text-mute text-sm">{ELECTRA.note}</p>
        </StaggerItem>
        <StaggerItem as="dl" className="spec grid gap-8">
          {ELECTRA.rows.map((row) => (
            <div key={row.label} className="spec-row">
              <dt className="font-mono text-xs uppercase text-signal mb-1">{row.label}</dt>
              <dd className="text-chalk-2 leading-relaxed max-w-[62ch]">{row.body}</dd>
            </div>
          ))}
        </StaggerItem>
      </Stagger>

      <Stagger className="cards grid gap-8 sm:grid-cols-2 lg:grid-cols-3" gap={0.06}>
        {order.map((p) => (
          // The entrance lives on a wrapper, not on the card: the card owns a
          // drag `y` motion value and a layout animation for reordering, and a
          // variant animating the same `y` would fight both.
          <StaggerItem key={p.id} className="h-full">
            <WorkCard
              project={p}
              reduced={reduced}
              expanded={expandedId === p.id}
              onExpand={() => setExpandedId(p.id)}
              onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
              registerRef={registerRef}
              onReorderStart={measureCenters}
              onReorderEnd={dropNearest}
            />
          </StaggerItem>
        ))}
      </Stagger>

      <div className="oss mt-28">
        <RiseText as="h3" className="oss-head font-display font-extrabold text-2xl text-chalk mb-8">
          On my own time
        </RiseText>
        <Stagger as="ul" className="oss-list grid gap-8" gap={0.07}>
          {OSS_ITEMS.map((item) => (
            <StaggerItem
              as="li"
              key={item.id}
              className="oss-item flex justify-between gap-8 border-b border-line pb-8"
            >
              <div>
                <h4 className="font-display font-bold text-xl text-chalk">{item.title}</h4>
                <p className="text-chalk-2 leading-relaxed mt-2 max-w-[70ch]">{item.desc}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="font-mono text-[0.6875rem] uppercase px-2 py-1 rounded-sm bg-ink-2 text-signal">
                  {item.status === "published" ? "Published" : item.status === "in-progress" ? "In progress" : "Private"}
                </span>
                {item.link && (
                  <a href={item.link.href} className="font-mono text-[0.6875rem] uppercase text-signal">
                    {item.link.label} <span aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
