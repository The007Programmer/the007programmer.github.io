import { lazy, Suspense } from "react"
import DeskSite from "@/components/canvas/DeskSite"
import { applyTheme, initialTheme } from "./theme"

const Room = lazy(() => import("./Room"))

function canWebGL() {
  try {
    const c = document.createElement("canvas")
    return !!(c.getContext("webgl2") || c.getContext("webgl"))
  } catch {
    return false
  }
}

export default function RoomSite() {
  if (typeof document !== "undefined") applyTheme(initialTheme())
  const ok = typeof window !== "undefined" && canWebGL()
  if (!ok) return <DeskSite />
  return (
    <Suspense fallback={<div className="fixed inset-0 grid place-items-center bg-void font-mono text-sm text-chalk-2 tracking-[0.14em] uppercase">Turning the lights on</div>}>
      <Room />
    </Suspense>
  )
}
