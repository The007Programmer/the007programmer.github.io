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
        <Hero />
        <Timeline />
        <Work />
        <Tally />
        <Path />
        <Toolkit />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
