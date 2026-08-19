import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Work, pickNearest, moveById, type CardCenter } from './Work'
import { PROJECT_CARDS, ELECTRA } from '@/data/work'

// A 3-column grid of 200x100 cards, gap 20 — mirrors the lg breakpoint.
const GRID: CardCenter[] = [
  { id: 'a', cx: 100, cy: 50 },
  { id: 'b', cx: 320, cy: 50 },
  { id: 'c', cx: 540, cy: 50 },
  { id: 'd', cx: 100, cy: 170 },
  { id: 'e', cx: 320, cy: 170 },
  { id: 'f', cx: 540, cy: 170 },
]

describe('pickNearest', () => {
  it('picks the card whose centre is closest to the drop point', () => {
    // 'a' dragged one column right and one row down lands exactly on 'e'
    expect(pickNearest(GRID, 'a', { x: 220, y: 120 })).toBe('e')
  })

  it('resolves a drop across both axes to the far corner', () => {
    expect(pickNearest(GRID, 'a', { x: 440, y: 120 })).toBe('f')
  })

  it('picks the dragged card itself when it barely moved', () => {
    expect(pickNearest(GRID, 'c', { x: 4, y: -3 })).toBe('c')
  })

  it('breaks an exact tie towards the earlier card', () => {
    // dropped exactly halfway between 'a' (100,50) and 'b' (320,50)
    expect(pickNearest(GRID, 'a', { x: 110, y: 0 })).toBe('a')
    // and halfway between 'b' and 'c', dragging 'f' in from elsewhere
    expect(pickNearest(GRID, 'f', { x: -110, y: -120 })).toBe('b')
  })

  it('returns null when the dragged id was never measured', () => {
    expect(pickNearest(GRID, 'ghost', { x: 0, y: 0 })).toBeNull()
  })
})

describe('moveById', () => {
  const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
  const ids = (l: { id: string }[]) => l.map((i) => i.id)

  it('moves an item forwards, landing it at the target slot', () => {
    expect(ids(moveById(list, 'a', 'c'))).toEqual(['b', 'c', 'a', 'd'])
  })

  it('moves an item backwards, landing it at the target slot', () => {
    expect(ids(moveById(list, 'd', 'b'))).toEqual(['a', 'd', 'b', 'c'])
  })

  it('moves an item to the very end and to the very front', () => {
    expect(ids(moveById(list, 'a', 'd'))).toEqual(['b', 'c', 'd', 'a'])
    expect(ids(moveById(list, 'd', 'a'))).toEqual(['d', 'a', 'b', 'c'])
  })

  it('returns the list untouched for a self-drop', () => {
    expect(moveById(list, 'b', 'b')).toBe(list)
  })

  it('returns the list untouched when either id is unknown', () => {
    expect(moveById(list, 'ghost', 'b')).toBe(list)
    expect(moveById(list, 'b', 'ghost')).toBe(list)
  })

  it('does not mutate the input list', () => {
    moveById(list, 'a', 'd')
    expect(ids(list)).toEqual(['a', 'b', 'c', 'd'])
  })
})

describe('Work', () => {
  it('renders the Electra feature and every project card title', () => {
    render(<Work />)
    expect(screen.getByText(ELECTRA.title)).toBeInTheDocument()
    for (const p of PROJECT_CARDS) {
      expect(screen.getByText(p.title)).toBeInTheDocument()
    }
  })

  it('lays the project cards out in a responsive grid', () => {
    const { container } = render(<Work />)
    const cards = container.querySelector('.cards')
    expect(cards).toHaveClass('grid', 'sm:grid-cols-2', 'lg:grid-cols-3')
    expect(cards).not.toHaveClass('flex-col')
  })

  it('renders every OSS item', () => {
    render(<Work />)
    expect(screen.getByText('MAGI')).toBeInTheDocument()
    expect(screen.getByText('clair')).toBeInTheDocument()
  })
})
