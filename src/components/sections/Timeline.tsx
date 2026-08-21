import { useEffect, useMemo, useRef, useState } from "react"
import { useInView } from "motion/react"
import { TIMELINE_NODES, TIMELINE_EDGES, type TimelineTrack } from "@/data/timeline"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"

const TRACK_Y: Record<TimelineTrack, number> = { twelvelabs: 95, personal: 315, school: 500 }
const TRACK_LABEL: Record<TimelineTrack, string> = { twelvelabs: "TwelveLabs", personal: "Personal / OSS", school: "School" }

const BOX_H = 40
const ARTIFACT_LANE = 76
const NODE_X_MIN = 120
// Bounded by the widest box on the latest date: at 780 the Agent Security node
// ran past the right edge and got clamped back, which silently put it at a date
// it did not happen on. Now that the axis is drawn, that is not a cosmetic
// problem — the figure would be lying. Timeline.test.tsx holds the line.
const NODE_X_SPAN = 740
// Measured, not guessed: Martian Mono advances 0.682em, so at 12px a glyph is
// 8.18 user units. The old 7.1 was a generic-monospace figure, which made every
// box too narrow — the longest label rendered wider than the box drawn for it.
const CHAR_W = 8.2
const BOX_PAD = 14

const VIEW_W = 1000
// The axis lives in the bottom strip. Everything the simulation is allowed to
// touch stops above FIELD_H, or a drifting node parks itself on top of a date.
const AXIS_Y = 578
const FIELD_H = AXIS_Y - 34
const VIEW_H = 640

// Every node is sprung to its seed position, so the figure always returns to a
// layout that reads. Without the anchor, repulsion wins and the graph wanders
// off into a shape that says nothing about when anything happened.
// The anchor has to win: the seed layout encodes *when* things happened, so
// repulsion is a nudge that keeps boxes off each other, not a layout solver
// allowed to drag a node off its own track.
const K_ANCHOR = 0.09
const REP = 3500
const GAP = 14
const SEP_K = 0.018
const DAMP = 0.84
const V_MAX = 5
// The anchors themselves drift on a slow lissajous, so the graph is never
// quite still — it breathes rather than sitting there as a diagram.
const DRIFT_A = 7
const DRIFT_W = 0.00028
/** Milliseconds for a pulse to travel one edge end to end. */
const PULSE_MS = 2600

// A box has to hold both of its lines. Sizing on the title alone let a node
// whose sub-line was longer than its name render text straight out through the
// side of its own box.
const SUB_CHAR_W = 6.6 // 9px Martian Mono plus the 0.025em tracking

function boxWidth(label: string, sub: string): number {
  const text = Math.max(label.length * CHAR_W, sub.length * SUB_CHAR_W)
  return Math.max(text + BOX_PAD * 2, 90)
}

function monthIndex(date: string): number {
  const [y, m] = date.split("-").map(Number)
  return y * 12 + m
}

// The horizontal axis was the whole problem with this figure: x meant time, and
// nothing on screen said so, which left it reading as an arbitrary node graph.
// The mapping is hoisted out of the layout so the axis and the nodes are drawn
// from the same function and cannot drift apart.
const MONTHS = TIMELINE_NODES.map((n) => monthIndex(n.date))
const MIN_MONTH = Math.min(...MONTHS)
const MAX_MONTH = Math.max(...MONTHS)

function xOfMonth(m: number): number {
  return NODE_X_MIN + ((m - MIN_MONTH) / Math.max(MAX_MONTH - MIN_MONTH, 1)) * NODE_X_SPAN
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** Every second month across the range, plus the far end whatever it lands on. */
const TICKS = (() => {
  const out: { m: number; x: number; label: string }[] = []
  for (let m = MIN_MONTH; m <= MAX_MONTH; m += 2) out.push({ m, x: xOfMonth(m), label: "" })
  if (out[out.length - 1].m !== MAX_MONTH) out.push({ m: MAX_MONTH, x: xOfMonth(MAX_MONTH), label: "" })
  return out.map((t) => {
    // monthIndex packs as y*12+m with m in 1..12, so the calendar month is the
    // remainder and December has to fall back to the previous year.
    const mm = t.m % 12
    const year = (t.m - (mm === 0 ? 12 : mm)) / 12
    return { ...t, label: `${MONTH_NAMES[(mm === 0 ? 12 : mm) - 1]} ’${String(year).slice(2)}` }
  })
})()

const EDGE_LABEL_CH = 6.85 // 0.682em at the 10px edge-label size
const EDGE_LABEL_H = 12

interface Box { x: number; y: number; w: number; h: number }

function hits(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

// A label pinned to the midpoint lands on top of whichever box the edge runs
// into whenever the edge is short or steeply diagonal. Walk along the edge (and
// to either side of it) and take the first placement that clears every
// obstacle. Obstacles include the labels already placed this pass: clearing only
// the node boxes let three labels around a short edge stack on each other, and
// with the halo turned on that reads as a label chewing a hole in a box border.
function placeLabel(
  label: string,
  x1: number, y1: number, x2: number, y2: number,
  obstacles: Box[],
): { x: number; y: number; box: Box } {
  const w = label.length * EDGE_LABEL_CH
  const vx = x2 - x1
  const vy = y2 - y1
  const len = Math.hypot(vx, vy) || 1
  const nx = -vy / len
  const ny = vx / len
  const ts = [0.5, 0.62, 0.38, 0.72, 0.28, 0.82, 0.2, 0.9, 0.1]
  // A short edge boxed in on both sides needs to reach past a whole node box —
  // roughly half the widest box plus half the label — before it finds clear
  // air, so the ladder runs well past the hugging distances.
  const offs = [13, -13, 22, -22, 32, -32, 44, -44, 58, -58, 76, -76, 96, -96]
  const boxAt = (cx: number, cy: number): Box =>
    ({ x: cx - w / 2 - 3, y: cy - EDGE_LABEL_H / 2 - 2, w: w + 6, h: EDGE_LABEL_H + 4 })

  // Offset-major: slide along the edge at every distance before stepping
  // further away from it, so a label never drifts off into space when a nearer
  // spot further along the line was free.
  for (const off of offs) {
    for (const t of ts) {
      const cx = x1 + vx * t + nx * off
      const cy = y1 + vy * t + ny * off
      const box = boxAt(cx, cy)
      if (box.x < 4 || box.x + box.w > VIEW_W - 4) continue
      if (box.y < 4 || box.y + box.h > FIELD_H) continue
      if (!obstacles.some((o) => hits(box, o))) return { x: cx, y: cy, box }
    }
  }
  const fx = x1 + vx * 0.5 + nx * 13
  const fy = y1 + vy * 0.5 + ny * 13
  return { x: fx, y: fy, box: boxAt(fx, fy) }
}

interface Seed { id: string; label: string; sub: string; kind: string; ax0: number; ay0: number; w: number }
interface SimNode { x: number; y: number; vx: number; vy: number }

// Edges attach to box edges, not centres, so a line never disappears under the
// box it points at.
function anchorPair(
  fx: number, fy: number, fw: number,
  tx: number, ty: number, tw: number,
) {
  const dx = tx - fx
  const dy = ty - fy
  const horiz = Math.abs(dx) > Math.abs(dy)
  return {
    x1: horiz ? fx + Math.sign(dx) * (fw / 2) : fx,
    y1: horiz ? fy : fy + Math.sign(dy) * (BOX_H / 2),
    x2: horiz ? tx - Math.sign(dx) * (tw / 2) : tx,
    y2: horiz ? ty : ty - Math.sign(dy) * (BOX_H / 2),
  }
}

export function Timeline() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.15 })
  const reduced = useReducedMotionGate()
  const [hoverNode, setHoverNode] = useState<string | null>(null)

  const seeds = useMemo<Seed[]>(() => {
    const laneTaken = new Map<string, number>()

    return TIMELINE_NODES.map((n) => {
      let lane = 0
      if (n.kind === "artifact") {
        const slot = `${n.track}:${n.date}`
        lane = (laneTaken.get(slot) ?? 0) + 1
        laneTaken.set(slot, lane)
      }
      const w = boxWidth(n.label, n.sub)
      const rawX = xOfMonth(monthIndex(n.date))
      return {
        id: n.id, label: n.label, sub: n.sub, kind: n.kind,
        ax0: Math.min(rawX, VIEW_W - w / 2 - 10),
        ay0: TRACK_Y[n.track] + lane * ARTIFACT_LANE,
        w,
      }
    })
  }, [])

  const indexById = useMemo(() => {
    const m = new Map<string, number>()
    seeds.forEach((s, i) => m.set(s.id, i))
    return m
  }, [seeds])

  // Seed geometry drives the initial render, so the markup is a correct,
  // readable layout before a single frame runs (and in a test environment,
  // where no frame ever runs).
  const seedEdges = useMemo(() => {
    const obstacles: Box[] = seeds.map((s) => ({
      x: s.ax0 - s.w / 2 - 4, y: s.ay0 - BOX_H / 2 - 4, w: s.w + 8, h: BOX_H + 8,
    }))
    return TIMELINE_EDGES.map((e) => {
      const f = seeds[indexById.get(e.from)!]
      const t = seeds[indexById.get(e.to)!]
      const a = anchorPair(f.ax0, f.ay0, f.w, t.ax0, t.ay0, t.w)
      const placed = placeLabel(e.label, a.x1, a.y1, a.x2, a.y2, obstacles)
      obstacles.push(placed.box)
      return { ...e, ...a, text: e.label, label: placed }
    })
  }, [seeds, indexById])

  const nodeRefs = useRef<(SVGGElement | null)[]>([])
  const edgeRefs = useRef<(SVGLineElement | null)[]>([])
  const edgeLabelRefs = useRef<(SVGTextElement | null)[]>([])
  const pulseRefs = useRef<(SVGCircleElement | null)[]>([])
  const dragRef = useRef<{ i: number; dx: number; dy: number } | null>(null)

  useEffect(() => {
    if (reduced || !inView) return

    const sim: SimNode[] = seeds.map((s) => ({ x: s.ax0, y: s.ay0, vx: 0, vy: 0 }))
    let raf = 0
    let t0 = performance.now()

    function frame(now: number) {
      const t = now - t0
      const drag = dragRef.current

      for (let i = 0; i < sim.length; i++) {
        const s = seeds[i]
        const n = sim[i]
        if (drag && drag.i === i) continue

        // Anchor, drifting so the whole figure keeps breathing.
        const ax = s.ax0 + Math.sin(t * DRIFT_W + i * 1.7) * DRIFT_A
        const ay = s.ay0 + Math.cos(t * DRIFT_W * 0.83 + i * 2.3) * DRIFT_A * 0.7
        let fx = (ax - n.x) * K_ANCHOR
        let fy = (ay - n.y) * K_ANCHOR

        for (let j = 0; j < sim.length; j++) {
          if (i === j) continue
          const o = sim[j]
          const dx = n.x - o.x
          const dy = n.y - o.y
          const d2 = Math.max(dx * dx + dy * dy, 400)
          const f = REP / d2 / Math.sqrt(d2)
          fx += dx * f
          fy += dy * f

          // Boxes must not overlap even while the springs argue about it.
          const ox = (s.w + seeds[j].w) / 2 + GAP - Math.abs(dx)
          const oy = BOX_H + GAP - Math.abs(dy)
          if (ox > 0 && oy > 0) {
            if (ox < oy) fx += Math.sign(dx || 1) * ox * SEP_K
            else fy += Math.sign(dy || 1) * oy * SEP_K
          }
        }

        n.vx = (n.vx + fx) * DAMP
        n.vy = (n.vy + fy) * DAMP
        const sp = Math.hypot(n.vx, n.vy)
        if (sp > V_MAX) { n.vx = (n.vx / sp) * V_MAX; n.vy = (n.vy / sp) * V_MAX }
        n.x += n.vx
        n.y += n.vy

        // Nothing leaves the frame.
        const halfW = s.w / 2 + 4
        n.x = Math.max(halfW, Math.min(VIEW_W - halfW, n.x))
        n.y = Math.max(BOX_H / 2 + 4, Math.min(FIELD_H - BOX_H / 2, n.y))
      }

      for (let i = 0; i < sim.length; i++) {
        const g = nodeRefs.current[i]
        if (g) g.setAttribute("transform", `translate(${(sim[i].x - seeds[i].ax0).toFixed(2)},${(sim[i].y - seeds[i].ay0).toFixed(2)})`)
      }

      const obstacles: Box[] = sim.map((n, i) => ({
        x: n.x - seeds[i].w / 2 - 4, y: n.y - BOX_H / 2 - 4, w: seeds[i].w + 8, h: BOX_H + 8,
      }))

      TIMELINE_EDGES.forEach((e, i) => {
        const fi = indexById.get(e.from)!
        const ti = indexById.get(e.to)!
        const a = anchorPair(sim[fi].x, sim[fi].y, seeds[fi].w, sim[ti].x, sim[ti].y, seeds[ti].w)
        const ln = edgeRefs.current[i]
        if (ln) {
          ln.setAttribute("x1", a.x1.toFixed(2)); ln.setAttribute("y1", a.y1.toFixed(2))
          ln.setAttribute("x2", a.x2.toFixed(2)); ln.setAttribute("y2", a.y2.toFixed(2))
        }
        // A dot running from cause to effect. The edges already say what caused
        // what, but only in words and only if you read the labels — a direction
        // of travel says it without any reading, and it is what turns the figure
        // from a static diagram into something that is visibly about causation.
        const pulse = pulseRefs.current[i]
        if (pulse) {
          const u = ((t / PULSE_MS + i * 0.17) % 1)
          pulse.setAttribute("cx", (a.x1 + (a.x2 - a.x1) * u).toFixed(2))
          pulse.setAttribute("cy", (a.y1 + (a.y2 - a.y1) * u).toFixed(2))
          // Fade in and out at the ends so a dot never pops into existence on
          // top of a box.
          pulse.setAttribute("opacity", (Math.sin(u * Math.PI) ** 0.6).toFixed(3))
        }

        const lb = edgeLabelRefs.current[i]
        if (lb) {
          const p = placeLabel(e.label, a.x1, a.y1, a.x2, a.y2, obstacles)
          obstacles.push(p.box)
          lb.setAttribute("x", p.x.toFixed(2)); lb.setAttribute("y", (p.y + 3).toFixed(2))
        }
      })

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    function toSvg(clientX: number, clientY: number) {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const ctm = svg.getScreenCTM()
      if (!ctm) return { x: 0, y: 0 }
      const inv = ctm.inverse()
      const pt = new DOMPoint(clientX, clientY).matrixTransform(inv)
      return { x: pt.x, y: pt.y }
    }

    function onMove(ev: PointerEvent) {
      const d = dragRef.current
      if (!d) return
      const p = toSvg(ev.clientX, ev.clientY)
      const n = sim[d.i]
      n.x = p.x + d.dx
      n.y = p.y + d.dy
      n.vx = 0; n.vy = 0
    }
    function onUp() {
      dragRef.current = null
      document.body.style.removeProperty("cursor")
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)

    const svg = svgRef.current
    function onDown(ev: PointerEvent) {
      const target = (ev.target as Element).closest("[data-node-index]")
      if (!target) return
      const i = Number(target.getAttribute("data-node-index"))
      const p = toSvg(ev.clientX, ev.clientY)
      dragRef.current = { i, dx: sim[i].x - p.x, dy: sim[i].y - p.y }
      document.body.style.cursor = "grabbing"
      ev.preventDefault()
    }
    svg?.addEventListener("pointerdown", onDown)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      svg?.removeEventListener("pointerdown", onDown)
      document.body.style.removeProperty("cursor")
    }
  }, [reduced, inView, seeds, indexById])

  return (
    <section className="figure-section bg-ink text-chalk py-20 px-[var(--edge,1.5rem)]" ref={sectionRef as React.RefObject<HTMLElement>}>
      <figure className="timeline max-w-[1100px] mx-auto">
        <figcaption className="timeline-caption mb-8">
          <span className="font-mono text-[0.6875rem] uppercase tracking-wide text-coral block mb-2">Trajectory</span>
          <span className="block max-w-[62ch]">
            Every job I&rsquo;ve had was caused by the one before it. Read it left to right &mdash;
            horizontal position is the date, the three rules are the tracks, and every arrow
            is one thing causing the next.
          </span>
        </figcaption>

        {/* The figure was legible and still got asked what it was, because
            nothing on it said what its own conventions meant: which boxes are
            jobs, which are things I made, and what a dashed line is claiming as
            opposed to a solid one. */}
        <ul className="timeline-legend mb-8 flex flex-wrap items-center gap-x-7 gap-y-3 font-mono text-[0.625rem] uppercase tracking-wide text-mute">
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-3 w-6 rounded-[2px] bg-signal" />
            Role
          </li>
          <li className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-3 w-6 rounded-[2px] border border-coral/70 bg-ink-2" />
            What it produced
          </li>
          <li className="flex items-center gap-2">
            <svg aria-hidden="true" width="26" height="8" className="overflow-visible">
              <line x1="0" y1="4" x2="26" y2="4" stroke="#FF5B4F" strokeWidth="1.5" />
            </svg>
            Caused
          </li>
          <li className="flex items-center gap-2">
            <svg aria-hidden="true" width="26" height="8" className="overflow-visible">
              <line x1="0" y1="4" x2="26" y2="4" stroke="#FF8F79" strokeWidth="1.5" strokeDasharray="5 5" strokeOpacity="0.6" />
            </svg>
            Alongside
          </li>
          <li className="text-coral/80">Drag any node</li>
        </ul>

        {/* Below ~900px the diagram would scale down far enough to make its
            12px labels unreadable. Scrolling it keeps type at a legible size
            instead of shrinking the whole figure to fit. */}
        <div className="overflow-x-auto -mx-[var(--edge,1.5rem)] px-[var(--edge,1.5rem)]">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="h-auto w-full min-w-[860px] touch-none select-none"
            role="img"
            aria-label="Career timeline across three tracks — TwelveLabs, Personal/OSS, and School — showing how each role caused the next"
          >
            {/* Time. Drawn first so every track, edge and box sits on top of
                it. The gridlines are what make the axis do any work — without
                them a date at the bottom of a tall figure is too far from the
                nodes to connect to them. */}
            <g>
              {TICKS.map((t) => (
                <line
                  key={`grid-${t.m}`}
                  x1={t.x} y1={40} x2={t.x} y2={AXIS_Y - 8}
                  stroke="#FF8F79" strokeOpacity={0.1} strokeWidth={1}
                />
              ))}
              <line
                x1={NODE_X_MIN - 40} y1={AXIS_Y} x2={NODE_X_MIN + NODE_X_SPAN + 40} y2={AXIS_Y}
                stroke="#FF8F79" strokeOpacity={0.25} strokeWidth={1}
              />
              {TICKS.map((t) => (
                <g key={`tick-${t.m}`}>
                  <line x1={t.x} y1={AXIS_Y - 4} x2={t.x} y2={AXIS_Y + 4} stroke="#FF8F79" strokeOpacity={0.45} strokeWidth={1} />
                  <text
                    x={t.x} y={AXIS_Y + 20} textAnchor="middle"
                    className="font-mono text-[10px] uppercase tracking-wider"
                    fill="#8593A6"
                  >
                    {t.label}
                  </text>
                </g>
              ))}
            </g>

            {(Object.keys(TRACK_Y) as TimelineTrack[]).map((track) => (
              <g key={track}>
                <line
                  x1={20} y1={TRACK_Y[track]} x2={VIEW_W - 10} y2={TRACK_Y[track]}
                  stroke="#FF8F79" strokeOpacity={0.18} strokeWidth={1}
                />
                <text x={20} y={TRACK_Y[track] - BOX_H / 2 - 12} className="fill-coral font-mono text-[11px] uppercase tracking-wider">
                  {TRACK_LABEL[track]}
                </text>
              </g>
            ))}

            {seedEdges.map((edge, i) => {
              const lit = hoverNode === edge.from || hoverNode === edge.to
              // Soft edges read as "alongside, not caused by" through dashes and
              // weight — never through a dimmer colour, which is what made this
              // edge invisible against the slate ground.
              const stroke = edge.soft ? "#FF8F79" : "#FF5B4F"
              return (
                <g
                  key={`${edge.from}-${edge.to}`}
                  style={{
                    opacity: reduced || inView ? 1 : 0,
                    transition: reduced ? undefined : `opacity .45s ease ${0.25 + i * 0.07}s`,
                  }}
                >
                  <line
                    ref={(el) => { edgeRefs.current[i] = el }}
                    // Tagged because the figure now draws several kinds of line
                    // — track rules, axis, ticks, gridlines — and "every line
                    // after the first three" stopped meaning the causal edges.
                    data-causal-edge=""
                    x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2}
                    stroke={stroke}
                    strokeOpacity={lit ? 1 : edge.soft ? 0.5 : 0.75}
                    strokeDasharray={edge.soft ? "5 5" : undefined}
                    strokeWidth={lit ? 2.5 : 1.5}
                    style={{ transition: "stroke-opacity .2s ease, stroke-width .2s ease" }}
                  />
                  <text
                    ref={(el) => { edgeLabelRefs.current[i] = el }}
                    x={edge.label.x} y={edge.label.y + 3}
                    textAnchor="middle"
                    className="font-mono text-[10px] uppercase tracking-wide"
                    fill={lit ? "#EDF2F8" : "#FF8F79"}
                    fillOpacity={lit ? 1 : 0.85}
                    // Punches the ground colour out from under the glyphs so an
                    // edge passing behind the label never strikes through it.
                    stroke="#18202D"
                    strokeWidth={4}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                    style={{ transition: "fill .2s ease" }}
                  >
                    {edge.text}
                  </text>
                  {/* Soft edges are "alongside", not "caused" — giving them a
                      direction of travel would assert something the data does
                      not. They stay dashed and still. */}
                  {!reduced && !edge.soft && (
                    <circle
                      ref={(el) => { pulseRefs.current[i] = el }}
                      cx={edge.x1} cy={edge.y1} r={2.6}
                      fill="#FFB3A3" opacity={0}
                    />
                  )}
                </g>
              )
            })}

            {seeds.map((node, i) => {
              const isRole = node.kind === "role"
              const active = hoverNode === node.id
              return (
                <g
                  key={node.id}
                  ref={(el) => { nodeRefs.current[i] = el }}
                  data-node-index={i}
                  onMouseEnter={() => setHoverNode(node.id)}
                  onMouseLeave={() => setHoverNode(null)}
                  style={{
                    cursor: reduced ? "default" : "grab",
                    opacity: reduced || inView ? 1 : 0,
                    transition: reduced ? undefined : `opacity .4s ease ${i * 0.06}s`,
                  }}
                >
                  <rect
                    x={node.ax0 - node.w / 2}
                    y={node.ay0 - BOX_H / 2}
                    width={node.w}
                    height={BOX_H}
                    rx={3}
                    fill={isRole ? "#FF5B4F" : "#18202D"}
                    stroke={isRole ? "#FF5B4F" : "#FF8F79"}
                    strokeWidth={active ? 2 : 1}
                    strokeOpacity={isRole ? 1 : active ? 1 : 0.65}
                    style={{ transition: "stroke-width .18s ease, stroke-opacity .18s ease" }}
                  />
                  <text x={node.ax0} y={node.ay0 - 3} textAnchor="middle" className="font-mono text-[12px]" fill={isRole ? "#0A0D13" : "#EDF2F8"}>
                    {node.label}
                  </text>
                  <text
                    x={node.ax0} y={node.ay0 + 12} textAnchor="middle"
                    className="font-mono text-[9px] uppercase tracking-wide"
                    fill={isRole ? "#3D0A06" : "#FF8F79"}
                  >
                    {node.sub}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </figure>
    </section>
  )
}
