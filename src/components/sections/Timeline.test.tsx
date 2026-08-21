import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Timeline } from './Timeline'
import { TIMELINE_NODES, TIMELINE_EDGES } from '@/data/timeline'
import { contrastRatio } from '@/lib/contrast'

// --color-ink, the band the figure sits on.
const FIGURE_GROUND = '#111722'

const VIEW_W = 1000
const BOX_H = 40
const EDGE_LABEL_CH = 6.85
const EDGE_LABEL_H = 12

interface Rect { x: number; y: number; w: number; h: number }

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

function boxes(container: HTMLElement) {
  // The three track rules are <line>s; node boxes are the only <rect>s.
  return Array.from(container.querySelectorAll('rect')).map((r) => ({
    x: Number(r.getAttribute('x')),
    y: Number(r.getAttribute('y')),
    w: Number(r.getAttribute('width')),
    h: Number(r.getAttribute('height')),
  }))
}

describe('Timeline', () => {
  it('renders every node label', () => {
    render(<Timeline />)
    for (const node of TIMELINE_NODES) {
      expect(screen.getByText(node.label)).toBeInTheDocument()
    }
  })

  it('renders the causal caption', () => {
    render(<Timeline />)
    expect(screen.getByText(/Every job I.ve had was caused by the one before it/)).toBeInTheDocument()
  })

  // Every edge label ships in the DOM unconditionally. They used to render
  // only on hover, which meant nobody scrolling past ever saw the causal
  // story the figure exists to tell.
  it('renders every edge label without needing hover', () => {
    render(<Timeline />)
    for (const edge of TIMELINE_EDGES) {
      expect(screen.getAllByText(edge.label).length).toBeGreaterThan(0)
    }
  })

  // jsdom has no geometry, so "in the document" says nothing about whether a
  // node is visible. These read coordinates off the shipped markup.
  it('gives every node a box that overlaps no other node box', () => {
    const { container } = render(<Timeline />)
    const rects = boxes(container)
    expect(rects).toHaveLength(TIMELINE_NODES.length)
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i]
        const b = rects[j]
        const overlaps =
          a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
        expect(overlaps).toBe(false)
      }
    }
  })

  it('keeps every node box inside the viewBox', () => {
    const { container } = render(<Timeline />)
    for (const b of boxes(container)) {
      expect(b.x).toBeGreaterThanOrEqual(0)
      expect(b.x + b.w).toBeLessThanOrEqual(VIEW_W)
      expect(b.h).toBe(BOX_H)
    }
  })

  it('draws every causal edge with non-zero length', () => {
    const { container } = render(<Timeline />)
    const edges = Array.from(container.querySelectorAll('line[data-causal-edge]'))
    expect(edges).toHaveLength(TIMELINE_EDGES.length)
    for (const line of edges) {
      const from = `${line.getAttribute('x1')},${line.getAttribute('y1')}`
      const to = `${line.getAttribute('x2')},${line.getAttribute('y2')}`
      expect(from).not.toBe(to)
    }
  })

  // Labels used to clear only the node boxes, so several crowding one short
  // edge stacked on top of each other — and with the halo on, a label sitting
  // over a box border eats a hole in it.
  it('places every edge label clear of every node box and of every other label', () => {
    const { container } = render(<Timeline />)
    const rects = boxes(container)
    const labels = Array.from(container.querySelectorAll('text'))
      .filter((t) => TIMELINE_EDGES.some((e) => e.label === t.textContent))
      .map((t) => {
        const w = (t.textContent ?? '').length * EDGE_LABEL_CH
        const cx = Number(t.getAttribute('x'))
        const cy = Number(t.getAttribute('y')) - 3
        return { x: cx - w / 2, y: cy - EDGE_LABEL_H / 2, w, h: EDGE_LABEL_H, text: t.textContent }
      })
    expect(labels).toHaveLength(TIMELINE_EDGES.length)

    for (const l of labels) {
      for (const r of rects) {
        expect(`${l.text} vs box: ${overlaps(l, r)}`).toBe(`${l.text} vs box: false`)
      }
    }
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        expect(`${labels[i].text} vs ${labels[j].text}: ${overlaps(labels[i], labels[j])}`)
          .toBe(`${labels[i].text} vs ${labels[j].text}: false`)
      }
    }
  })

  // The figure reads left-to-right as time, and now says so out loud. Which
  // means the axis and the node positions have to be the same mapping: an axis
  // that disagrees with the thing it is labelling is worse than no axis, because
  // it is confidently wrong and nothing about it looks broken.
  it('places every node at the date its own axis claims', () => {
    const { container } = render(<Timeline />)

    const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const ticks = Array.from(container.querySelectorAll('text'))
      .map((t) => ({ text: (t.textContent ?? '').trim(), x: Number(t.getAttribute('x')) }))
      .map((t) => {
        const m = t.text.match(/^([A-Za-z]{3})\s*[’']?(\d{2})$/)
        if (!m) return null
        return { x: t.x, idx: (2000 + Number(m[2])) * 12 + MONTHS.indexOf(m[1].toLowerCase()) + 1 }
      })
      .filter((t): t is { x: number; idx: number } => t !== null)
      .sort((a, b) => a.idx - b.idx)

    expect(ticks.length).toBeGreaterThanOrEqual(4)

    // Ticks must march in one direction, or "left to right is time" is a lie.
    for (let i = 1; i < ticks.length; i++) {
      expect(ticks[i].x).toBeGreaterThan(ticks[i - 1].x)
    }

    // Fit the axis from its own two ends, then check every node against it.
    const a = ticks[0]
    const b = ticks[ticks.length - 1]
    const pxPerMonth = (b.x - a.x) / (b.idx - a.idx)
    const axisX = (idx: number) => a.x + (idx - a.idx) * pxPerMonth

    // The axis has to span the data, not a slice of it.
    const nodeIdx = TIMELINE_NODES.map((n) => {
      const [y, m] = n.date.split('-').map(Number)
      return y * 12 + m
    })
    expect(a.idx).toBe(Math.min(...nodeIdx))
    expect(b.idx).toBe(Math.max(...nodeIdx))

    const rects = boxes(container)
    TIMELINE_NODES.forEach((node, i) => {
      const [y, m] = node.date.split('-').map(Number)
      const centre = rects[i].x + rects[i].w / 2
      // Half a pixel of rounding, no more. A node nudged right to keep its box
      // inside the frame would land on the wrong month and read as a lie.
      expect(Math.abs(centre - axisX(y * 12 + m))).toBeLessThan(0.5)
    })
  })

  // An "alongside" edge was once drawn in #5A6675 on the old slate ground —
  // 1.7:1, effectively invisible. Soft edges must say "soft" through dashes and
  // weight, never through a stroke too dim to see against the figure's ground.
  it('draws every edge in a stroke that clears 3:1 against the figure ground', () => {
    const { container } = render(<Timeline />)
    const edges = Array.from(container.querySelectorAll('line[data-causal-edge]'))
    expect(edges).toHaveLength(TIMELINE_EDGES.length)
    for (const line of edges) {
      const stroke = line.getAttribute('stroke')
      expect(stroke).toBeTruthy()
      expect(contrastRatio(stroke as string, FIGURE_GROUND)).toBeGreaterThanOrEqual(3)
    }
  })
})
