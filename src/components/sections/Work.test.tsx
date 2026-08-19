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

  it('renders every OSS item', () => {
    render(<Work />)
    expect(screen.getByText('MAGI')).toBeInTheDocument()
    expect(screen.getByText('clair')).toBeInTheDocument()
  })
})
