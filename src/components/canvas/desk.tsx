import { useState, type ReactNode } from "react"
import { ELECTRA, PROJECT_CARDS, OSS_ITEMS } from "@/data/work"
import { LEDGER_ROWS } from "@/data/path"
import { TOOLKIT_GROUPS } from "@/data/toolkit"

export const DESK = { x: -1200, y: -750, w: 2400, h: 1500 }
export const FIT = { x: -1260, y: -790, w: 2520, h: 1620 }

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

/* ---------- shared bits ---------- */
const Chip = ({ children }: { children: ReactNode }) => (
  <span className="inline-block border border-edge text-chalk-2 font-mono text-[11px] px-2 py-0.5 mr-1.5 mb-1.5">{children}</span>
)
const Ext = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="inline-block font-mono text-[14px] text-signal underline underline-offset-4 mr-5 mt-4">{children}</a>
)
const SHORT: Record<string, string> = { agentsec: "Agent Security", devex: "DevEx", tamu: "Texas A&M", avionics: "Avionics Lead", hacks: "Chinatown Hacks", frc: "Circuit Bakers", berkeley: "CS61A" }
const SHOT: Record<string, string> = { flashguard: "/img/projects/flashguard.png", mailsmith: "/img/projects/mailsmith.png", ufw: "/img/projects/ufwmanager.png" }

function DetailShell({ stamp, title, children, cover, img }: { stamp: string; title: string; children: ReactNode; cover?: string; img?: string }) {
  return (
    <div>
      {img ? <img src={img} alt="" className="w-full h-auto mb-5 border border-line" /> : cover ? <Cover id={cover} className="w-full h-[170px] mb-5 border border-line" /> : null}
      <div className="font-mono text-[12px] text-mute mb-2">{stamp}</div>
      <h3 className="font-display font-extrabold text-[44px] leading-none tracking-[-0.03em] mb-4">{title}</h3>
      {children}
    </div>
  )
}

/* ---------- objects ---------- */
const cardObj = (id: string, x: number, y: number, r: number): ObjSpec => {
  const c = PROJECT_CARDS.find((p) => p.id === id)!
  return {
    id, w: 216, h: 300, x, y, r,
    face: (
      <div className="h-full flex flex-col bg-ink-2 border border-line rounded-[3px] overflow-hidden">
        <Cover id={id} className="w-full h-[52%] block" />
        <div className="p-3 flex-1">
          <div className="font-mono text-[9.5px] text-mute leading-tight mb-1.5">{c.stamp}</div>
          <div className="font-display font-extrabold uppercase text-[27px] leading-[0.95] tracking-[-0.03em]">{c.title}</div>
        </div>
      </div>
    ),
    detail: (
      <DetailShell stamp={c.stamp} title={c.title} cover={id}>
        <p className="text-[17px] leading-[1.5] text-chalk-2">{c.desc}</p>
        <div className="mt-4">{c.tags.map((t) => <Chip key={t}>{t}</Chip>)}</div>
        {c.link && <Ext href={c.link.href}>{c.link.label} ↗</Ext>}
      </DetailShell>
    ),
  }
}

const ossObj = (id: string, x: number, y: number, r: number, polaroid: boolean): ObjSpec => {
  const o = OSS_ITEMS.find((p) => p.id === id)!
  const shot = SHOT[id]
  const detail = (
    <DetailShell stamp={o.status} title={o.title} cover={id} img={shot}>
      <p className="text-[16px] leading-[1.5] text-chalk-2">{o.desc}</p>
      {o.link && <Ext href={o.link.href}>{o.link.label} ↗</Ext>}
    </DetailShell>
  )
  if (!polaroid) {
    return {
      id, w: 216, h: 300, x, y, r, detail,
      face: (
        <div className="h-full flex flex-col bg-ink-2 border border-line rounded-[3px] overflow-hidden">
          <Cover id={id} className="w-full h-[52%] block" />
          <div className="p-3">
            <div className="font-mono text-[9.5px] text-signal uppercase mb-1.5">{o.status} · stays on my hardware</div>
            <div className="font-display font-extrabold uppercase text-[34px] leading-[0.95] tracking-[-0.03em]">{o.title}</div>
          </div>
        </div>
      ),
    }
  }
  return {
    id, w: 224, h: 262, x, y, r, detail,
    face: (
      <div className="h-full bg-[#E4E9F0] p-[11px] pb-0 text-[#10161f] rounded-[2px]">
        {shot ? <img src={shot} alt="" draggable={false} className="w-full h-[170px] object-cover object-top block" /> : <Cover id={id} className="w-full h-[170px] block" />}
        <div className="font-display font-extrabold uppercase text-[24px] tracking-[-0.02em] mt-2 leading-none">{o.title}</div>
        <div className="font-mono text-[9.5px] text-[#44546a] mt-1">{o.status}</div>
      </div>
    ),
  }
}

const Paper = ({ children, pages = 2 }: { children: ReactNode; pages?: number }) => (
  <div className="relative h-full">
    {pages > 1 && <div className="absolute inset-0 bg-[#BFC7D3] translate-x-[5px] translate-y-[4px] rotate-[1.5deg]" />}
    <div className="relative h-full bg-[#DCE2EA] text-[#10161f] p-5 overflow-hidden rounded-[1px]">{children}</div>
  </div>
)
const Staple = () => <div className="absolute -top-0.5 left-4 w-6 h-[3px] bg-[#6a7790] rotate-[-18deg] z-10" />

const electraDetail = (
  <DetailShell stamp={ELECTRA.stamp} title={ELECTRA.title}>
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

export const OBJS: ObjSpec[] = [
  // agents pile
  {
    id: "electra", w: 280, h: 380, x: -560, y: 30, r: -4, detail: electraDetail,
    face: (
      <Paper>
        <Staple />
        <div className="font-mono text-[10px] text-[#44546a] mb-2">{ELECTRA.stamp}</div>
        <div className="font-display font-extrabold uppercase text-[56px] leading-[0.9] tracking-[-0.04em] mb-3">{ELECTRA.title}</div>
        <p className="text-[13px] leading-[1.45] text-[#26334a]">{ELECTRA.lede}</p>
        <div className="mt-3 space-y-1.5">{[0.9, 0.7, 0.85, 0.5].map((w, i) => <div key={i} className="h-[5px] bg-[#9aa6b8]" style={{ width: `${w * 100}%` }} />)}</div>
      </Paper>
    ),
  },
  ossObj("magi", -420, 70, 5, false),
  // systems pile
  cardObj("sage", -270, -570, -5),
  cardObj("recurser", -80, -590, 4),
  cardObj("jockey", 110, -560, -3),
  cardObj("bastion", -210, -275, 6),
  cardObj("sentinel", -10, -300, -7),
  cardObj("density", 190, -270, 3),
  // side quests polaroids
  ossObj("flashguard", 560, -470, -7, true),
  ossObj("mailsmith", 720, -430, 4, true),
  ossObj("ufw", 880, -480, -3, true),
  ossObj("clair", 1010, -400, 8, true),
  // photo
  {
    id: "photo", w: 236, h: 300, x: -1000, y: 20, r: -6,
    detail: (
      <div>
        <img src="/img/photo.jpg" alt="Aahil Shaikh" className="w-full max-h-[60vh] object-cover object-top mb-4 border border-line" />
        <h3 className="font-display font-extrabold text-[44px] leading-none tracking-[-0.03em]">Aahil Shaikh</h3>
        <p className="font-mono text-[13px] text-chalk-2 mt-2">Texas A&amp;M · TwelveLabs · Bay Area</p>
      </div>
    ),
    face: (
      <div className="h-full bg-[#E4E9F0] p-3 pb-0 text-[#10161f]">
        <img src="/img/photo.jpg" alt="" draggable={false} className="w-full h-[222px] object-cover object-top block" />
        <div className="font-mono text-[11px] mt-2.5 text-center">aahil, sophomore year</div>
      </div>
    ),
  },
  // resume
  {
    id: "resume", w: 300, h: 400, x: -20, y: 130, r: 2,
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
        <div className="font-display font-extrabold uppercase text-[32px] leading-[0.9] tracking-[-0.03em]">Aahil Shaikh</div>
        <div className="font-mono text-[9.5px] text-[#44546a] mt-1 mb-3">College Station, TX · Sophomore · 4.0 GPA</div>
        <div className="border-t border-[#8c98ab] pt-2 mb-2 font-mono text-[9px] uppercase text-[#44546a]">Experience</div>
        {LEDGER_ROWS.filter((r) => ["agentsec", "devex", "avionics", "frc"].includes(r.id)).map((r) => (
          <div key={r.id} className="mb-2">
            <div className="font-display font-bold text-[12px] leading-tight">{SHORT[r.id]}</div>
            <div className="font-mono text-[9px] text-[#44546a]">{r.org} · {r.when}</div>
          </div>
        ))}
        <a href="/assets/aahil-shaikh-resume.pdf" className="absolute bottom-4 left-5 font-mono text-[10px] underline text-[#a1281f]">PDF ↗</a>
      </Paper>
    ),
  },
  // receipt (timeline)
  {
    id: "receipt", w: 200, h: 540, x: 1080, y: 80, r: 3, detail: ledgerDetail,
    face: (
      <div className="h-full bg-[#F1F3F6] text-[#10161f] font-mono text-[10px] px-3.5 pt-4 leading-[1.5]" style={{ clipPath: "polygon(0 0,100% 0,100% 97%,95% 100%,90% 97%,85% 100%,80% 97%,75% 100%,70% 97%,65% 100%,60% 97%,55% 100%,50% 97%,45% 100%,40% 97%,35% 100%,30% 97%,25% 100%,20% 97%,15% 100%,10% 97%,5% 100%,0 97%)" }}>
        <div className="text-center font-bold text-[13px] tracking-widest">PATH</div>
        <div className="text-center text-[#44546a] mb-2">-- itemized --</div>
        {LEDGER_ROWS.map((r) => (
          <div key={r.id} className="mb-2">
            <div className="font-bold uppercase">{SHORT[r.id] ?? r.title}</div>
            <div className="text-[#44546a]">{r.when}</div>
            <div className="text-[#44546a] truncate">{r.org}</div>
          </div>
        ))}
        <div className="border-t border-dashed border-[#44546a] mt-2 pt-1 text-center">KEEP GOING</div>
      </div>
    ),
  },
  // toolkit tray
  {
    id: "tray", w: 560, h: 300, x: 440, y: 330, r: 1, detail: (
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
      <div className="h-full bg-[#0E131C] border-2 border-edge/60 rounded-[6px] p-3 grid grid-cols-3 grid-rows-2 gap-2.5 shadow-[inset_0_6px_14px_rgba(0,0,0,.6)]">
        {TOOLKIT_GROUPS.map((g) => {
          const items = g.items.split(" · ")
          return (
            <div key={g.id} className="bg-ink border border-line p-2 overflow-hidden">
              <div className={`font-mono text-[9.5px] uppercase mb-1.5 ${g.accent ? "text-signal" : "text-mute"}`}>{g.title}</div>
              {items.slice(0, 4).map((t) => <span key={t} className="inline-block bg-ink-2 border border-edge/50 text-chalk-2 font-mono text-[9px] px-1.5 py-px mr-1 mb-1 rounded-full">{t}</span>)}
              {items.length > 4 && <span className="font-mono text-[9px] text-signal">+{items.length - 4}</span>}
            </div>
          )
        })}
      </div>
    ),
  },
  // contact sticky
  {
    id: "contact", w: 250, h: 250, x: -640, y: 380, r: -5,
    face: (
      <div className="h-full bg-coral text-[#1a0d0b] p-4 shadow-[inset_0_-24px_30px_-24px_rgba(0,0,0,.3)]">
        <div className="font-display font-extrabold text-[27px] leading-[0.95] tracking-[-0.03em] mb-3">Say something interesting.</div>
        <p className="text-[11.5px] leading-[1.35] mb-3">Agents, graph memory, video models, or a problem without a name yet. I read everything.</p>
        {CONTACT.map((l) => <div key={l.href}><a href={l.href} className="font-mono text-[11.5px] underline">{l.label}</a></div>)}
      </div>
    ),
  },
  // mug
  {
    id: "mug", w: 150, h: 150, x: 870, y: 360, r: 0, bare: true,
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

/* ---------- static decals ---------- */
export const TAPES: { label: string; x: number; y: number; r: number; fly: [number, number, number] }[] = [
  { label: "AGENTS", x: -600, y: -190, r: -3, fly: [-500, 50, 1.5] },
  { label: "SYSTEMS", x: -60, y: -735, r: 1.5, fly: [-30, -430, 1.15] },
  { label: "SIDE QUESTS", x: 780, y: -665, r: -2, fly: [790, -430, 1.3] },
  { label: "TOOLKIT", x: 440, y: 160, r: 2, fly: [440, 330, 1.4] },
  { label: "PATH", x: 1080, y: -215, r: -3, fly: [1080, 80, 1.3] },
]

export function Decals() {
  return (
    <>
      {/* coffee ring: lives under the mug's home spot */}
      <div className="absolute pointer-events-none" style={{ left: 850, top: 385, width: 140, height: 140, marginLeft: -70, marginTop: -70 }}>
        <svg viewBox="0 0 140 140" className="w-full h-full" aria-hidden="true">
          <circle cx="70" cy="70" r="52" fill="none" stroke="#8a5a3c" strokeOpacity=".55" strokeWidth="4" />
          <circle cx="70" cy="70" r="49" fill="none" stroke="#8a5a3c" strokeOpacity=".25" strokeWidth="1.5" />
          <path d="M100 30 q18 14 12 40" stroke="#8a5a3c" strokeOpacity=".3" strokeWidth="3" fill="none" />
        </svg>
      </div>
      <div className="absolute font-mono text-[12px] text-mute/80 pointer-events-none" style={{ left: 925, top: 450, transform: "rotate(-8deg)" }}>cold brew, 2am</div>
      {/* hidden under SAGE */}
      <div className="absolute pointer-events-none bg-[#E9E2A8] text-[#3a3410] font-mono text-[12px] leading-[1.5] p-3" style={{ left: -270, top: -550, width: 190, height: 150, marginLeft: -95, marginTop: -75, transform: "rotate(11deg)", boxShadow: "0 3px 8px rgba(0,0,0,.5)" }}>
        <div className="font-bold">sage, rough</div>
        marengo → 1024-d<br />2s segments<br />cosine similarity<br />compare two videos
        <div className="mt-1 text-[#7a6d20]">(you found it)</div>
      </div>
    </>
  )
}

export function TapeLabel({ t }: { t: (typeof TAPES)[number] }) {
  return (
    <div
      data-fly={t.fly.join(",")}
      className="absolute font-mono font-bold text-[20px] tracking-[0.18em] text-[#10161f] bg-[#E8D9A6]/90 px-5 py-1.5 whitespace-nowrap"
      style={{ left: t.x, top: t.y, transform: `translate(-50%,-50%) rotate(${t.r}deg)`, zIndex: 90, clipPath: "polygon(2% 0,98% 0,100% 20%,98% 45%,100% 70%,98% 100%,2% 100%,0 75%,2% 50%,0 25%)" }}
    >
      {t.label}
    </div>
  )
}

export function Drawer() {
  const [open, setOpen] = useState(false)
  const old = LEDGER_ROWS.filter((r) => ["hacks", "frc", "berkeley"].includes(r.id))
  return (
    <div data-nodrag data-cursor="pull" className="absolute" style={{ left: -260, top: 662, width: 520, zIndex: 1 }}>
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="relative block w-full h-[88px] bg-ink-2 border border-edge/60 text-left" style={{ boxShadow: "0 4px 10px rgba(0,0,0,.5)" }}>
        <span className="absolute left-1/2 top-9 -translate-x-1/2 w-24 h-3 rounded-full bg-[#C9D2DE]" />
        <span className="absolute left-3 top-2 font-mono text-[10px] text-mute uppercase tracking-widest">{open ? "older things" : "drawer"}</span>
      </button>
      <div className="overflow-hidden bg-[#06080C] border-x border-b border-edge/40 transition-[height] duration-500 ease-out" style={{ height: open ? 210 : 0 }}>
        <div className="flex gap-3 p-4">
          {old.map((r, i) => (
            <div key={r.id} className="w-[150px] shrink-0 bg-[#DCE2EA] text-[#10161f] p-2.5 h-[170px] overflow-hidden" style={{ transform: `rotate(${(i - 1) * 3}deg)` }}>
              <div className="font-mono text-[9px] text-[#44546a]">{r.when}</div>
              <div className="font-display font-bold text-[14px] leading-tight mb-1">{r.title}</div>
              <div className="font-mono text-[9px] text-[#44546a] mb-1">{r.org}</div>
              {r.body && <p className="text-[9.5px] leading-[1.3] text-[#26334a]">{r.body.slice(0, 120)}{r.body.length > 120 ? "…" : ""}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
