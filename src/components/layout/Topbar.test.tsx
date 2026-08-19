import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Topbar } from './Topbar'

const SECTIONS = [
  { id: 'work', label: 'Work' },
  { id: 'path', label: 'Path' },
  { id: 'toolkit', label: 'Toolkit' },
  { id: 'contact', label: 'Contact' },
]

describe('Topbar', () => {
  it('renders the mark and every section link', () => {
    render(<Topbar sections={SECTIONS} />)
    expect(screen.getByRole('link', { name: 'AS' })).toHaveAttribute('href', '#top')
    for (const s of SECTIONS) {
      expect(screen.getByRole('link', { name: s.label })).toHaveAttribute('href', `#${s.id}`)
    }
  })

  it('renders a skip link pointing at #main', () => {
    render(<Topbar sections={SECTIONS} />)
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute('href', '#main')
  })
})
