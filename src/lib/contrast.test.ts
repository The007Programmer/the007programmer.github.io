import { describe, it, expect } from 'vitest'
import { contrastRatio } from './contrast'

describe('contrastRatio', () => {
  it('computes white on black as 21:1', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1)
  })

  it('computes identical colors as 1:1', () => {
    expect(contrastRatio('#C4261E', '#C4261E')).toBeCloseTo(1, 5)
  })

  it('clears 4.5:1 for signal red on paper, both directions', () => {
    expect(contrastRatio('#C4261E', '#FFF1ED')).toBeGreaterThanOrEqual(4.5)
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
    expect(contrastRatio('#FFF1ED', '#C4261E')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 4.5:1 for paper text on the button hover background', () => {
    expect(contrastRatio('#FFF1ED', '#B5241B')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 4.5:1 for slate title on the project card background', () => {
    expect(contrastRatio('#39434F', '#FFE4DC')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 4.5:1 for slate-2 stamp/description on the project card background', () => {
    expect(contrastRatio('#4B5563', '#FFE4DC')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 4.5:1 for paper/70 opacity text (Path ledger org) on slate background', () => {
    // paper (#FFF1ED) at 70% opacity alpha-blended over slate (#39434F)
    // Result: RGB(196, 189, 190) = #C4BDBE
    expect(contrastRatio('#C4BDBE', '#39434F')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 4.5:1 for paper/85 opacity text (Path ledger body) on slate background', () => {
    // paper (#FFF1ED) at 85% opacity alpha-blended over slate (#39434F)
    // Result: RGB(225, 215, 213) = #E1D7D5
    expect(contrastRatio('#E1D7D5', '#39434F')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 4.5:1 for coral timeline track labels on slate', () => {
    expect(contrastRatio('#FFA795', '#39434F')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 4.5:1 for paper on slate (timeline text, stuck topbar, Path headings)', () => {
    expect(contrastRatio('#FFF1ED', '#39434F')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 4.5:1 for mute on paper-2 (Tally labels)', () => {
    expect(contrastRatio('#5A6675', '#FFE4DC')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 3.0:1 for signal on paper-2 (Tally numerals, text-5xl)', () => {
    expect(contrastRatio('#C4261E', '#FFE4DC')).toBeGreaterThanOrEqual(3.0)
  })

  it('clears 4.5:1 for slate-2 on paper (Toolkit and Work body text)', () => {
    expect(contrastRatio('#4B5563', '#FFF1ED')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 4.5:1 for slate on paper (section titles, footer name)', () => {
    expect(contrastRatio('#39434F', '#FFF1ED')).toBeGreaterThanOrEqual(4.5)
  })

  it('clears 4.5:1 for ember on paper-2 (ProjectCard and Work links)', () => {
    expect(contrastRatio('#B5241B', '#FFE4DC')).toBeGreaterThanOrEqual(4.5)
  })
})

// CursorEffect paints rgba(196,38,30,0.06) over the whole viewport at z-[3],
// above <main>. At the gradient's centre it tints foreground and background
// alike, so the pairings it can cover are re-checked in their composited form.
describe('contrast under the cursor glow', () => {
  const GLOW = [196, 38, 30]
  const GLOW_ALPHA = 0.06

  function composite(hex: string): string {
    const n = hex.replace('#', '')
    const channels = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16))
    return (
      '#' +
      channels
        .map((c, i) => Math.round(GLOW_ALPHA * GLOW[i] + (1 - GLOW_ALPHA) * c).toString(16).padStart(2, '0'))
        .join('')
    )
  }

  it('keeps hero paper-on-signal above 4.5:1', () => {
    expect(contrastRatio(composite('#FFF1ED'), composite('#C4261E'))).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps Tally mute-on-paper-2 above 4.5:1', () => {
    expect(contrastRatio(composite('#5A6675'), composite('#FFE4DC'))).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps timeline coral-on-slate above 4.5:1', () => {
    expect(contrastRatio(composite('#FFA795'), composite('#39434F'))).toBeGreaterThanOrEqual(4.5)
  })
})
