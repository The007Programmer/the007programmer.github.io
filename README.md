# the007programmer.github.io

My portfolio: agent security and applied AI work.

Live at **https://the007programmer.github.io**

## How it's built

Plain HTML, CSS, and JavaScript — no framework and no build step. This is a
GitHub Pages user site, so pushing to the default branch publishes the repo
root as-is. Nothing to install and nothing to compile.

```
index.html          the whole site, one page
404.html            not-found page (must live at the root to work)
thanks.html         contact-form landing page
assets/src/
  main.css          the site
  page.css          shared shell for 404 + thanks
  script.js         trajectory graph, sticky nav, scroll reveals
img/                favicon and images
```

Run it locally with `python3 -m http.server` and open `localhost:8000`.

## The graph

The hero draws my career as a directed graph, because the edges are real: each
role was caused by the one before it. Nodes and edges are declared at the top
of `assets/src/script.js` and hand-placed rather than force-simulated, so the
layout is identical on every load. Filled nodes are roles; outlined nodes are
what those roles produced.

It is drawn on its own paper ground, one section below the hero, and inverted
to dark-on-light: on the same red field it read as more hero instead of as a
figure. `--field` on `.figure-section` is the colour the graph is drawn on;
node boxes and label patches fill with it so edges stop cleanly at the box.
Move the graph to a different ground and that one variable follows.

It is a live force simulation and every node is draggable. Each node hangs from
an anchor (`ax0`/`ay0`) rather than from its seed: the seed is only where a node
starts, and dropping a node moves its anchor there, so nothing springs back to
the layout I wrote. The anchor itself is load-bearing — without it the repulsion
wins, the graph expands until every box is pinned against the frame, and it
never cools. It is also what keeps the figure chronological: a force sim has no
idea that time runs left to right, and unanchored it settles into a radial blob
around the highest-degree node.

Every anchor walks a slow lissajous (`DRIFT_A`, `DRIFT_MS`), so the graph is
always faintly alive and reads as grabbable. Those constants describe the
*anchor*, not the node: edges and repulsion resist it, so a node travels less
than its anchor asks for — currently about 13-16px on a 6s cycle. Tune them
against the real simulation rather than by eye, and check for box overlaps
afterward; the first values I picked moved a node ~8px over 11 seconds, which
is indistinguishable from a still image.

The wander means the graph never settles, so the loop is gated on an
IntersectionObserver: it runs while the figure is on screen and stops when it
isn't. The failsafe that force-starts the build only fires if the observer never
reports at all — firing it blind started the spawn while the reader was still a
full screen above the graph.
Edge rest length is never shorter than the label written on it needs, so the
layout is obliged to make room for its own annotations.

The constants (`REP`, `K_SPRING`, `K_ANCHOR`, `DAMP`, `GAP`) were solved
offline against the real node sizes rather than tuned by eye — they reach zero
energy with no overlapping boxes. If you change them, check convergence rather
than trusting a screenshot: Chrome's `--virtual-time-budget` does not drive
`requestAnimationFrame`, so a headless capture of this graph is meaningless.
`--force-prefers-reduced-motion` solves the layout synchronously and renders it
once, which is the way to see the settled result.

Below 64rem the SVG is hidden and the vertical trace in `index.html` takes over
— the same data, readable on a phone. That trace is also what screen readers
and no-JS visitors get. It is the drawn graph turned on its side and given the
same vocabulary: boxed nodes filled with `--field`, roles solid, edges ending in
an arrowhead at the box they cause, and the one soft edge dashed and unarrowed.
Its spine runs at `--spine` from the left rather than down the middle so edges
enter and leave the boxes the way the SVG's do; centred, it reads as a flowchart
instead of as the same figure.

Both forms run oldest to newest. The arrows are causal, so reversing the graph
would have it claim that each job caused the one that got me there — the project
cards are newest-first because a reader wants the latest work, but the graph
cannot be, and that is the difference between a list and a figure.

To change the graph, edit `NODES` and `EDGES` in `script.js`, then update the
`.graph-fallback` list in `index.html` to match.

## Motion

Most of it is in one place: the graph assembles in causal order when it scrolls
into view. Order comes from the edge list, so adding a role re-times the
sequence on its own — `STEP` in `script.js` is the only dial.

The name decodes from noise on load. Each slot is locked to the width of its
final letter and only swaps among letters of a similar width, so the name never
reflows or collides while it resolves. It measures in the real display face, so
it waits for `document.fonts.ready` — but only for 900ms, after which it skips
rather than scrambling a name the reader can already see.

Short monospace labels (the eyebrows) decode left-to-right on reveal. Monospace
has no width problem, so they need none of the measuring the name does. The
tally counts up on reveal, with tabular figures so the digits don't jitter as
they climb.

The rest is scroll-triggered and hangs off `[data-reveal]`, which `script.js`
sets only when it is both able and allowed to animate. Nothing may key off
`.is-in` alone: the moment that guard says no, anything that did would sit at
opacity 0 forever. The same goes for `[data-trace]` on the vertical graph, which
is additionally gated on the viewport being narrow enough to show it — animating
it wide would strand it invisible for a screen reader walking the page without
scrolling. Section titles rise out from under their own top edge (the head only
fades — two moves on one element read as drift); tags and Electra's spec rows
land after the thing they annotate; each row of the path gets ruled in.

The narrow-screen graph assembles in causal order like the drawn one, but its
timing is written out per step rather than computed: `::before` and `::after`
carry the spine and the arrowheads and can't be reached from script, and one
step carries an extra branch, so the cadence isn't a formula.

The hero parallaxes as ONE block (`data-parallax` on `.hero-inner`) and fades
out. Giving each line its own rate reads as depth for about 200px and then the
lines converge and overlap — they share a column, so the gap between them
shrinks by the difference in their rates.

`prefers-reduced-motion` skips the scramble, the parallax, and the graph build.

## Design

Red-forward and bright; slate `#39434F` is the darkest tone on the site. The
field red `#D62B22` is picked so it clears WCAG AA (4.5:1) against the paper
`#FFF1ED` in both directions — white on red in the hero, red on white for small
text elsewhere. Type is Bricolage Grotesque (display), Instrument Sans (body),
and Martian Mono (labels and data).

## Commits key

- SAFE: Stable and production-ready code; can be safely deployed.
- TEST: Code meant for testing or experimental changes; safe but does not affect the main program directly; stable for version control.
- UNST: Unstable commit with potential issues; not suitable for production, used for backup or testing phases.
- REFA: Refactor or restructure code for improved readability, maintainability, or efficiency, with no changes to core functionality.
- RESD: Revert previous changes due to instability or issues encountered during testing; restores the code to a prior stable state.
- BUGF: Bug fix or issue resolution, fixing known problems in the code without adding new functionality.
- DOCS: Documentation update, including comments, README files, or other forms of documentation to improve clarity and understanding.
