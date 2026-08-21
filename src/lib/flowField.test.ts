import { describe, it, expect } from 'vitest'
import { shortestArc, proximity, steer } from './flowField'

const TAU = Math.PI * 2

describe('shortestArc', () => {
  it('takes the short way round the wrap point', () => {
    // 0.1 -> 2π-0.1 is 0.2 backwards, not 6.08 forwards.
    expect(shortestArc(0.1, TAU - 0.1)).toBeCloseTo(-0.2, 6)
    expect(shortestArc(TAU - 0.1, 0.1)).toBeCloseTo(0.2, 6)
  })

  it('is invariant to whole turns on either argument', () => {
    const base = shortestArc(0.4, 2.3)
    expect(shortestArc(0.4 + TAU * 3, 2.3 - TAU * 2)).toBeCloseTo(base, 6)
  })

  it('never returns a distance longer than half a turn', () => {
    for (let a = -10; a < 10; a += 0.37) {
      for (let b = -10; b < 10; b += 0.53) {
        expect(Math.abs(shortestArc(a, b))).toBeLessThanOrEqual(Math.PI + 1e-9)
      }
    }
  })
})

describe('proximity', () => {
  it('is 1 under the pointer and 0.5 at the radius', () => {
    expect(proximity(0, 0, 300)).toBeCloseTo(1, 6)
    expect(proximity(300, 0, 300)).toBeCloseTo(0.5, 6)
    expect(proximity(0, 300, 300)).toBeCloseTo(0.5, 6)
  })

  it('decays monotonically and stays in (0, 1]', () => {
    let prev = Infinity
    for (let d = 0; d < 4000; d += 50) {
      const w = proximity(d, 0, 300)
      expect(w).toBeGreaterThan(0)
      expect(w).toBeLessThanOrEqual(1)
      expect(w).toBeLessThan(prev)
      prev = w
    }
  })
})

describe('steer', () => {
  it('leaves the angle untouched when there is no pull', () => {
    expect(steer(1.2, 40, 40, 300, 0, 1)).toBe(1.2)
  })

  it('turns toward the swirled target rather than away from it', () => {
    const angle = 0
    const dx = 0
    const dy = 100 // target straight below, atan2 = +π/2
    const swirl = 0
    const out = steer(angle, dx, dy, 300, 0.7, swirl)
    expect(out).toBeGreaterThan(angle)
    expect(out).toBeLessThan(Math.PI / 2)
  })

  it('never overshoots the target for any pull in [0, 1]', () => {
    // The guard that matters: a particle that swings past the pointer and has
    // to come back is what a stream flicking backwards looks like on screen.
    for (const pull of [0.1, 0.5, 0.7, 1]) {
      for (let a = -6; a < 6; a += 0.41) {
        for (const [dx, dy] of [[10, 0], [0, -240], [-500, 320], [3, -3]]) {
          const gap = shortestArc(a, Math.atan2(dy, dx) + 1.15)
          const moved = steer(a, dx, dy, 340, pull, 1.15) - a
          expect(Math.abs(moved)).toBeLessThanOrEqual(Math.abs(gap) + 1e-9)
          if (gap !== 0) expect(Math.sign(moved)).toBe(Math.sign(gap))
        }
      }
    }
  })

  it('bends a near particle much harder than a distant one', () => {
    const near = Math.abs(steer(0, 30, 30, 340, 0.7, 1.15))
    const far = Math.abs(steer(0, 1800, 1800, 340, 0.7, 1.15))
    expect(near).toBeGreaterThan(far * 8)
  })
})
