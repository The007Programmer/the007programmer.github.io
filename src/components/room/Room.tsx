import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { PROJECT_CARDS } from "@/data/work"
import { PATH_BAND, PATH_GROUPS, SIDE_ITEMS, splitTitle } from "./content"
import { PAL, applyTheme, initialTheme, type Theme } from "./theme"
import MonitorOS from "./MonitorOS"
import Scene, { type Ctx, type Input } from "./Scene"
import { DESK_ITEMS, STATIONS, type SId } from "./stations"

const CONTACT = [
  { href: "mailto:aahils2019@gmail.com", label: "aahils2019@gmail.com" },
  { href: "https://github.com/The007Programmer", label: "GitHub" },
  { href: "https://www.linkedin.com/in/aahil-shaikh-04b9ba356/", label: "LinkedIn" },
  { href: "https://www.instagram.com/aahil.cr3/", label: "Instagram (photography)" },
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
      <H k="three clusters, left to right on the board">Path</H>
      <div className="grid gap-6">
        {PATH_GROUPS.map((g) => (
          <section key={g.id} aria-label={g.label}>
            <h3 className="font-mono text-[12px] tracking-[0.14em] uppercase text-signal border-b border-line pb-1 mb-3">{g.label}</h3>
            <ol className="grid gap-4">
              {g.rows.map((r) => {
                const t = splitTitle(r.title)
                return (
                  <li key={r.id}>
                    <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-mute">{r.when}</div>
                    <div className="font-display font-bold text-[18px] leading-tight mt-0.5">{t.focus}{t.role && <span className="font-mono text-[12px] font-normal text-chalk-2"> · {t.role}</span>}</div>
                    <div className="font-mono text-[12px] text-mute">{r.org}</div>
                    {r.body && <p className="text-[14px] leading-[1.5] text-chalk-2 mt-1">{r.body}</p>}
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
        <section aria-label="Texas A&M" className="border-t border-line pt-3">
          <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-mute">{PATH_BAND.when}, underneath all of it</div>
          <div className="font-display font-bold text-[18px] leading-tight mt-0.5">{PATH_BAND.title}</div>
          <div className="font-mono text-[12px] text-mute">{PATH_BAND.org}</div>
        </section>
      </div>
    </>
  )
}

function DrawerPanel() {
  return (
    <>
      <H k="pull the drawer">Side quests</H>
      <ul className="grid gap-5">
        {SIDE_ITEMS.map((o) => (
          <li key={o.id} className="border-b border-line pb-5">
            <div className="font-mono text-[11px] tracking-[0.12em] uppercase text-signal">{o.kicker}</div>
            <div className="font-display font-extrabold uppercase text-[26px] leading-none mt-1">{o.title}</div>
            <p className="text-[14px] leading-[1.5] text-chalk-2 mt-2">{o.body}</p>
            {o.link && <Ext href={o.link.href}>{o.link.label} ↗</Ext>}
          </li>
        ))}
      </ul>
    </>
  )
}

function KeyboardPanel() {
  return (
    <>
      <H k="on the desk">TGR 910 GAF</H>
      <p className="text-[15px] leading-[1.55] text-chalk-2">Black case, GMK Matsu keycaps.</p>
      <p className="font-mono text-[12px] text-mute mt-4">A model replica: layout and cap colours are approximate.</p>
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
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [flash, setFlash] = useState<{ c: string; k: number } | null>(null)
  const [msg, setMsg] = useState("")
  const [ready, setReady] = useState(false)
  const [narrow, setNarrow] = useState(() => innerWidth < 768 || innerWidth < innerHeight)
  useEffect(() => { const f = () => setNarrow(innerWidth < 768 || innerWidth < innerHeight); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f) }, [])
  const reduced = useRef(typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches).current
  const input = useRef<Input>({ px: 0, py: 0, ox: 0, oy: 0 })
  const back = useRef<HTMLButtonElement>(null)
  const tip = useRef<HTMLDivElement>(null)
  const [hoverLabel, setHoverLabel] = useState<string | null>(null)

  const goto = useCallback((id: SId) => { setFocus(id); setCard(null) }, [])
  const openCard = useCallback((id: string) => { setFocus("desk"); setCard(id) }, [])
  const toast = useCallback((m: string) => setMsg(m), [])
  const toggleTheme = () => { const t: Theme = theme === "dark" ? "light" : "dark"; setTheme(t); applyTheme(t, true); if (!reduced) setFlash({ c: PAL[t].bg, k: Date.now() }); setMsg(t === "light" ? "Click. Lights on." : "Click. Lights off.") } // SPIKE COPY
  const ctx: Ctx = { focus, card, lamp, theme, toggleTheme, reduced, narrow, goto, openCard, hover: setHoverLabel, toggleLamp: () => { setLamp((l) => !l); setMsg(lamp ? "Lamp off." : "Lamp on.") }, toast }

  useEffect(() => { applyTheme(theme) }, [theme])
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(""), 2400); return () => clearTimeout(t) }, [msg])

  // look around: pointer, drag, arrows, Esc
  useEffect(() => {
    const inv = () => input.current.inv?.()
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return // touch looks by dragging, not by where the finger is
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
    i.ox = Math.max(-35, Math.min(35, i.ox + (e.clientX - drag.current.x) * (e.pointerType === "touch" ? 0.22 : 0.12)))
    i.oy = Math.max(-40, Math.min(40, i.oy + (e.clientY - drag.current.y) * (e.pointerType === "touch" ? 0.22 : 0.12)))
    drag.current = { x: e.clientX, y: e.clientY }
    i.inv?.()
  }

  useEffect(() => { if (focus) setTimeout(() => back.current?.focus({ preventScroll: true }), 50) }, [focus])

  const showPanel = focus && !(focus === "monitor" && !narrow) && (focus !== "desk" || card)
  const delay = reduced ? "0s" : "0.55s"

  return (
    <div className="fixed inset-0 bg-void text-chalk overflow-hidden select-none">
      <style>{`@keyframes roomFlash{from{opacity:.85}to{opacity:0}}@keyframes roomIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
      <div className="absolute inset-0" style={{ touchAction: "none" }} onPointerDown={onDown} onPointerMove={onMove}>
        <Suspense fallback={null}>
          <Scene ctx={ctx} input={input} onReady={() => setReady(true)} />
        </Suspense>
      </div>
      {/* vignette + grain-free dark falloff */}
      <div className="pointer-events-none absolute inset-0" style={{ background: theme === "dark" ? "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(8,5,3,0.78) 100%)" : "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(60,40,20,0.25) 100%)" }} />

      {flash && <div key={flash.k} aria-hidden="true" className="pointer-events-none absolute inset-0 z-30" style={{ background: flash.c, animation: "roomFlash .55s ease-out forwards" }} />}

      {!ready && <div className="absolute inset-0 grid place-items-center bg-void font-mono text-sm text-chalk-2 tracking-[0.14em] uppercase">Turning the lights on</div>}

      <header className="absolute top-4 left-4 md:top-5 md:left-6 pointer-events-none">
        <div className="font-display font-extrabold uppercase text-[20px] tracking-[-0.02em]">Aahil Shaikh</div>
        <div className="font-mono text-[11px] text-mute mt-1">{focus ? (narrow ? "tap back to sit down" : "esc to sit back") : narrow ? "drag to look around · tap anything" : "move to look around · click anything · tab for the stations"}</div>
      </header>

      {focus && (
        <button ref={back} onClick={() => (card ? setCard(null) : setFocus(null))} className="absolute top-4 right-4 md:top-5 md:right-6 font-mono text-[12px] tracking-[0.1em] uppercase border border-edge bg-ink-2/90 px-4 py-2 hover:border-signal focus-visible:outline-2 focus-visible:outline-signal">
          ← {card ? "Desk" : "Sit back"} <span className="text-mute">Esc</span>
        </button>
      )}

      {/* station nav: also the keyboard path into the scene */}
      <nav aria-label="Stations" className={narrow ? "absolute bottom-3 inset-x-0 flex gap-2 px-3 overflow-x-auto [&>button]:shrink-0 [&>button]:whitespace-nowrap" : "absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 px-4"}>
        {STATIONS.map((s) => (
          <button key={s.id} onClick={() => goto(s.id)} aria-pressed={focus === s.id} className={`font-mono text-[11px] tracking-[0.1em] uppercase px-3 py-2 border bg-ink-2/80 backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-signal ${focus === s.id ? "border-signal text-signal" : "border-line text-chalk-2 hover:border-edge hover:text-chalk"}`}>
            <span className="text-signal">{s.num}</span> {s.label}
          </button>
        ))}
        <button onClick={ctx.toggleTheme} aria-pressed={theme === "light"} className="font-mono text-[11px] tracking-[0.1em] uppercase px-3 py-2 border border-line bg-ink-2/80 text-chalk-2 hover:border-edge focus-visible:outline-2 focus-visible:outline-signal">Lights {theme === "light" ? "on" : "off"}</button>
        <button onClick={ctx.toggleLamp} aria-pressed={lamp} className="font-mono text-[11px] tracking-[0.1em] uppercase px-3 py-2 border border-line bg-ink-2/80 text-chalk-2 hover:border-edge focus-visible:outline-2 focus-visible:outline-signal">Lamp {lamp ? "on" : "off"}</button>
      </nav>

      {showPanel && (
        <section aria-label={focus!} className={narrow ? "absolute inset-x-2 bottom-[64px] h-[52vh] overflow-y-auto bg-ink-2/95 border border-line p-5 shadow-2xl" : "absolute right-5 top-20 bottom-[120px] w-[min(460px,92vw)] overflow-y-auto bg-ink-2/95 border border-line p-7 shadow-2xl"} style={{ animation: `roomIn .35s ${delay} both` }}>
          {focus === "monitor" && <div className="-m-5 h-[calc(100%+2.5rem)]"><MonitorOS compact /></div>}
          {focus === "desk" && card && <CardPanel id={card} />}
          {focus === "shelf" && <ShelfPanel />}
          {focus === "board" && <BoardPanel />}
          {focus === "drawer" && <DrawerPanel />}
          {focus === "notes" && <NotesPanel />}
          {focus === "keyboard" && <KeyboardPanel />}
        </section>
      )}
      {focus === "desk" && !card && (
        <div className="absolute right-4 md:right-6 top-16 md:top-20 font-mono text-[12px] text-chalk-2 bg-ink-2/90 border border-line px-4 py-2" style={{ animation: `roomIn .35s ${delay} both` }}>Pick something up. {narrow ? "Tap a card to open it." : "Hover lifts it, click opens it."}</div>
      )}

      <div ref={tip} aria-hidden="true" className={`pointer-events-none absolute left-0 top-0 z-40 font-mono text-[11px] tracking-[0.12em] uppercase bg-void/85 border border-line px-2 py-1 text-chalk ${hoverLabel && !focus ? "" : "hidden"}`}>{hoverLabel}</div>

      {msg && <div role="status" className="absolute left-1/2 -translate-x-1/2 top-16 z-50 max-w-[92vw] text-center font-mono text-sm bg-ink-2 border border-edge px-4 py-2 pointer-events-none">{msg}</div>}
    </div>
  )
}
