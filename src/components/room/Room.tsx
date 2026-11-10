import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { OSS_ITEMS, PROJECT_CARDS } from "@/data/work"
import { LEDGER_ROWS } from "@/data/path"
import Scene, { type Ctx, type Input } from "./Scene"
import { DESK_ITEMS, STATIONS, type SId } from "./stations"

const CONTACT = [
  { href: "mailto:aahils2019@gmail.com", label: "aahils2019@gmail.com" },
  { href: "https://github.com/The007Programmer", label: "GitHub" },
  { href: "https://www.linkedin.com/in/aahil-shaikh-04b9ba356/", label: "LinkedIn" },
  { href: "/assets/aahil-shaikh-resume.pdf", label: "Résumé (PDF)" },
]

const Ext = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="inline-block font-mono text-[13px] text-signal underline underline-offset-4 mr-5 mt-3 hover:text-coral focus-visible:outline-2 focus-visible:outline-signal">{children}</a>
)
const H = ({ k, children }: { k?: string; children: ReactNode }) => (
  <div className="mb-4">
    {k && <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-signal mb-1">{k}</div>}
    <h2 className="font-display font-extrabold uppercase text-[34px] leading-[0.95] tracking-[-0.03em] text-chalk">{children}</h2>
  </div>
)

/* ------------------------------------------------------------ panel bodies */
function CardPanel({ id }: { id: string }) {
  const it = DESK_ITEMS.find((d) => d.id === id)!
  return (
    <>
      <H k={it.kind === "HELLO" ? it.org : `${it.kind} · ${it.stamp}`}>{it.title}</H>
      <img src={it.img} alt="" className={`w-full border border-line mb-4 ${it.kind === "HELLO" ? "max-h-[300px] object-cover" : "object-cover object-top max-h-[220px]"}`} />
      <p className="text-[15px] leading-[1.55] text-chalk-2">{it.desc}</p>
      {it.link && <Ext href={it.link.href}>{it.link.label} ↗</Ext>}
    </>
  )
}

function ShelfPanel() {
  return (
    <>
      <H k="writeups, my byline">On the shelf</H>
      {PROJECT_CARDS.filter((p) => p.id === "sage" || p.id === "recurser").map((c) => (
        <article key={c.id} className="mb-6 pb-6 border-b border-line">
          <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-mute">{c.stamp}</div>
          <h3 className="font-display font-extrabold uppercase text-[34px] leading-none tracking-[-0.02em] mt-1">{c.title}</h3>
          <p className="text-[15px] leading-[1.55] text-chalk-2 mt-2">{c.desc}</p>
          {c.link && <Ext href={c.link.href}>{c.link.label} ↗</Ext>}
        </article>
      ))}
    </>
  )
}

function BoardPanel() {
  return (
    <>
      <H k="pinned, oldest to newest, read it top to bottom">Path</H>
      <ol className="relative border-l-2 border-signal/60 ml-1 pl-5 grid gap-5">
        {[...LEDGER_ROWS].reverse().map((r) => (
          <li key={r.id}>
            <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-signal">{r.when}</div>
            <div className="font-display font-bold text-[18px] leading-tight mt-0.5">{r.title}</div>
            <div className="font-mono text-[12px] text-mute">{r.org}</div>
            {r.body && <p className="text-[14px] leading-[1.5] text-chalk-2 mt-1">{r.body}</p>}
          </li>
        ))}
      </ol>
    </>
  )
}

function DrawerPanel() {
  return (
    <>
      <H k="pull the drawer">Side quests</H>
      <ul className="grid gap-5">
        {OSS_ITEMS.map((o) => (
          <li key={o.id} className="border-b border-line pb-5">
            <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-signal">{o.status}</div>
            <div className="font-display font-extrabold uppercase text-[26px] leading-none mt-1">{o.title}</div>
            <p className="text-[14px] leading-[1.5] text-chalk-2 mt-2">{o.desc}</p>
            {o.link && <Ext href={o.link.href}>{o.link.label} ↗</Ext>}
          </li>
        ))}
      </ul>
    </>
  )
}

function NotesPanel() {
  return (
    <>
      <H k="I read everything">Contact</H>
      <ul className="grid gap-3">
        {CONTACT.map((l) => (
          <li key={l.href}><a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="font-mono text-[16px] text-chalk underline underline-offset-4 decoration-signal hover:text-signal focus-visible:outline-2 focus-visible:outline-signal">{l.label}</a></li>
        ))}
      </ul>
    </>
  )
}

/* -------------------------------------------------------------------- shell */
export default function Room() {
  const [focus, setFocus] = useState<SId | null>(null)
  const [card, setCard] = useState<string | null>(null)
  const [lamp, setLamp] = useState(true)
  const [msg, setMsg] = useState("")
  const [ready, setReady] = useState(false)
  const reduced = useRef(typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches).current
  const input = useRef<Input>({ px: 0, py: 0, ox: 0, oy: 0 })
  const back = useRef<HTMLButtonElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const [hoverLabel, setHoverLabel] = useState<string | null>(null)

  const goto = useCallback((id: SId) => { setFocus(id); setCard(null) }, [])
  const openCard = useCallback((id: string) => { setFocus("desk"); setCard(id) }, [])
  const toast = useCallback((m: string) => setMsg(m), [])
  const ctx: Ctx = { focus, card, lamp, reduced, goto, openCard, hover: setHoverLabel, toggleLamp: () => { setLamp((l) => !l); setMsg(lamp ? "Lamp off." : "Lamp on.") }, toast }

  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(""), 2400); return () => clearTimeout(t) }, [msg])

  // look around: pointer, drag, arrows, Esc
  useEffect(() => {
    const inv = () => input.current.inv?.()
    const move = (e: PointerEvent) => {
      if (tip.current) tip.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 16}px)`
      input.current.px = (e.clientX / innerWidth) * 2 - 1; input.current.py = (e.clientY / innerHeight) * 2 - 1; inv() }
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (card) setCard(null); else if (focus) setFocus(null); return }
      if (focus || (e.target as HTMLElement)?.tagName === "BUTTON") return
      const i = input.current
      if (e.key === "ArrowLeft") i.ox = Math.min(35, i.ox + 6)
      else if (e.key === "ArrowRight") i.ox = Math.max(-35, i.ox - 6)
      else if (e.key === "ArrowUp") i.oy = Math.min(40, i.oy + 6)
      else if (e.key === "ArrowDown") i.oy = Math.max(-40, i.oy - 6)
      else return
      e.preventDefault(); inv()
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("keydown", key)
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("keydown", key) }
  }, [focus, card])

  const drag = useRef<{ x: number; y: number } | null>(null)
  const onDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY } }
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current || focus || !(e.buttons & 1)) return
    const i = input.current
    i.ox = Math.max(-35, Math.min(35, i.ox + (e.clientX - drag.current.x) * 0.12))
    i.oy = Math.max(-40, Math.min(40, i.oy + (e.clientY - drag.current.y) * 0.12))
    drag.current = { x: e.clientX, y: e.clientY }
    i.inv?.()
  }

  useEffect(() => { if (focus) setTimeout(() => back.current?.focus({ preventScroll: true }), 50) }, [focus])

  const showPanel = focus && focus !== "monitor" && (focus !== "desk" || card)
  const delay = reduced ? "0s" : "0.55s"

  return (
    <div className="fixed inset-0 bg-void text-chalk overflow-hidden select-none">
      <style>{`@keyframes roomIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
      <div className="absolute inset-0" onPointerDown={onDown} onPointerMove={onMove}>
        <Suspense fallback={null}>
          <Scene ctx={ctx} input={input} onReady={() => setReady(true)} />
        </Suspense>
      </div>
      {/* vignette + grain-free dark falloff */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(4,6,10,0.78) 100%)" }} />

      {!ready && <div className="absolute inset-0 grid place-items-center bg-void font-mono text-sm text-chalk-2 tracking-[0.14em] uppercase">Turning the lights on</div>}

      <header className="absolute top-5 left-6 pointer-events-none">
        <div className="font-display font-extrabold uppercase text-[20px] tracking-[-0.02em]">Aahil Shaikh</div>
        <div className="font-mono text-[11px] text-mute mt-1">{focus ? "esc to sit back" : "move to look around · click anything · tab for the stations"}</div>
      </header>

      {focus && (
        <button ref={back} onClick={() => (card ? setCard(null) : setFocus(null))} className="absolute top-5 right-6 font-mono text-[12px] tracking-[0.1em] uppercase border border-edge bg-ink-2/90 px-4 py-2 hover:border-signal focus-visible:outline-2 focus-visible:outline-signal">
          ← {card ? "Desk" : "Sit back"} <span className="text-mute">Esc</span>
        </button>
      )}

      {/* station nav: also the keyboard path into the scene */}
      <nav aria-label="Stations" className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 px-4">
        {STATIONS.map((s) => (
          <button key={s.id} onClick={() => goto(s.id)} aria-pressed={focus === s.id} className={`font-mono text-[11px] tracking-[0.1em] uppercase px-3 py-2 border bg-ink-2/80 backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-signal ${focus === s.id ? "border-signal text-signal" : "border-line text-chalk-2 hover:border-edge hover:text-chalk"}`}>
            <span className="text-signal">{s.num}</span> {s.label}
          </button>
        ))}
        <button onClick={ctx.toggleLamp} aria-pressed={lamp} className="font-mono text-[11px] tracking-[0.1em] uppercase px-3 py-2 border border-line bg-ink-2/80 text-chalk-2 hover:border-edge focus-visible:outline-2 focus-visible:outline-signal">Lamp {lamp ? "on" : "off"}</button>
      </nav>

      {showPanel && (
        <section aria-label={focus!} className="absolute right-5 top-20 bottom-[120px] w-[min(460px,92vw)] overflow-y-auto bg-ink-2/95 border border-line p-7 shadow-2xl" style={{ animation: `roomIn .35s ${delay} both` }}>
          {focus === "desk" && card && <CardPanel id={card} />}
          {focus === "shelf" && <ShelfPanel />}
          {focus === "board" && <BoardPanel />}
          {focus === "drawer" && <DrawerPanel />}
          {focus === "notes" && <NotesPanel />}
        </section>
      )}
      {focus === "desk" && !card && (
        <div className="absolute right-6 top-20 font-mono text-[12px] text-chalk-2 bg-ink-2/90 border border-line px-4 py-2" style={{ animation: `roomIn .35s ${delay} both` }}>Pick something up. Hover lifts it, click opens it.</div>
      )}

      <div ref={tip} aria-hidden="true" className={`pointer-events-none absolute left-0 top-0 z-40 font-mono text-[11px] tracking-[0.12em] uppercase bg-void/85 border border-line px-2 py-1 text-chalk ${hoverLabel && !focus ? "" : "hidden"}`}>{hoverLabel}</div>

      {msg && <div role="status" className="absolute left-1/2 -translate-x-1/2 top-16 z-50 font-mono text-sm bg-ink-2 border border-edge px-4 py-2 pointer-events-none">{msg}</div>}
    </div>
  )
}
