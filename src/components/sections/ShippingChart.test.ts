import { describe, it, expect } from 'vitest'
import { shippedByMonth } from './ShippingChart'
import { TIMELINE_NODES } from '@/data/timeline'

describe('shippedByMonth', () => {
  const series = shippedByMonth()

  it('counts everything that is not a role', () => {
    const made = TIMELINE_NODES.filter((n) => n.kind !== 'role').length
    expect(series[series.length - 1].shipped).toBe(made)
  })

  // The chart draws a running total, and a running total cannot go down. This
  // is not a formality: the chart's default curve is a natural spline, which
  // overshoots between points and drew a visible dip across two quiet months —
  // a decline that never happened, rendered convincingly.
  it('never decreases', () => {
    for (let i = 1; i < series.length; i++) {
      expect(series[i].shipped).toBeGreaterThanOrEqual(series[i - 1].shipped)
    }
  })

  it('emits every month in the range, including the quiet ones', () => {
    const months = TIMELINE_NODES.map((n) => {
      const [y, m] = n.date.split('-').map(Number)
      return y * 12 + (m - 1)
    })
    expect(series).toHaveLength(Math.max(...months) - Math.min(...months) + 1)

    // Consecutive, one calendar month apart, no gaps and no repeats. A missing
    // month silently rescales the months either side of it.
    for (let i = 1; i < series.length; i++) {
      const prev = series[i - 1].date
      const cur = series[i].date
      const gap = (cur.getFullYear() - prev.getFullYear()) * 12 + (cur.getMonth() - prev.getMonth())
      expect(gap).toBe(1)
    }
  })

  it('starts on the month of the earliest thing that happened', () => {
    const first = series[0].date
    const earliest = TIMELINE_NODES.map((n) => n.date).sort()[0]
    const [y, m] = earliest.split('-').map(Number)
    expect(first.getFullYear()).toBe(y)
    expect(first.getMonth()).toBe(m - 1)
  })
})
