import { useEffect, useState } from "react"

export type FontPairing = "tempting" | "athelas" | "inter" | "archivo"
const PAIRINGS: FontPairing[] = ["tempting", "athelas", "inter", "archivo"]

function readPairing(): FontPairing {
  const raw = new URLSearchParams(window.location.search).get("font")
  return (PAIRINGS as string[]).includes(raw ?? "") ? (raw as FontPairing) : "tempting"
}

/** Dev-only: lets ?font=<pairing> swap the active typography across the
 *  real built layout so the 4 candidates can be compared live, in
 *  context, before one is locked in (see Task 16, Step "lock in the font"). */
export function useFontPairing(): FontPairing {
  const [pairing, setPairing] = useState<FontPairing>(readPairing)

  useEffect(() => {
    document.documentElement.setAttribute("data-font", pairing)
  }, [pairing])

  useEffect(() => {
    const onPopState = () => setPairing(readPairing())
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  return pairing
}
