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

Below 64rem the SVG is hidden and the vertical trace in `index.html` takes over
— the same data, readable on a phone. That trace is also what screen readers
and no-JS visitors get.

To change the graph, edit `NODES` and `EDGES` in `script.js`, then update the
`.graph-fallback` list in `index.html` to match.

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
