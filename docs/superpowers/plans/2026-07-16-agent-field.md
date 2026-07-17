# Agent Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An ambient whole-page field of agents that drift, hold identity, and cooperate — the three words in the hero line, rendered as behavior.

**Architecture:** One fixed full-viewport canvas at `z-index: 1`, above the opaque section backgrounds and below content raised to `z-index: 2` by a single CSS rule. `assets/src/field.js` owns a boids-style simulation whose colour per agent comes from `getComputedStyle(section).color` of whichever section band the agent is over. Text elements are repulsors in the sim, which is what keeps contrast intact by physics rather than by colour compromise.

**Tech Stack:** Vanilla ES5-flavoured JS in an IIFE (matching `assets/src/script.js`), Canvas 2D, no build step, no dependencies, no framework.

## Global Constraints

- **No build step. No package.json. No framework. No CDN dependency.** This is a GitHub Pages *user* site; the repo root is published as-is.
- **No `node`, no `npm`, no test runner on this machine.** Tests are harness pages driven by headless Chrome. See "Testing Approach".
- **No black.** `--slate: #39434F` is the darkest tone permitted anywhere.
- **Contrast is solved numerically, never by eye.** Tokens at `assets/src/main.css:6-20`.
- **Never key CSS off `.is-in`/`.is-built` alone** — gate on `[data-reveal]`/`[data-trace]`, set only when script is both able and allowed to animate (`main.css:957-961`).
- **Reduced motion must zero `delay` as well as duration** (`main.css:1049-1066`). The field's equivalent failure is painting nothing; it must paint a settled frame.
- **Commit prefixes are mandatory** (`README.md:112-121`): `SAFE`/`TEST`/`UNST`/`REFA`/`RESD`/`BUGF`/`DOCS`. Trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- **Branch:** all work on `agent-field`. Never push to `main` until Aahil has watched it in a real browser. Live site stays at `9a2bf41`.
- **`pkill -f "http.server"` kills its own shell** (exit 144) and silently skips the rest of the command. Don't use it.
- Style: IIFE + `'use strict'`, `function () {}` over arrows, `const` for bindings, section banners `/* ── N. Title ──── */`.

## Testing Approach — read this before Task 1

**Chrome's `--virtual-time-budget` does not drive `requestAnimationFrame`.** Only one frame runs. Any headless screenshot of a *running* field is meaningless. This project has already produced two false "verified" claims on exactly this trap (handoff §5).

The way around it: **never wait for a frame in a test.** `field.js` exposes `window.AgentField.createField(opts)` returning a sim whose `step()` is a plain synchronous function. A harness page calls `step()` in a `for` loop 2,000 times, computes metrics, and writes them into `#out`. Headless Chrome renders that page once with `--dump-dom`, and we grep the result. No rAF, no timing, real shipped code — not a reimplementation.

This is strictly better than the Python-port technique the handoff sanctions, because it tests the actual JS. Keep the port in reserve only if a bug appears that the harness cannot isolate.

Standard test command (used verbatim in every task):

```bash
OUT=/tmp/claude-1000/-home-t007p-Documents-Code-the007programmer-github-io/e274a99c-f2e2-413f-801f-a9ecf11898a5/scratchpad
rm -rf "$OUT/site"; cp -r /home/t007p/Documents/Code/the007programmer.github.io "$OUT/site"
flatpak run --filesystem="$OUT" com.google.Chrome --headless --disable-gpu \
  --window-size=1440,900 --virtual-time-budget=5000 --dump-dom \
  "file://$OUT/site/tests/field.html" 2>/dev/null | grep -A40 'id="out"'
```

`--virtual-time-budget` here only lets the page's synchronous script finish; it is not being asked to drive animation. That distinction is the whole point.

## File Structure

| File | Responsibility |
|---|---|
| `assets/src/field.js` | **Create.** The entire feature: bands, repulsors, sim, render, gates. Exposes `window.AgentField`. Self-contained; shares no state with `script.js`. |
| `assets/src/main.css` | **Modify.** Two rules: `.agent-field` canvas positioning, and one rule raising section content above it. |
| `index.html` | **Modify.** One `<canvas>`, one `<script>`. |
| `tests/field.html` | **Create.** Harness page. Drives `step()` synchronously, prints metrics to `#out`. |

`field.js` is a new file rather than a section 8 of `script.js` because `script.js` is already ~900 lines across 7 sections, the field shares no state with it, and a separate file means rejecting the feature is one `git rm`.

---

### Task 1: The canvas sits above grounds and below content

**Files:**
- Modify: `index.html` (add canvas + script tag)
- Modify: `assets/src/main.css` (add `.agent-field` rule + content-raise rule)
- Create: `assets/src/field.js` (stub that proves the stacking)

**Interfaces:**
- Consumes: nothing
- Produces: `window.AgentField.createField(opts)` — stubbed here, filled in Task 4. A `<canvas class="agent-field">` present in the DOM.

**Why this is first:** the entire feature is invisible if the stacking is wrong, and section backgrounds are opaque so "behind everything" shows nothing. Prove the canvas is visible over a ground and hidden under text before building anything on it.

- [ ] **Step 1: Write the failing test**

Create `tests/field-stack.html` — a page that loads the real CSS and a red-fill canvas, so a screenshot proves the layering:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>field stacking</title>
  <link rel="stylesheet" href="../assets/src/main.css">
  <style>
    /* Fill the canvas so layering is unambiguous in a screenshot. */
    .agent-field { background: #00FF00 !important; }
  </style>
</head>
<body>
  <canvas class="agent-field" aria-hidden="true"></canvas>
  <main id="main">
    <section class="hero">
      <div class="hero-inner">
        <h1 class="hero-name">STACK</h1>
      </div>
    </section>
  </main>
</body>
</html>
```

Expected once correct: green covers the red hero ground, and the word STACK is drawn **on top of** the green.

- [ ] **Step 2: Run it to make sure it fails**

```bash
OUT=/tmp/claude-1000/-home-t007p-Documents-Code-the007programmer-github-io/e274a99c-f2e2-413f-801f-a9ecf11898a5/scratchpad
rm -rf "$OUT/site"; cp -r /home/t007p/Documents/Code/the007programmer.github.io "$OUT/site"
flatpak run --filesystem="$OUT" com.google.Chrome --headless --disable-gpu \
  --hide-scrollbars --window-size=800,600 \
  --screenshot="$OUT/stack.png" "file://$OUT/site/tests/field-stack.html" 2>/dev/null
```

Expected: FAIL — no `.agent-field` rule exists yet, so the canvas is inline-sized (300×150) at the top of the flow and STACK is not layered over it.

- [ ] **Step 3: Write the minimal CSS**

Append to `assets/src/main.css`, after the `.topbar` block (keep z-index rules near each other; existing ones are 100 for `.topbar` and 50 for the skip link, so 1–2 is a free band):

```css
/* ── The agent field ─────────────────────────────────────────
   The canvas sits at z-index 1: above the sections' opaque
   backgrounds, below their content. .hero is position:relative
   with z-index:auto, so it makes no stacking context and its
   children are free to be raised over a fixed canvas. Give
   .hero a z-index and this breaks.
   ──────────────────────────────────────────────────────────── */
.agent-field {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

/* Every section wraps its content in element children — no bare
   text at this level — so one rule lifts all content over the
   canvas. Verified against index.html's structure. */
main > section > *,
body > footer > * {
  position: relative;
  z-index: 2;
}
```

- [ ] **Step 4: Run the screenshot and confirm the layering**

Re-run the Step 2 command. Read `$OUT/stack.png`.
Expected: PASS — full-viewport green, with STACK legible on top of it. If STACK is hidden, the content-raise rule is not matching; if the hero's red shows through, the canvas is not covering.

- [ ] **Step 5: Add the canvas and stub to the real page**

In `index.html`, immediately after `<body>` and before the skip link:

```html
  <canvas class="agent-field" aria-hidden="true"></canvas>
```

And beside the existing script tag at `index.html:564`:

```html
  <script src="assets/src/field.js"></script>
  <script src="assets/src/script.js"></script>
```

Create `assets/src/field.js`:

```js
/* ============================================================
   Aahil Shaikh — the agent field
   An ambient layer of agents that drift, hold identity, and
   cooperate. Text is a repulsor in the sim, which is what keeps
   contrast intact: no agent ever occupies a pixel behind text,
   so every ratio in main.css:6-20 still holds exactly.
   ============================================================ */

(function () {
  'use strict';

  window.AgentField = {
    createField: function () {
      return null; /* Task 4 */
    }
  };
}());
```

- [ ] **Step 6: Confirm the real page still renders and has no JS errors**

```bash
OUT=/tmp/claude-1000/-home-t007p-Documents-Code-the007programmer-github-io/e274a99c-f2e2-413f-801f-a9ecf11898a5/scratchpad
rm -rf "$OUT/site"; cp -r /home/t007p/Documents/Code/the007programmer.github.io "$OUT/site"
flatpak run --filesystem="$OUT" com.google.Chrome --headless --disable-gpu \
  --force-prefers-reduced-motion --hide-scrollbars --window-size=1440,900 \
  --screenshot="$OUT/page.png" "file://$OUT/site/index.html" 2>/dev/null
flatpak run --filesystem="$OUT" com.google.Chrome --headless --disable-gpu \
  --window-size=1440,900 --virtual-time-budget=3000 --dump-dom \
  --enable-logging=stderr --log-level=0 "file://$OUT/site/index.html" 2>&1 \
  | grep -iE "uncaught|exception|SEVERE" | grep -v border-spacing
```

Expected: hero renders exactly as before (canvas is transparent), and no error lines.

- [ ] **Step 7: Commit**

```bash
git add index.html assets/src/main.css assets/src/field.js tests/field-stack.html
git commit -m "$(cat <<'EOF'
SAFE: the field canvas, stacked between grounds and content

Section backgrounds are opaque, so a canvas behind everything shows
nothing. The canvas goes at z-index 1 - over the backgrounds, under
content raised to 2 by one rule. One rule works because every section
wraps its content in element children.

.hero is position:relative with z-index:auto and so makes no stacking
context; that is load-bearing. Give it a z-index and the field vanishes.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Bands — each section's colour, read from the DOM

**Files:**
- Modify: `assets/src/field.js`
- Create: `tests/field.html`

**Interfaces:**
- Consumes: `window.AgentField` from Task 1
- Produces: `AgentField.readBands()` → `Array<{top: number, bottom: number, colour: string}>`, viewport coordinates, ordered top to bottom. `colour` is a computed `rgb(...)` string.

**Why the text colour:** the agent colour *is* the section's computed `color`. Text colour is already the most readable thing its ground supports, so it's by definition the boldest legal mark. This also dodges a real trap — `.work` and `.toolkit` have **no `background` of their own** and inherit paper from `body`, so their ground is not readable from the element. Text colour inherits correctly; ground does not. Read the thing that inherits.

- [ ] **Step 1: Write the failing test**

Create `tests/field.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>field harness</title>
  <link rel="stylesheet" href="../assets/src/main.css">
</head>
<body>
  <canvas class="agent-field" aria-hidden="true"></canvas>
  <main id="main">
    <section class="hero"><div class="hero-inner"><h1>A</h1></div></section>
    <section class="path"><div class="section-head"><h2>B</h2></div></section>
    <section class="contact"><div class="contact-grid"><h2>C</h2></div></section>
  </main>
  <pre id="out">not run</pre>
  <script src="../assets/src/field.js"></script>
  <script>
    (function () {
      const lines = [];
      const bands = window.AgentField.readBands();
      lines.push('bands: ' + bands.length);
      bands.forEach(function (b, i) {
        lines.push(i + ' colour=' + b.colour + ' h=' + Math.round(b.bottom - b.top));
      });
      document.getElementById('out').textContent = lines.join('\n');
    }());
  </script>
</body>
</html>
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
OUT=/tmp/claude-1000/-home-t007p-Documents-Code-the007programmer-github-io/e274a99c-f2e2-413f-801f-a9ecf11898a5/scratchpad
rm -rf "$OUT/site"; cp -r /home/t007p/Documents/Code/the007programmer.github.io "$OUT/site"
flatpak run --filesystem="$OUT" com.google.Chrome --headless --disable-gpu \
  --window-size=1440,900 --virtual-time-budget=5000 --dump-dom \
  "file://$OUT/site/tests/field.html" 2>/dev/null | grep -A6 'id="out"'
```

Expected: FAIL — `readBands is not a function`, `#out` still says `not run`.

- [ ] **Step 3: Implement `readBands`**

In `field.js`, inside the IIFE, above the `window.AgentField` assignment:

```js
  /* ── 1. Bands ──────────────────────────────────────────────
     A band is a section's viewport rect plus the colour agents
     take while over it. The colour is the section's computed
     text colour: text colour is already the most readable thing
     its ground supports, so it is by definition the boldest legal
     mark. .work and .toolkit have no background of their own and
     inherit paper from body, so ground is NOT readable from the
     element - but colour inherits correctly. Read what inherits.
     ──────────────────────────────────────────────────────────── */

  const BAND_SEL = 'main > section, body > footer';

  function readBands() {
    const out = [];
    const nodes = document.querySelectorAll(BAND_SEL);
    Array.prototype.forEach.call(nodes, function (el) {
      const r = el.getBoundingClientRect();
      if (r.height <= 0) return;
      out.push({
        top: r.top,
        bottom: r.bottom,
        colour: window.getComputedStyle(el).color
      });
    });
    return out;
  }

  function colourAt(bands, y) {
    for (let i = 0; i < bands.length; i++) {
      if (y >= bands[i].top && y < bands[i].bottom) return bands[i].colour;
    }
    return bands.length ? bands[bands.length - 1].colour : 'rgb(57, 67, 79)';
  }
```

And extend the export:

```js
  window.AgentField = {
    createField: function () { return null; }, /* Task 4 */
    readBands: readBands,
    colourAt: colourAt
  };
```

- [ ] **Step 4: Run the test to verify it passes**

Re-run the Step 2 command.
Expected: PASS —

```
bands: 3
0 colour=rgb(255, 241, 237) h=...   <- hero, paper on signal
1 colour=rgb(255, 241, 237) h=...   <- path, paper on slate
2 colour=rgb(255, 241, 237) h=...   <- contact, paper on ember
```

- [ ] **Step 5: Add a band-boundary assertion**

Append to the harness `<script>`, before the `textContent` assignment:

```js
      const mid0 = (bands[0].top + bands[0].bottom) / 2;
      const mid1 = (bands[1].top + bands[1].bottom) / 2;
      lines.push('colourAt(mid band0) === band0: ' +
        (window.AgentField.colourAt(bands, mid0) === bands[0].colour));
      lines.push('colourAt(mid band1) === band1: ' +
        (window.AgentField.colourAt(bands, mid1) === bands[1].colour));
      lines.push('boundary belongs to lower band: ' +
        (window.AgentField.colourAt(bands, bands[1].top) === bands[1].colour));
```

- [ ] **Step 6: Run and verify all three are true**

Re-run the Step 2 command.
Expected: PASS — three `true` lines. The boundary case matters: `>= top && < bottom` means a boundary pixel belongs to the lower band, and exactly one band claims it.

- [ ] **Step 7: Commit**

```bash
git add assets/src/field.js tests/field.html
git commit -m "$(cat <<'EOF'
SAFE: bands read their colour from the DOM, not a table

An agent's colour is its section's computed text colour. Text colour is
already the most readable thing a ground supports, so it is the boldest
legal mark by construction - agent visibility equals the site's own
text/ground ratio and is >=4.5:1 for free.

No hardcoded colour table: it cannot drift from the palette. It also
dodges a trap - .work and .toolkit have no background of their own and
inherit paper from body, so ground is unreadable from the element.
Colour inherits; ground does not.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Text repulsors

**Files:**
- Modify: `assets/src/field.js`
- Modify: `tests/field.html`

**Interfaces:**
- Consumes: nothing from Task 2
- Produces: `AgentField.readRepulsors()` → `Array<{left, top, right, bottom}>`, viewport coordinates, each inflated by `STANDOFF`.

- [ ] **Step 1: Write the failing test**

Replace the harness `<script>` body with:

```js
      const lines = [];
      const rects = window.AgentField.readRepulsors();
      lines.push('repulsors: ' + rects.length);
      const h1 = document.querySelector('h1').getBoundingClientRect();
      const hit = rects.filter(function (r) {
        return r.left < h1.right && r.right > h1.left &&
               r.top < h1.bottom && r.bottom > h1.top;
      })[0];
      lines.push('h1 has a repulsor: ' + !!hit);
      if (hit) {
        lines.push('inflated left by: ' + Math.round(h1.left - hit.left));
        lines.push('inflated top by: ' + Math.round(h1.top - hit.top));
      }
      document.getElementById('out').textContent = lines.join('\n');
```

- [ ] **Step 2: Run it to make sure it fails**

Same command as Task 2 Step 2.
Expected: FAIL — `readRepulsors is not a function`.

- [ ] **Step 3: Implement `readRepulsors`**

In `field.js`, after the bands section:

```js
  /* ── 2. Repulsors ──────────────────────────────────────────
     Text is a participant in the sim, not an obstacle bolted on
     beside it. Agents are pushed off text by the same separation
     force they apply to each other, so no agent ever occupies a
     pixel behind text and every contrast ratio in main.css:6-20
     survives untouched. This is the whole contrast argument: it
     is a physics claim, not a colour claim.
     ──────────────────────────────────────────────────────────── */

  const STANDOFF = 24; /* px of clear air around glyphs */

  const TEXT_SEL = [
    '.hero-name', '.hero-thesis', '.hero-meta', '.eyebrow',
    '.section-title', '.card-title', '.card-desc',
    '.feature h3', '.feature p',
    '.tally-num', '.tally-label', '.tally-note',
    '.ledger-when', '.ledger-what',
    '.kit-group', '.contact-title', '.contact-copy', '.contact-links',
    '.form', '.graph', '.graph-caption',
    '.foot-name', '.foot-meta'
  ].join(',');

  function readRepulsors() {
    const out = [];
    const nodes = document.querySelectorAll(TEXT_SEL);
    Array.prototype.forEach.call(nodes, function (el) {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      out.push({
        left: r.left - STANDOFF,
        top: r.top - STANDOFF,
        right: r.right + STANDOFF,
        bottom: r.bottom + STANDOFF
      });
    });
    return out;
  }
```

Extend the export with `readRepulsors: readRepulsors` and `STANDOFF: STANDOFF`.

- [ ] **Step 4: Run the test to verify it passes**

Same command.
Expected: PASS — `repulsors: 1`, `h1 has a repulsor: true`, `inflated left by: 24`, `inflated top by: 24`.

(The harness has only an `<h1>`, which is not in `TEXT_SEL`. **If `repulsors: 0`, that is correct and the test is wrong** — change the harness `<h1>` to `<h1 class="hero-name">`. Do that rather than widening `TEXT_SEL` to bare tags; the selector list is deliberately opt-in so a future element can't silently start repelling.)

- [ ] **Step 5: Verify against the real page, not the harness**

The harness has a handful of sections; the real page has dozens of text elements. `TEXT_SEL` matching the harness proves nothing about the real markup, and a `TEXT_SEL` that silently misses real elements means agents drift over text and the contrast argument collapses without a sound.

**Inject the probe BEFORE `</body>`, not by appending to the end of the file.** Appending after `</html>` yields a `<pre>` that renders EMPTY — the script does not run, and you will read the empty element as a result. This was verified the hard way; do not use `cat >>` here.

```bash
OUT=/tmp/claude-1000/-home-t007p-Documents-Code-the007programmer-github-io/e274a99c-f2e2-413f-801f-a9ecf11898a5/scratchpad
rm -rf "$OUT/site"; cp -r /home/t007p/Documents/Code/the007programmer.github.io "$OUT/site"

python3 - <<'PY'
p = '/tmp/claude-1000/-home-t007p-Documents-Code-the007programmer-github-io/e274a99c-f2e2-413f-801f-a9ecf11898a5/scratchpad/site/index.html'
src = open(p).read()
probe = """<pre id="probe">pending</pre>
<script>
(function () {
  var r = window.AgentField.readRepulsors();
  var out = ['repulsors on real page: ' + r.length];
  var bad = r.filter(function (x) { return x.right <= x.left || x.bottom <= x.top; });
  out.push('degenerate rects: ' + bad.length + ' (must be 0)');
  document.getElementById('probe').textContent = out.join('\\n');
}());
</script>
</body>"""
open(p, 'w').write(src.replace('</body>', probe, 1))
PY

flatpak run --filesystem="$OUT" com.google.Chrome --headless --disable-gpu \
  --window-size=1440,900 --virtual-time-budget=5000 --dump-dom \
  "file://$OUT/site/index.html" 2>/dev/null > "$OUT/probe.html"

python3 -c "
import re, html
src = open('$OUT/probe.html').read()
m = re.search(r'<pre id=\"probe\">(.*?)</pre>', src, re.S)
print(html.unescape(m.group(1)) if m else 'PROBE DID NOT RUN')
"
```

Expected: `repulsors on real page: 68` (approximately — every card, ledger row, tally item, and the two footer lines), and `degenerate rects: 0`.

**If the count is 0, under ~10, or the probe prints `PROBE DID NOT RUN`, stop and fix it before continuing.** A near-zero count means `TEXT_SEL` is not matching the real markup.

- [ ] **Step 6: Commit**

```bash
git add assets/src/field.js tests/field.html
git commit -m "$(cat <<'EOF'
SAFE: text repulsors, the mechanism that keeps contrast intact

Making agents safe to pass BEHIND text is impossible: a mark visible
against a ground is far from it in luminance, but text is also far from
the ground in luminance - that is what makes text readable - so a
visible agent is necessarily close to the TEXT and text contrast
collapses. The boldest legal agent under that rule measured 1.7:1. A
whisper, and spectacle was the whole ask.

So text repels instead. Agents physically cannot reach it, contrast is
guaranteed by physics, and the palette is free (4.5:1 to 9.1:1).

Selector list is opt-in on purpose - a future element must not start
repelling silently.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: The simulation — cooperation, drift, identity

**Files:**
- Modify: `assets/src/field.js`
- Modify: `tests/field.html`

**Interfaces:**
- Consumes: `readBands`, `readRepulsors` from Tasks 2–3
- Produces: `AgentField.createField({w, h, n, seed})` → `{agents, step(dt), setRepulsors(rects)}`. `agents` is `Array<{x, y, vx, vy, id, trust}>`. `step(dt)` advances one tick synchronously and returns nothing.

**The behavior contract, restated so it isn't lost:** flocks must **form, degrade, dissolve, and re-form, forever.** `trust` decays continuously; as it falls, alignment and cohesion fade, the flock loosens and comes apart on its own; below a threshold the agent is solitary and wanders; `trust` recovers and it rejoins. That cycle *is* the feature. A field that converges to one stable flock, or never flocks at all, has failed — even if it looks pretty.

- [ ] **Step 1: Write the failing test**

Replace the harness `<script>` body:

```js
      const lines = [];
      const F = window.AgentField.createField({ w: 1440, h: 900, n: 70, seed: 7 });
      F.setRepulsors(window.AgentField.readRepulsors());

      function meanPairwise(ag) {
        let s = 0, c = 0;
        for (let i = 0; i < ag.length; i++) {
          for (let j = i + 1; j < ag.length; j++) {
            const dx = ag[i].x - ag[j].x, dy = ag[i].y - ag[j].y;
            s += Math.sqrt(dx * dx + dy * dy); c++;
          }
        }
        return s / c;
      }

      const series = [];
      let escaped = 0;
      const rects = window.AgentField.readRepulsors();
      for (let t = 0; t < 2000; t++) {
        F.step(1);
        if (t % 20 === 0) series.push(meanPairwise(F.agents));
        F.agents.forEach(function (a) {
          for (let k = 0; k < rects.length; k++) {
            const r = rects[k];
            if (a.x > r.left && a.x < r.right && a.y > r.top && a.y < r.bottom) escaped++;
          }
          if (a.x < 0 || a.x > 1440 || a.y < 0 || a.y > 900) escaped++;
        });
      }

      const lo = Math.min.apply(null, series), hi = Math.max.apply(null, series);
      lines.push('samples: ' + series.length);
      lines.push('mean pairwise min: ' + lo.toFixed(1) + ' max: ' + hi.toFixed(1));
      lines.push('OSCILLATES (hi/lo > 1.15): ' + (hi / lo > 1.15));
      lines.push('NOT collapsed (lo > 40): ' + (lo > 40));
      lines.push('NOT exploded (hi < 900): ' + (hi < 900));
      lines.push('agents in text or offscreen: ' + escaped + ' (must be 0)');
      lines.push('trust spread: ' +
        F.agents.filter(function (a) { return a.trust > 0.5; }).length + ' trusting / ' +
        F.agents.filter(function (a) { return a.trust <= 0.5; }).length + ' drifted');
      document.getElementById('out').textContent = lines.join('\n');
```

- [ ] **Step 2: Run it to make sure it fails**

Same command as Task 2 Step 2.
Expected: FAIL — `createField(...)` returns `null`, so `F.setRepulsors` throws.

- [ ] **Step 3: Implement the sim**

In `field.js`, after the repulsors section:

```js
  /* ── 3. The sim ────────────────────────────────────────────
     Same physics family as the graph: wander, separation, and a
     velocity clamp, with a zeroed velocity on wall contact. The
     graph taught us that an unanchored force sim never cools and
     pins everything to the frame; here the frame is a soft basin
     and trust decay is what keeps the field from settling.
     ──────────────────────────────────────────────────────────── */

  const SEP    = 260;    /* separation strength */
  const SEP_R  = 34;     /* separation radius */
  const ALIGN  = 0.055;  /* alignment, scaled by trust */
  const COH    = 0.0016; /* cohesion, scaled by trust */
  const NEAR   = 130;    /* neighbourhood radius */
  const WANDER = 0.055;  /* lissajous amplitude */
  const REP    = 0.9;    /* text repulsion strength */
  const DAMP   = 0.94;
  const V_MAX  = 1.5;
  const EDGE   = 60;     /* soft basin inset */
  const EDGE_K = 0.02;

  const TRUST_DECAY   = 0.00055;
  const TRUST_RECOVER = 0.00075;
  const TRUST_FLOOR   = 0.06;

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createField(opts) {
    const w = opts.w, h = opts.h;
    const rnd = mulberry32(opts.seed || 1);
    const agents = [];
    let rects = [];
    let clock = 0;

    for (let i = 0; i < opts.n; i++) {
      agents.push({
        x: EDGE + rnd() * (w - 2 * EDGE),
        y: EDGE + rnd() * (h - 2 * EDGE),
        vx: (rnd() - 0.5) * 0.6,
        vy: (rnd() - 0.5) * 0.6,
        id: i,                       /* identity: stable, survives regrouping */
        phase: rnd() * Math.PI * 2,
        trust: rnd()
      });
    }

    /* Agents are seeded at random positions and some land ON text.
       Repulsion would push them off over the next few ticks, but that is
       not good enough for two reasons: the test asserts ZERO intrusions
       from t=0, and - worse - the reduced-motion path paints after only
       200 steps, so a slow-to-clear agent would be painted sitting on a
       headline in exactly the accessibility path where contrast must not
       break. So eject on contact rather than waiting for the force.

       Two passes: ejecting along the shortest axis can land an agent
       inside a neighbouring rect, and the rects overlap (a card's title
       and its body both repel). Two passes clears the overlap cases that
       actually occur here; the test's zero-intrusion assertion is what
       proves it, so if it reports non-zero, add a third pass rather than
       weakening the assertion. */
    function ejectFromRects() {
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 0; i < agents.length; i++) {
          const a = agents[i];
          for (let k = 0; k < rects.length; k++) {
            const r = rects[k];
            if (a.x <= r.left || a.x >= r.right || a.y <= r.top || a.y >= r.bottom) continue;
            const dl = a.x - r.left, dr = r.right - a.x;
            const dtop = a.y - r.top, db = r.bottom - a.y;
            const m = Math.min(dl, dr, dtop, db);
            if (m === dl) a.x = r.left - 1;
            else if (m === dr) a.x = r.right + 1;
            else if (m === dtop) a.y = r.top - 1;
            else a.y = r.bottom + 1;
            a.vx = 0;
            a.vy = 0;
          }
        }
      }
    }

    function setRepulsors(next) {
      rects = next || [];
      ejectFromRects();
    }

    function step(dt) {
      clock += dt;
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        let ax = 0, ay = 0;
        let cx = 0, cy = 0, hx = 0, hy = 0, n = 0;

        for (let j = 0; j < agents.length; j++) {
          if (i === j) continue;
          const b = agents[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > NEAR * NEAR || d2 === 0) continue;
          const d = Math.sqrt(d2);
          if (d < SEP_R) { ax += (dx / d) * (SEP / d2); ay += (dy / d) * (SEP / d2); }
          cx += b.x; cy += b.y; hx += b.vx; hy += b.vy; n++;
        }

        /* Cooperation, scaled by trust. As trust decays the agent
           stops agreeing with its neighbours and the flock loosens
           and comes apart on its own. That IS behaviour drift. */
        if (n > 0) {
          ax += ((hx / n) - a.vx) * ALIGN * a.trust;
          ay += ((hy / n) - a.vy) * ALIGN * a.trust;
          ax += ((cx / n) - a.x) * COH * a.trust;
          ay += ((cy / n) - a.y) * COH * a.trust;
          a.trust -= TRUST_DECAY * dt * n * 0.12;
        } else {
          a.trust += TRUST_RECOVER * dt;
        }
        if (a.trust < TRUST_FLOOR) a.trust = TRUST_FLOOR;
        if (a.trust > 1) a.trust = 1;

        /* Wander: the graph's lissajous, per-agent phase. */
        ax += Math.sin(clock * 0.0016 + a.phase) * WANDER;
        ay += Math.cos(clock * 0.0013 + a.phase * 1.7) * WANDER;

        /* Text repels. Push out along the shortest axis. */
        for (let k = 0; k < rects.length; k++) {
          const r = rects[k];
          if (a.x <= r.left || a.x >= r.right || a.y <= r.top || a.y >= r.bottom) continue;
          const dl = a.x - r.left, dr = r.right - a.x;
          const dt2 = a.y - r.top, db = r.bottom - a.y;
          const m = Math.min(dl, dr, dt2, db);
          if (m === dl) ax -= REP; else if (m === dr) ax += REP;
          else if (m === dt2) ay -= REP; else ay += REP;
        }

        /* Soft basin, not walls. */
        if (a.x < EDGE) ax += (EDGE - a.x) * EDGE_K;
        if (a.x > w - EDGE) ax -= (a.x - (w - EDGE)) * EDGE_K;
        if (a.y < EDGE) ay += (EDGE - a.y) * EDGE_K;
        if (a.y > h - EDGE) ay -= (a.y - (h - EDGE)) * EDGE_K;

        a.vx = (a.vx + ax) * DAMP;
        a.vy = (a.vy + ay) * DAMP;
        const sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
        if (sp > V_MAX) { a.vx = (a.vx / sp) * V_MAX; a.vy = (a.vy / sp) * V_MAX; }
        a.x += a.vx * dt;
        a.y += a.vy * dt;

        /* Hard clamp: the basin is soft, but nothing leaves. */
        if (a.x < 0) { a.x = 0; a.vx = 0; }
        if (a.x > w) { a.x = w; a.vx = 0; }
        if (a.y < 0) { a.y = 0; a.vy = 0; }
        if (a.y > h) { a.y = h; a.vy = 0; }
      }
    }

    return { agents: agents, step: step, setRepulsors: setRepulsors };
  }
```

Replace the stub in the export with `createField: createField`.

- [ ] **Step 4: Run the test to verify it passes**

Same command.
Expected: PASS on every line —

```
OSCILLATES (hi/lo > 1.15): true
NOT collapsed (lo > 40): true
NOT exploded (hi < 900): true
agents in text or offscreen: 0 (must be 0)
trust spread: <some> trusting / <some> drifted
```

- [ ] **Step 5: If any assertion fails, tune against the sim — never against a screenshot**

This is where the graph's constants were solved and where guessing wasted a whole session. The knobs, in the order to try them:

| Symptom | Knob |
|---|---|
| `OSCILLATES: false`, mean distance flat | `TRUST_DECAY` up — flocks aren't coming apart |
| `OSCILLATES: false`, one stable blob | `COH` down, `TRUST_DECAY` up |
| `NOT collapsed: false` | `SEP` up or `COH` down |
| `NOT exploded: false` | `COH` up or `WANDER` down |
| `agents in text: > 0` | First check WHEN: if non-zero from t=0 it is a seeding/ejection problem — add a third pass to `ejectFromRects`. If it only appears later, it is tunnelling: `REP` up, then `V_MAX` down (a fast agent crosses a thin rect in one tick). **Never weaken the assertion** — a non-zero here means agents land on text and the whole contrast argument is void |
| `trust spread` all one side | `TRUST_DECAY`/`TRUST_RECOVER` ratio |

Re-run Step 4 after each change. Change **one** knob at a time.

- [ ] **Step 6: Commit**

```bash
git add assets/src/field.js tests/field.html
git commit -m "$(cat <<'EOF'
SAFE: the sim - cooperation, drift, identity

Flocks form, degrade, dissolve, and re-form forever. Trust decays while
an agent has neighbours; as it falls, alignment and cohesion fade, so the
flock comes apart on its own rather than on a timer. Solitary agents
recover trust and rejoin. That cycle is the feature - a field that
converges to one stable flock has failed even if it looks pretty.

Identity is a stable per-agent id that survives regrouping, so you can
watch one agent leave a dissolving flock and join another. Without it the
field is noise.

Verified by calling step() 2000x synchronously in a harness and asserting
mean pairwise distance oscillates (hi/lo > 1.15), never collapses, never
explodes, and that ZERO agents ever enter a text rect - which is the whole
contrast argument. No rAF involved, so the virtual-time trap in handoff
S5 does not apply.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Render, and wire it to the page

**Files:**
- Modify: `assets/src/field.js`

**Interfaces:**
- Consumes: `createField`, `readBands`, `colourAt`, `readRepulsors`
- Produces: a running field on the real page. No new public API.

- [ ] **Step 1: Implement render + mount**

Append to `field.js` before the export:

```js
  /* ── 4. Render and mount ───────────────────────────────────── */

  const DOT = 2.6;
  const N_WIDE = 70;
  const N_NARROW = 35;

  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function mount() {
    const cv = document.querySelector('canvas.agent-field');
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1, F = null, bands = [], raf = 0, last = 0;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.style.width = w + 'px'; cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function geometry() {
      bands = readBands();
      if (F) F.setRepulsors(readRepulsors());
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < F.agents.length; i++) {
        const a = F.agents[i];
        ctx.fillStyle = colourAt(bands, a.y);
        /* Identity reads as size as well as persistence: a drifted
           agent is smaller, so you can see who has come loose. */
        const r = DOT * (0.6 + 0.4 * a.trust);
        ctx.globalAlpha = 0.35 + 0.4 * a.trust;
        ctx.beginPath();
        ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    size();
    F = createField({
      w: w, h: h,
      n: w < 640 ? N_NARROW : N_WIDE,
      seed: 7
    });
    geometry();

    if (prefersReduced()) {
      /* Paint one settled frame and stop. Reduced motion must not
         mean a blank layer - the site's whole reduced-motion rule is
         that nothing may be left invisible (main.css:1049-1066). */
      for (let i = 0; i < 200; i++) F.step(1);
      draw();
      return;
    }

    function frame(t) {
      const dt = last ? Math.min((t - last) / 16.7, 3) : 1;
      last = t;
      F.step(dt);
      draw();
      raf = window.requestAnimationFrame(frame);
    }
    raf = window.requestAnimationFrame(frame);

    let resizeTimer = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () { size(); geometry(); }, 150);
    });

    window.addEventListener('scroll', function () { geometry(); }, { passive: true });

    /* The graph's loop stops when off-screen; this one has no such
       gate because it is always on screen. Stop it when the tab is
       hidden instead - the field never settles, so it would burn
       CPU forever in a background tab. */
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        window.cancelAnimationFrame(raf); raf = 0; last = 0;
      } else if (!raf) {
        raf = window.requestAnimationFrame(frame);
      }
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(geometry);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
```

- [ ] **Step 2: Verify reduced-motion paints a settled frame**

```bash
OUT=/tmp/claude-1000/-home-t007p-Documents-Code-the007programmer-github-io/e274a99c-f2e2-413f-801f-a9ecf11898a5/scratchpad
rm -rf "$OUT/site"; cp -r /home/t007p/Documents/Code/the007programmer.github.io "$OUT/site"
flatpak run --filesystem="$OUT" com.google.Chrome --headless --disable-gpu \
  --force-prefers-reduced-motion --hide-scrollbars --window-size=1440,900 \
  --screenshot="$OUT/field-rm.png" "file://$OUT/site/index.html" 2>/dev/null
```

Read `$OUT/field-rm.png`.
Expected: PASS — cream dots visible on the red hero, **clear of the name and the hook**, and the hero text unchanged. This screenshot IS trustworthy: the reduced-motion path is one synchronous frame by design and never touches rAF.

- [ ] **Step 3: Verify no JS errors on the real page**

```bash
flatpak run --filesystem="$OUT" com.google.Chrome --headless --disable-gpu \
  --window-size=1440,900 --virtual-time-budget=3000 --dump-dom \
  --enable-logging=stderr --log-level=0 "file://$OUT/site/index.html" 2>&1 \
  | grep -iE "uncaught|exception|SEVERE" | grep -v border-spacing
```

Expected: no output.

- [ ] **Step 4: Verify the narrow build**

Re-run Step 2 with `--window-size=390,844`, output `$OUT/field-390.png`.
Expected: PASS — dots present, fewer of them, hero text clear.

**Do NOT screenshot the animated path and claim it works.** `--virtual-time-budget` does not drive rAF; a non-reduced-motion capture shows one arbitrary frame and proves nothing about motion.

- [ ] **Step 5: Commit**

```bash
git add assets/src/field.js
git commit -m "$(cat <<'EOF'
SAFE: render the field, mount it, gate it

Agents draw in their band's colour, sized and faded by trust, so a
drifted agent reads as smaller and quieter - identity you can see.

Reduced motion runs 200 steps and paints one settled frame rather than
nothing: the site's rule is that nothing may be left invisible
(main.css:1049-1066), and a blank layer is this feature's version of
that failure. That path is also the only one a headless screenshot can
honestly verify, since it never touches rAF.

Loop stops on visibilitychange - the field never settles, so it would
burn CPU in a background tab forever.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Scroll impulse

**Files:**
- Modify: `assets/src/field.js`

**Interfaces:**
- Consumes: the field from Task 5
- Produces: `F.nudge(dy)` — adds a `vy` impulse to every agent.

**Why last:** it's the one behavior that's pure feel, has no correctness assertion, and is the easiest to cut if Aahil finds it distracting. Keeping it separate means cutting it is one revert.

- [ ] **Step 1: Add `nudge` to the sim**

Inside `createField`, before the `return`:

```js
    function nudge(dy) {
      const k = Math.max(-6, Math.min(6, dy * 0.06));
      for (let i = 0; i < agents.length; i++) agents[i].vy += k * 0.18;
    }
```

Return it: `return { agents: agents, step: step, setRepulsors: setRepulsors, nudge: nudge };`

- [ ] **Step 2: Call it from the scroll listener**

Replace the scroll listener in `mount`:

```js
    let lastY = window.scrollY || 0;
    window.addEventListener('scroll', function () {
      const y = window.scrollY || 0;
      if (F) F.nudge(y - lastY);
      lastY = y;
      geometry();
    }, { passive: true });
```

- [ ] **Step 3: Verify agents still never reach text after a nudge**

In `tests/field.html`, add before the metrics print:

```js
      for (let t = 0; t < 400; t++) { F.nudge(40); F.step(1); }
      let post = 0;
      F.agents.forEach(function (a) {
        for (let k = 0; k < rects.length; k++) {
          const r = rects[k];
          if (a.x > r.left && a.x < r.right && a.y > r.top && a.y < r.bottom) post++;
        }
      });
      lines.push('after sustained nudge, agents in text: ' + post + ' (must be 0)');
```

- [ ] **Step 4: Run it**

Same command as Task 2 Step 2.
Expected: PASS — `after sustained nudge, agents in text: 0`. A sustained nudge is the worst case for tunnelling: if this is non-zero, lower `V_MAX` or the nudge coefficient. **Do not ship a non-zero here** — it means agents land on text and the contrast argument is void.

- [ ] **Step 5: Commit**

```bash
git add assets/src/field.js tests/field.html
git commit -m "$(cat <<'EOF'
SAFE: scroll pushes the field

Scroll is the only input - no pointer dependency, so it is alive on
touch.

Tested against the worst case for tunnelling: 400 sustained nudges must
still leave zero agents on text. A fast agent can cross a thin rect in
one tick, and that would void the contrast argument silently.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Full verification, then hand it to Aahil

**Files:**
- Modify: `README.md` (document the field's rationale, as the graph and motion are)
- Modify: `docs/superpowers/specs/2026-07-16-agent-field-design.md` (mark shipped)

- [ ] **Step 1: Run the whole honest verification set**

```bash
OUT=/tmp/claude-1000/-home-t007p-Documents-Code-the007programmer-github-io/e274a99c-f2e2-413f-801f-a9ecf11898a5/scratchpad
rm -rf "$OUT/site"; cp -r /home/t007p/Documents/Code/the007programmer.github.io "$OUT/site"

# 1. markup well-formed
python3 -c "
import html.parser
class P(html.parser.HTMLParser):
    def __init__(s):
        super().__init__(); s.stack=[]; s.void={'meta','link','br','img','input','hr','source','area','col'}
    def handle_starttag(s,t,a):
        if t not in s.void: s.stack.append((t,s.getpos()))
    def handle_endtag(s,t):
        if not s.stack: return
        if s.stack[-1][0]!=t: print('MISMATCH',s.stack[-1],t,s.getpos())
        else: s.stack.pop()
p=P(); p.feed(open('index.html').read()); print('unclosed:',p.stack)
"

# 2. sim assertions
flatpak run --filesystem="$OUT" com.google.Chrome --headless --disable-gpu \
  --window-size=1440,900 --virtual-time-budget=5000 --dump-dom \
  "file://$OUT/site/tests/field.html" 2>/dev/null | grep -A12 'id="out"'

# 3. no console errors
flatpak run --filesystem="$OUT" com.google.Chrome --headless --disable-gpu \
  --window-size=1440,900 --virtual-time-budget=3000 --dump-dom \
  --enable-logging=stderr --log-level=0 "file://$OUT/site/index.html" 2>&1 \
  | grep -iE "uncaught|exception|SEVERE" | grep -v border-spacing

# 4. reduced-motion settled frame, both widths
for W in 1440 390; do
  flatpak run --filesystem="$OUT" com.google.Chrome --headless --disable-gpu \
    --force-prefers-reduced-motion --hide-scrollbars --window-size=$W,900 \
    --screenshot="$OUT/final-$W.png" "file://$OUT/site/index.html" 2>/dev/null
done
```

Every sim assertion must read `true`, and `agents in text` must be `0`.

- [ ] **Step 2: Document it in the README**

Add a section after the motion rationale (`README.md:87-110`), matching the existing voice:

```markdown
## The field

The page is covered by a field of agents that drift, hold identity, and
cooperate — the three words the hero line uses about the work. Flocks form,
their members slowly stop agreeing, the flock comes apart, and new ones form.
That cycle is the point; a field that settles into one stable flock has failed.

Text is a repulsor in the simulation. Agents are pushed off it by the same
separation force they apply to each other, so no agent ever occupies a pixel
behind text and every contrast ratio in `main.css:6-20` survives untouched.
This is deliberate and load-bearing: the alternative — tinting agents close to
their ground so they'd be safe behind text — was measured and capped out at
1.7:1, which is invisible.

Agent colour is the section's computed text colour, never a table. Text colour
is already the most readable thing a ground supports, so it's the boldest legal
mark by construction. It also can't drift from the palette, and it sidesteps
`.work`/`.toolkit` having no background of their own.
```

- [ ] **Step 3: Commit the docs**

```bash
git add README.md docs/superpowers/specs/2026-07-16-agent-field-design.md
git commit -m "$(cat <<'EOF'
DOCS: the field's rationale, in the repo

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Hand it to Aahil — do not push to main**

Report honestly:
- what the sim assertions prove (flocking, drift cycle, zero text contact)
- what they do **not** prove: whether it looks good, and whether the field gets squeezed into the margins on text-dense sections. **Neither is checkable by any script.** Both are the actual criteria for keeping it.
- ask him to run `python3 -m http.server` and look, on desktop and phone.

**The branch does not merge to `main` until he has watched it.** Rejecting is `git branch -D agent-field` — no revert commit, no churn on the live site, which stays at `9a2bf41` throughout.

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| Behavior model: cooperation / drift / identity | 4 |
| Text-as-repulsor mechanism | 3, 4 |
| Agent colour = computed text colour, no table | 2 |
| Band mapping, viewport space | 2, 5 |
| Stacking (canvas z-1, content z-2) | 1 |
| Scroll impulse, no pointer dependency | 6 |
| Degradation: no-JS | 1 (canvas is empty and invisible; CSS paints grounds) |
| Degradation: reduced motion → settled frame | 5 |
| Degradation: tab hidden | 5 |
| Perf: N=70/35, DPR cap 2, rects off the frame path | 5 |
| Verification incl. the rAF trap | Testing Approach + 4, 5, 7 |
| Revert path | 7 |

No gaps.

**Placeholder scan:** No TBD/TODO. Every code step carries complete code. The only deliberate under-specification is the tuning table in Task 4 Step 5, which is a decision procedure with concrete knobs, not a placeholder.

**Type consistency:** `createField({w,h,n,seed})` → `{agents, step, setRepulsors}` in Task 4, extended with `nudge` in Task 6 — Task 6 restates the full return. `readBands()` → `{top,bottom,colour}` used identically by `colourAt` (Task 2) and `draw` (Task 5). `readRepulsors()` → `{left,top,right,bottom}` used identically by `setRepulsors` (Task 4) and the harness (Tasks 3, 4, 6). `prefersReduced` is defined locally in `field.js` rather than imported — `script.js` has its own inside a closed IIFE and there is no module system to share it. Consistent.

**Known risk carried forward:** Task 4's constants are first guesses. The graph's constants took a full offline solve, and Step 5 exists because these will likely need the same. That is expected work, not a defect in the plan.
