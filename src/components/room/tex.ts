import { useEffect, useMemo } from "react"
import { useThree } from "@react-three/fiber"
import * as THREE from "three"

export const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = rej
    i.src = src
  })

export function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, top = false) {
  const s = Math.max(w / img.width, h / img.height)
  const sw = w / s, sh = h / s
  ctx.drawImage(img, (img.width - sw) / 2, top ? 0 : (img.height - sh) / 2, sw, sh, x, y, w, h)
}

export function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, maxLines = 99) {
  const words = text.split(" ")
  let line = "", n = 0
  for (const w of words) {
    const t = line ? line + " " + w : w
    if (ctx.measureText(t).width > maxW && line) {
      if (++n >= maxLines) { ctx.fillText(line + "…", x, y); return }
      ctx.fillText(line, x, y); y += lh; line = w
    } else line = t
  }
  ctx.fillText(line, x, y)
}

export const DISPLAY = '800 {s}px "Bricolage Grotesque", "Arial Black", sans-serif'
export const MONO = '700 {s}px "Martian Mono", ui-monospace, monospace'
export const f = (tpl: string, s: number) => tpl.replace("{s}", String(s))

export function useCanvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void | Promise<void>, key: string) {
  const invalidate = useThree((s) => s.invalidate)
  const tex = useMemo(() => {
    const c = document.createElement("canvas")
    c.width = w; c.height = h
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [w, h])
  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        await Promise.all([document.fonts?.load(f(DISPLAY, 40)), document.fonts?.load(f(MONO, 20))])
      } catch { /* fonts optional */ }
      if (!live) return
      const ctx = (tex.image as HTMLCanvasElement).getContext("2d")!
      ctx.clearRect(0, 0, w, h)
      try { await draw(ctx) } catch { /* image failed */ }
      tex.needsUpdate = true
      invalidate()
    })()
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex, key])
  return tex
}
