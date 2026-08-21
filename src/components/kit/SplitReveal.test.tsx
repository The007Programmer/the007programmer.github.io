import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SplitReveal } from './SplitReveal'

// The split happens at runtime and is meant to be invisible to anything that
// reads the page rather than watching it. jsdom never fires the observer, so
// what these assert is the shipped state: a real heading with real words.
describe('SplitReveal', () => {
  it('renders as a heading element by default', () => {
    render(<SplitReveal>What I shipped</SplitReveal>)
    expect(screen.getByRole('heading', { name: 'What I shipped' })).toBeInTheDocument()
  })

  it('honours the element it is told to be', () => {
    render(<SplitReveal as="h3">On my own time</SplitReveal>)
    const el = screen.getByRole('heading', { name: 'On my own time' })
    expect(el.tagName).toBe('H3')
  })

  it('ships the text as text, not as a pile of per-character spans', () => {
    const { container } = render(<SplitReveal className="x">Say something</SplitReveal>)
    const el = container.querySelector('.x') as HTMLElement
    expect(el.textContent).toBe('Say something')
    expect(el.querySelectorAll('span')).toHaveLength(0)
  })
})
