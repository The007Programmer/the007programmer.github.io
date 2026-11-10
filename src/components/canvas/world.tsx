import type { ReactNode } from "react"
import { ELECTRA, PROJECT_CARDS, OSS_ITEMS } from "@/data/work"
import { LEDGER_ROWS } from "@/data/path"
import { TOOLKIT_GROUPS } from "@/data/toolkit"
import { RollText } from "@/components/kit/RollText"

export const IW = 760
export const IH = 700
const GAP = 60

export interface Box { x: number; y: number; w: number; h: number }
export interface WItem extends Box { id: string; cluster: string; title: string; kicker: string; detail: ReactNode }
export interface WCluster { id: string; label: string; grid: Box; label_box: Box }

const LABEL_H = 520

const Chip = ({ children }: { children: ReactNode }) => (
  <span className="inline-block border border-edge text-chalk-2 font-mono text-[18px] px-3 py-1 mr-2 mb-2">{children}</span>
)
const Ext = ({ href, children }: { href: string; children: string }) => (
  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="group inline-block font-mono text-[22px] text-signal underline underline-offset-4 mr-6 mt-4">
    <RollText>{children}</RollText>
  </a>
)
const Body = ({ children }: { children: ReactNode }) => <p className="text-[26px] leading-[1.45] text-chalk-2">{children}</p>

function place(items: Omit<WItem, "x" | "y" | "w" | "h">[], ox: number, oy: number, cols: number): { items: WItem[]; grid: Box } {
  const rows = Math.ceil(items.length / cols)
  return {
    items: items.map((it, i) => ({
      ...it,
      x: ox + (i % cols) * (IW + GAP),
      y: oy + Math.floor(i / cols) * (IH + GAP),
      w: IW,
      h: IH,
    })),
    grid: { x: ox, y: oy, w: cols * IW + (cols - 1) * GAP, h: rows * IH + (rows - 1) * GAP },
  }
}

const electra: Omit<WItem, "x" | "y" | "w" | "h"> = {
  id: "electra", cluster: "agents", title: ELECTRA.title, kicker: "Shipped to beta · TwelveLabs",
  detail: (
    <>
      <div className="font-mono text-[18px] text-mute mb-3">{ELECTRA.stamp}</div>
      <h3 className="font-display font-extrabold text-[84px] leading-none tracking-[-0.04em] mb-5">{ELECTRA.title}</h3>
      <p className="text-[23px] leading-[1.4] text-chalk mb-5">{ELECTRA.lede}</p>
      {ELECTRA.rows.map((r) => (
        <div key={r.label} className="mb-3">
          <span className="font-mono text-[17px] uppercase text-signal">{r.label} </span>
          <span className="text-[19px] leading-[1.35] text-chalk-2">{r.body}</span>
        </div>
      ))}
      <div className="font-mono text-[16px] text-mute">{ELECTRA.note}</div>
    </>
  ),
}
const ossItem = (id: string, cluster: string): Omit<WItem, "x" | "y" | "w" | "h"> => {
  const o = OSS_ITEMS.find((x) => x.id === id)!
  return {
    id: o.id, cluster, title: o.title, kicker: o.status,
    detail: (
      <>
        <div className="font-mono text-[18px] text-signal uppercase mb-3">{o.status}</div>
        <h3 className="font-display font-extrabold text-[96px] leading-none tracking-[-0.04em] mb-6">{o.title}</h3>
        <p className={`${o.desc.length > 400 ? "text-[22px]" : "text-[26px]"} leading-[1.45] text-chalk-2`}>{o.desc}</p>
        {o.link && <Ext href={o.link.href}>{o.link.label}</Ext>}
      </>
    ),
  }
}
const cardItem = (id: string): Omit<WItem, "x" | "y" | "w" | "h"> => {
  const c = PROJECT_CARDS.find((x) => x.id === id)!
  return {
    id: c.id, cluster: "systems", title: c.title, kicker: c.stamp,
    detail: (
      <>
        <div className="font-mono text-[18px] text-mute mb-3">{c.stamp}</div>
        <h3 className="font-display font-extrabold text-[96px] leading-none tracking-[-0.04em] mb-6">{c.title}</h3>
        <Body>{c.desc}</Body>
        <div className="mt-6">{c.tags.map((t) => <Chip key={t}>{t}</Chip>)}</div>
        {c.link && <Ext href={c.link.href}>{c.link.label}</Ext>}
      </>
    ),
  }
}

const SHORT: Record<string, string> = { agentsec: "Agent Security", devex: "DevEx", tamu: "Texas A&M", avionics: "Avionics Lead", hacks: "Chinatown Hacks", frc: "Circuit Bakers", berkeley: "CS61A" }

const AG = place([electra, ossItem("magi", "agents")], -3900, -1300, 2)
const SY = place(["sage", "recurser", "jockey", "bastion", "sentinel", "density"].map(cardItem), 700, -2700, 3)
const SQ = place(["clair", "ufw", "flashguard", "mailsmith"].map((i) => ossItem(i, "side")), -4200, 300, 2)
const PA = place(
  LEDGER_ROWS.map((r) => ({
    id: "p-" + r.id, cluster: "path", title: SHORT[r.id] ?? r.title, kicker: r.when,
    detail: (
      <>
        <div className="font-mono text-[18px] text-signal mb-3">{r.when}</div>
        <h3 className="font-display font-extrabold text-[54px] leading-[1.05] tracking-[-0.03em] mb-4">{r.title}</h3>
        <div className="font-mono text-[20px] text-chalk mb-6">{r.org}</div>
        {r.body && <Body>{r.body}</Body>}
      </>
    ),
  })),
  1500, 800, 3
)
const TK = place(
  TOOLKIT_GROUPS.map((g) => ({
    id: "t-" + g.id, cluster: "toolkit", title: g.title, kicker: g.items.split(" · ").length + " tools",
    detail: (
      <>
        <h3 className={`font-display font-extrabold text-[72px] leading-none tracking-[-0.04em] mb-8 ${g.accent ? "text-signal" : ""}`}>{g.title}</h3>
        <div>{g.items.split(" · ").map((t) => <Chip key={t}>{t}</Chip>)}</div>
      </>
    ),
  })),
  -2800, 3100, 3
)

const CONTACT_LINKS = [
  { href: "mailto:aahils2019@gmail.com", label: "aahils2019@gmail.com" },
  { href: "https://github.com/The007Programmer", label: "GitHub" },
  { href: "https://www.linkedin.com/in/aahil-shaikh-04b9ba356/", label: "LinkedIn" },
  { href: "/assets/aahil-shaikh-resume.pdf", label: "Résumé (PDF)" },
]
const CT: WItem = {
  id: "contact", cluster: "contact", title: "Say something interesting.", kicker: "Open to hear it",
  x: -800, y: 1150, w: 1600, h: 620,
  detail: (
    <>
      <p className="text-[34px] leading-[1.4] text-chalk-2 mb-8 max-w-[34ch]">
        Agents, graph memory, video models, or a problem that doesn't have a name yet. I read everything that comes through here.
      </p>
      <ul className="font-mono text-[40px] flex flex-col gap-3">
        {CONTACT_LINKS.map((l) => (
          <li key={l.href}><a href={l.href} className="group inline-block text-chalk"><RollText>{l.label}</RollText></a></li>
        ))}
      </ul>
    </>
  ),
}

export const ITEMS: WItem[] = [...AG.items, ...SY.items, ...SQ.items, ...PA.items, ...TK.items, CT]

const lab = (id: string, label: string, grid: Box): WCluster => ({
  id, label, grid,
  label_box: { x: grid.x, y: grid.y - LABEL_H - 80, w: Math.max(grid.w, label.length * 330), h: LABEL_H },
})
export const CLUSTERS: WCluster[] = [
  lab("agents", "AGENTS", AG.grid),
  lab("systems", "SYSTEMS", SY.grid),
  lab("side", "SIDE QUESTS", SQ.grid),
  lab("path", "PATH", PA.grid),
  lab("toolkit", "TOOLKIT", TK.grid),
  lab("contact", "CONTACT", { x: CT.x, y: CT.y, w: CT.w, h: CT.h }),
]
export const HERO: Box = { x: -800, y: -450, w: 1600, h: 900 }

export function union(bs: Box[]): Box {
  const x0 = Math.min(...bs.map((b) => b.x)), y0 = Math.min(...bs.map((b) => b.y))
  const x1 = Math.max(...bs.map((b) => b.x + b.w)), y1 = Math.max(...bs.map((b) => b.y + b.h))
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }
}
export const clusterBox = (c: WCluster) => union([c.grid, c.label_box])
export const BOUNDS = union([HERO, ...CLUSTERS.map(clusterBox)])
