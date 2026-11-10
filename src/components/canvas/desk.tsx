import { useState, type ReactNode } from "react"
import { ELECTRA, PROJECT_CARDS, OSS_ITEMS } from "@/data/work"
import { LEDGER_ROWS } from "@/data/path"
import { TOOLKIT_GROUPS } from "@/data/toolkit"

export const DESK = { x: -1240, y: -750, w: 2480, h: 1500 }
export const FIT = { x: -1290, y: -780, w: 2580, h: 1650 }

export interface ObjSpec {
  id: string
  w: number
  h: number
  x: number
  y: number
  r: number
  face: ReactNode
  detail?: ReactNode
  bare?: boolean
  zone?: string
  pile?: boolean
}

/* ---------- generated covers, seeded by id ---------- */
function rng(seed: string) {
  let h = 2166136261
  for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) }
  return () => {
    h += 0x6d2b79f5
    let t = Math.imul(h ^ (h >>> 15), 1 | h)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const ACC = ["#FF5B4F", "#FF8F79", "#C4261E"]

export function Cover({ id, className = "" }: { id: string; className?: string }) {
  const r = rng(id)
  const kind = Math.floor(r() * 5)
  const a = ACC[Math.floor(r() * 3)]
  const els: ReactNode[] = []
  if (kind === 0) {
    const cx = 40 + r() * 120, cy = 30 + r() * 60
    for (let i = 1; i < 12; i++) els.push(<circle key={i} cx={cx} cy={cy} r={i * 11} fill="none" stroke={a} strokeOpacity={0.9 - i * 0.07} strokeWidth={1.5} />)
  } else if (kind === 1) {
    for (let y = 0; y < 8; y++) for (let x = 0; x < 14; x++) {
      const d = Math.hypot(x - 7 * r() * 2, y - 4) / 9
      els.push(<circle key={x + "-" + y} cx={8 + x * 14.5} cy={8 + y * 15} r={Math.max(0.6, 5 - d * 6 + r() * 1.5)} fill={a} fillOpacity={0.85} />)
    }
  } else if (kind === 2) {
    for (let i = -6; i < 24; i++) els.push(<line key={i} x1={i * 12} y1={0} x2={i * 12 + 70} y2={120} stroke="#617599" strokeOpacity={0.45} strokeWidth={1.2} />)
    els.push(<rect key="b" x={30 + r() * 80} y={20 + r() * 30} width={50 + r() * 60} height={40 + r() * 30} fill={a} fillOpacity={0.9} />)
  } else if (kind === 3) {
    const pts = Array.from({ length: 10 }, () => [10 + r() * 180, 10 + r() * 100])
    pts.forEach((p, i) => pts.forEach((q, j) => { if (j > i && Math.hypot(p[0] - q[0], p[1] - q[1]) < 70) els.push(<line key={i + "_" + j} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#617599" strokeWidth={1} />) }))
    pts.forEach((p, i) => els.push(<circle key={"n" + i} cx={p[0]} cy={p[1]} r={3 + r() * 4} fill={a} />))
  } else {
    for (let i = 0; i < 7; i++) {
      const amp = 6 + r() * 14, ph = r() * 6
      let d = `M0 ${18 + i * 14}`
      for (let x = 0; x <= 200; x += 10) d += ` L${x} ${18 + i * 14 + Math.sin(x / 22 + ph) * amp}`
      els.push(<path key={i} d={d} fill="none" stroke={a} strokeOpacity={0.35 + i * 0.09} strokeWidth={1.6} />)
    }
  }
  return (
    <svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={"g" + id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#18202D" /><stop offset="1" stopColor="#0A0D13" /></linearGradient>
      </defs>
      <rect width="200" height="120" fill={`url(#g${id})`} />
      {els}
    </svg>
  )
}


/* ---------- zones: each section's bounded home on the desk ---------- */
export const ZW = 540, ZH = 620
const COLX = [-900, -300, 300, 900], ROWY = [-350, 350]
export type ZoneKind = "mat" | "folder" | "box" | "pin" | "clip" | "cabinet"
export interface Zone { id: string; title: string; sub: string; cx: number; cy: number; kind: ZoneKind; pile?: boolean }
const NSIDE = OSS_ITEMS.filter((o) => o.id !== "magi").length
export const ZONES: Zone[] = [
  { id: "hello", title: "HELLO", sub: "who put this here", cx: COLX[0], cy: ROWY[0], kind: "mat" }, // SPIKE COPY
  { id: "agents", title: "AGENTS", sub: "2 builds", cx: COLX[1], cy: ROWY[0], kind: "folder" },
  { id: "systems", title: "SYSTEMS", sub: `${PROJECT_CARDS.length} projects`, cx: COLX[2], cy: ROWY[0], kind: "box", pile: true },
  { id: "side", title: "SIDE QUESTS", sub: `${NSIDE} repos`, cx: COLX[3], cy: ROWY[0], kind: "pin", pile: true },
  { id: "path", title: "PATH", sub: "2 documents", cx: COLX[0], cy: ROWY[1], kind: "clip", pile: true },
  { id: "toolkit", title: "TOOLKIT", sub: `${TOOLKIT_GROUPS.length} shelves`, cx: COLX[1], cy: ROWY[1], kind: "mat" },
  { id: "contact", title: "CONTACT", sub: "I read everything", cx: COLX[2], cy: ROWY[1], kind: "pin" }, // SPIKE COPY
  { id: "older", title: "OLDER", sub: "pull the drawer", cx: COLX[3], cy: ROWY[1], kind: "cabinet" }, // SPIKE COPY
]
export const zoneOf = (id: string) => ZONES.find((z) => z.id === id)!

/* ---------- indicator system: type tab, year, status stamp, tags ---------- */
type Kind = "AGENT" | "TOOL" | "HACKATHON" | "OSS" | "CONTRIB"
const KIND_CLS: Record<Kind, string> = {
  AGENT: "bg-signal text-void",
  TOOL: "bg-edge text-void",
  HACKATHON: "bg-[#E8D9A6] text-void",
  OSS: "bg-chalk text-void",
  CONTRIB: "bg-transparent text-chalk border-r border-b border-edge",
}
const yearOf = (s: string) => (s.match(/20\d\d/g) ?? []).slice(-1)[0] ?? ""
const orgOf = (s: string) => s.split(" · ")[1] ?? ""
// type derivation from data: tags, stamp, description, link
function kindOfProject(c: { stamp: string; tags: string[]; desc: string }): Kind {
  if (c.tags.includes("Contributor")) return "CONTRIB"
  if (/Hacks/.test(c.stamp)) return "HACKATHON"
  if (/agent/i.test(c.desc)) return "AGENT"
  return "TOOL"
}

function TypeTab({ kind, year, paper }: { kind: Kind; year: string; paper?: boolean }) {
  return (
    <div className={`flex items-stretch justify-between border-b ${paper ? "border-[#aab4c4] bg-[#c9d1dd]" : "border-line bg-ink"}`}>
      <span className={`font-mono font-bold text-[20px] tracking-[0.12em] px-4 py-2 ${KIND_CLS[kind]}`}>{kind}</span>
      {year && <span className={`font-mono font-bold text-[18px] px-4 py-2 ${paper ? "text-[#44546a]" : "text-chalk-2"}`}>{year}</span>}
    </div>
  )
}
function Stamp({ text, paper }: { text: string; paper?: boolean }) {
  return (
    <span
      className={`absolute right-4 font-mono font-bold text-[17px] tracking-[0.12em] px-3 py-1 border-[3px] border-double whitespace-nowrap ${paper ? "text-[#a1281f] border-[#a1281f]" : "text-signal border-signal"}`}
      style={{ bottom: 70, transform: "rotate(-8deg)", opacity: 0.92 }}
    >
      {text}
    </span>
  )
}
interface CardProps { kind: Kind; year: string; org: string; title: string; status?: string; tags: string[]; blurb: string; img?: string; paper?: boolean }
function ItemCard({ kind, year, org, title, status, tags, blurb, img, paper }: CardProps) {
  return (
    <div className={`relative h-full flex flex-col rounded-[3px] overflow-hidden border ${paper ? "bg-[#DCE2EA] text-[#10161f] border-[#aab4c4]" : "bg-ink-2 text-chalk border-line"}`}>
      <TypeTab kind={kind} year={year} paper={paper} />
      <div className="p-5 pt-4 flex-1 flex flex-col">
        <div className={`font-mono text-[15px] uppercase tracking-[0.08em] mb-1.5 ${paper ? "text-[#44546a]" : "text-mute"}`}>{org || " "}</div>
        <div className={`font-display font-extrabold uppercase leading-[0.92] tracking-[-0.03em] ${title.length > 9 ? "text-[40px]" : "text-[48px]"}`}>{title}</div>
        {img ? (
          <img src={img} alt="" draggable={false} className="mt-3 w-full h-[128px] object-cover object-top border border-line" />
        ) : (
          <p className={`mt-3 text-[16px] leading-[1.4] line-clamp-6 ${paper ? "text-[#26334a]" : "text-chalk-2"}`}>{blurb}</p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-3">
          {tags.slice(0, 2).map((t) => (
            <span key={t} className={`font-mono text-[14px] px-2 py-0.5 border ${paper ? "border-[#8c98ab] text-[#26334a]" : "border-edge text-chalk-2"}`}>{t}</span>
          ))}
        </div>
      </div>
      {status && <Stamp text={status} paper={paper} />}
    </div>
  )
}

const Chip = ({ children }: { children: ReactNode }) => (
  <span className="inline-block border border-edge text-chalk-2 font-mono text-[11px] px-2 py-0.5 mr-1.5 mb-1.5">{children}</span>
)
const Ext = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="inline-block font-mono text-[14px] text-signal underline underline-offset-4 mr-5 mt-4">{children}</a>
)
const SHORT: Record<string, string> = { agentsec: "Agent Security", devex: "DevEx", tamu: "Texas A&M", avionics: "Avionics Lead", hacks: "Chinatown Hacks", frc: "Circuit Bakers", berkeley: "CS61A" }
const SHOT: Record<string, string> = { flashguard: "/img/projects/flashguard.png", mailsmith: "/img/projects/mailsmith.png", ufw: "/img/projects/ufwmanager.png" }

function DetailShell({ kind, year, stamp, title, children, cover, img }: { kind?: Kind; year?: string; stamp: string; title: string; children: ReactNode; cover?: string; img?: string }) {
  return (
    <div>
      {img ? <img src={img} alt="" className="w-full h-auto mb-5 border border-line" /> : cover ? <Cover id={cover} className="w-full h-[84px] mb-5 border border-line opacity-60" /> : null}
      <div className="flex items-center gap-3 mb-3">
        {kind && <span className={`font-mono font-bold text-[13px] tracking-[0.14em] px-2.5 py-1 ${KIND_CLS[kind]}`}>{kind}</span>}
        {year && <span className="font-mono text-[13px] text-chalk-2">{year}</span>}
        <span className="font-mono text-[12px] text-mute">{stamp}</span>
      </div>
      <h3 className="font-display font-extrabold text-[44px] leading-none tracking-[-0.03em] mb-4">{title}</h3>
      {children}
    </div>
  )
}

/* ---------- objects ---------- */
const cardObj = (id: string): Omit<ObjSpec, "x" | "y" | "r"> => {
  const c = PROJECT_CARDS.find((p) => p.id === id)!
  const kind = kindOfProject(c)
  const wr = c.link && /writeup/i.test(c.link.label)
  return {
    id, w: 320, h: 420, zone: "systems", pile: true,
    face: <ItemCard kind={kind} year={yearOf(c.stamp)} org={orgOf(c.stamp)} title={c.title} status={wr ? "WRITEUP" : undefined} tags={c.tags} blurb={c.desc} />,
    detail: (
      <DetailShell kind={kind} year={yearOf(c.stamp)} stamp={c.stamp} title={c.title} cover={id}>
        <p className="text-[17px] leading-[1.5] text-chalk-2">{c.desc}</p>
        <div className="mt-4">{c.tags.map((t) => <Chip key={t}>{t}</Chip>)}</div>
        {c.link && <Ext href={c.link.href}>{c.link.label} ↗</Ext>}
      </DetailShell>
    ),
  }
}

const STATUS: Record<string, string> = { private: "PRIVATE", published: "PUBLISHED", "in-progress": "IN PROGRESS" }
// tags below are phrases lifted from each item's own description
const OSS_TAGS: Record<string, string[]> = {
  magi: ["Local models", "Security assessor"],
  clair: ["MIT", "Homebrew tap"],
  ufw: ["UFW", "PPA"],
  flashguard: ["USB", "Malware"],
  mailsmith: ["Gmail API"],
}
const ossObj = (id: string, pile: boolean): Omit<ObjSpec, "x" | "y" | "r"> => {
  const o = OSS_ITEMS.find((p) => p.id === id)!
  const shot = SHOT[id]
  const kind: Kind = /agent/i.test(o.desc) ? "AGENT" : "OSS"
  return {
    id, w: pile ? 320 : 280, h: pile ? 420 : 400, zone: pile ? "side" : "agents", pile,
    face: <ItemCard kind={kind} year="" org={o.id === "magi" ? "Stays on my hardware" : o.link ? "GitHub" : ""} title={o.title} status={STATUS[o.status]} tags={OSS_TAGS[id] ?? []} blurb={o.desc} img={shot} />,
    detail: (
      <DetailShell kind={kind} stamp={STATUS[o.status]} title={o.title} cover={id} img={shot}>
        <p className="text-[16px] leading-[1.5] text-chalk-2">{o.desc}</p>
        {o.link && <Ext href={o.link.href}>{o.link.label} ↗</Ext>}
      </DetailShell>
    ),
  }
}

const Paper = ({ children, pages = 2 }: { children: ReactNode; pages?: number }) => (
  <div className="relative h-full">
    {pages > 1 && <div className="absolute inset-0 bg-[#BFC7D3] translate-x-[5px] translate-y-[4px] rotate-[1.5deg]" />}
    <div className="relative h-full bg-[#DCE2EA] text-[#10161f] p-6 overflow-hidden rounded-[1px]">{children}</div>
  </div>
)
const Staple = () => <div className="absolute -top-0.5 left-4 w-6 h-[3px] bg-[#6a7790] rotate-[-18deg] z-10" />

const electraDetail = (
  <DetailShell kind="AGENT" year={yearOf(ELECTRA.stamp)} stamp={ELECTRA.stamp} title={ELECTRA.title}>
    <p className="text-[18px] leading-[1.45] text-chalk mb-5">{ELECTRA.lede}</p>
    {ELECTRA.rows.map((r) => (
      <p key={r.label} className="mb-3 text-[15px] leading-[1.45] text-chalk-2"><span className="font-mono text-[12px] uppercase text-signal">{r.label} </span>{r.body}</p>
    ))}
    <div className="font-mono text-[12px] text-mute mt-4">{ELECTRA.note}</div>
  </DetailShell>
)

const ledgerDetail = (
  <div>
    <h3 className="font-display font-extrabold text-[44px] leading-none tracking-[-0.03em] mb-5">Path</h3>
    {LEDGER_ROWS.map((r) => (
      <div key={r.id} className="mb-4 border-l-2 border-line pl-4">
        <div className="font-mono text-[12px] text-signal">{r.when}</div>
        <div className="font-display font-bold text-[19px] leading-tight">{r.title}</div>
        <div className="font-mono text-[12px] text-chalk-2">{r.org}</div>
        {r.body && <p className="text-[14px] leading-[1.45] text-chalk-2 mt-1">{r.body}</p>}
      </div>
    ))}
  </div>
)

const CONTACT = [
  { href: "mailto:aahils2019@gmail.com", label: "aahils2019@gmail.com" },
  { href: "https://github.com/The007Programmer", label: "GitHub" },
  { href: "https://www.linkedin.com/in/aahil-shaikh-04b9ba356/", label: "LinkedIn" },
]

const z = zoneOf
const at = (zone: string, dx: number, dy: number, r: number) => ({ x: z(zone).cx + dx, y: z(zone).cy + dy, r })
// stacked piles: listed top card first; depth pushes cards up-left and alternates tilt
const TILT = [-1.5, 3, -4, 2.5, -3, 4]
export const PILE_IDS: Record<string, string[]> = {
  systems: ["sage", "recurser", "jockey", "bastion", "sentinel", "density"],
  side: ["flashguard", "mailsmith", "ufw", "clair"],
  path: ["resume", "receipt"],
}
const pileAt = (zone: string, id: string, dx = 0, dy = -20) => {
  const d = PILE_IDS[zone].indexOf(id)
  return at(zone, dx - d * 9, dy - d * 8, TILT[d % 6])
}

const specs: ObjSpec[] = [
  // hello
  {
    id: "photo", w: 200, h: 258, ...at("hello", 160, 168, -5), zone: "hello",
    detail: (
      <div>
        <img src="/img/photo.jpg" alt="Aahil Shaikh" className="w-full max-h-[60vh] object-cover object-top mb-4 border border-line" />
        <h3 className="font-display font-extrabold text-[44px] leading-none tracking-[-0.03em]">Aahil Shaikh</h3>
        <p className="font-mono text-[13px] text-chalk-2 mt-2">Texas A&amp;M · TwelveLabs · Bay Area</p>
      </div>
    ),
    face: (
      <div className="h-full bg-[#E4E9F0] p-3 pb-0 text-[#10161f]">
        <img src="/img/photo.jpg" alt="" draggable={false} className="w-full h-[196px] object-cover object-top block" />
        <div className="font-mono text-[12px] mt-2.5 text-center whitespace-nowrap">aahil, sophomore year</div>
      </div>
    ),
  },
  // agents: two, side by side, no pile
  { ...ossObj("magi", false), ...at("agents", 120, 24, 3.5) },
  {
    id: "electra", w: 280, h: 400, ...at("agents", -120, 10, -3), zone: "agents", detail: electraDetail,
    face: (
      <div className="relative h-full">
        <div className="absolute inset-0 bg-[#BFC7D3] translate-x-[5px] translate-y-[4px] rotate-[1.5deg]" />
        <div className="relative h-full">
          <ItemCard paper kind="AGENT" year={yearOf(ELECTRA.stamp)} org={orgOf(ELECTRA.stamp)} title={ELECTRA.title} status="BETA" tags={["Graph memory", "Injection defense"]} blurb={ELECTRA.lede} />
          <Staple />
        </div>
      </div>
    ),
  },
  // systems pile (bottom of pile first so the top card renders last)
  ...[...PILE_IDS.systems].reverse().map((id): ObjSpec => ({ ...cardObj(id), ...pileAt("systems", id) }) as ObjSpec),
  // side quests pile
  ...[...PILE_IDS.side].reverse().map((id): ObjSpec => ({ ...ossObj(id, true), ...pileAt("side", id) }) as ObjSpec),
  // path: receipt tucked behind the résumé on the clipboard
  {
    id: "receipt", w: 220, h: 520, ...pileAt("path", "receipt", 50, 0), zone: "path", pile: true, detail: ledgerDetail,
    face: (
      <div className="h-full bg-[#F1F3F6] text-[#10161f] font-mono text-[12px] px-4 pt-5 leading-[1.5]" style={{ clipPath: "polygon(0 0,100% 0,100% 97%,95% 100%,90% 97%,85% 100%,80% 97%,75% 100%,70% 97%,65% 100%,60% 97%,55% 100%,50% 97%,45% 100%,40% 97%,35% 100%,30% 97%,25% 100%,20% 97%,15% 100%,10% 97%,5% 100%,0 97%)" }}>
        <div className="text-center font-bold text-[16px] tracking-widest">PATH</div>
        <div className="text-center text-[#44546a] mb-2">-- itemized --</div>
        {LEDGER_ROWS.map((r) => (
          <div key={r.id} className="mb-2.5">
            <div className="font-bold uppercase">{SHORT[r.id] ?? r.title}</div>
            <div className="text-[#44546a]">{r.when}</div>
          </div>
        ))}
        <div className="border-t border-dashed border-[#44546a] mt-2 pt-1 text-center">KEEP GOING</div>
      </div>
    ),
  },
  {
    id: "resume", w: 320, h: 430, ...pileAt("path", "resume", -40, 0), zone: "path", pile: true,
    detail: (
      <div>
        <h3 className="font-display font-extrabold text-[44px] leading-none tracking-[-0.03em] mb-3">Résumé</h3>
        <Ext href="/assets/aahil-shaikh-resume.pdf">Open the PDF ↗</Ext>
        <div className="mt-6">{ledgerDetail}</div>
      </div>
    ),
    face: (
      <Paper pages={1}>
        <Staple />
        <div className="font-mono font-bold text-[14px] tracking-[0.14em] text-[#a1281f] mb-2">RÉSUMÉ</div>
        <div className="font-display font-extrabold uppercase text-[40px] leading-[0.9] tracking-[-0.03em]">Aahil Shaikh</div>
        <div className="font-mono text-[12.5px] text-[#44546a] mt-1.5 mb-4">College Station, TX · Sophomore · 4.0 GPA</div>
        <div className="border-t border-[#8c98ab] pt-2 mb-2 font-mono text-[12px] uppercase text-[#44546a]">Experience</div>
        {LEDGER_ROWS.filter((r) => ["agentsec", "devex", "avionics", "frc"].includes(r.id)).map((r) => (
          <div key={r.id} className="mb-2.5">
            <div className="font-display font-bold text-[17px] leading-tight">{SHORT[r.id]}</div>
            <div className="font-mono text-[12px] text-[#44546a]">{r.org} · {r.when}</div>
          </div>
        ))}
      </Paper>
    ),
  },
  // toolkit tray
  {
    id: "tray", w: 500, h: 440, ...at("toolkit", 0, 10, 1), zone: "toolkit", detail: (
      <div>
        <h3 className="font-display font-extrabold text-[44px] leading-none tracking-[-0.03em] mb-5">Toolkit</h3>
        {TOOLKIT_GROUPS.map((g) => (
          <div key={g.id} className="mb-4">
            <div className={`font-mono text-[12px] uppercase mb-1.5 ${g.accent ? "text-signal" : "text-mute"}`}>{g.title}</div>
            {g.items.split(" · ").map((t) => <Chip key={t}>{t}</Chip>)}
          </div>
        ))}
      </div>
    ),
    face: (
      <div className="h-full bg-[#0E131C] border-[3px] border-edge/60 rounded-[8px] p-3 grid grid-cols-2 grid-rows-3 gap-3 shadow-[inset_0_6px_14px_rgba(0,0,0,.6)]">
        {TOOLKIT_GROUPS.map((g) => {
          const items = g.items.split(" · ")
          return (
            <div key={g.id} className="bg-ink border border-line p-3 overflow-hidden">
              <div className={`font-mono font-bold text-[16px] uppercase tracking-[0.06em] mb-2 ${g.accent ? "text-signal" : "text-chalk-2"}`}>{g.title}</div>
              {items.slice(0, 3).map((t) => <span key={t} className="inline-block bg-ink-2 border border-edge/50 text-chalk-2 font-mono text-[13px] px-2 py-px mr-1.5 mb-1.5 rounded-full">{t}</span>)}
              {items.length > 3 && <span className="font-mono text-[13px] text-signal">+{items.length - 3}</span>}
            </div>
          )
        })}
      </div>
    ),
  },
  // contact sticky + mug
  {
    id: "contact", w: 330, h: 330, ...at("contact", -50, -10, -4), zone: "contact",
    face: (
      <div className="h-full bg-coral text-[#1a0d0b] p-5 shadow-[inset_0_-24px_30px_-24px_rgba(0,0,0,.3)]">
        <div className="font-display font-extrabold text-[38px] leading-[0.95] tracking-[-0.03em] mb-3">Say something interesting.</div>
        <p className="text-[15px] leading-[1.35] mb-3">Agents, graph memory, video models, or a problem without a name yet. I read everything.</p>
        {CONTACT.map((l) => <div key={l.href}><a href={l.href} className="font-mono text-[16px] underline">{l.label}</a></div>)}
      </div>
    ),
  },
  {
    id: "mug", w: 150, h: 150, ...at("contact", 175, 205, 0), zone: "contact", bare: true,
    face: (
      <svg viewBox="0 0 150 150" className="w-full h-full overflow-visible" aria-hidden="true">
        <ellipse cx="75" cy="82" rx="66" ry="66" fill="#000" opacity=".35" />
        <path d="M118 52 a26 26 0 0 1 0 46" fill="none" stroke="#C9D2DE" strokeWidth="11" />
        <circle cx="68" cy="75" r="56" fill="#C9D2DE" />
        <circle cx="68" cy="75" r="46" fill="#26160f" />
        <circle cx="68" cy="75" r="46" fill="none" stroke="#8a5a3c" strokeOpacity=".5" strokeWidth="2" />
        <path d="M40 62 q20 -16 44 -4" stroke="#b07a52" strokeOpacity=".5" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
]
export const OBJS: ObjSpec[] = specs

/* ---------- fan-out layout for piles ---------- */
export function fanLayout(ids: string[], narrow: boolean) {
  const sp = ids.map((id) => OBJS.find((o) => o.id === id)!)
  const cw = Math.max(...sp.map((s) => s.w)) + 40, ch = Math.max(...sp.map((s) => s.h)) + 40
  const n = ids.length
  const cols = narrow ? (n <= 1 ? 1 : 2) : n <= 2 ? n : n === 4 ? 2 : 3
  const rows = Math.ceil(n / cols)
  const pts = ids.map((_, i) => {
    const row = Math.floor(i / cols), inRow = Math.min(cols, n - row * cols)
    return { x: (i % cols - (inRow - 1) / 2) * cw, y: (row - (rows - 1) / 2) * ch + 30, r: ((i % 3) - 1) * 1.2 }
  })
  return { pts, bw: cols * cw, bh: rows * ch + 120 }
}

/* ---------- zone decor, tabs, controls ---------- */
const PANEL: Record<ZoneKind, React.CSSProperties> = {
  mat: { background: "#131B28", border: "1.5px solid #2E3A54" },
  folder: { background: "#1B2638", border: "1.5px solid #3b4a68" },
  box: { background: "#0B1018", border: "3px solid rgba(97,117,153,.5)", boxShadow: "inset 0 10px 30px rgba(0,0,0,.7)" },
  pin: { background: "radial-gradient(rgba(97,117,153,.22) 1.5px, transparent 1.6px) 0 0/22px 22px, #141C2A", border: "1.5px solid #2E3A54" },
  clip: { background: "#1A2335", border: "1.5px solid #3b4a68" },
  cabinet: { background: "#0C111A", border: "1.5px solid #2E3A54" },
}

export function ZoneBack({ zn }: { zn: Zone }) {
  const left = zn.cx - ZW / 2, top = zn.cy - ZH / 2
  return (
    <div className="absolute pointer-events-none" style={{ left, top, width: ZW, height: ZH }}>
      {zn.kind === "folder" && <div className="absolute rounded-[14px]" style={{ inset: "-10px -4px 6px 8px", background: "#222f45", border: "1.5px solid #3b4a68" }} />}
      <div className="absolute inset-0 rounded-[14px]" style={PANEL[zn.kind]} />
      {zn.kind === "mat" && <div className="absolute rounded-[8px]" style={{ inset: 14, border: "2px dashed rgba(97,117,153,.35)" }} />}
      {zn.kind === "clip" && (
        <div className="absolute left-1/2 -translate-x-1/2 w-[150px] h-[46px] rounded-[6px] bg-[#C9D2DE]" style={{ top: -22, boxShadow: "0 4px 8px rgba(0,0,0,.5)" }}>
          <div className="absolute left-1/2 -translate-x-1/2 top-3 w-[60px] h-[10px] rounded-full bg-[#10161f]" />
        </div>
      )}
    </div>
  )
}

export function ZoneTab({ zn, i }: { zn: Zone; i: number }) {
  const left = zn.cx - ZW / 2, top = zn.cy - ZH / 2 - 56
  return (
    <>
      <div
        data-zone-fly={i}
        className="absolute flex items-center gap-3 font-mono font-bold text-[30px] tracking-[0.12em] text-void bg-[#E8D9A6] px-5 whitespace-nowrap"
        style={{ left, top, height: 56, zIndex: 90, borderRadius: "8px 8px 0 0", boxShadow: "0 -2px 8px rgba(0,0,0,.4)" }}
      >
        <span className="opacity-60">{String(i + 1).padStart(2, "0")}</span>{zn.title}
      </div>
      <div className="absolute font-mono text-[20px] text-chalk-2 text-right whitespace-nowrap pointer-events-none" style={{ left: left + ZW - 300, width: 300, top: top + 18 }}>{zn.sub}</div>
    </>
  )
}

export function PileButton({ zn, onFan }: { zn: Zone; onFan: () => void }) {
  return (
    <button
      data-nodrag
      onClick={onFan}
      className="absolute font-mono font-bold text-[22px] text-void bg-signal px-5 py-2 hover:bg-coral whitespace-nowrap"
      style={{ left: zn.cx, top: zn.cy + ZH / 2 - 38, transform: "translate(-50%,-50%)", zIndex: 1 }}
    >
      {zn.sub} · fan out ▸
    </button>
  )
}

export function Hello() {
  const zn = zoneOf("hello")
  return (
    <div className="absolute pointer-events-none" style={{ left: zn.cx - ZW / 2 + 36, top: zn.cy - ZH / 2 + 34, width: ZW - 60 }}>
      <div className="font-mono text-[20px] text-signal mb-3">Texas A&amp;M · TwelveLabs · Bay Area</div>
      <h1 className="font-display font-extrabold uppercase text-[128px] leading-[0.82] tracking-[-0.055em] text-chalk">Aahil<br />Shaikh</h1>
      <p className="font-display text-[34px] leading-[1.1] mt-6 text-chalk-2 tracking-[-0.02em]" style={{ width: 380 }}>Not another sheep in the herd.</p>
      <p className="font-mono text-[18px] leading-[1.4] mt-8 text-mute" style={{ width: 250 }}>Pick things up. Throw them. Look underneath.</p>
    </div>
  )
}

/* ---------- static decals ---------- */
export const RING = { x: z("contact").cx + 175, y: z("contact").cy + 205 }
export function Decals({ lift }: { lift: boolean }) {
  const sy = z("systems")
  return (
    <>
      {/* coffee ring: lives under the mug's home spot */}
      <div className="absolute pointer-events-none" style={{ left: RING.x, top: RING.y + 8, width: 140, height: 140, marginLeft: -70, marginTop: -70 }}>
        <svg viewBox="0 0 140 140" className="w-full h-full" aria-hidden="true">
          <circle cx="70" cy="70" r="52" fill="none" stroke="#8a5a3c" strokeOpacity=".55" strokeWidth="4" />
          <circle cx="70" cy="70" r="49" fill="none" stroke="#8a5a3c" strokeOpacity=".25" strokeWidth="1.5" />
          <path d="M100 30 q18 14 12 40" stroke="#8a5a3c" strokeOpacity=".3" strokeWidth="3" fill="none" />
        </svg>
      </div>
      <div className="absolute font-mono text-[14px] text-mute/80 pointer-events-none whitespace-nowrap" style={{ left: RING.x - 150, top: RING.y + 70, transform: "rotate(-8deg)" }}>cold brew, 2am</div>
      {/* hidden under the SYSTEMS pile (SAGE on top): a corner peeks out, fan the pile to read it */}
      <div className="absolute pointer-events-none bg-[#E9E2A8] text-[#3a3410] font-mono text-[13px] leading-[1.5] p-3" style={{ left: sy.cx + 165, top: sy.cy + 50, width: 200, height: 160, marginLeft: -100, marginTop: -80, transform: "rotate(11deg)", boxShadow: "0 3px 8px rgba(0,0,0,.5)", zIndex: lift ? 4001 : 1 }}>
        <div className="font-bold">sage, rough</div>
        marengo → 1024-d<br />2s segments<br />cosine similarity<br />compare two videos
        <div className="mt-1 text-[#7a6d20]">(you found it)</div>
      </div>
    </>
  )
}

export function Drawer() {
  const [open, setOpen] = useState(false)
  const zn = zoneOf("older")
  const old = LEDGER_ROWS.filter((r) => ["hacks", "frc", "berkeley"].includes(r.id))
  return (
    <div data-nodrag data-cursor="pull" className="absolute" style={{ left: zn.cx - 240, top: zn.cy - 110, width: 480, zIndex: 1 }}>
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="relative block w-full h-[190px] bg-ink-2 border border-edge/60 text-left" style={{ boxShadow: "0 4px 10px rgba(0,0,0,.5)" }}>
        <span className="absolute left-1/2 top-[92px] -translate-x-1/2 w-40 h-4 rounded-full bg-[#C9D2DE]" />
        <span className="absolute left-4 top-3 font-mono text-[16px] text-chalk-2 uppercase tracking-widest">{open ? "older things" : "drawer"}</span>
      </button>
      <div className="overflow-hidden bg-[#06080C] border-x border-b border-edge/40 transition-[height] duration-500 ease-out" style={{ height: open ? 290 : 0 }}>
        <div className="flex gap-3 p-4">
          {old.map((r, i) => (
            <div key={r.id} className="w-[142px] shrink-0 bg-[#DCE2EA] text-[#10161f] p-2.5 h-[250px] overflow-hidden" style={{ transform: `rotate(${(i - 1) * 3}deg)` }}>
              <div className="font-mono text-[12px] text-[#44546a]">{r.when}</div>
              <div className="font-display font-bold text-[17px] leading-tight mb-1">{r.title}</div>
              <div className="font-mono text-[12px] text-[#44546a] mb-1">{r.org}</div>
              {r.body && <p className="text-[12px] leading-[1.3] text-[#26334a]">{r.body.slice(0, 90)}{r.body.length > 90 ? "…" : ""}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
