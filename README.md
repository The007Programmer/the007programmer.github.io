# the007programmer.github.io

My portfolio: applied AI and systems work — video, agents, and the things
underneath them.

Live at **https://the007programmer.github.io**

## How it's built

Vite + React + TypeScript, styled with Tailwind CSS v4 and animated with
Motion. Every component is hand-written against plain Tailwind — there is no
component library in the tree, and the runtime dependencies are exactly React,
Motion, and `clsx`/`tailwind-merge` for the `cn` helper. This is a GitHub Pages
site: a GitHub Actions workflow (`.github/workflows/deploy.yml`) builds the site
on every push to `main` and publishes the output.

```
index.html          the HTML shell Vite mounts into
src/
  main.tsx           app entry point
  App.tsx            top-level layout, assembles the sections
  index.css          global styles, Tailwind entry
  components/
    layout/          topbar, footer
    sections/        hero, timeline, work, tally, path, toolkit, contact
    kit/             shared building blocks (action button, project card)
    effects/         cursor and agent-field visual effects
  data/              content for the timeline, toolkit, and path sections
  hooks/             reusable React hooks
  lib/               utilities (contrast checks, agent-field logic, cn helper)
public/
  404.html           not-found page
  thanks.html        contact-form landing page
  img/               favicon and images
  assets/            resume PDF and legacy page.css
```

Run it locally with `npm install` then `npm run dev`. `npm run build` type-checks
and produces the static `dist/` output; `npm run test` runs the Vitest suite.

## The timeline

The section under the hero draws my career as a chart, because the relationships
are real: each role was caused by the one before it. It is a hand-rolled SVG in
`src/components/sections/Timeline.tsx` over the node and edge lists in
`src/data/timeline.ts` — a static layout solved from the data on mount, not a
force simulation. Nothing is draggable and nothing settles, so the figure is
identical on every load and in every screenshot.

The x axis is time. `monthIndex` turns each node's `YYYY-MM` into a month
ordinal and the range is mapped linearly across the 960-unit viewBox, so the
gaps between events are proportional to the real gaps. The y axis is the track:
`twelvelabs`, `personal`, `school`, each on its own horizontal line.

Because x depends only on the month and the track line depends only on the
track, two nodes in the same track and month would otherwise land on the same
point and hide each other. `kind` breaks the tie: `role` and `event` nodes sit
on the track line, and `artifact` nodes drop into lanes below it — one lane per
artifact, so a second artifact in the same month drops one lane further. That is
also what the lanes mean. Roles sit on the track; what those roles produced
hangs off them. `Timeline.test.tsx` asserts that all nine rendered `(cx, cy)`
pairs are distinct and that no causal edge has zero length, because jsdom has no
geometry — every label can be in the DOM while the figure is unreadable.

Filled nodes are roles, outlined nodes are artifacts. Edges are drawn coral and
solid, except `soft: true` edges, which are dashed — the one soft edge is
"alongside", which is concurrency rather than causation. Hovering an edge
thickens it and reveals its label at the midpoint.

The figure runs oldest to newest and the arrows are causal, so reversing it
would have it claim that each job caused the one that got me there. The project
cards below are newest-first because a reader wants the latest work, but this
cannot be, and that is the difference between a list and a figure.

To change it, edit `TIMELINE_NODES` and `TIMELINE_EDGES` in
`src/data/timeline.ts`. `timeline.test.ts` guards chronology and edge direction.

## Motion

Everything animated goes through Motion, and every animated component calls
`useReducedMotionGate()` (`src/hooks/useReducedMotionGate.tsx`) — the single
place the site's reduced-motion policy lives. Nothing calls `useReducedMotion()`
directly, so the policy can change in one edit.

The gate is not "skip the animation," it is "start at the end state." Where a
component would animate in from `opacity: 0`, the reduced branch passes
`initial={false}` instead of a start value, so the element renders where the
animation would have finished rather than sitting invisible forever. `CountUp`
seeds its motion value at the target. `Hero`'s parallax maps to `[0, 0]`. This
is the failure mode worth guarding: an element that keys off the animation alone
disappears the moment the guard says no.

The hero parallaxes as ONE block — `useScroll` on `.hero-inner` drives a shared
`y` and `opacity`. Giving each line its own rate reads as depth for about 200px
and then the lines converge and overlap, because they share a column and the gap
between them shrinks by the difference in their rates. The name and the lines
under it fade up on load, staggered by hand-written delays.

Scroll-triggered reveals use `useInView(ref, { once: true })` rather than a
global observer, so each section owns its own trigger and its own threshold: the
timeline builds its edges and nodes in causal order at `amount: 0.2`, the tally
counts up at `0.4`, and each row of the path rules itself in with a coral hairline
at `0.5`. The tally uses tabular figures so the digits don't jitter as they climb.

The work cards carry the only real interaction. Each card is draggable two ways:
the ⠿ handle starts a free drag that reorders the grid on release, and dragging
the card body downward past 40px expands it. Reordering is grid-aware —
`measureCenters` records every card's layout-box centre from `offsetLeft`/
`offsetTop` at drag start, and `pickNearest` picks the slot closest to where the
card was released. The measurement is deliberately layout-only: by the time it
runs, Motion has already flushed the pan-threshold offset onto the dragged card
and a previous drop's `layout` animation may still be settling on the others, so
anything transform-aware (`getBoundingClientRect`) measures the wrong thing.
`pickNearest` and `moveById` are pure module-level functions for exactly this
reason — the risky logic is unit-tested rather than trapped in a closure.

Distinguishing the expand-drag from a tap needs care: `onTap` fires after
`onDragEnd`, so a `didDragRef` flag is set on drag end and cleared in
`frame.postRender` — Motion's own scheduler — rather than on a timeout. A timing
bet would work until it didn't.

The topbar's scroll-progress bar smooths `scrollYProgress` through a spring;
under reduced motion it reads the raw progress value instead, so the bar tracks
scroll exactly rather than lagging behind it.

Two ambient layers sit outside `<main>`: `AgentField` renders 90 agents on a
fixed canvas at `z-[1]`, taking their colour from whichever section band they
are over, and `CursorEffect` paints a radial signal-red glow at `z-[3]`. Both
return `null` under reduced motion. The glow composites over text as well as
background, so its alpha is capped at the value that keeps every shipped colour
pairing above 4.5:1 at the gradient's centre — `contrast.test.ts` checks the
composited ratios, not just the flat ones.

## Design

Red-forward and bright; slate `#39434F` is the darkest tone on the site. The
signal red `#C4261E` is picked so it clears WCAG AA (4.5:1) against the paper
`#FFF1ED` in both directions — paper on red in the hero, red on paper for small
text elsewhere — with enough headroom left over that the cursor glow compositing
on top of it does not push the pairing under. Type is Bricolage Grotesque
(display), Instrument Sans (body), and Martian Mono (labels and data).

Every pairing that ships is checked numerically rather than by eye.
`src/lib/contrast.ts` implements the WCAG relative-luminance formula and
`contrast.test.ts` asserts a ratio for each one, including one pairing that is
expected to *fail* so the check cannot go tautological.

## Commits key

- SAFE: Stable and production-ready code; can be safely deployed.
- TEST: Code meant for testing or experimental changes; safe but does not affect the main program directly; stable for version control.
- UNST: Unstable commit with potential issues; not suitable for production, used for backup or testing phases.
- REFA: Refactor or restructure code for improved readability, maintainability, or efficiency, with no changes to core functionality.
- RESD: Revert previous changes due to instability or issues encountered during testing; restores the code to a prior stable state.
- BUGF: Bug fix or issue resolution, fixing known problems in the code without adding new functionality.
- DOCS: Documentation update, including comments, README files, or other forms of documentation to improve clarity and understanding.
