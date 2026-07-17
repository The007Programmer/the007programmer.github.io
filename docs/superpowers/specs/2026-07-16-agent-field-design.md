# The agent field — design

Date: 2026-07-16
Branch: `agent-field` (cut from `main` @ `9a2bf41`)
Status: design, approved verbally, not yet implemented

## What this is

An ambient layer across the whole page: a field of small agents that **drift, hold
identity, and cooperate** — the three words in the hero line, rendered as behavior
rather than described.

This exists because the site needs visual spectacle (his call, asked and answered:
"it needs more visual spectacle", "an ambient layer, whole page"). The behavior model
is chosen so the spectacle is also the argument — a flocking field that visibly does
what he says he works on could not be lifted onto someone else's portfolio.

## What it is not

- Not particles.js. If it reads as generic ambient dots it has failed and should be
  reverted, not tuned.
- Not decoration keyed to the pointer. It must be alive on touch.
- Not a second physics vocabulary. It reuses the graph's language (wander, anchors,
  repulsion) so the site has one physical logic.

## Behavior model

Each agent carries: `x, y, vx, vy, id, trust`.

| Force | Role |
|---|---|
| Separation | keeps agents off each other; the graph's repulsion, scaled down |
| Alignment × `trust` | match neighbors' heading — the cooperation term |
| Cohesion × `trust` | steer toward the local centroid — the other cooperation term |
| Wander | the graph's lissajous, per-agent phase; never lets the field settle |
| Text repulsion | the same separation force, sourced from text rects; see the colour section — this is what keeps contrast intact |

**Drift is the load-bearing behavior.** `trust` decays continuously. As it falls, the
alignment and cohesion terms fade, so the agent stops agreeing with its neighbors and
the flock loosens and comes apart on its own. Below a threshold the agent is solitary
and wanders; `trust` then recovers slowly and it rejoins whatever is nearby. Flocks
therefore form, degrade, dissolve, and re-form forever. That cycle is the point — it
is behavior drift as a visual, not a metaphor for one.

**Identity** is a stable per-agent tint offset that survives regrouping, so a viewer
can watch one specific agent leave a dissolving flock, cross open ground, and join a
different one. Without identity the field is noise; with it the field has characters.
This is the cheapest element and the one that makes it legible — do not cut it.

**Scroll** adds a `vy` impulse proportional to scroll delta, so moving through the
page pushes the field. This is the only input; there is no pointer dependency.

## Text is a repulsor — the mechanism that makes the field both legal and bold

### The finding that forced this

The first version of this spec tried to make agents safe to pass *behind* text by
picking agent colours close to the ground in luminance. Computing it killed it.

**Visibility and text-safety are mathematically opposed.** An agent visible against a
ground is by definition far from that ground in luminance. But the text is *also* far
from the ground in luminance — that is what makes the text readable. So a visible
agent is necessarily *close to the text*, and text-on-agent contrast collapses. The
boldest agent that stays legal on each ground:

| Ground | Boldest legal agent | Visibility |
|---|---|---|
| `--signal` | `--slate` | 2.02:1 |
| `--paper` | `--coral` | 1.70:1 |
| `--slate` | `--signal` | 2.02:1 |
| `--ember` | `--slate` | 1.55:1 |

A 1.7:1 mark is a whisper. That rule is legal and delivers no spectacle, which is the
only thing this feature was asked for. It is rejected.

(Two claims in the first draft were also simply wrong: on `--paper` and `--slate` the
agent *degrades* text contrast, 9.12 → 8.32 and 9.12 → 6.86. Both still clear AA, but
they were asserted without being computed. Compute, then claim.)

### The rule

**Text is a repulsor in the simulation.** Every text element gets a separation force —
the same one agents already apply to each other. Agents physically cannot reach text,
so contrast is guaranteed by the physics rather than by a colour compromise. No masks,
no alpha fades, no fencing logic bolted on beside the sim: the text is a participant
*in* it.

That frees the palette completely — and the answer turns out to need no table at all.

**The agent colour is the section's own text colour.** Not a coincidence: text colour
is already chosen to be the most readable thing its ground supports, so it is by
definition the boldest mark that ground allows. Since agents never go behind text,
nothing conflicts. Agent visibility therefore *equals* the site's own text/ground
contrast ratio, and is guaranteed ≥4.5:1 by the same property that makes the page
readable.

Verified against the real CSS (the first draft of this table was wrong on two rows —
`.toolkit` has no background and inherits `--paper` from `body`; `.contact` is
`--ember`, not `--paper-2`; the `--paper-2` at `main.css:548` is an inner card, not a
section ground):

| Sections | Ground | Text = agent | Visibility |
|---|---|---|---|
| `.hero`, `.tally` | `--signal` #D62B22 | `--paper` #FFF1ED | 4.51:1 |
| `.figure-section`, `.work`, `.toolkit` | `--paper` #FFF1ED | `--slate` #39434F | 9.12:1 |
| `.path` | `--slate` #39434F | `--paper` #FFF1ED | 9.12:1 |
| `.contact` | `--ember` #B5241B | `--paper` #FFF1ED | 5.89:1 |

**Implementation consequence: there is no colour table in the code.** Each band reads
`getComputedStyle(section).color`. This cannot drift from the palette, needs no
maintenance when a ground changes, and requires no background resolution at all —
which matters because `.work` and `.toolkit` have no `background` of their own and
inherit it, so their ground is not readable from the element directly. Text colour
inherits correctly; ground does not. Read the thing that inherits.

Text contrast is **untouched** — every ratio in `main.css:6-20` still holds exactly,
because no agent ever occupies a pixel behind text.

Agents switch colour hard at a band boundary rather than lerping. The site's edges are
crisp everywhere else and a crossing agent reading as a state change is on-vocabulary.
If it pops badly in review, soften over ~8px — but try crisp first.

### Repulsor sourcing

Collect rects from a single opt-in selector list (headlines, hook, ledger rows, card
bodies — everything that carries text), via `getBoundingClientRect()` on load, resize,
and font load. Inflate each by a margin (~24px) so agents keep a visible standoff
rather than grazing the glyphs. Recompute on `document.fonts.ready`, since the display
face changes metrics and the site already waits on this for the name scramble
(`script.js:507-642`).

Cost: the rect list is rebuilt only on layout-changing events, never per frame. Per
frame each agent tests against the rects overlapping its band — bounded and cheap at
N=70.

**Risk to watch:** on text-dense sections the field may be squeezed into the margins.
That may look like the field respecting the content, or it may look like the field
gave up. This is a judgment call that only shows up in a real browser — see
Verification.

## Architecture

**New file `assets/src/field.js`.** Not a section 8 of `script.js`, which is already
~900 lines across 7 sections. The field needs nothing from `script.js` and shares no
state with it; a separate file keeps both readable and lets the field be deleted in one
move if it gets reverted.

```
index.html      <canvas class="agent-field" aria-hidden="true"> as a direct child of <body>
                <script src="assets/src/field.js" defer>
main.css        .agent-field { position: fixed; inset: 0; z-index: 1; pointer-events: none }
                main > section > *, body > footer > * { position: relative; z-index: 2 }
field.js        band mapping · sim · render · gates
```

**Stacking.** Section backgrounds are opaque, so a canvas merely "behind everything"
would be invisible. The canvas sits at `z-index: 1` — above the section backgrounds
(which paint at `z-index: auto`) and below the content, which one rule raises to
`z-index: 2`. Verified viable: every section wraps its content in element children, no
bare text at that level, so it is one rule and not eight. Only two z-indexes exist on
the site today (topbar 100, skip-link 50), so the 1–2 band is free. `.hero` is
`position: relative` with `z-index: auto` and so does **not** create a stacking
context — its children can be raised above a fixed canvas. Do not give `.hero` a
z-index or this breaks.

**Band mapping.** On load, resize, and scroll — throttled through `field.js`'s own rAF
loop, not `script.js`'s; the two sims stay independent — read
`getBoundingClientRect()` for each ground-bearing section into an array of
`{top, bottom, colour}`. Each agent maps its viewport `y` to a band. The canvas is
fixed, so agents live in viewport space and the bands slide under them as the page
scrolls — which is also what makes the scroll impulse feel physical.

## Degradation

| Condition | Behaviour |
|---|---|
| No JS | Canvas stays empty and invisible. CSS paints every ground. Page fully intact. |
| Reduced motion | Run the sim ~200 steps headlessly, paint **one settled frame**, never start the loop. |
| Tab hidden | Pause the loop on `visibilitychange`. |
| Touch / no pointer | Unaffected — scroll is the only input. |

The canvas is `aria-hidden` and purely decorative; it is never the sole carrier of any
information.

**Reduced motion must not blank it.** The site's convention is that reduced motion
zeroes *delay* as well as duration, because zeroing duration alone strands content at
`opacity: 0` (`main.css:1049-1066`). The field's equivalent failure is painting
nothing. It must paint a settled frame.

## Performance

- N = 70 desktop, 35 under 40rem. At 70 the O(n²) neighbour pass is ~4,900 distance
  checks per frame — fine, no spatial hash needed. If N ever goes above ~150, revisit.
- Text rects are rebuilt only on load / resize / `fonts.ready`, never per frame. Per
  frame each agent tests only the rects overlapping its band.
- Cap `devicePixelRatio` at 2.
- One `requestAnimationFrame` loop. The graph has its own, already gated on an
  IntersectionObserver; leave them independent rather than coupling two sims.
- Pause on `document.hidden`.

## Verification — read `§5` of the handoff first

**This needs `requestAnimationFrame`, and Chrome's `--virtual-time-budget` does not
drive rAF.** A headless screenshot of a running field is meaningless and must not be
presented as evidence. This project has already produced two false "verified" claims
on exactly this trap.

What can honestly be verified, and how:

| Claim | Method | Trustworthy |
|---|---|---|
| Flocks form, drift apart, re-form | Port the integrator to Python, run 2,000+ steps, assert mean pairwise distance **oscillates** rather than converging or exploding | yes — this is the technique that solved the graph's constants |
| **No agent ever reaches text** | Python port with the real repulsor rects, 2,000+ steps, assert **zero** agent centres enter any inflated rect. This is the whole contrast argument; it is a physics claim now, not a colour claim | yes |
| Agent colours are the boldest legal per ground | Holds by construction — agent colour *is* the text colour, so visibility equals the site's own text/ground ratio. Verify by asserting the band's resolved colour equals the section's computed `color` | yes |
| Reduced-motion paints a settled frame | Headless screenshot with `--force-prefers-reduced-motion` — one frame is the whole feature here | yes |
| No JS errors | Chrome stderr grep | yes |
| Content sits above the canvas | Headless screenshot, any ground | yes |
| **It looks good in motion** | **Aahil watches it in a real browser** | **only him** |
| **The field doesn't look squeezed out by text** | **Aahil watches it** | **only him** |

The last row is not a formality. Whether this reads as *his field* or as particles.js
is a judgment no automated check can make, and it is the entire criterion for keeping
it.

## Revert path

The live site is `main` @ `9a2bf41`. This branch is never pushed to `main` until he
has watched it. Rejecting it is `git branch -D agent-field` — no revert commit, no
re-deploy, no churn on the live site. The fallback options, in his stated order of
preference, are the living-ground and physical-medium directions from the same
brainstorm.
