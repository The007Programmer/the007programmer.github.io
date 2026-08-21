import { Topbar } from "@/components/layout/Topbar"
import { Footer } from "@/components/layout/Footer"
import CursorEffect from "@/components/effects/CursorEffect"
import { Hero } from "@/components/sections/Hero"
import { Timeline } from "@/components/sections/Timeline"
import { Work } from "@/components/sections/Work"
import { Tally } from "@/components/sections/Tally"
import { Path } from "@/components/sections/Path"
import { Toolkit } from "@/components/sections/Toolkit"
import { Contact } from "@/components/sections/Contact"
import { Seam } from "@/components/kit/Seam"

const SECTIONS = [
  { id: "work", label: "Work" },
  { id: "path", label: "Path" },
  { id: "toolkit", label: "Toolkit" },
  { id: "contact", label: "Contact" },
]

export default function App() {
  return (
    <>
      <CursorEffect />
      <Topbar sections={SECTIONS} />
      <main id="main" className="relative z-[2]">
        {/* Seams carry the ground from one band into the next. The order below
            is not decoration — each `from` has to be the previous section's
            actual background and each `to` the next one's, or the seam ramps to
            a colour nothing uses and reinstates the hard step it exists to
            remove. Sections with no bg class sit on the body, which is `void`. */}
        <Hero />
        <Seam from="void" to="ink" />
        <Timeline />
        <Seam from="ink" to="void" />
        <Work />
        <Seam from="void" to="ink-2" />
        <Tally />
        <Seam from="ink-2" to="ink" />
        <Path />
        <Seam from="ink" to="void" />
        <Toolkit />
        {/* Same ground on both sides — no ramp to do, but the rule still marks
            the change so the page keeps its rhythm into the last section. */}
        <Seam from="void" to="void" />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
