export interface Agent {
  x: number; y: number; vx: number; vy: number
  id: number; phase: number; trust: number
}
export interface Rect { left: number; top: number; right: number; bottom: number }
export interface Band { top: number; bottom: number; colour: string }
export interface FieldOpts { w: number; h: number; n: number; seed?: number }
export interface Field {
  agents: Agent[]
  step: (dt: number) => void
  setRepulsors: (rects: Rect[]) => void
}

export const STANDOFF = 24 // px of clear air around glyphs

const BAND_SEL = "main > section, body > footer"
const TEXT_SEL = [
  ".topbar", ".hero-name", ".hero-thesis", ".hero-meta", ".eyebrow",
  ".section-title", ".card-title", ".card-desc",
  ".feature h3", ".feature p",
  ".tally-num", ".tally-label", ".tally-note",
  ".ledger-when", ".ledger-what",
  ".kit-group", ".contact-title", ".contact-copy", ".contact-links",
  ".form", ".timeline", ".timeline-caption",
  ".foot-name", ".foot-meta",
].join(",")

export function readBands(): Band[] {
  const out: Band[] = []
  document.querySelectorAll(BAND_SEL).forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.height <= 0) return
    out.push({ top: r.top, bottom: r.bottom, colour: window.getComputedStyle(el).color })
  })
  return out
}

export function colourAt(bands: Band[], y: number): string {
  if (!bands.length) return window.getComputedStyle(document.body).color
  if (y < bands[0].top) return bands[0].colour
  for (const b of bands) if (y >= b.top && y < b.bottom) return b.colour
  return bands[bands.length - 1].colour
}

export function readRepulsors(): Rect[] {
  const out: Rect[] = []
  document.querySelectorAll(TEXT_SEL).forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return
    out.push({ left: r.left - STANDOFF, top: r.top - STANDOFF, right: r.right + STANDOFF, bottom: r.bottom + STANDOFF })
  })
  return out
}

const SEP = 260, SEP_R = 34, ALIGN = 0.055, COH = 0.0016, NEAR = 130
const WANDER = 0.055, REP = 3.6, DAMP = 0.94, V_MAX = 1.5
const EDGE = 60, EDGE_K = 0.02
const TRUST_DECAY = 0.0022, TRUST_RECOVER = 0.003, TRUST_FLOOR = 0.06

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createField(opts: FieldOpts): Field {
  const { w, h } = opts
  const rnd = mulberry32(opts.seed ?? 1)
  const agents: Agent[] = []
  let rects: Rect[] = []
  let clock = 0

  for (let i = 0; i < opts.n; i++) {
    agents.push({
      x: EDGE + rnd() * (w - 2 * EDGE),
      y: EDGE + rnd() * (h - 2 * EDGE),
      vx: (rnd() - 0.5) * 0.6,
      vy: (rnd() - 0.5) * 0.6,
      id: i,
      phase: rnd() * Math.PI * 2,
      trust: rnd(),
    })
  }

  function escapeTarget(pos: number, other: number, axisIsY: boolean, dir: number): number {
    let p = pos, moved = true, guard = 0
    while (moved && guard < 16) {
      moved = false
      guard++
      for (const r of rects) {
        const lo = axisIsY ? r.top : r.left
        const hi = axisIsY ? r.bottom : r.right
        const oLo = axisIsY ? r.left : r.top
        const oHi = axisIsY ? r.right : r.bottom
        if (other <= oLo || other >= oHi) continue
        if (p > lo && p < hi) { p = dir < 0 ? lo - 1 : hi + 1; moved = true }
      }
    }
    return p
  }

  function ejectFromRects() {
    for (const a of agents) {
      let guard = 0
      while (guard < 8) {
        guard++
        let hit = false
        for (const r of rects) {
          if (a.x > r.left && a.x < r.right && a.y > r.top && a.y < r.bottom) { hit = true; break }
        }
        if (!hit) break

        const upY = escapeTarget(a.y, a.x, true, -1)
        const downY = escapeTarget(a.y, a.x, true, 1)
        const leftX = escapeTarget(a.x, a.y, false, -1)
        const rightX = escapeTarget(a.x, a.y, false, 1)
        const dUp = a.y - upY, dDown = downY - a.y, dLeft = a.x - leftX, dRight = rightX - a.x
        const m = Math.min(dUp, dDown, dLeft, dRight)

        if (m === dUp) a.y = upY
        else if (m === dDown) a.y = downY
        else if (m === dLeft) a.x = leftX
        else a.x = rightX

        a.vx = 0; a.vy = 0
      }
    }
  }

  function setRepulsors(next: Rect[]) {
    rects = next || []
    ejectFromRects()
  }

  function step(dt: number) {
    clock += dt
    for (const a of agents) {
      let ax = 0, ay = 0, cx = 0, cy = 0, hx = 0, hy = 0, n = 0

      for (const b of agents) {
        if (a === b) continue
        const dx = a.x - b.x, dy = a.y - b.y
        const d2 = dx * dx + dy * dy
        if (d2 > NEAR * NEAR || d2 === 0) continue
        const d = Math.sqrt(d2)
        if (d < SEP_R) { ax += (dx / d) * (SEP / d2); ay += (dy / d) * (SEP / d2) }
        cx += b.x; cy += b.y; hx += b.vx; hy += b.vy; n++
      }

      if (n > 0) {
        ax += (hx / n - a.vx) * ALIGN * a.trust
        ay += (hy / n - a.vy) * ALIGN * a.trust
        ax += (cx / n - a.x) * COH * a.trust
        ay += (cy / n - a.y) * COH * a.trust
        a.trust -= TRUST_DECAY * dt * n * 0.12
      } else {
        a.trust += TRUST_RECOVER * dt
      }
      if (a.trust < TRUST_FLOOR) a.trust = TRUST_FLOOR
      if (a.trust > 1) a.trust = 1

      ax += Math.sin(clock * 0.0016 + a.phase) * WANDER
      ay += Math.cos(clock * 0.0013 + a.phase * 1.7) * WANDER

      for (const r of rects) {
        if (a.x <= r.left || a.x >= r.right || a.y <= r.top || a.y >= r.bottom) continue
        const dl = a.x - r.left, dr = r.right - a.x, dtp = a.y - r.top, db = r.bottom - a.y
        const m = Math.min(dl, dr, dtp, db)
        if (m === dl) ax -= REP
        else if (m === dr) ax += REP
        else if (m === dtp) ay -= REP
        else ay += REP
      }

      if (a.x < EDGE) ax += (EDGE - a.x) * EDGE_K
      if (a.x > w - EDGE) ax -= (a.x - (w - EDGE)) * EDGE_K
      if (a.y < EDGE) ay += (EDGE - a.y) * EDGE_K
      if (a.y > h - EDGE) ay -= (a.y - (h - EDGE)) * EDGE_K

      a.vx = (a.vx + ax) * DAMP
      a.vy = (a.vy + ay) * DAMP
      const sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy)
      if (sp > V_MAX) { a.vx = (a.vx / sp) * V_MAX; a.vy = (a.vy / sp) * V_MAX }
      a.x += a.vx * dt
      a.y += a.vy * dt

      if (a.x < 0) { a.x = 0; a.vx = 0 }
      if (a.x > w) { a.x = w; a.vx = 0 }
      if (a.y < 0) { a.y = 0; a.vy = 0 }
      if (a.y > h) { a.y = h; a.vy = 0 }
    }
    ejectFromRects()
  }

  return { agents, step, setRepulsors }
}
