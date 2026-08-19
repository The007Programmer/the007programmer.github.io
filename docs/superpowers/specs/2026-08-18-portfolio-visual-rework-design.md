# Portfolio visual rework — design

Date: 2026-08-18
Branch: `agent-field` (continues from the current work; may be cut to its own branch before implementation)
Status: design, approved in chat, not yet implemented

## What this is

A full visual rework of Aahil Shaikh's portfolio, moving off the current zero-build
vanilla HTML/CSS/JS site onto a built React stack, so the site can use real
component and chart libraries (KokonutUI, Bklit UI) and a real animation engine
(Motion) instead of hand-rolled everything. The goal, in his words: **"crazy
transitions and anims."**

This reverses a documented decision from the last rewrite (`handoffs/handoff-2026-07-16-portfolio-rewrite.md`,
README) that explicitly evaluated and rejected a build step. That decision was
correct for its time and is being revisited deliberately, not by drift — the user
was asked directly ("introduce a build step" vs. "hand-build in vanilla, reference
only") and chose the build step, aware it reverses that call.

## What it is not

- Not a content rewrite. Copy, project list, dates, and privacy rules (MAGI named
  by function only, no home address, no phone, "Bay Area" not "Dublin CA") all
  carry forward unchanged unless flagged otherwise below.
- Not a framework fight. React + Vite is the implementation detail that unlocks
  the libraries the user asked for; it is not itself the goal.
- Not a departure from the palette. Red-forward, no black, WCAG AA numerically
  checked — same hard rules as before, just re-expressed as Tailwind theme
  tokens instead of CSS custom properties.

## Approach chosen (of 3 proposed)

**B — Evolve the current identity.** Keep the existing red/paper/slate palette
and warm editorial tone; use KokonutUI and Bklit UI as *pattern references*
re-themed onto the existing tokens, not their default shadcn dark palette.
Rejected: (A) full instrument-panel/dark-theme pivot copying the ascii/fluid
reference sites literally; (C) hybrid structural borrowing (numbered sections,
preset-switcher UI patterns) without a full identity change. B was chosen because
the red identity is itself a deliberate, previously-litigated decision
("bright and robust, primary colors red... no black... has to be DAMN unique")
and the new libraries should raise production value without erasing what already
makes the site not-generic.

## Stack & deploy

- **Vite + React + TypeScript.** Chosen over Next.js: this is a single-page
  portfolio with no routing/SSR need, and Vite's static `dist/` output maps
  directly onto GitHub Pages. KokonutUI and Bklit UI both install cleanly on
  Vite + Tailwind despite most of their docs assuming Next.js — their
  components are plain React, not Next-specific.
- **Tailwind CSS** as the styling layer, **shadcn/ui** as the primitive layer
  underneath KokonutUI and Bklit UI (both are shadcn registries — components
  install as editable source in-repo via their CLI, not as an opaque
  dependency).
- **Motion** (`motion` npm package, the vanilla/React-agnostic successor to
  Framer Motion) for all animation: `animate()`, `inView()`, layout
  transitions, drag.
- **Deploy:** GitHub Actions workflow (`.github/workflows/deploy.yml`) builds
  on push to `main` and publishes via `actions/deploy-pages`. GitHub Pages
  source switches from "deploy from branch (root)" to "deploy via Actions" in
  repo settings — this is a one-time manual change in GitHub's UI that the
  user will need to make (Settings → Pages → Source).
- **What's removed:** the current no-build guarantee. `npm install` and
  `npm run build` become required steps; local dev is `npm run dev` (Vite)
  instead of `python3 -m http.server`.

## Design system

Carry forward as Tailwind theme colors, values unchanged:

```
signal: #D62B22   (field red — clears 4.5:1 on paper, both directions)
ember:  #B5241B   (5.9:1 on paper)
coral:  #FFA795   (5.4:1 on slate)
rust:   #8E1A13
paper:  #FFF1ED
paper-2:#FFE4DC
slate:  #39434F   (darkest tone on the site — hard rule: no black)
slate-2:#4B5563
mute:   #5A6675   (5.3:1 on paper)
```

Both hard rules stay in force and stay numerically checked, not eyeballed: no
color darker than `--slate`, every text/background pairing recomputed against
WCAG AA (4.5:1 small text, 3.0:1 large) if changed.

**Typography — dev-only comparison, then lock one in.** A `?font=` query param
(`tempting`, `athelas`, `inter`, `archivo`) swaps the active pairing across the
real built layout during development:

| Param | Display | Body |
|---|---|---|
| `tempting` | Tempting | Switzer |
| `athelas` | Athelas | Vanguard |
| `inter` | Inter | Times New Roman MT |
| `archivo` | Archivo | Abril, STIX fallback |

Once the user picks a winner by viewing all 4 in the live layout, the switcher
and the other 3 font loads are deleted before ship — no runtime font-switching
cost in the shipped bundle.

## Components (KokonutUI)

Installed via KokonutUI's CLI (shadcn-registry pattern — files land in
`src/components/` as editable source), then re-themed onto the palette above
rather than left on shadcn's default neutral/dark styling.

- Project cards (`.cards`, `.oss` sections) → KokonutUI animated card pattern,
  hover/press micro-interactions.
- Contact submit → KokonutUI interactive button.
- Toolkit groups → hover-driven reveal/emphasis on the accent group.

## Career visualization — reimagined (Bklit UI)

Replaces the force-directed graph entirely. New concept: a **multi-track
causal timeline**, built by composing Bklit's chart primitives (`Grid`,
`XAxis`, tooltip) rather than using a preset chart type directly.

- X-axis: time (2024 → present).
- 2–3 lanes/tracks: TwelveLabs, Personal/OSS, School — parallel to how the
  current `.ledger` already groups things.
- Each milestone is a node on its lane. Connecting lines between nodes carry
  the causal language the graph currently uses in edge labels ("led to an
  offer", "returned as", "prototyped") as hover tooltips.
- Connecting lines draw themselves in with Motion (`inView` + path animation)
  as the section scrolls into view — same causal-storytelling beat as the old
  graph's build-in sequence, expressed as an axis-based chart instead of a
  force simulation.
- Drops the entire physics-tuning apparatus (`REP`, `K_SPRING`, `K_ANCHOR`,
  drift/anchor logic, the offline-solved convergence) — not needed for an
  axis-based layout. Also drops the hand-maintained mobile fallback (the
  `.graph-fallback` / narrow-screen trace duplication); one chart component
  handles both breakpoints at different aspect ratios.
- The chronological-order rule carries forward unchanged: this chart also
  runs oldest → newest, for the same causal reason documented in the current
  README (reversing it would claim each role caused the one before it).

## The agent field (ambient background layer)

Out of scope for removal — **must be ported, not dropped.** This is a
recently-built (current branch, `assets/src/field.js`, 312 lines) flocking
ambient layer that visualizes the hero thesis word-for-word: agents drift,
hold identity, and cooperate across the whole page, with text acting as a
repulsor to protect contrast. It stays a hand-rolled canvas simulation (boids
model: separation/alignment/cohesion/wander, trust-decay-driven flock
dissolution, per-agent identity tint, text-rect repulsion) — Motion is not a
fit for a continuous physics sim, so this becomes a React component wrapping
a `<canvas>` with the same imperative animation loop, ported near-verbatim
into a `useEffect`-managed loop rather than rewritten.

## Motion — "crazy transitions and anims"

This is the section the user explicitly asked to push further than the
original B proposal:

- **Section reveals:** staggered, spring-based entrances on scroll
  (`inView()` + `animate()`), replacing the current `[data-reveal]` CSS-class
  gate with Motion's viewport triggers.
- **Layout transitions:** shared-layout animation (`layoutId`) when the work
  grid filters/expands — a card clicked/expanded morphs in place rather than
  a modal popping in.
- **Cursor-reactive effects:** taking a cue from `fluid.krackeddevs.com`
  specifically (ripple/lens-style pointer response) — applied narrowly (e.g.
  the hero or the timeline section), not site-wide, so it reads as a flourish
  rather than noise.
- **Drag:** at least one real drag interaction survives the graph's removal —
  candidate is drag-to-reorder or drag-to-expand on project cards, using
  Motion's `drag` prop with constraints/inertia.
- **Hover/press micro-interactions:** every interactive element (cards,
  buttons, nav links, timeline nodes) gets a spring hover/tap response,
  not just `:hover` CSS.
- **Reduced motion:** `prefers-reduced-motion` remains a hard gate — Motion
  supports this natively (`useReducedMotion()` / `MotionConfig`), replacing
  the current manual CSS override block.

## Content / IA

No specific restructuring requested yet beyond "open to it." Default: **carry
all current content forward unchanged** (hero copy status is still marked
unreviewed by the user per the last handoff — that's an open item independent
of this rework), same section order (hero → timeline → work → tally → path →
toolkit → contact), same privacy rules. This section is a placeholder for the
user to edit during spec review — no content changes are proposed here.

## Testing / verification

The current repo's headless-testing traps (documented in the old handoff §5)
mostly stop applying once this is a real built app — a dev server
(`npm run dev`) replaces the `file://`-URL workarounds, and standard browser
automation (not `--virtual-time-budget` tricks) can drive Motion's
`requestAnimationFrame`-based animations correctly. The implementation plan
should include: visual check of all 4 font pairings in the real layout before
lock-in, a real-browser check of drag/hover/layout-transition behavior (not
headless screenshots, per the old trap list), and a Lighthouse/contrast pass
on the ported palette.

## Open questions for the user to resolve at spec review

1. Any specific content/IA changes, or is "carry forward unchanged" correct?
2. Exact drag interaction to keep (reorder vs. expand vs. something else).
3. Where cursor-reactive effects should live (hero only? timeline? both?).
4. Whether the GitHub Pages source switch (branch → Actions) in repo settings
   is something the user wants to do themselves or wants walked through.
