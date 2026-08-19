import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Path } from './Path'
import { LEDGER_ROWS } from '@/data/path'

describe('Path', () => {
  it('renders every ledger row title and org', () => {
    render(<Path />)
    for (const row of LEDGER_ROWS) {
      expect(screen.getByText(row.title)).toBeInTheDocument()
      expect(screen.getAllByText(row.org).length).toBeGreaterThan(0)
    }
  })
})
