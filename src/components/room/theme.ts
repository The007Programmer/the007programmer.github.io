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

/* 3D palettes. DOM colours come from the CSS variables in index.css. */
export const PAL = {
  dark: { bg: "#07090e", wall: "#121926", wallSide: "#0f1520", floor: "#0e131c", rug: "#1a222f", ceil: "#090c12", base: "#1a2332", ambient: 0.14, key: 0.1, fogNear: 3.2, fogFar: 9 },
  light: { bg: "#dfe3e8", wall: "#d6d2ca", wallSide: "#cfcbc3", floor: "#8f8678", rug: "#8a8478", ceil: "#ece9e3", base: "#bdb7ab", ambient: 0.75, key: 1.5, fogNear: 6, fogFar: 16 },
} as const
