import { useState } from "react"
import { ELECTRA, PROJECT_CARDS } from "@/data/work"
import { TOOLKIT_GROUPS } from "@/data/toolkit"

type Tab = "agents" | "systems" | "toolkit"
const TABS: { id: Tab; label: string; glyph: string }[] = [
  { id: "agents", label: "AGENTS", glyph: "A" },
  { id: "systems", label: "SYSTEMS", glyph: "S" },
  { id: "toolkit", label: "TOOLKIT", glyph: "T" },
]

/* The little desktop that lives on the monitor glass. Fixed 1280x720 CSS px. */
export default function MonitorOS() {
  const [tab, setTab] = useState<Tab>("agents")
  const [open, setOpen] = useState<string | null>(null)
  const proj = PROJECT_CARDS.find((p) => p.id === open)
  const title = proj ? `systems / ${proj.title.toLowerCase()}` : tab === "agents" ? "electra" : tab
  return (
    <div className="flex flex-col bg-void text-chalk select-text" style={{ width: 1280, height: 720 }}>
      <div className="h-[44px] shrink-0 flex items-center gap-3 px-4 bg-ink border-b border-line">
        <span className="size-3 rounded-full bg-signal" /><span className="size-3 rounded-full bg-edge" /><span className="size-3 rounded-full bg-line" />
        <span className="ml-3 font-mono text-[15px] text-chalk-2">{title}</span>
      </div>
      <div className="flex flex-1 min-h-0">
        <nav aria-label="Desktop" className="w-[220px] shrink-0 bg-ink border-r border-line p-4 flex flex-col gap-2">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => { setTab(t.id); setOpen(null) }} aria-pressed={tab === t.id} className={`flex items-center gap-3 text-left font-mono text-[16px] tracking-[0.1em] px-3 py-3 border cursor-pointer focus-visible:outline-2 focus-visible:outline-signal ${tab === t.id ? "border-signal text-signal bg-void" : "border-transparent text-chalk-2 hover:text-chalk hover:border-line"}`}>
              <span className="grid place-items-center size-8 border border-current font-display font-extrabold text-[16px]">{t.glyph}</span>{t.label}
            </button>
          ))}
          <div className="mt-auto font-mono text-[12px] text-mute">click anything. esc to sit back.</div>
        </nav>
        <main className="flex-1 min-w-0 overflow-y-auto p-9">
          {tab === "agents" && (
            <>
              <div className="font-mono text-[14px] tracking-[0.1em] uppercase text-signal mb-3">{ELECTRA.stamp}</div>
              <h2 className="font-display font-extrabold uppercase text-[88px] leading-[0.88] tracking-[-0.03em] mb-5">{ELECTRA.title}</h2>
              <p className="text-[20px] leading-[1.5] text-chalk-2 max-w-[66ch]">{ELECTRA.lede}</p>
              <dl className="mt-7 grid grid-cols-3 gap-7">
                {ELECTRA.rows.map((r) => (
                  <div key={r.label}><dt className="font-mono text-[14px] tracking-[0.12em] uppercase text-signal mb-2">{r.label}</dt><dd className="text-[15px] leading-[1.5] text-chalk-2">{r.body}</dd></div>
                ))}
              </dl>
              <p className="font-mono text-[13px] text-mute mt-6">{ELECTRA.note}</p>
            </>
          )}
          {tab === "systems" && !proj && (
            <ul className="grid grid-cols-2 gap-4">
              {PROJECT_CARDS.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setOpen(c.id)} className="w-full h-full text-left border border-line bg-ink-2 p-5 cursor-pointer hover:border-signal focus-visible:outline-2 focus-visible:outline-signal">
                    <div className="font-mono text-[12px] tracking-[0.1em] uppercase text-mute">{c.stamp}</div>
                    <div className="font-display font-extrabold uppercase text-[34px] leading-none tracking-[-0.02em] mt-1">{c.title}</div>
                    <p className="text-[15px] leading-[1.45] text-chalk-2 mt-2 line-clamp-3">{c.desc}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {tab === "systems" && proj && (
            <article className="max-w-[70ch]">
              <button onClick={() => setOpen(null)} className="font-mono text-[14px] text-signal underline underline-offset-4 mb-5 cursor-pointer focus-visible:outline-2 focus-visible:outline-signal">← all systems</button>
              <div className="font-mono text-[14px] tracking-[0.1em] uppercase text-mute">{proj.stamp}</div>
              <h2 className="font-display font-extrabold uppercase text-[72px] leading-[0.9] tracking-[-0.03em] mt-1">{proj.title}</h2>
              <p className="text-[20px] leading-[1.5] text-chalk-2 mt-5">{proj.desc}</p>
              <div className="flex flex-wrap gap-2 mt-5">{proj.tags.map((t) => <span key={t} className="font-mono text-[13px] border border-edge text-chalk-2 px-3 py-1">{t}</span>)}</div>
              {proj.link && <a href={proj.link.href} target="_blank" rel="noreferrer" className="inline-block font-mono text-[16px] text-signal underline underline-offset-4 mt-6 focus-visible:outline-2 focus-visible:outline-signal">{proj.link.label} ↗</a>}
            </article>
          )}
          {tab === "toolkit" && (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-6">
              {TOOLKIT_GROUPS.map((g) => (
                <div key={g.id}><dt className={`font-mono text-[14px] tracking-[0.12em] uppercase mb-2 ${g.accent ? "text-signal" : "text-chalk"}`}>{g.title}</dt><dd className="text-[15px] leading-[1.5] text-chalk-2">{g.items}</dd></div>
              ))}
            </dl>
          )}
        </main>
      </div>
    </div>
  )
}
