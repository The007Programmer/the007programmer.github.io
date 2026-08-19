import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import CursorEffect from './CursorEffect'

vi.mock('@/hooks/useReducedMotionGate', () => ({
  useReducedMotionGate: () => true,
}))

describe('CursorEffect', () => {
  it('renders nothing when reduced motion is preferred', () => {
    const { container } = render(<CursorEffect />)
    expect(container.firstChild).toBeNull()
  })
})
