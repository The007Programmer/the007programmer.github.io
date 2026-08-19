import { useMemo, useRef, useState } from "react"
import { motion, useInView } from "motion/react"
import { TIMELINE_NODES, TIMELINE_EDGES, type TimelineTrack } from "@/data/timeline"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

const TRACK_Y: Record<TimelineTrack, number> = { twelvelabs: 60, personal: 160, school: 260 }
const TRACK_LABEL: Record<TimelineTrack, string> = { twelvelabs: "TwelveLabs", personal: "Personal / OSS", school: "School" }

// x is a pure function of the month, so any two nodes in the same track and
// month would land on the same point and hide each other. Artifacts drop into
// lanes below their track line — which also encodes "roles sit on the track,
// what they produced hangs off it" — and a second artifact in the same month
// drops one lane further.
const ARTIFACT_LANE = 30

function monthIndex(date: string): number {
  const [y, m] = date.split("-").map(Number)
  return y * 12 + m
}

export function Timeline() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.2 })
  const reduced = useReducedMotionGate()
  const [hoverEdge, setHoverEdge] = useState<string | null>(null)

  const { positioned } = useMemo(() => {
    const idx = TIMELINE_NODES.map((n) => monthIndex(n.date))
    const minX = Math.min(...idx)
    const maxX = Math.max(...idx)
    const laneTaken = new Map<string, number>()
    const positioned = TIMELINE_NODES.map((n) => {
      let lane = 0
      if (n.kind === "artifact") {
        const slot = `${n.track}:${n.date}`
        lane = (laneTaken.get(slot) ?? 0) + 1
        laneTaken.set(slot, lane)
      }
      return {
        ...n,
        cx: 60 + ((monthIndex(n.date) - minX) / Math.max(maxX - minX, 1)) * 840,
        cy: TRACK_Y[n.track] + lane * ARTIFACT_LANE,
      }
    })
    return { positioned, minX, maxX }
  }, [])

  const byId = useMemo(() => new Map(positioned.map((n) => [n.id, n])), [positioned])

  return (
    <section className="figure-section bg-slate text-paper py-24 px-[var(--edge,1.5rem)]" ref={sectionRef as React.RefObject<HTMLElement>}>
      <figure className="timeline max-w-[1000px] mx-auto">
        <figcaption className="timeline-caption mb-10">
          <span className="font-mono text-[0.6875rem] uppercase tracking-wide text-coral block mb-2">Trajectory</span>
          Every job I've had was caused by the one before it. Drawn as the thing it actually is.
        </figcaption>

        <svg viewBox="0 0 960 320" className="w-full h-auto" role="img" aria-label="Career timeline, three tracks: TwelveLabs, Personal, School">
          {(Object.keys(TRACK_Y) as TimelineTrack[]).map((track) => (
            <text key={track} x={8} y={TRACK_Y[track] + 4} className="fill-coral font-mono text-[10px] uppercase">
              {TRACK_LABEL[track]}
            </text>
          ))}

          {TIMELINE_EDGES.map((edge, i) => {
            const from = byId.get(edge.from)
            const to = byId.get(edge.to)
            if (!from || !to) return null
            const key = `${edge.from}-${edge.to}`
            return (
              <g key={key} onMouseEnter={() => setHoverEdge(key)} onMouseLeave={() => setHoverEdge(null)}>
                <motion.line
                  x1={from.cx} y1={from.cy} x2={to.cx} y2={to.cy}
                  stroke={edge.soft ? "#5A6675" : "#FFA795"}
                  strokeDasharray={edge.soft ? "4 4" : undefined}
                  strokeWidth={hoverEdge === key ? 2.5 : 1.5}
                  initial={reduced ? false : { pathLength: 0 }}
                  animate={inView ? { pathLength: 1 } : {}}
                  transition={{ duration: 0.55, delay: reduced ? 0 : i * 0.12, ease: "easeOut" }}
                />
                {hoverEdge === key && (
                  <text x={(from.cx + to.cx) / 2} y={(from.cy + to.cy) / 2 - 8} className="fill-paper font-mono text-[10px]" textAnchor="middle">
                    {edge.label}
                  </text>
                )}
              </g>
            )
          })}

          {positioned.map((node, i) => (
            <motion.g
              key={node.id}
              initial={reduced ? false : { opacity: 0, scale: 0.6 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3, delay: reduced ? 0 : 0.15 + i * 0.08 }}
            >
              <circle cx={node.cx} cy={node.cy} r={node.kind === "role" ? 7 : 5} fill={node.kind === "role" ? "#C4261E" : "#FFF1ED"} />
              <text x={node.cx} y={node.cy - 12} textAnchor="middle" className="fill-paper font-mono text-[9px]">
                {node.label}
              </text>
            </motion.g>
          ))}
        </svg>
      </figure>
    </section>
  )
}
