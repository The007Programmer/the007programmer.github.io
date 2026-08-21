import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScrambleName } from './ScrambleName'

const NAME = ['Aahil', 'Shaikh']

describe('ScrambleName', () => {
  it('renders each line as readable text', () => {
    render(<ScrambleName lines={NAME} />)
    expect(screen.getByText('Aahil')).toBeInTheDocument()
    expect(screen.getByText('Shaikh')).toBeInTheDocument()
  })

  // The effect splits the DOM by hand, outside React. jsdom has no layout, so
  // every measured width is 0 — which would make every letter "closest" to
  // every other, hand the whole alphabet to every slot, and decode the name
  // into a jumble of glyphs that never lands. Without geometry it must decline
  // to run at all and leave the name alone. This is also what protects any
  // hidden or not-yet-laid-out subtree in a real browser.
  it('declines to scramble where nothing can be measured', () => {
    const { container } = render(<ScrambleName lines={NAME} />)
    expect(container.querySelectorAll('.ch')).toHaveLength(0)
    expect(container.textContent).toBe('AahilShaikh')
  })

  it('leaves the text intact after unmounting mid-decode', () => {
    const { container, unmount } = render(<ScrambleName lines={NAME} />)
    unmount()
    expect(container.textContent).toBe('')
  })

  it('marks up one line element per line, in order', () => {
    const { container } = render(<ScrambleName lines={NAME} />)
    const lines = Array.from(container.querySelectorAll('[data-line]'))
    expect(lines.map((l) => l.textContent)).toEqual(NAME)
    expect(lines.map((l) => (l as HTMLElement).dataset.line)).toEqual(['0', '1'])
  })
})
