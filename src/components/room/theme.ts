export type Theme = "dark" | "light"
const KEY = "room-theme"

export function initialTheme(): Theme {
  try {
    const s = localStorage.getItem(KEY)
    if (s === "dark" || s === "light") return s
  } catch { /* storage blocked */ }
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
}

export function applyTheme(t: Theme, persist = false) {
  document.documentElement.dataset.theme = t
  if (persist) {
    try { localStorage.setItem(KEY, t) } catch { /* storage blocked */ }
  }
}

/* 3D palettes and the canvas-drawn UI tokens (DOM reads the CSS variables). */
export const PAL = {
  dark: { bg: "#0B0908", wall: "#2a1f19", wallSide: "#211812", floor: "#1c1510", rug: "#33241c", ceil: "#0d0a08", base: "#2a201a", fogNear: 3.2, fogFar: 9 },
  light: { bg: "#F2EBD2", wall: "#E9D8B8", wallSide: "#E0CDAA", floor: "#9E6240", rug: "#81ADC8", ceil: "#F8F2DC", base: "#CBB48F", fogNear: 6, fogFar: 16 },
} as const
export const TOK = {
  dark: { void: "#0B0908", ink: "#14100E", ink2: "#1D1815", edge: "#7C7C7C", chalk: "#EEE5E9", chalk2: "#D2C4B4", signal: "#E06A42" },
  light: { void: "#F8F2DC", ink: "#EFE7CB", ink2: "#FDFAEC", edge: "#9E6240", chalk: "#2B1B13", chalk2: "#5E3F2B", signal: "#B73A27" },
} as const
