import { ELECTRA, OSS_ITEMS, PROJECT_CARDS } from "@/data/work"
import { LEDGER_ROWS, type LedgerRow } from "@/data/path"
import { TOOLKIT_GROUPS } from "@/data/toolkit"

export { TOOLKIT_GROUPS }

/* Hero copy, verbatim from src/components/sections/Hero.tsx */
export const HOME = {
  eyebrow: "Applied AI & systems",
  name: "Aahil Shaikh",
  thesis:
    "At work it’s the parts of agents nobody’s solved yet — drift, identity, cooperation. At home it’s whatever annoyed me that week. Both keep outgrowing what I built them for.",
  meta: "Sophomore at Texas A&M · Two terms at TwelveLabs · Bay Area",
}

export interface Item {
  id: string
  kicker: string
  title: string
  body: string
  tags?: string[]
  rows?: { label: string; body: string }[]
  note?: string
  link?: { href: string; label: string }
}
const proj = (id: string): Item => {
  const c = PROJECT_CARDS.find((p) => p.id === id)!
  return { id: c.id, kicker: c.stamp, title: c.title, body: c.desc, tags: c.tags, link: c.link }
}
const oss = (id: string): Item => {
  const o = OSS_ITEMS.find((p) => p.id === id)!
  return { id: o.id, kicker: o.status, title: o.title, body: o.desc, link: o.link }
}

// Electra is one agent among a few, not the front page.
export const AGENT_ITEMS: Item[] = [
  { id: "electra", kicker: ELECTRA.stamp, title: ELECTRA.title, body: ELECTRA.lede, rows: ELECTRA.rows, note: ELECTRA.note },
  oss("magi"),
  proj("jockey"),
]
export const SYSTEM_ITEMS: Item[] = ["sage", "recurser", "bastion", "sentinel", "density"].map(proj)
export const SIDE_ITEMS: Item[] = OSS_ITEMS.filter((o) => o.id !== "magi").map((o) => oss(o.id))
export const WRITING_ITEMS: Item[] = ["sage", "recurser"].map(proj)

/* Path: three clusters read left to right, Texas A&M runs underneath as the band. */
const row = (id: string) => LEDGER_ROWS.find((r) => r.id === id)!
export interface PathGroup { id: string; label: string; rows: LedgerRow[] }
export const PATH_GROUPS: PathGroup[] = [
  { id: "g24", label: "2024", rows: [row("berkeley"), row("frc")] },
  { id: "g25", label: "Mar 2025", rows: [row("hacks"), row("avionics")] },
  { id: "gtl", label: "TwelveLabs", rows: [row("devex"), row("agentsec")] },
]
export const PATH_BAND = row("tamu")
// "Software Engineering Intern — DevEx" -> role + focus
export const splitTitle = (t: string) => { const [a, b] = t.split(" — "); return b ? { role: a, focus: b } : { role: "", focus: a } }
