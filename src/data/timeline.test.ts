import { describe, it, expect } from 'vitest'
import { TIMELINE_NODES, TIMELINE_EDGES } from './timeline'

describe('timeline data integrity', () => {
  it('every edge references nodes that exist', () => {
    const ids = new Set(TIMELINE_NODES.map((n) => n.id))
    for (const edge of TIMELINE_EDGES) {
      expect(ids.has(edge.from), `edge.from "${edge.from}" is not a known node id`).toBe(true)
      expect(ids.has(edge.to), `edge.to "${edge.to}" is not a known node id`).toBe(true)
    }
  })

  it('has exactly one node per role kind for TwelveLabs (devex, agentsec)', () => {
    const roles = TIMELINE_NODES.filter((n) => n.kind === 'role')
    expect(roles.map((n) => n.id).sort()).toEqual(['agentsec', 'devex'])
  })

  it('runs oldest to newest by date', () => {
    const dates = TIMELINE_NODES.map((n) => n.date)
    const sorted = [...dates].sort()
    // Not a strict equality (nodes can share a month), but no node may be
    // dated before the node before it in the declared array — the whole
    // point of the chronology rule from the old README.
    expect(dates).toEqual(sorted)
  })
})
