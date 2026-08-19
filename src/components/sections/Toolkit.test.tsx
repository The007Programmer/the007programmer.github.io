import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Toolkit } from './Toolkit'
import { TOOLKIT_GROUPS } from '@/data/toolkit'

describe('Toolkit', () => {
  it('renders every group title', () => {
    render(<Toolkit />)
    for (const g of TOOLKIT_GROUPS) {
      expect(screen.getByText(g.title)).toBeInTheDocument()
    }
  })
})
