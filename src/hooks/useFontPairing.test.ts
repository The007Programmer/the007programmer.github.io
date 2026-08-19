import { describe, it, expect, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useFontPairing } from './useFontPairing'

describe('useFontPairing', () => {
  afterEach(() => {
    window.history.pushState({}, '', '/')
  })

  it('defaults to tempting when no ?font param is present', () => {
    const { result } = renderHook(() => useFontPairing())
    expect(result.current).toBe('tempting')
  })

  it('reads a valid ?font param', () => {
    window.history.pushState({}, '', '/?font=archivo')
    const { result } = renderHook(() => useFontPairing())
    expect(result.current).toBe('archivo')
  })

  it('falls back to tempting for an unrecognized ?font value', () => {
    window.history.pushState({}, '', '/?font=nonsense')
    const { result } = renderHook(() => useFontPairing())
    expect(result.current).toBe('tempting')
  })
})
