import { describe, it, expect } from 'vitest'
import { contrastRatio } from './contrast'

// The palette from src/index.css @theme, kept in one place so these assertions
// describe the colours the site actually ships rather than a remembered set.
const GROUND = {
  void: '#0A0D13',
  ink: '#111722',
  'ink-2': '#18202D',
} as const

const INK = {
  chalk: '#EDF2F8',
  'chalk-2': '#AFBBCB',
  mute: '#8593A6',
  signal: '#FF5B4F',
  coral: '#FF8F79',
} as const

const LINE = '#2E3A54'
const EDGE = '#617599'
const EMBER = '#C4261E'

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1)
  })

  it('returns 1 for a colour against itself', () => {
    expect(contrastRatio(INK.signal, INK.signal)).toBeCloseTo(1, 5)
  })
})

// The dark pivot's central claim: any ink may be set on any ground. If that
// stops being true the palette has to change, not the markup — so it is
// asserted exhaustively rather than for the pairings that happen to be used.
describe('every ink on every ground', () => {
  for (const [inkName, ink] of Object.entries(INK)) {
    for (const [groundName, ground] of Object.entries(GROUND)) {
      it(`${inkName} on ${groundName} clears AA 4.5:1`, () => {
        expect(contrastRatio(ink, ground)).toBeGreaterThanOrEqual(4.5)
      })
    }
  }
})

describe('filled surfaces take dark type', () => {
  // This is the rule ActionButton and the timeline's role nodes both follow.
  it('void on signal clears AA, so a red fill is legible', () => {
    expect(contrastRatio(GROUND.void, INK.signal)).toBeGreaterThanOrEqual(4.5)
  })

  // A regression guard, not a curiosity: white-on-red is the obvious thing to
  // write and it fails. If this ever starts passing the rule can be relaxed;
  // until then, anything filled with signal must use void for its label.
  it('chalk on signal FAILS AA — which is why nothing does it', () => {
    expect(contrastRatio(INK.chalk, INK.signal)).toBeLessThan(4.5)
  })

  it('void on chalk clears AA for the inverted button', () => {
    expect(contrastRatio(GROUND.void, INK.chalk)).toBeGreaterThanOrEqual(4.5)
  })

  it('chalk on ember clears AA for the heavier red fill', () => {
    expect(contrastRatio(INK.chalk, EMBER)).toBeGreaterThanOrEqual(4.5)
  })
})

describe('the trajectory figure', () => {
  // The figure sits on ink. Its strokes are graphics, not text, so the bar is
  // the 3:1 non-text minimum.
  it('edge strokes clear 3:1 on the figure ground', () => {
    expect(contrastRatio(INK.signal, GROUND.ink)).toBeGreaterThanOrEqual(3)
    expect(contrastRatio(INK.coral, GROUND.ink)).toBeGreaterThanOrEqual(3)
  })

  it('node labels clear AA against the artifact-node fill', () => {
    expect(contrastRatio(INK.chalk, GROUND['ink-2'])).toBeGreaterThanOrEqual(4.5)
  })
})

describe('control boundaries', () => {
  // WCAG 1.4.11: the edge of an input is a non-text element that carries
  // meaning, so it needs 3:1 against what surrounds it. The contact fields sat
  // at 1.7:1 on void and were genuinely invisible in a screenshot.
  it('edge clears 3:1 on every ground', () => {
    for (const [name, ground] of Object.entries(GROUND)) {
      expect(`${name}: ${contrastRatio(EDGE, ground) >= 3}`).toBe(`${name}: true`)
    }
  })

  it('line does NOT clear 3:1 — which is why controls do not use it', () => {
    expect(contrastRatio(LINE, GROUND.void)).toBeLessThan(3)
  })
})

describe('hairlines', () => {
  // Non-text and deliberately quiet, but it still has to be a visible edge.
  it('line is distinguishable from every ground', () => {
    for (const ground of Object.values(GROUND)) {
      expect(contrastRatio(LINE, ground)).toBeGreaterThan(1.15)
    }
  })
})

// CursorEffect paints rgba(255,91,79,0.10) over the viewport above <main>. At
// the gradient's centre it tints ink and ground alike, so the pairings it can
// cover are re-checked in their composited form.
describe('contrast under the cursor glow', () => {
  const GLOW = [255, 91, 79]
  const GLOW_ALPHA = 0.1

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

  for (const [inkName, ink] of Object.entries(INK)) {
    for (const [groundName, ground] of Object.entries(GROUND)) {
      it(`${inkName} on ${groundName} still clears AA under the glow`, () => {
        expect(contrastRatio(composite(ink), composite(ground))).toBeGreaterThanOrEqual(4.5)
      })
    }
  }
})
