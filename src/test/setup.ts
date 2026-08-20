import '@testing-library/jest-dom/vitest'

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

if (typeof window !== 'undefined' && !window.IntersectionObserver) {
  class IntersectionObserverStub {
    root = null
    rootMargin = ''
    thresholds: ReadonlyArray<number> = []
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  window.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver
}

// jsdom has no 2D canvas. Components that paint one guard on a null context and
// degrade correctly, but jsdom's stub *throws* rather than returning null, which
// buries real failures under a wall of not-implemented traces. Returning null is
// what a browser without canvas support would do, and what the guards expect.
if (typeof window !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext']
}
