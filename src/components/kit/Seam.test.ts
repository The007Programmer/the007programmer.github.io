import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { GROUND, ramp, type Ground } from './Seam'

// The seam interpolates ground colours numerically, so it holds a second copy of
// them outside the token layer. That copy silently going stale is the whole risk:
// a seam ramping to a colour the next section no longer uses puts the hard step
// straight back, and it looks close enough to right that nobody notices.
describe('Seam grounds', () => {
  // Read, not imported: vitest runs with CSS processing off, so `?raw` on a
  // stylesheet comes back empty rather than as its text. Relative to the repo
  // root, which is where the suite runs from.
  const css = readFileSync('src/index.css', 'utf8')

  function token(name: string): [number, number, number] {
    const m = css.match(new RegExp(`--color-${name}:\\s*#([0-9A-Fa-f]{6})`))
    if (!m) throw new Error(`--color-${name} not found in index.css`)
    const h = m[1]
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
  }

  it.each(Object.keys(GROUND) as Ground[])('%s matches its --color token', (name) => {
    expect([...GROUND[name]]).toEqual(token(name))
  })
})

describe('ramp', () => {
  const rgb = (g: Ground) => `rgb(${GROUND[g].join(', ')})`

  it('starts on the outgoing ground and lands exactly on the incoming one', () => {
    // Either end being even one channel off is a visible line, which is the
    // exact defect the seam exists to remove.
    const g = ramp('void', 'ink')
    expect(g).toContain(`${rgb('void')} 0.0%`)
    expect(g).toContain(`${rgb('ink')} 100.0%`)
  })

  it('is monotonic per channel across every stop', () => {
    const stops = [...ramp('void', 'ink-2').matchAll(/rgb\((\d+), (\d+), (\d+)\)/g)].map((m) =>
      m.slice(1).map(Number)
    )
    expect(stops.length).toBeGreaterThan(2)
    for (let c = 0; c < 3; c++) {
      for (let i = 1; i < stops.length; i++) {
        expect(stops[i][c]).toBeGreaterThanOrEqual(stops[i - 1][c])
      }
    }
  })

  it('emits a flat band when both sides share a ground', () => {
    const stops = new Set([...ramp('void', 'void').matchAll(/rgb\([^)]+\)/g)].map((m) => m[0]))
    expect(stops.size).toBe(1)
  })
})

// The seam sequence in App.tsx is the part that actually rots. Sections get
// reordered or restyled, and a seam left ramping to the wrong ground puts the
// hard step back — quietly, because a wrong dark grey still looks like a
// gradient. This walks the page as written and checks every join.
describe('the page’s seam sequence', () => {
  const app = readFileSync('src/App.tsx', 'utf8')
  const main = app.slice(app.indexOf('<main'), app.indexOf('</main>'))

  /** The ground a section paints, from its own root element. */
  function groundOf(component: string): Ground {
    const src = readFileSync(`src/components/sections/${component}.tsx`, 'utf8')
    const tag = src.slice(src.indexOf('<section'))
    const cls = tag.slice(0, tag.indexOf('>'))
    // ink-2 first: `bg-ink` is a prefix of it.
    if (/\bbg-ink-2\b/.test(cls)) return 'ink-2'
    if (/\bbg-ink\b/.test(cls)) return 'ink'
    // No bg class means the section sits on the body, which is --color-void.
    return 'void'
  }

  const nodes = [...main.matchAll(/<(Seam|[A-Z]\w+)\b([^>]*)\/>/g)].map((m) => ({
    name: m[1],
    attrs: m[2],
  }))

  it('finds the page it is meant to be checking', () => {
    expect(nodes.filter((n) => n.name === 'Seam').length).toBeGreaterThan(3)
    expect(nodes.filter((n) => n.name !== 'Seam').length).toBeGreaterThan(5)
  })

  it('puts a seam between every pair of adjacent sections', () => {
    const sections = nodes.filter((n) => n.name !== 'Seam').map((n) => n.name)
    for (let i = 0; i < nodes.length - 1; i++) {
      if (nodes[i].name !== 'Seam' && nodes[i + 1].name !== 'Seam') {
        throw new Error(`no seam between <${nodes[i].name}> and <${nodes[i + 1].name}>`)
      }
    }
    expect(sections.length).toBeGreaterThan(0)
  })

  it('ramps each seam from the ground above it to the ground below it', () => {
    nodes.forEach((node, i) => {
      if (node.name !== 'Seam') return
      const above = nodes[i - 1]
      const below = nodes[i + 1]
      expect(above, `seam at index ${i} has nothing above it`).toBeDefined()
      expect(below, `seam at index ${i} has nothing below it`).toBeDefined()

      const from = node.attrs.match(/from="([\w-]+)"/)?.[1]
      const to = node.attrs.match(/to="([\w-]+)"/)?.[1]
      expect(from, `seam between ${above.name} and ${below.name} has no from`).toBeDefined()
      expect(to, `seam between ${above.name} and ${below.name} has no to`).toBeDefined()

      expect(from, `seam below <${above.name}>`).toBe(groundOf(above.name))
      expect(to, `seam above <${below.name}>`).toBe(groundOf(below.name))
    })
  })
})
