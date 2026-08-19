import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLiveRepoCount } from './useLiveRepoCount'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useLiveRepoCount', () => {
  it('returns the fallback immediately, then the live count once fetched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ public_repos: 18 }),
    }))

    const { result } = renderHook(() => useLiveRepoCount(15))
    expect(result.current).toBe(15)
    await waitFor(() => expect(result.current).toBe(18))
  })

  it('keeps the fallback if the fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const { result } = renderHook(() => useLiveRepoCount(15))
    await new Promise((r) => setTimeout(r, 10))
    expect(result.current).toBe(15)
  })
})
