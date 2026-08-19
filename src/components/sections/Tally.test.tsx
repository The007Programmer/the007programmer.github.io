import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tally } from './Tally'

vi.mock('@/hooks/useLiveRepoCount', () => ({ useLiveRepoCount: (fallback: number) => fallback }))

describe('Tally', () => {
  it('renders all three stats with their labels', () => {
    render(<Tally />)
    expect(screen.getByText('public repositories')).toBeInTheDocument()
    expect(screen.getByText('writeups, my byline')).toBeInTheDocument()
    expect(screen.getByText(/GPA at Texas A&M/)).toBeInTheDocument()
  })
})
