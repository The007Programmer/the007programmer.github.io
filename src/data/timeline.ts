export type TimelineNodeKind = "role" | "artifact" | "event"
export type TimelineTrack = "twelvelabs" | "personal" | "school"

export interface TimelineNode {
  id: string
  label: string
  sub: string
  kind: TimelineNodeKind
  track: TimelineTrack
  date: string // 'YYYY-MM', used for x-axis position and sort order
}

export interface TimelineEdge {
  from: string
  to: string
  label: string
  soft?: boolean
}

export const TIMELINE_NODES: TimelineNode[] = [
  { id: "hacks",    label: "Chinatown Hacks",              sub: "Mar 2025",           kind: "event",    track: "personal",   date: "2025-03" },
  { id: "sentinel", label: "Sentinel",                     sub: "Prototype",          kind: "artifact", track: "personal",   date: "2025-03" },
  { id: "devex",    label: "TwelveLabs · DevEx",           sub: "Jun–Dec 2025",       kind: "role",     track: "twelvelabs", date: "2025-06" },
  { id: "bastion",  label: "Bastion",                      sub: "Shipped",            kind: "artifact", track: "twelvelabs", date: "2025-06" },
  { id: "recurser", label: "Recurser",                     sub: "Proposed, then shipped", kind: "artifact", track: "twelvelabs", date: "2025-06" },
  { id: "tamu",     label: "Texas A&M",                    sub: "Aug 2025 →",         kind: "event",    track: "school",     date: "2025-08" },
  { id: "sage",     label: "SAGE",                         sub: "Shipped",            kind: "artifact", track: "twelvelabs", date: "2025-08" },
  { id: "agentsec", label: "TwelveLabs · Agent Security",  sub: "Feb–Jun 2026",       kind: "role",     track: "twelvelabs", date: "2026-02" },
  { id: "electra",  label: "Electra",                      sub: "Beta",               kind: "artifact", track: "twelvelabs", date: "2026-02" },
]

export const TIMELINE_EDGES: TimelineEdge[] = [
  { from: "hacks",    to: "sentinel", label: "prototyped" },
  { from: "sentinel", to: "devex",    label: "led to an offer" },
  { from: "devex",    to: "sage",     label: "built" },
  { from: "devex",    to: "bastion",  label: "built" },
  { from: "devex",    to: "recurser", label: "proposed" },
  { from: "devex",    to: "agentsec", label: "returned as" },
  { from: "agentsec", to: "electra",  label: "led the build" },
  { from: "devex",    to: "tamu",     label: "alongside", soft: true },
]
