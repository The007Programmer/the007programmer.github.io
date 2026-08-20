# Handoff — Aahil Shaikh's portfolio rewrite: copy, motion, and the trajectory graph — 2026-07-16

## §0 — Orientation (read this first, always)

### Mission
Full rewrite of Aahil Shaikh's GitHub Pages portfolio, driven by a new resume. The old
site was years stale (called him a high-school student, listed a swim-instructor job).
The rewrite is **substantially shipped and live**; what remains is copy refinement and
polish, not construction.

His original brief, verbatim, because it still governs every visual decision:

> "i want it to be bright and robust, primary colors red and offtones of red, any
> contrasts from there you pick, no black, most im willing to do for darks or background
> is a slate gray, lets utlize any and all frameworks you find and weigh pros cons for a
> banger portfolio, has to be DAMN unique"

### Project root, stack, how to run
- Root: `/home/t007p/Documents/Code/the007programmer.github.io`
- Stack: **vanilla HTML/CSS/JS. No build step, no framework, no package.json.** This was a
  considered decision — it's a GitHub Pages *user* site, so pushing to `main` publishes the
  repo root as-is. Astro/Vite were evaluated and rejected as a toolchain for one page. **Do
  not introduce a build step.**
- Run locally: `python3 -m http.server` then open `localhost:8000`.
- Deploy: `git push origin main`. Pages rebuilds on its own. Live at
  <https://the007programmer.github.io>.
- Remote: `https://github.com/The007Programmer/the007programmer.github.io` (git is
  configured for SSH; `gh auth setup-git` was already run to fix an HTTPS push failure).

### Current overall status
- **Everything is committed and pushed. Working tree clean. `origin/main` == `main` == `fd11340`.**
- The site is structurally done: hero, trajectory graph (force-simulated + draggable),
  work section, tally, path ledger, toolkit, contact, 404/thanks.
- **The hero hook is the live open question.** Four rounds of copy were rejected. The
  current line is a synthesis the user has not yet reacted to. See §1.
- Content is current as of the new resume, plus MAGI and clair added this session.
- Recent commits: `fd11340` (de-emphasize agent security), `9a7d9aa` (mobile graph rebuild
  + more motion), `37cdeda` (MAGI/clair + project timeline), `8efe5e9` (wander fixes).

### Segment map
| Segment | Title | Hand this to a session if you need to… |
|---|---|---|
| §1 | Hero hook & positioning copy | …change the hero line, eyebrow, title/meta, or how he's positioned |
| §2 | The trajectory graph (desktop SVG + mobile trace) | …touch the graph, its physics, its layout, or its narrow-screen form |
| §3 | Motion system | …add, tune, or debug any animation |
| §4 | Content, privacy & the résumé of record | …add/edit projects, dates, stats, or anything about what's safe to publish |
| §5 | Verification & the headless-testing traps | …verify any change — **read this before trusting any screenshot** |

**All sessions:** run your segment's Bootstrap block first (it joins board
`handoff-2026-07-16-portfolio-rewrite` and claims your files); coordinate via
`mboard ps|inbox|send`.

**Mboard board:** `MBOARD_BOARD=handoff-2026-07-16-portfolio-rewrite`

> **mboard is NOT on PATH on this machine.** The binary is at `~/.claude/mboard/mboard`
> (a symlink into `/home/linuxbrew/.linuxbrew/opt/ccpkg/libexec/mboard/bin/mboard`).
> Either call it by full path or `export PATH="$HOME/.claude/mboard:$PATH"` first.
> Verified working: `~/.claude/mboard/mboard --help`.

### Global conventions, constraints, hard-won gotchas

1. **Contrast is solved numerically, not by eye.** The palette clears WCAG AA (4.5:1 small
   text, 3.0 large) and an earlier pass *failed* — mute was 3.32:1, red-on-paper 3.82:1.
   `--signal: #D62B22` is specifically chosen to clear 4.5:1 against `--paper: #FFF1ED`
   **in both directions** (white-on-red in the hero, red-on-white for small text). If you
   change a colour, recompute the ratio. Tokens at `assets/src/main.css:6-20`.
2. **No black.** `--slate: #39434F` is the darkest tone permitted on the site. User's rule.
3. **Commit message prefixes are mandatory** — the key is in `README.md:112-121`:
   `SAFE`/`TEST`/`UNST`/`REFA`/`RESD`/`BUGF`/`DOCS`. Use `SAFE` for shippable work.
   Co-author trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
4. **Never key CSS off `.is-in` or `.is-built` alone.** Always gate on `[data-reveal]` /
   `[data-trace]`, which `script.js` sets *only* when it is both able and allowed to
   animate. Anything keyed to the class alone sits at `opacity: 0` forever the moment that
   guard says no. This is written into `main.css:957-961`.
5. **`pkill -f "http.server ..."` kills its own shell** (exit 144) and the rest of the
   command silently never runs. This ate an entire `git push` once — the push appeared to
   succeed and had done nothing. Verify with `git log` after.
6. **Read §5 before trusting any headless screenshot.** Chrome's `--virtual-time-budget`
   does **not** drive `requestAnimationFrame`. A previous "verified" claim was false
   because of this.

---

## §1 — Hero hook & positioning copy

Status: **in-progress — user has not reacted to the current line**
Depends on: none

```bash
# Bootstrap (run first) — joins the shared Mboard board and stakes this segment's territory
export PATH="$HOME/.claude/mboard:$PATH"                       # mboard is not on PATH here
export MBOARD_BOARD=handoff-2026-07-16-portfolio-rewrite        # so SessionStart auto-joins
# SessionStart reads MBOARD_BOARD only at session start. On a freshly spawned session the
# export above is enough. If you paste this into an ALREADY-running session, run:
mboard join --board handoff-2026-07-16-portfolio-rewrite        # idempotent
mboard claim 'index.html' --note "§1 hero hook & positioning copy"
mboard ps
```

> **Coupling warning:** §1 and §4 both write `index.html`. §1 owns lines ~1-56 (head + hero)
> and the eyebrow/title/meta/toolkit-heading language; §4 owns the work/tally/path/oss
> content. If both run at once, coordinate via `mboard send` before editing — do not both
> hold the file blind.

### Goal
Write a hero hook that lands. Everything else on the site is done; this is the piece the
user keeps rejecting, and it is the first thing anyone sees.

### Context & decisions — READ THIS, IT IS THE WHOLE POINT

The user rejected **four** rounds. The failure mode was mine and it repeated:

1. `"I build AI agents that remember what they've done — and can't be talked out of it."`
   → "this is a bit odd lmao"
2. `"I build agents that remember what they've done, and the security layer that decides
   what reaches them. One at TwelveLabs, one on hardware I own."`
   → **"this is lame asf what this is a terrible opener"**
3. Four options built on the Sentinel/Bastion/FlashGuard naming pattern ("a wall, a guard,
   a watchman") → "these are still buns" / "these are still ass"
4. Four "ahead of the field" options → he cherry-picked a mix instead of choosing.

**Why I kept failing, in his words:**
- *"i specialize in agent workings as a whole, security, drift, context, teams,
  communication, cross work"*
- *"i do more than that yk, agents is my recent work with magi, clair, and with work at
  twelvelabs"*
- *"also we can tone down the agent security thing down, a. its not a focus on not just
  agent security but many agentic aspects, also i do more stuff than just agents lmao"*
- *"has to be a banger hook"*, *"not just facts listed off"*
- **The register he wants: *"should be a vibe of 'this guy is ahead of the field'"***

I latched onto agent-security defense framing three separate times *after* he'd told me it
was too narrow, because his job title at TwelveLabs literally is Agent Security and the site
itself was selling that title everywhere. **Do not re-run that dead-end.**

**Rules extracted from the rejections:**
- Not a list of facts. Not an explanatory clause-pile. It needs tension in the first few words.
- "Ahead of the field" cannot be *claimed*, only demonstrated — and the flex only works
  **underplayed**. The most-ahead people are casual about it.
- **Jokes were a mistake.** "I build software that argues back", "Go ahead, sweet-talk my
  agents" — rejected. A bit has to survive a hiring manager reading it twice.
- Don't lean on avionics/firewall specifics. His words: *"dont go crazy on avionics stack or
  firewall stuff, its a lot of tech in general, agentic, non agentic, mix it better."*

**His final steer** was to mix two options: the "becomes a category a year later" flex with
the "the part nobody's built yet" range-then-thesis structure. That produced the current
live line, which he has **not yet seen or reacted to**:

> I keep ending up on the part nobody's built yet — video, systems, agents. It becomes a
> category about a year later. I'd like to say that's on purpose.

Structure: range → claim → undercut (the undercut is what keeps the claim from being
insufferable).

**Last thing I told him, and it stands:** three rounds of me sampling my own taste didn't
converge. The useful next move is **him writing one bad version in his own voice**, and the
session sharpening it. Ask for that before generating a fifth set of options.

### Files & key locations
- `index.html:48-52` — `.hero-thesis`, the live hook.
- `index.html:43` — `.eyebrow` = "Applied AI & systems" (was "Agent security & applied AI").
- `index.html:53-55` — `.hero-meta` = "Sophomore at Texas A&M · Two terms at TwelveLabs · Bay Area".
- `index.html:6,7,10,11` — `<title>`, meta description, og:title, og:description. **These
  must move with the hook** — they carried the old positioning.
- `index.html:504-512` — Toolkit `.kit-group-accent`, renamed "Agent security" → "Agents",
  now carrying his full list: orchestration, memory and context, knowledge graphs, behavior
  drift, inter-agent communication, task routing, injection/jailbreak defense, RBAC, anomaly
  detection.
- `index.html:540-542` — contact copy, de-securitized.
- `assets/src/main.css:239-247` — `.hero-thesis`. **`max-width: 30ch`** was widened from
  `22ch`; at 22ch the longer line broke into six lines and read as a paragraph, not a
  thesis. If the hook gets short again, drop this back toward 22ch.
- `README.md:3` — one-line site description, broadened to match.

### State
- **Done:** the site-wide de-emphasis of "agent security" (commit `fd11340`). Eyebrow, title,
  both meta tags, OG tags, toolkit group, contact copy, README all broadened.
- **Done:** "Dublin, CA" → "Bay Area" everywhere (see §4 for why).
- **In-flight:** the hook itself. Live, unreviewed, may well be rejected again.
- **Not started:** nothing else in this segment.

### Next actions
1. Ask him to write one rough version in his own voice rather than serving a fifth option set.
2. If he does react to the current line, sharpen *that* rather than starting over.
3. Whatever wins, propagate to `index.html:6,7,10,11` (title + meta + OG) — they are the same
   claim in four places and they drift apart easily.
4. Re-check `.hero-thesis` `max-width` against the new length (`main.css:240`). Target 3-4
   lines at 1440px.

### Gotchas & open questions
- **Open:** the hook. Unresolved.
- The eyebrow currently says "Applied AI & systems". If the hook changes register, the
  eyebrow should follow — they're read together as one unit.
- He offered photos twice (*"i can give photos if u need"*) and it was never taken up.
  Suggested placement if it comes up: contact section or a short about block — **not** the
  hero, which is typographic by design.

---

## §2 — The trajectory graph (desktop SVG + mobile trace)

Status: **done-pending-verification** (built, pushed, working; no live-browser check of drag)
Depends on: none

```bash
# Bootstrap (run first) — joins the shared Mboard board and stakes this segment's territory
export PATH="$HOME/.claude/mboard:$PATH"
export MBOARD_BOARD=handoff-2026-07-16-portfolio-rewrite
mboard join --board handoff-2026-07-16-portfolio-rewrite
mboard claim 'assets/src/script.js' --note "§2 trajectory graph"
mboard ps
```

> Reads `index.html:59-118` (the `.graph-fallback` markup) and `main.css:378-532`. If you must
> edit those, `mboard request-release` from whoever holds them.

### Goal
The site's signature element: his career drawn as a **directed graph with real causal edges**.
This is not decoration — it's grounded in his actual graph-memory work at TwelveLabs, and the
caption makes a claim the figure has to earn: *"Every job I've had was caused by the one
before it. Drawn as the thing it actually is."*

### Context & decisions

- **It lives one section below the hero, on its own paper ground, inverted to dark-on-light.**
  On the same red field it read as *more hero* instead of as a *figure* — the user reported
  this: *"lanbding is nice but the graph sorta merges with the landing landing yk"*.
  `--field` on `.figure-section` (`main.css:261`) is the colour the graph is drawn on; node
  boxes and label patches fill with it so edges terminate cleanly at the box. **Move the graph
  to a different ground and that one variable follows.**
- **It is a live force simulation and every node is draggable** (user asked for
  Obsidian-style: *"spawn in nodes like an obsidian graph and just move around, each node
  being draggable"*).
- **Anchors are load-bearing.** Each node hangs from an anchor (`ax0`/`ay0`), not from its
  seed. Without the anchor, repulsion wins, the graph expands until every box is pinned to the
  frame, and it never cools. The anchor is *also* what keeps the figure chronological — a
  force sim has no idea time runs left to right, and unanchored it settles into a radial blob
  around the highest-degree node.
- **Dropping a node moves its anchor there** — no snap-back. User: *"no need for it to
  rigidly snap back after bneing dragged"*. `release()` sets `n.ax0 = n.x; n.ay0 = n.y`.
- **Constants were solved offline by porting the integrator to Python**, not tuned by eye. An
  earlier set never converged (energy 317 after 400 iterations, all nodes pinned to walls).
  The fix was three things: add anchor springs, drop `REP` 90000→16000, and **zero velocity on
  wall contact**.
- **The wander was reported broken by the user** (*"uh the wander is NOT in"*) and had **two**
  causes, both instructive:
  1. My verification tested a *free node in isolation* (0.5 unit lag) — the wrong model. Real
     nodes are held by stiffer springs and repulsion, so a node travels **less** than its
     anchor asks for. Measured against the *full* sim it was 4-8px over 11s: invisible.
     Fixed by `DRIFT_A` 5→10 and `DRIFT_MS` 11000→6000 → verified 12.8-15.7px, 0 overlaps.
  2. The 2500ms failsafe fired **unconditionally**, so the spawn animation played while the
     reader was still a full screen up on the hero. Fixed with the `ioReported` flag.
- **Edge rest length is never shorter than its own label needs**
  (`rest: Math.max(seed, labelW + 76)`) — the layout is obliged to make room for its
  annotations. This came from the user: *"the between arrows or nodes text is a little
  cramped still"*.
- **viewBox is `-40 -24 1060 508`** — the user reported *"padding on the graph is a little
  off, very close cut"*; measured margins were 31/52/37/37 units, hence the negative origin.
- **The mobile trace was rebuilt this session.** It was a bulleted list with 7px squares —
  the same data as the drawn graph with none of its vocabulary, which is why the user said
  *"the graph thing looks lame on mobile"*. It is now the figure **turned on its side**: boxed
  nodes filled with `--field`, roles solid, edges ending in an arrowhead at the box they cause,
  the one soft edge dashed and unarrowed. **The spine runs at `--spine: 1.5rem` from the left,
  not down the middle** — centred it reads as a generic flowchart instead of as the same
  figure; offset, edges enter and leave the boxes the way the SVG's do.
- **`Fig. 01` → `Trajectory`.** User: *"the graph says fig 1 we dont have more than 1 fig
  lmao"*. The new label also rhymes with the other eyebrows (WORK / PATH / TOOLKIT).

### ⚠️ The one thing that must not be "fixed"

**Both graph forms run oldest → newest, and this is deliberate.** The user asked for the
*project cards* to be reversed to newest-first (§4) and they were. **The graph was not, and
must not be.** Its arrows are causal — reversing them would have the figure claim that Electra
caused the hackathon that got him hired. A list serves the reader; a figure serves the
direction of causation. This is documented at `README.md:73-85` and in the markup comment at
`index.html:68-75`. If the mismatch is raised again, the honest fix is to change what the
graph argues, not to reverse the arrows.

### Files & key locations
- `assets/src/script.js:16-505` — section 1, the entire graph.
  - `:18-21` — `VIEW_X = -40, VIEW_Y = -24, VIEW_W = 1060, VIEW_H = 508`
  - `:29-39` — `NODES`. Hand-placed seeds; they seed the sim so it relaxes out from a good
    arrangement rather than finding one from noise. 9 nodes: hacks, sentinel, devex, tamu,
    sage, bastion, recurser, agentsec, electra.
  - `:41-50` — `EDGES`. 8 edges. Build order comes from this list — adding a role re-times the
    spawn sequence on its own.
  - `:66-84` — physics: `REP = 16000`, `K_SPRING = 0.03`, `K_ANCHOR = 0.02`, `DAMP = 0.86`,
    `V_MAX = 6`, `GAP = 30`, `DRIFT_A = 10`, `DRIFT_MS = 6000`
  - `:85` — `STEP = 300` (ms between causal hops; the only spawn dial)
  - `:239-246` — `wander(t)`, the lissajous on the anchors
  - `:476-497` — the IntersectionObserver + `ioReported` failsafe
- `index.html:59-118` — figure, caption, and the `.graph-fallback` markup (5 `.gf-step`s).
- `assets/src/main.css:378-532` — the whole trace: node boxes, spine, arrowheads, build
  transitions, and the width gates (`:518` sr-only above 64rem, `:530` `.g-svg` hidden below).
- `assets/src/script.js:870-899` — section 7, the trace build + `matchMedia` gate.
- `README.md:26-85` — the graph's full rationale.

### State
- **Done:** desktop sim, drag, wander, spawn, viewBox padding, mobile trace rebuild, label.
- **Verified:** builds all 9 nodes (36 `g-node*` / 25 `g-edge*` elements in a headless DOM
  dump); trace reaches fully-built state at 390px; `data-trace` present at 390px and absent at
  1440px (the matchMedia gate works); no console errors.
- **NOT verified:** dragging, and the wander, in a real browser this session. Both were
  verified in earlier sessions by reading constants back out of `script.js` and measuring
  against a Python port of the integrator.

### Next actions
Nothing outstanding. If asked to change the graph:
1. Edit `NODES`/`EDGES` in `script.js:29-50`, then **update the `.graph-fallback` list in
   `index.html:77-115` to match** — they are two hand-maintained copies of one dataset.
2. If you add/remove a `.gf-step`, **the per-step transition delays in `main.css:488-514` are
   written out by hand** and must be extended. They aren't a formula because `::before`/
   `::after` carry the spine and arrowheads and can't be reached from script, and step 3
   carries an extra branch.
3. If you touch physics constants, **check convergence against the real sim, not a
   screenshot** — see §5.

### Gotchas & open questions
- The trace and the SVG are **two hand-maintained copies of the same data**. They drift.
- `DRIFT_A`/`DRIFT_MS` describe the **anchor**, not the node. Edges and repulsion resist, so
  the node travels less than the anchor asks. Tune against the full sim.
- Below 64rem the SVG is hidden and the trace is the real presentation. Above 64rem the trace
  is sr-only. The trace is also the no-JS and screen-reader form.
- The trace's build animation is gated on `narrow.matches` — animating it wide would strand it
  at `opacity: 0` for a screen reader walking the page without scrolling.

---

## §3 — Motion system

Status: **done-pending-verification** (nav marker never seen in a real browser)
Depends on: §2 for the trace build specifically (`main.css:462-514`, `script.js:870-899`)

```bash
# Bootstrap (run first) — joins the shared Mboard board and stakes this segment's territory
export PATH="$HOME/.claude/mboard:$PATH"
export MBOARD_BOARD=handoff-2026-07-16-portfolio-rewrite
mboard join --board handoff-2026-07-16-portfolio-rewrite
mboard claim 'assets/src/main.css' --note "§3 motion system"
mboard ps
```

### Goal
The user asked repeatedly for richer motion: *"lets implement more animations"* → *"more like
text anims... like maybe the text glitching characters until landing on the correct letters for
my name"* → *"we wanna add in more text anims, maybe specifically more big numbers that stand
out"* → *"i wanna add in more anims please i want it to be rich"*.

### Context & decisions

- **The name decodes from noise on load.** Each slot is locked to the width of its final letter
  and only swaps among letters of **similar width** (±12% or the closest 8), so the name never
  reflows or collides while it resolves. An early version put a wide `M` in a narrow `i` slot
  and the glyphs collided.
- **It measures in the real display face**, so it waits for `document.fonts.ready` — but
  **capped at 900ms** (`go(true/false)`), after which it skips. Unbounded, the name would show
  and then scramble seconds later, which is worse than not scrambling.
- **`.hero-name .ch { letter-spacing: normal; }` at `main.css:215` is critical.** The `-0.055em`
  tracking on `.hero-name` was being counted twice — once between the spans and once inside
  them — and the letters overlapped. Tracking must apply *between* spans, not inside them.
- **Parallax is ONE block, not per-line.** User reported *"scroll is a bit odd here"*. Giving
  each line its own rate reads as depth for ~200px and then the lines **converge and overlap** —
  they share a column, so the gap between them shrinks by the difference in their rates.
  `data-parallax="0.28"` sits on `.hero-inner` (`index.html:42`).
- **Entrance animations use `both`, not `backwards`** — same bug family.
- **reduced-motion must zero `delay`, not just `duration`.** Zeroing duration alone left the
  staggered delays, which held the hero and graph blank for most of a second. See
  `main.css:1049-1066`.
- **The `[data-reveal]` guard is the load-bearing convention** — see §0 gotcha #4.
- Added this session: section titles rise out from under their own top edge (the head only
  fades — **two moves on one element read as drift, not as a reveal**); tags and Electra's spec
  rows land after the thing they annotate; each Path row gets ruled in with a coral line; the
  topbar carries a scroll-progress rule; a marker in the nav slides to whichever section owns
  the middle of the viewport while the other links dim.
- **The nav marker tracks the section owning the *middle* of the viewport**, not what's merely
  visible — tracking visibility flickers between two links wherever a boundary sits on screen,
  and at the bottom of the page several sections are visible at once.

### Files & key locations
- `assets/src/script.js:507-642` — section 2, name scramble (`measureNoise`, `nearestWidths`).
- `assets/src/script.js:643-682` — section 3, parallax.
- `assets/src/script.js:683-770` — section 4, mono decode + tally count-up + `liveRepos()`.
- `assets/src/script.js:771-790` — section 5, topbar stuck state + scroll progress.
- `assets/src/script.js:792-846` — section 5b, the nav marker. **Never seen in a real browser.**
- `assets/src/script.js:847-868` — section 6, the generic reveal observer.
- `assets/src/main.css:157-172` — `.topbar-ink` (the sliding marker).
- `assets/src/main.css:173-186` — `.topbar-progress` (scaleX, never lays out).
- `assets/src/main.css:236` — hero entrance timings.
- `assets/src/main.css:957-1025` — the whole reveal system incl. the new title/tags/spec/ledger
  effects.
- `assets/src/main.css:1049-1066` — the reduced-motion block. **Extended this session** to hand
  back everything the new attributes hide, because `script.js` checks the preference once at
  load and turning it on later leaves the attributes on the page.
- `README.md:87-110` — the motion rationale.

### State
- **Done and verified headless:** trace build completes; no console errors; reveals fire.
- **Done, NOT verified:** the nav marker (`.topbar-ink`) sliding, and the scroll-progress rule.
  Both need **real scrolling**, which headless can't do (see §5). The logic is straightforward
  and errors would have surfaced in the console, but nobody has watched it.
- **Known-good in real browsers from earlier sessions:** name scramble, parallax, tally count-up,
  graph spawn.

### Next actions
1. Have the user (or a real browser) confirm the nav marker slides correctly and the progress
   rule fills. This is the only unverified motion on the site.
2. If adding motion: hang it off `[data-reveal]`, and add its reset to the reduced-motion block
   at `main.css:1049`.

### Gotchas & open questions
- `.topbar-ink` positioning depends on `.topbar-nav { position: relative }` (`main.css:130`) so
  that `link.offsetLeft` and the ink's containing block agree. Don't remove it.
- `.topbar-progress` is absolutely positioned inside `position: fixed` `.topbar`; its containing
  block is the topbar's **padding box**, which is why `width: 100%` spans the bar correctly.
- The graph's loop is gated on an IntersectionObserver and stops when off-screen — the wander
  means it never settles, so it would otherwise burn CPU forever.

---

## §4 — Content, privacy & the résumé of record

Status: **done** (pending any new content the user asks for)
Depends on: none

```bash
# Bootstrap (run first) — joins the shared Mboard board and stakes this segment's territory
export PATH="$HOME/.claude/mboard:$PATH"
export MBOARD_BOARD=handoff-2026-07-16-portfolio-rewrite
mboard join --board handoff-2026-07-16-portfolio-rewrite
mboard claim 'README.md' --note "§4 content, privacy, résumé of record"
mboard ps
```

> **Coupling warning:** §4's content lives in `index.html`, which §1 also edits. §4 owns the
> work/tally/path/oss regions (`index.html:120-583`); §1 owns the head + hero (`:1-56`).
> Coordinate via `mboard send` before touching `index.html`.

### Goal
Keep what the site says true, current, and safe to publish.

### ⚠️ Privacy constraints — these are hard rules

- **His home address (2411 Amantea Way, Dublin CA 94568) and phone (408-442-8567) are
  deliberately NOT on the site**, and the resume PDF was not published for that reason.
- **Location is "Bay Area", never "Dublin, CA".** He raised this himself — *"remove dublin CA
  maybe since its lwk doxxing me"* — and delegated the call. Dublin is ~70k people; next to a
  full name it narrows him to a neighbourhood and buys nothing, because recruiters filter on
  metro, not city.
- **MAGI is a PRIVATE repo.** It may be named and described **by what it does, never by what it
  runs on** — no hostnames (l2u/larry, Nexus), no VPN topology (Tailscale), no ports, no
  filesystem paths. Infra detail on a public page is attack surface, not portfolio. I asked
  whether it could be named publicly and never got an explicit yes; he then told me to add it,
  which I took as the answer.
- **MAGI's MELCHIOR agent contains an essay "humanizer" for AI-detection evasion. It is
  deliberately OFF the site and he was told so.** On a portfolio a recruiter reads, that's a
  liability regardless of intent, and it isn't what makes MAGI impressive — the security layer
  is. He has not objected. Don't add it back without an explicit ask.
- **Electra internals (Electra/GBrain/Hermes codenames, the hardening approach) are public by
  his explicit decision** — he was flagged twice and said "commit it and push".

### Context & decisions

- **What MAGI actually is** (read from `~/MAGI/HANDOFF.md` and
  `~/MAGI/spellbook/MAGI_SYSTEM_OVERVIEW.md` this session — its GitHub description is only
  "online sync backup", which I refused to build a headline around): a multi-agent orchestrator.
  FastAPI core → `SecurityAssessor` (35+ threat patterns) → `ModelRouter` (task-complexity
  analysis) → agent delegation. Agents are MELCHIOR (school, operational), BALTHASAR (personal,
  not started), CASPAR (work, not started). Local Ollama models, Qdrant vector DB. Threat levels
  SAFE→CRITICAL, where a hit **downgrades the model the task is allowed to reach or blocks it
  outright**. That last mechanism is the interesting part and it's what the site says.
- **What clair is:** public, MIT, Python, created 2026-07-02. "Your Claude Code environment as
  code" — a dependency-free tool that rebuilds a whole Claude Code setup (settings, hooks,
  commands, skills, plugins, a vendored mboard coordinator) on a fresh macOS/Linux/Windows
  machine, idempotently. Personal/secret content lives in a private overlay and never enters the
  public repo. Installs from a Homebrew tap. User: *"add clair, thats a huge deal"*.
- **The section was renamed "Open source, on my own time" → "On my own time"** because MAGI is
  private and the old heading would have been a lie. The heading is now about whose time the
  work was built on, not the licence.
- **Project card order is newest-first** (user: *"the events are going oldest to newest, make it
  the other way around"*). The true timeline he gave: density tracker (Mar) → Sentinel (Mar) →
  Bastion (Jun) → Jockey (Jun/Jul) → Recurser (Jun–Aug) → SAGE (Aug–Dec). Cards render that
  **reversed**. **The graph does not — see §2.**
- **The tally was rebuilt once already.** User: *"the stats are kinda random maybe pull my git
  contributions or something, diversify dont make it twelvelabs only cuz it makes it seems like
  ive got nothing else on my own"*. It now spans four different things: his own repos (live from
  the GitHub API), his writing, the technical work, and school.

### Files & key locations
- `index.html:129-170` — the Electra feature (Memory / Defense / Next spec rows).
- `index.html:173-262` — `.cards`, 6 cards, **newest-first**: SAGE, Recurser, Jockey, Bastion,
  Sentinel, Density tracker. Blog links on SAGE and Recurser
  (`https://www.twelvelabs.io/blog/sage`, `.../recurser`).
- `index.html:265-341` — `.oss` "On my own time": MAGI (Private, no link), clair (Published +
  GitHub), UFW Manager, FlashGuard, Mailsmith.
- `index.html:352-381` — `.tally`: 15 public repos (live), 2 writeups, 1024 dimensions, 4.0 GPA.
- `index.html:386-484` — `.path` ledger, **already newest-first**.
- `assets/src/script.js:716-740` — `liveRepos()`: fetches
  `https://api.github.com/users/The007Programmer` → `.public_repos`, **raced against a 1200ms
  timeout**, falls back to the markup value (15).
- `~/MAGI/HANDOFF.md`, `~/MAGI/spellbook/MAGI_SYSTEM_OVERVIEW.md` — source of truth for MAGI.
- `~/Downloads/Aahil_Shaikh_Resume.pdf` — the résumé that drove the rewrite. **Do not publish it.**

### State
- **Done:** resume-driven content, MAGI + clair added, card order/dates fixed, tally rebuilt,
  Bay Area, the security de-emphasis.
- **Not started:** nothing outstanding.

### Next actions
Only reactive. If adding a 7th project card, note the grid is explicit
`1fr` → `repeat(2,1fr)` @40rem → `repeat(3,1fr)` @62rem (`main.css:596`) — **6 items always fill
it; 7 leaves an orphan cell that leaks the 1px-gap background as a coral block.** That bug
already happened once.

### Gotchas & open questions
- **Open:** he offered photos twice and it was never resolved. See §1.
- The tally's repo count is live; the `15` in the markup is only the fallback.

---

## §5 — Verification & the headless-testing traps

Status: **reference — read before verifying anything**
Depends on: none

```bash
# Bootstrap (run first) — joins the shared Mboard board (read-only segment; claims nothing)
export PATH="$HOME/.claude/mboard:$PATH"
export MBOARD_BOARD=handoff-2026-07-16-portfolio-rewrite
mboard join --board handoff-2026-07-16-portfolio-rewrite
mboard ps
```

### Goal
Stop future sessions from making the same false "verified" claims I made. **These traps have
already produced at least two wrong conclusions in this project.**

### The traps — all learned the hard way

1. **Chrome's `--virtual-time-budget` does NOT drive `requestAnimationFrame`.** Only one frame
   runs. This invalidated an earlier "the counters resolved" check — those values were already
   in the markup, so the screenshot proved nothing. **A headless capture of the force-simulated
   graph is meaningless.**
2. **`--force-prefers-reduced-motion` is the way to see the graph.** It solves the layout
   synchronously and renders once, which is the settled result.
3. **Fragment scrolling is broken headless.** `file://.../index.html#work` renders a garbled
   composite. To see a lower section, collapse `.hero` with an injected override in a **copy** of
   the site (see Appendix), never in the repo.
4. **The hero is `100svh`**, so a taller `--window-size` grows the hero too and never reveals
   more of the page. Collapsing the hero is the only way down.
5. **Firefox's `ui.prefersReducedMotion` setpref does not apply.** Don't bother.
6. **Chrome on this machine is a flatpak** and has no filesystem access to `/tmp` by default:
   `flatpak run --filesystem="$OUT" com.google.Chrome ...`. There is **no `google-chrome` or
   `chromium` on PATH** — `command -v google-chrome` returns nothing.
7. **`python3 -m http.server` was unreachable in this sandbox** — every port returned 404 from
   something. **Use `file://` URLs against a copy of the site instead.** This works.
8. **`node` is not installed** — `node --check` for JS syntax is unavailable. Validate JS by
   loading it in Chrome and grepping stderr for errors.

### What was actually verified this session, honestly

| Claim | How | Trustworthy? |
|---|---|---|
| HTML well-formed | `html.parser` stack check, 0 unclosed | yes |
| CSS braces balanced | 233/233 | yes (weak check) |
| No JS console errors | Chrome stderr grep | yes |
| Desktop graph builds 9 nodes | DOM dump: 36 `g-node*`, 25 `g-edge*` | yes |
| `data-trace` gate works | present @390px, absent @1440px | yes |
| Mobile trace fully builds | screenshot @390px, motion on | yes |
| Hero renders at 4 lines | screenshot @1440px | yes |
| **Nav marker slides** | **not tested** | **NO — needs a real browser** |
| **Scroll progress fills** | **not tested** | **NO — needs real scrolling** |
| **Drag / wander** | **not tested this session** | verified in earlier sessions via a Python port of the integrator |

### Next actions
1. Before claiming any motion works, ask: *does this need rAF or real scrolling?* If yes,
   headless cannot tell you. Say so instead of guessing.
2. The Python-port technique (reimplement the integrator, run 400+ iterations, assert zero
   energy and zero box overlaps) is the **only** trustworthy way to validate physics changes.

### Gotchas & open questions
- `README.md:65-71` documents traps 1 and 2 in the repo itself. Keep it current.

---

## Appendix — Verbatim references

### Working headless screenshot (the only reliable recipe found)
```bash
OUT=/tmp/claude-1000/-home-t007p-Documents-Code-the007programmer-github-io/<session>/scratchpad
rm -rf "$OUT/site"; cp -r /home/t007p/Documents/Code/the007programmer.github.io "$OUT/site"

# To reach a section below the fold, collapse the hero IN THE COPY ONLY:
printf '\n.hero{min-height:auto!important;padding:6rem 1.5rem 3rem!important}\n' \
  >> "$OUT/site/assets/src/main.css"

flatpak run --filesystem="$OUT" com.google.Chrome --headless --disable-gpu \
  --force-prefers-reduced-motion --hide-scrollbars --window-size=390,1700 \
  --screenshot="$OUT/shot.png" "file://$OUT/site/index.html"
```

### Check for JS errors / inspect the built DOM
```bash
flatpak run --filesystem="$OUT" com.google.Chrome --headless --disable-gpu \
  --window-size=1440,900 --virtual-time-budget=3000 --dump-dom \
  --enable-logging=stderr --log-level=0 "file://$OUT/site/index.html" 2>&1 \
  | grep -iE "error|exception|Uncaught|SEVERE"
```
(The `Gtk-WARNING ... 'border-spacing' is not a valid property name` line is flatpak noise, not
a page error.)

### Markup validation (no node on this box)
```bash
python3 -c "
import html.parser
class P(html.parser.HTMLParser):
    def __init__(s):
        super().__init__(); s.stack=[]; s.void={'meta','link','br','img','input','hr','source','area','col'}
    def handle_starttag(s,t,a):
        if t not in s.void: s.stack.append((t,s.getpos()))
    def handle_endtag(s,t):
        if not s.stack: print('stray',t,s.getpos()); return
        if s.stack[-1][0]!=t: print('MISMATCH',s.stack[-1],t,s.getpos())
        else: s.stack.pop()
p=P(); p.feed(open('index.html').read()); print('unclosed:',p.stack)
"
```

### The palette (`assets/src/main.css:6-20`)
```css
--signal:  #D62B22;  /* clears 4.5:1 with --paper in BOTH directions */
--ember:   #B5241B;  /* 5.9:1 with --paper */
--coral:   #FFA795;  /* 5.4:1 on slate */
--rust:    #8E1A13;
--paper:   #FFF1ED;  --paper-2: #FFE4DC;
--slate:   #39434F;  --slate-2: #4B5563;  --mute: #5A6675;
--display: 'Bricolage Grotesque'; --body: 'Instrument Sans'; --mono: 'Martian Mono';
```

### Commit message key (`README.md:112-121`)
```
SAFE: stable, production-ready, deployable
TEST: testing/experimental; safe, doesn't affect main program
UNST: unstable; not for production
REFA: refactor, no functional change
RESD: revert to a prior stable state
BUGF: bug fix
DOCS: documentation
```

### The hero copy the user rejected, in order (do not re-propose these)
1. `I build AI agents that remember what they've done — and can't be talked out of it.`
2. `I build agents that remember what they've done, and the security layer that decides what reaches them. One at TwelveLabs, one on hardware I own.`
3. `Everything I've built is named after a wall, a guard, or a watchman. That wasn't on purpose. Then it was.`
4. `Most AI agents are one clever sentence away from doing whatever you want. Mine aren't.`
5. `I build software that argues back.`
6. `Go ahead, sweet-talk my agents. They've heard it.`

### The line currently live (`index.html:48-52`) — unreviewed
> I keep ending up on the part nobody's built yet — video, systems, agents. It becomes a
> category about a year later. I'd like to say that's on purpose.

### Persistent memory already written (do not duplicate)
- `~/.claude/projects/-home-t007p-Documents-Code-the007programmer-github-io/memory/aahil-positioning.md`
- `~/.claude/projects/-home-t007p-Documents-Code-the007programmer-github-io/memory/aahil-privacy-boundaries.md`
- `.../memory/MEMORY.md` — the index
