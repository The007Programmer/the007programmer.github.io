import { useMemo, useRef, useState } from "react"
import { motion, useInView } from "motion/react"
import { TIMELINE_NODES, TIMELINE_EDGES, type TimelineTrack } from "@/data/timeline"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

const TRACK_Y: Record<TimelineTrack, number> = { twelvelabs: 90, personal: 290, school: 445 }
const TRACK_LABEL: Record<TimelineTrack, string> = { twelvelabs: "TwelveLabs", personal: "Personal / OSS", school: "School" }

// Nodes are boxes, not dots: a dot carries no information at a glance and
// pushes every label into the space around it, where labels then collide.
// The box IS the label, so position only has to keep boxes from overlapping.
const BOX_H = 40
const ARTIFACT_LANE = 68
const NODE_X_MIN = 150
const NODE_X_SPAN = 700

// A box's width has to be known at layout time to keep boxes from overlapping
// and to clamp the rightmost one inside the viewBox. Measuring real text needs
// a DOM pass; the labels here are a fixed, known set in mono at a known size,
// so estimating from character count is accurate enough and stays pure.
const CHAR_W = 7.1
const BOX_PAD = 14

function boxWidth(label: string): number {
  return Math.max(label.length * CHAR_W + BOX_PAD * 2, 90)
}

function monthIndex(date: string): number {
  const [y, m] = date.split("-").map(Number)
  return y * 12 + m
}

const EDGE_LABEL_CH = 5.9
const EDGE_LABEL_H = 12

interface Box { x: number; y: number; w: number; h: number }

function hits(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

// A label pinned to the midpoint lands on top of whichever box the edge runs
// into whenever the edge is short or steeply diagonal. Walk along the edge (and
// to either side of it) and take the first placement that clears every box.
function placeLabel(
  label: string,
  x1: number, y1: number, x2: number, y2: number,
  obstacles: Box[],
): { x: number; y: number } {
  const w = label.length * EDGE_LABEL_CH
  const vx = x2 - x1
  const vy = y2 - y1
  const len = Math.hypot(vx, vy) || 1
  const nx = -vy / len
  const ny = vx / len

  const ts = [0.5, 0.62, 0.38, 0.72, 0.28, 0.82, 0.2]
  const offs = [13, -13, 22, -22, 32, -32]

  for (const t of ts) {
    for (const off of offs) {
      const cx = x1 + vx * t + nx * off
      const cy = y1 + vy * t + ny * off
      const box: Box = { x: cx - w / 2, y: cy - EDGE_LABEL_H / 2, w, h: EDGE_LABEL_H }
      if (!obstacles.some((o) => hits(box, o))) return { x: cx, y: cy }
    }
  }
  return { x: x1 + vx * 0.5 + nx * 13, y: y1 + vy * 0.5 + ny * 13 }
}

const VIEW_W = 1000
const VIEW_H = 510

export function Timeline() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.15 })
  const reduced = useReducedMotionGate()
  const [hoverNode, setHoverNode] = useState<string | null>(null)

  const positioned = useMemo(() => {
    const idx = TIMELINE_NODES.map((n) => monthIndex(n.date))
    const minX = Math.min(...idx)
    const maxX = Math.max(...idx)
    const laneTaken = new Map<string, number>()

    return TIMELINE_NODES.map((n) => {
      let lane = 0
      if (n.kind === "artifact") {
        const slot = `${n.track}:${n.date}`
        lane = (laneTaken.get(slot) ?? 0) + 1
        laneTaken.set(slot, lane)
      }
      const w = boxWidth(n.label)
      const rawX = NODE_X_MIN + ((monthIndex(n.date) - minX) / Math.max(maxX - minX, 1)) * NODE_X_SPAN
      // Keep the whole box inside the viewBox — the rightmost label used to
      // run off the edge and render truncated.
      const cx = Math.min(rawX, VIEW_W - w / 2 - 10)
      return { ...n, cx, cy: TRACK_Y[n.track] + lane * ARTIFACT_LANE, w }
    })
  }, [])

  const byId = useMemo(() => new Map(positioned.map((n) => [n.id, n])), [positioned])

  // Node boxes plus a little breathing room — edge labels route around these.
  const nodeBoxes = useMemo<Box[]>(
    () => positioned.map((n) => ({ x: n.cx - n.w / 2 - 4, y: n.cy - BOX_H / 2 - 4, w: n.w + 8, h: BOX_H + 8 })),
    [positioned],
  )

  // Edges attach to box edges, not centres, so a line never disappears under
  // the box it points at.
  function anchor(from: typeof positioned[number], to: typeof positioned[number]) {
    const dx = to.cx - from.cx
    const dy = to.cy - from.cy
    const fromSide = Math.abs(dx) > Math.abs(dy)
    return {
      x1: fromSide ? from.cx + Math.sign(dx) * (from.w / 2) : from.cx,
      y1: fromSide ? from.cy : from.cy + Math.sign(dy) * (BOX_H / 2),
      x2: fromSide ? to.cx - Math.sign(dx) * (to.w / 2) : to.cx,
      y2: fromSide ? to.cy : to.cy - Math.sign(dy) * (BOX_H / 2),
    }
  }

  return (
    <section className="figure-section bg-slate text-paper py-20 px-[var(--edge,1.5rem)]" ref={sectionRef as React.RefObject<HTMLElement>}>
      <figure className="timeline max-w-[1100px] mx-auto">
        <figcaption className="timeline-caption mb-8">
          <span className="font-mono text-[0.6875rem] uppercase tracking-wide text-coral block mb-2">Trajectory</span>
          Every job I've had was caused by the one before it. Drawn as the thing it actually is.
        </figcaption>

        {/* Below ~900px the diagram would scale down far enough to make its
            12px labels unreadable. Scrolling it keeps type at a legible size
            instead of shrinking the whole figure to fit. */}
        <div className="overflow-x-auto -mx-[var(--edge,1.5rem)] px-[var(--edge,1.5rem)]">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-auto w-full min-w-[860px]"
          role="img"
          aria-label="Career timeline across three tracks — TwelveLabs, Personal/OSS, and School — showing how each role caused the next"
        >
          {(Object.keys(TRACK_Y) as TimelineTrack[]).map((track) => (
            <g key={track}>
              <line
                x1={20} y1={TRACK_Y[track]} x2={VIEW_W - 10} y2={TRACK_Y[track]}
                stroke="#FFA795" strokeOpacity={0.18} strokeWidth={1}
              />
              {/* Clears the tallest box on the row (top = TRACK_Y - BOX_H/2)
                  so a long track name never runs under a node. */}
              <text x={20} y={TRACK_Y[track] - BOX_H / 2 - 12} className="fill-coral font-mono text-[11px] uppercase tracking-wider">
                {TRACK_LABEL[track]}
              </text>
            </g>
          ))}

          {TIMELINE_EDGES.map((edge, i) => {
            const from = byId.get(edge.from)
            const to = byId.get(edge.to)
            if (!from || !to) return null
            const key = `${edge.from}-${edge.to}`
            const a = anchor(from, to)
            const { x: mx, y: my } = placeLabel(edge.label, a.x1, a.y1, a.x2, a.y2, nodeBoxes)
            const lit = hoverNode === edge.from || hoverNode === edge.to
            // Soft edges read as "alongside, not caused by" through dashes and
            // a lighter weight — never through a dimmer colour, which is what
            // made this edge invisible against the slate ground.
            const stroke = edge.soft ? "#FFA795" : "#FF7A63"
            return (
              <motion.g
                key={key}
                initial={reduced ? false : { opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ duration: 0.4, delay: reduced ? 0 : 0.25 + i * 0.07 }}
              >
                <line
                  x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2}
                  stroke={stroke}
                  strokeOpacity={lit ? 1 : edge.soft ? 0.5 : 0.75}
                  strokeDasharray={edge.soft ? "5 5" : undefined}
                  strokeWidth={lit ? 2.5 : 1.5}
                />
                <text
                  x={mx} y={my + 3}
                  textAnchor="middle"
                  className="font-mono text-[10px] uppercase tracking-wide"
                  fill={lit ? "#FFF1ED" : "#FFA795"}
                  fillOpacity={lit ? 1 : 0.85}
                  // Punches the ground colour out from under the glyphs so an
                  // edge passing behind the label never strikes through it.
                  stroke="#39434F"
                  strokeWidth={4}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                >
                  {edge.label}
                </text>
              </motion.g>
            )
          })}

          {positioned.map((node, i) => {
            const isRole = node.kind === "role"
            const active = hoverNode === node.id
            return (
              <motion.g
                key={node.id}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.35, delay: reduced ? 0 : i * 0.06 }}
                onMouseEnter={() => setHoverNode(node.id)}
                onMouseLeave={() => setHoverNode(null)}
                style={{ cursor: "default" }}
              >
                <rect
                  x={node.cx - node.w / 2}
                  y={node.cy - BOX_H / 2}
                  width={node.w}
                  height={BOX_H}
                  rx={3}
                  fill={isRole ? "#C4261E" : "#39434F"}
                  stroke={isRole ? "#FF7A63" : "#FFA795"}
                  strokeWidth={active ? 2 : 1}
                  strokeOpacity={isRole ? 1 : active ? 1 : 0.65}
                />
                <text
                  x={node.cx}
                  y={node.cy - 3}
                  textAnchor="middle"
                  className="fill-paper font-mono text-[12px]"
                >
                  {node.label}
                </text>
                <text
                  x={node.cx}
                  y={node.cy + 12}
                  textAnchor="middle"
                  className="font-mono text-[9px] uppercase tracking-wide"
                  fill={isRole ? "#FFD9D0" : "#FFA795"}
                >
                  {node.sub}
                </text>
              </motion.g>
            )
          })}
        </svg>
        </div>
      </figure>
    </section>
  )
}
