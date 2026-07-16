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
always faintly alive and reads as grabbable. That means it never settles, so the
loop is gated on an IntersectionObserver: scrolled away, it costs nothing.
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
and no-JS visitors get.

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

Short monospace labels (the eyebrows, `Fig. 01`) decode left-to-right on
reveal. Monospace has no width problem, so they need none of the measuring the
name does. The tally counts up on reveal, with tabular figures so the digits
don't jitter as they climb.

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
