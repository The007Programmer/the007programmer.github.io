import { describe, it, expect } from 'vitest'
import { createField, colourAt, readBands, readRepulsors } from './agentField'
import type { Band } from './agentField'

describe('colourAt', () => {
  const bands: Band[] = [
    { top: 0, bottom: 100, colour: 'rgb(255, 241, 237)' },
    { top: 100, bottom: 300, colour: 'rgb(214, 43, 34)' },
    { top: 300, bottom: 600, colour: 'rgb(57, 67, 79)' },
  ]

  it('returns the band colour for a point inside it', () => {
    expect(colourAt(bands, 50)).toBe('rgb(255, 241, 237)')
    expect(colourAt(bands, 200)).toBe('rgb(214, 43, 34)')
  })

  it('clamps out-of-range points to the nearest band rather than the last', () => {
    expect(colourAt(bands, -500)).toBe('rgb(255, 241, 237)')
    expect(colourAt(bands, 5000)).toBe('rgb(57, 67, 79)')
  })

  it('falls back to the body colour when there are no bands', () => {
    const result = colourAt([], 100)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('createField', () => {
  it('seeds the requested number of agents with stable identity ids', () => {
    const field = createField({ w: 1440, h: 900, n: 70, seed: 7 })
    expect(field.agents).toHaveLength(70)
    expect(new Set(field.agents.map((a) => a.id)).size).toBe(70)
  })

  it('never leaves an agent outside the canvas bounds after stepping', () => {
    const field = createField({ w: 1440, h: 900, n: 70, seed: 7 })
    for (let i = 0; i < 200; i++) field.step(16)
    for (const a of field.agents) {
      expect(a.x).toBeGreaterThanOrEqual(0)
      expect(a.x).toBeLessThanOrEqual(1440)
      expect(a.y).toBeGreaterThanOrEqual(0)
      expect(a.y).toBeLessThanOrEqual(900)
    }
  })

  it('ejects every agent that starts inside a repulsor rect', () => {
    const field = createField({ w: 1440, h: 900, n: 70, seed: 7 })
    const rects = [{ left: 0, top: 0, right: 1440, bottom: 100 }]
    field.setRepulsors(rects)
    for (const a of field.agents) {
      const inside = a.x > rects[0].left && a.x < rects[0].right && a.y > rects[0].top && a.y < rects[0].bottom
      expect(inside).toBe(false)
    }
  })
})

describe('readBands / readRepulsors', () => {
  it('read from the DOM without throwing when no matching elements exist', () => {
    expect(() => readBands()).not.toThrow()
    expect(() => readRepulsors()).not.toThrow()
    expect(readBands()).toEqual([])
    expect(readRepulsors()).toEqual([])
  })
})
