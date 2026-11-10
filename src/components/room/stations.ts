import { OSS_ITEMS } from "@/data/work"

export type SId = "monitor" | "desk" | "shelf" | "board" | "drawer" | "notes" | "keyboard"
type V3 = [number, number, number]
export interface Station { id: SId; label: string; num: string; pos: V3; look: V3; label3: V3 }

export const SEAT: V3 = [0, 1.3, 1.35]

export const STATIONS: Station[] = [
  { id: "monitor", num: "01", label: "Agents & Systems", pos: [0, 1.28, 0.21], look: [0, 1.28, -0.64], label3: [0, 1.78, -0.6] },
  { id: "desk", num: "02", label: "Desk", pos: [0.05, 1.8, 0.75], look: [0.05, 0.8, 0.1], label3: [-0.1, 0.95, 0.5] },
  { id: "shelf", num: "03", label: "Writeups", pos: [1.1, 1.75, 0.35], look: [0.72, 1.85, -1.4], label3: [0, 2.25, -1.4] },
  { id: "board", num: "04", label: "Path", pos: [2.55, 1.55, 0.1], look: [2.55, 1.55, -1.6], label3: [1.85, 2.2, -1.55] },
  { id: "drawer", num: "05", label: "Side quests", pos: [0.4, 1.3, 1.55], look: [0.4, 0.6, 0.65], label3: [0, 0.52, 0.62] },
  { id: "notes", num: "06", label: "Contact", pos: [1.4, 1.55, 0.75], look: [1.4, 0.8, 0.3], label3: [1.1, 0.95, 0.45] },
  { id: "keyboard", num: "07", label: "Keyboard", pos: [0.18, 1.1, 0.25], look: [0.18, 0.83, -0.2], label3: [0, 0.95, -0.2] },
]
export const stationOf = (id: SId) => STATIONS.find((s) => s.id === id)!

export interface DeskItem {
  id: string
  kind: "OSS" | "HELLO"
  title: string
  org: string
  stamp: string
  tags: string[]
  desc: string
  img: string
  link?: { href: string; label: string }
  x: number
  z: number
  rot: number
}
const SHOT: Record<string, string> = { flashguard: "flashguard.png", mailsmith: "mailsmith.png", ufw: "ufwmanager.png" }
const pos: Record<string, [number, number, number]> = { flashguard: [-0.82, 0.12, 0.07], mailsmith: [-0.4, 0.1, -0.05], ufw: [0.02, 0.13, 0.04] }
export const DESK_ITEMS: DeskItem[] = [
  ...OSS_ITEMS.filter((o) => SHOT[o.id]).map((o): DeskItem => ({
    id: o.id,
    kind: "OSS",
    title: o.title,
    org: "Open source",
    stamp: o.status === "published" ? "PUBLISHED" : o.status === "in-progress" ? "IN PROGRESS" : "PRIVATE",
    tags: [o.status],
    desc: o.desc,
    img: "/img/projects/" + SHOT[o.id],
    link: o.link,
    x: pos[o.id][0],
    z: pos[o.id][1],
    rot: pos[o.id][2],
  })),
  {
    id: "hello", kind: "HELLO", title: "Hello", org: "who put this here", // SPIKE COPY
    stamp: "", tags: [],
    desc: "Sophomore in computer science at Texas A&M. Two terms at TwelveLabs building AI agents.",
    img: "/img/photo.jpg", x: 0.46, z: 0.1, rot: -0.09,
  },
]
