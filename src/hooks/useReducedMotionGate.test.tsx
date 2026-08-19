import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useReducedMotionGate } from './useReducedMotionGate'

vi.mock('motion/react', () => ({
  useReducedMotion: () => true,
}))

describe('useReducedMotionGate', () => {
  it('returns true when Motion reports reduced motion is preferred', () => {
    const { result } = renderHook(() => useReducedMotionGate())
    expect(result.current).toBe(true)
  })
})
