import * as THREE from "three"

/* Procedural surfaces. Generated once on canvas, no downloads. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function tex(c: HTMLCanvasElement, rx = 1, ry = 1, srgb = true) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rx, ry)
  t.anisotropy = 8
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  return t
}
function canvas(n: number) { const c = document.createElement("canvas"); c.width = c.height = n; return c }

export function woodTex(base: string, rx = 2, ry = 1) {
  const c = canvas(512), g = c.getContext("2d")!, r = rng(7)
  g.fillStyle = base; g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 220; i++) {
    const y = r() * 512, a = 0.03 + r() * 0.08
    g.strokeStyle = r() > 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,220,170,${a * 0.6})`
    g.lineWidth = 0.6 + r() * 2.2
    g.beginPath(); g.moveTo(0, y)
    for (let x = 0; x <= 512; x += 64) g.lineTo(x, y + Math.sin(x / 90 + i) * (1 + r() * 2))
    g.stroke()
  }
  return tex(c, rx, ry)
}

/* grey noise: use as roughness/bump variation or tinted albedo */
export function noiseTex(base: string, amp = 0.08, rx = 4, ry = 4, srgb = true, grain = 1) {
  const c = canvas(256), g = c.getContext("2d")!, r = rng(11)
  g.fillStyle = base; g.fillRect(0, 0, 256, 256)
  const im = g.getImageData(0, 0, 256, 256)
  for (let i = 0; i < im.data.length; i += 4) {
    const n = (r() - 0.5) * 255 * amp * grain
    im.data[i] += n; im.data[i + 1] += n; im.data[i + 2] += n
  }
  g.putImageData(im, 0, 0)
  return tex(c, rx, ry, srgb)
}

export function corkTex() {
  const c = canvas(512), g = c.getContext("2d")!, r = rng(3)
  g.fillStyle = "#6a4f35"; g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(${r() > 0.5 ? "30,18,8" : "200,150,90"},${0.08 + r() * 0.2})`
    g.beginPath(); g.arc(r() * 512, r() * 512, 0.8 + r() * 2.4, 0, 7); g.fill()
  }
  return tex(c, 1, 1)
}

/* soft radial glow for additive sprites */
export function glowTex() {
  const c = canvas(128), g = c.getContext("2d")!
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)")
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128)
  return tex(c, 1, 1)
}
