import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Work } from './Work'
import { PROJECT_CARDS, ELECTRA } from '@/data/work'

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
