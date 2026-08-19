import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Timeline } from './Timeline'
import { TIMELINE_NODES } from '@/data/timeline'

describe('Timeline', () => {
  it('renders every node label', () => {
    render(<Timeline />)
    for (const node of TIMELINE_NODES) {
      expect(screen.getByText(node.label)).toBeInTheDocument()
    }
  })

  it('renders the causal caption', () => {
    render(<Timeline />)
    expect(screen.getByText(/Every job I've had was caused by the one before it/)).toBeInTheDocument()
  })
})
