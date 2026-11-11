import { useEffect, useRef, useState } from "react"
import { AGENT_ITEMS, HOME, SIDE_ITEMS, SYSTEM_ITEMS, TOOLKIT_GROUPS, WRITING_ITEMS, type Item } from "./content"
import { osNav } from "./shared"

type Folder = "agents" | "systems" | "side" | "toolkit" | "writing"
const FOLDERS: { id: Folder; label: string }[] = [
  { id: "agents", label: "Agents" },
  { id: "systems", label: "Systems" },
  { id: "side", label: "Side Quests" },
  { id: "toolkit", label: "Toolkit" },
  { id: "writing", label: "Writing" },
]
const ITEMS: Record<string, Item[]> = { agents: AGENT_ITEMS, systems: SYSTEM_ITEMS, side: SIDE_ITEMS, writing: WRITING_ITEMS }

const FolderIcon = ({ active }: { active: boolean }) => (
  <svg viewBox="0 0 48 40" className="w-12 h-10" aria-hidden="true">
    <path d="M2 8a3 3 0 0 1 3-3h13l5 5h20a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" fill={active ? "var(--color-signal)" : "var(--color-edge)"} />
    <path d="M2 16h44v19a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3z" fill={active ? "var(--color-coral)" : "var(--color-chalk-2)"} opacity="0.9" />
  </svg>
)

function ItemDetail({ it, back, compact }: { it: Item; back: () => void; compact: boolean }) {
  return (
    <article className="max-w-[72ch]">
      <button onClick={back} className="font-mono text-[14px] text-signal underline underline-offset-4 mb-4 cursor-pointer focus-visible:outline-2 focus-visible:outline-signal">← back</button>
      <div className="font-mono text-[13px] tracking-[0.1em] uppercase text-mute">{it.kicker}</div>
      <h2 className={`font-display font-extrabold uppercase ${compact ? "text-[38px]" : "text-[64px]"} leading-[0.9] tracking-[-0.03em] mt-1`}>{it.title}</h2>
      <p className="text-[19px] leading-[1.5] text-chalk-2 mt-4">{it.body}</p>
      {it.rows && (
        <dl className={`mt-5 grid ${compact ? "grid-cols-1" : "grid-cols-3"} gap-6`}>
          {it.rows.map((r) => <div key={r.label}><dt className="font-mono text-[13px] tracking-[0.12em] uppercase text-signal mb-1">{r.label}</dt><dd className="text-[14px] leading-[1.45] text-chalk-2">{r.body}</dd></div>)}
        </dl>
      )}
      {it.tags && <div className="flex flex-wrap gap-2 mt-4">{it.tags.map((t) => <span key={t} className="font-mono text-[12px] border border-edge text-chalk-2 px-2 py-0.5">{t}</span>)}</div>}
      {it.note && <p className="font-mono text-[12px] text-mute mt-4">{it.note}</p>}
      {it.link && <a href={it.link.href} target="_blank" rel="noreferrer" className="inline-block font-mono text-[15px] text-signal underline underline-offset-4 mt-5 focus-visible:outline-2 focus-visible:outline-signal">{it.link.label} ↗</a>}
    </article>
  )
}

/* The little desktop on the monitor glass. Fixed 1280x720 CSS px.
   Home is a README that says who this is; Electra lives inside Agents. */
export default function MonitorOS({ compact = false, onExit }: { compact?: boolean; onExit?: () => void }) {
  const [folder, setFolder] = useState<Folder | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const items = folder ? ITEMS[folder] : undefined
  const it = items?.find((i) => i.id === open)
  const go = (f: Folder | null) => { setFolder(f); setOpen(null) }
  // the stack of views is home > folder > item, so its depth is 0, 1 or 2; back pops one level and leaving is only offered from home
  const depth = it ? 2 : folder ? 1 : 0
  const back = () => { if (open) setOpen(null); else if (folder) go(null) }
  const live = useRef({ depth, back, onExit })
  live.current = { depth, back, onExit }
  useEffect(() => {
    osNav.depth = depth; osNav.back = () => live.current.back()
    return () => { osNav.depth = 0; osNav.back = () => {} }
  }, [depth])
  const title = !folder ? "README.md" : it ? `${folder}/${it.id}` : folder === "side" ? "side quests" : folder

  return (
    <div onContextMenu={(e) => { e.preventDefault(); const l = live.current; if (l.depth > 0) l.back(); else l.onExit?.() }} className="flex flex-col bg-void text-chalk select-text" style={compact ? { width: "100%", height: "100%" } : { width: 1280, height: 720 }}>
      <div className="h-[40px] shrink-0 flex items-center gap-3 px-4 bg-ink border-b border-line font-mono text-[13px] text-chalk-2">
        <span className="font-bold text-signal">&gt;_</span><span>{HOME.name.toLowerCase()}</span><span className="ml-auto text-mute">desktop</span>
      </div>
      <div className={`flex flex-1 min-h-0 ${compact ? "flex-col" : ""}`}>
        <nav aria-label="Desktop" className={compact ? "shrink-0 border-b border-line p-2 flex gap-1 overflow-x-auto" : "w-[200px] shrink-0 border-r border-line p-3 grid content-start gap-1"} style={{ background: "linear-gradient(180deg, var(--color-ink), var(--color-void))" }}>
          {FOLDERS.map((f) => (
            <button key={f.id} onClick={() => go(f.id)} aria-pressed={folder === f.id} className={`flex flex-col items-center gap-1 ${compact ? "px-2 shrink-0" : ""} py-2 border cursor-pointer focus-visible:outline-2 focus-visible:outline-signal ${folder === f.id ? "border-signal bg-ink-2" : "border-transparent hover:border-line"}`}>
              <FolderIcon active={folder === f.id} />
              <span className={`font-mono text-[13px] tracking-[0.06em] ${folder === f.id ? "text-signal" : "text-chalk-2"}`}>{f.label}</span>
            </button>
          ))}
        </nav>
        <section aria-label={title} className={`flex-1 min-w-0 min-h-0 flex flex-col ${compact ? "p-2" : "p-6"}`}>
          <div className="flex-1 min-h-0 flex flex-col border border-edge bg-ink-2">
            <div className="h-[36px] shrink-0 flex items-center gap-2 px-3 bg-ink border-b border-line">
              <span className="size-3 rounded-full bg-signal" /><span className="size-3 rounded-full bg-edge" /><span className="size-3 rounded-full bg-line" />
              {depth > 0 && <button onClick={back} className="ml-2 font-mono text-[13px] text-signal hover:underline cursor-pointer px-1 focus-visible:outline-2 focus-visible:outline-signal">‹ back</button>}
              <span className="ml-2 font-mono text-[13px] text-chalk-2">{title}</span>
              <span className="ml-3 font-mono text-[11px] text-mute hidden sm:inline">{depth > 0 ? "right-click or Esc to go back" : "right-click or Esc to leave"}</span>
              {folder && <button onClick={() => go(null)} aria-label="Close window" className="ml-auto font-mono text-[14px] text-chalk-2 hover:text-signal cursor-pointer px-2 focus-visible:outline-2 focus-visible:outline-signal">×</button>}
            </div>
            <div className={`flex-1 min-h-0 overflow-y-auto ${compact ? "p-4" : "p-8"}`}>
              {!folder && (
                <div className="max-w-[60ch]">
                  <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-signal mb-4">{HOME.eyebrow}</p>
                  <h1 className={`font-display font-extrabold ${compact ? "text-[44px]" : "text-[84px]"} leading-[0.92] tracking-[-0.04em] mb-6`}>{HOME.name}</h1>
                  <p className={`font-display font-semibold ${compact ? "text-[19px]" : "text-[27px]"} leading-[1.18] tracking-[-0.02em]`}>{HOME.thesis}</p>
                  <p className="font-mono text-[13px] text-chalk-2 mt-6">{HOME.meta}</p>
                  <p className="font-mono text-[12px] text-mute mt-4">open a folder on the left.</p>
                </div>
              )}
              {folder && folder !== "toolkit" && !it && (
                <ul className={`grid ${compact ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
                  {items!.map((i) => (
                    <li key={i.id}>
                      <button onClick={() => setOpen(i.id)} className="w-full h-full text-left border border-line bg-void p-5 cursor-pointer hover:border-signal focus-visible:outline-2 focus-visible:outline-signal">
                        <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-mute">{i.kicker}</div>
                        <div className="font-display font-extrabold uppercase text-[30px] leading-none tracking-[-0.02em] mt-1">{i.title}</div>
                        <p className="text-[14px] leading-[1.45] text-chalk-2 mt-2 line-clamp-3">{i.body}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {it && <ItemDetail it={it} back={() => setOpen(null)} compact={compact} />}
              {folder === "toolkit" && (
                <dl className={`grid ${compact ? "grid-cols-1" : "grid-cols-2"} gap-x-8 gap-y-6`}>
                  {TOOLKIT_GROUPS.map((g) => <div key={g.id}><dt className={`font-mono text-[13px] tracking-[0.12em] uppercase mb-1 ${g.accent ? "text-signal" : "text-chalk"}`}>{g.title}</dt><dd className="text-[14px] leading-[1.5] text-chalk-2">{g.items}</dd></div>)}
                </dl>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
