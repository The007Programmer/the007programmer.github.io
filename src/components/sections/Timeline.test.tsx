import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Timeline } from './Timeline'
import { TIMELINE_NODES, TIMELINE_EDGES } from '@/data/timeline'

describe('Timeline', () => {
  it('renders every node label', () => {
    render(<Timeline />)
    for (const node of TIMELINE_NODES) {
      expect(screen.getByText(node.label)).toBeInTheDocument()
    }
  })

  it('renders the causal caption', () => {
    render(<Timeline />)
    expect(screen.getByText(/Every job I've had was caused by the one before it/)).toBeInTheDocument()
  })

  // jsdom has no geometry, so every node being in the DOM says nothing about
  // whether it is visible. These read the coordinates off the shipped markup.
  it('gives every node a distinct coordinate', () => {
    const { container } = render(<Timeline />)
    const circles = Array.from(container.querySelectorAll('circle'))
    expect(circles).toHaveLength(TIMELINE_NODES.length)
    const points = circles.map((c) => `${c.getAttribute('cx')},${c.getAttribute('cy')}`)
    expect(new Set(points).size).toBe(TIMELINE_NODES.length)
  })

  it('draws every causal edge with non-zero length', () => {
    const { container } = render(<Timeline />)
    const lines = Array.from(container.querySelectorAll('line'))
    expect(lines).toHaveLength(TIMELINE_EDGES.length)
    for (const line of lines) {
      const from = `${line.getAttribute('x1')},${line.getAttribute('y1')}`
      const to = `${line.getAttribute('x2')},${line.getAttribute('y2')}`
      expect(from).not.toBe(to)
    }
  })

  // Track labels are drawn at x=8 and run out to roughly x=90 for the
  // longest ("Personal / OSS"). No node may sit left of that or its circle
  // collides with the label text — a real, visible collision the fill-mute
  // -> fill-coral change made legible for the first time.
  it('keeps every node clear of the track labels on the left edge', () => {
    const { container } = render(<Timeline />)
    const circles = Array.from(container.querySelectorAll('circle'))
    const minCx = Math.min(...circles.map((c) => Number(c.getAttribute('cx'))))
    expect(minCx).toBeGreaterThanOrEqual(120)
  })
})
