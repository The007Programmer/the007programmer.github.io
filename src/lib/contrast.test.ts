import { describe, it, expect } from 'vitest'
import { contrastRatio } from './contrast'

describe('contrastRatio', () => {
  it('computes white on black as 21:1', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1)
  })

  it('computes identical colors as 1:1', () => {
    expect(contrastRatio('#D62B22', '#D62B22')).toBeCloseTo(1, 5)
  })

  it('clears 4.5:1 for signal red on paper, both directions', () => {
    expect(contrastRatio('#D62B22', '#FFF1ED')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 4.5:1 for ember on paper', () => {
    expect(contrastRatio('#B5241B', '#FFF1ED')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 3.0:1 for coral on slate (large text only)', () => {
    expect(contrastRatio('#FFA795', '#39434F')).toBeGreaterThanOrEqual(3.0)
  })

  it('clears 4.5:1 for mute on paper', () => {
    expect(contrastRatio('#5A6675', '#FFF1ED')).toBeGreaterThanOrEqual(4.5)
  })

  it('rejects a pairing that does not clear AA, proving the check is not tautological', () => {
    expect(contrastRatio('#FFA795', '#FFF1ED')).toBeLessThan(4.5)
  })

  it('clears 4.5:1 for paper text on signal button background', () => {
    expect(contrastRatio('#FFF1ED', '#D62B22')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 4.5:1 for paper text on the button hover background', () => {
    expect(contrastRatio('#FFF1ED', '#B5241B')).toBeGreaterThanOrEqual(4.5)
  })
})
