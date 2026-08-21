import { useEffect, useRef } from "react"
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate"
import { cn } from "@/lib/utils"

/**
 * The name decodes itself — the load-in from the published site, ported.
 *
 * Every letter starts as noise and swaps glyphs on a mechanical beat until its
 * turn comes to lock. Two things make it work, and both are easy to leave out:
 *
 * 1. Each slot is pinned to the width of its FINAL letter, and only ever swaps
 *    among letters of roughly that width. Left free, an M lands in an i's slot
 *    and the whole name reflows under itself on every frame.
 * 2. It waits for the real display face before measuring. Widths taken in the
 *    fallback font are wrong, so the letters would lock into the wrong boxes.
 *
 * That second point is why this is not anime.js's scrambleText, which is
 * otherwise exactly this effect: it has no notion of slot width, and at 12rem
 * in a display face the jitter is the whole animation.
 */

const NOISE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
const HOLD = 160 // ms of pure noise before anything resolves
const STAGGER = 70 // ms between one letter landing and the next
const SETTLE = 420 // ms each letter spends unresolved
const SWAP = 45 // ms between glyph swaps — mechanical, not smooth
/** Past this, a slow font load means showing the name plainly beats decoding it
    seconds after the reader has already read it. */
const FONT_WAIT = 900

interface Cell {
  el: HTMLSpanElement
  final: string
  pool: string[]
  lockAt: number
  done: boolean
}

/** Width of every candidate letter, in the real face at the real size. */
function measureNoise(host: HTMLElement): { ch: string; w: number }[] {
  const probe = document.createElement("span")
  probe.className = "ch"
  probe.style.position = "absolute"
  probe.style.visibility = "hidden"
  probe.style.width = "auto"
  host.appendChild(probe)
  const out = NOISE.split("").map((ch) => {
    probe.textContent = ch
    return { ch, w: probe.getBoundingClientRect().width }
  })
  host.removeChild(probe)
  return out
}

/** The letters closest in width to the slot they have to sit in. */
function nearestWidths(widths: { ch: string; w: number }[], target: number): string[] {
  const close = widths.filter((x) => Math.abs(x.w - target) <= target * 0.12)
  if (close.length >= 5) return close.map((x) => x.ch)
  // Nothing near enough — a very narrow letter like "i". Take the closest
  // handful rather than widening into glyphs that would spill.
  return [...widths]
    .sort((a, b) => Math.abs(a.w - target) - Math.abs(b.w - target))
    .slice(0, 8)
    .map((x) => x.ch)
}

const pick = (pool: string[]) => pool[(Math.random() * pool.length) | 0]

export interface ScrambleNameProps {
  /** One entry per rendered line. */
  lines: string[]
  className?: string
  lineClassName?: string
}

export function ScrambleName({ lines, className, lineClassName }: ScrambleNameProps) {
  const hostRef = useRef<HTMLSpanElement | null>(null)
  const reduced = useReducedMotionGate()

  useEffect(() => {
    if (reduced) return
    const host = hostRef.current
    if (!host) return

    let raf = 0
    let cancelled = false
    let cells: Cell[] = []

    /** Put every line back to plain text, exactly as React rendered it. */
    const restore = () => {
      for (const line of Array.from(host.querySelectorAll<HTMLElement>("[data-line]"))) {
        const text = lines[Number(line.dataset.line)]
        if (text !== undefined) line.textContent = text
      }
      cells = []
    }

    const start = () => {
      if (cancelled) return
      const lineEls = Array.from(host.querySelectorAll<HTMLElement>("[data-line]"))
      if (!lineEls.length) return

      // Split into per-character spans, keeping the real letters in place so
      // they can be measured before any scrambling starts.
      for (const line of lineEls) {
        const text = (line.textContent ?? "").trim()
        line.textContent = ""
        for (const ch of text) {
          const span = document.createElement("span")
          span.className = "ch"
          span.textContent = ch
          line.appendChild(span)
          if (ch.trim()) {
            cells.push({ el: span, final: ch, pool: [], lockAt: 0, done: false })
          }
        }
      }
      if (!cells.length) return

      const widths = measureNoise(host)
      const slots = cells.map((c) => c.el.getBoundingClientRect().width)

      // No layout, no effect. Everything that keeps this from turning into a
      // reflowing mess — the pinned slot widths, the width-matched noise pools —
      // is measured, and where nothing measures (a test environment, a hidden
      // subtree) every width comes back 0. Then every letter is "closest" to
      // every other, the pools are the whole alphabet, and the name decodes into
      // a jumble of the wrong widths. Leave it as the name instead.
      if (slots.some((w) => w <= 0) || widths.every((x) => x.w <= 0)) {
        restore()
        return
      }

      cells.forEach((c, i) => {
        c.el.style.width = `${slots[i]}px`
        c.pool = nearestWidths(widths, slots[i])
        c.el.textContent = pick(c.pool)
        c.el.classList.add("is-noise")
        c.lockAt = HOLD + i * STAGGER + SETTLE
      })

      const total = HOLD + (cells.length - 1) * STAGGER + SETTLE
      const t0 = performance.now()
      let last = -SWAP

      const frame = (now: number) => {
        const t = now - t0
        if (t - last >= SWAP) {
          last = t
          for (const c of cells) {
            if (c.done) continue
            if (t >= c.lockAt) {
              c.el.textContent = c.final
              c.el.classList.remove("is-noise")
              c.done = true
            } else {
              c.el.textContent = pick(c.pool)
            }
          }
        }
        if (t < total + SWAP) {
          raf = requestAnimationFrame(frame)
        } else {
          // Never leave a letter stuck as noise.
          for (const c of cells) {
            c.el.textContent = c.final
            c.el.classList.remove("is-noise")
          }
        }
      }
      raf = requestAnimationFrame(frame)
    }

    // Wait briefly for the display face; past that, leave the name alone. A
    // name that renders correctly and THEN scrambles itself two seconds later
    // does not read as an entrance, it reads as a fault.
    let ran = false
    const go = (scramble: boolean) => {
      if (ran || cancelled) return
      ran = true
      if (scramble) start()
    }
    let timer = 0
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => go(true))
      timer = window.setTimeout(() => go(false), FONT_WAIT)
    } else {
      go(true)
    }

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
      // Hand the DOM back the way React left it. The split is done by hand
      // outside React's knowledge, so unmounting mid-decode would otherwise
      // leave it reconciling against spans it never created.
      restore()
    }
  }, [reduced, lines])

  return (
    <span ref={hostRef} className={cn("hero-name", className)}>
      {lines.map((line, i) => (
        <span key={line} data-line={i} className={cn("line block", lineClassName)}>
          {line}
        </span>
      ))}
    </span>
  )
}
