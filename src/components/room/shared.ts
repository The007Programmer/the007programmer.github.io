import type { ThreeEvent } from "@react-three/fiber"
import type { MutableRefObject } from "react"
import type { SId } from "./stations"
import type { Theme } from "./theme"

export interface Input { px: number; py: number; ox: number; oy: number; inv?: () => void }
export interface Ctx {
  focus: SId | null
  card: string | null
  lamp: boolean
  theme: Theme
  reduced: boolean
  narrow: boolean
  goto: (id: SId) => void
  openCard: (id: string) => void
  toggleLamp: () => void
  toggleTheme: () => void
  toast: (m: string) => void
  hover: (l: string | null) => void
}
export type InputRef = MutableRefObject<Input>

export const C = { void: "#0B0908", ink2: "#1D1815", edge: "#7C7C7C", chalk: "#EEE5E9", signal: "#CF5C36", ember: "#CD4631" }
export const DESK_Y = 0.8

/* shadow maps are frozen; anything that moves on the desk marks them dirty */
export const shadow = { dirty: true }
/* ambient critters ask for a slow frame tick (ms until the next render); the Ticker applies the smallest ask */
export const ambient = { next: Infinity }

export function setCursor(on: boolean) { document.body.style.cursor = on ? "pointer" : "" }
export const hovFor = (ctx: Ctx, label: string) => ({
  onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setCursor(true); ctx.hover(label) },
  onPointerOut: () => { setCursor(false); ctx.hover(null) },
})

/* which desk card the pointer is on (kept briefly after it leaves, so the camera does not flap): the rig leans toward it */
export const cardHover = { id: null as string | null }
