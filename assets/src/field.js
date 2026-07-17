/* ============================================================
   Aahil Shaikh — the agent field
   An ambient layer of agents that drift, hold identity, and
   cooperate. Text is a repulsor in the sim, which is what keeps
   contrast intact: no agent ever occupies a pixel behind text,
   so every ratio in main.css:6-20 still holds exactly.
   ============================================================ */

(function () {
  'use strict';

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
    /* No bands means no DOM to read from - fall back to the thing every
       band would have inherited from anyway, still read rather than
       hardcoded. */
    if (!bands.length) return window.getComputedStyle(document.body).color;
    /* Out of range clamps to the NEAREST band, not the last one. */
    if (y < bands[0].top) return bands[0].colour;
    for (let i = 0; i < bands.length; i++) {
      if (y >= bands[i].top && y < bands[i].bottom) return bands[i].colour;
    }
    return bands[bands.length - 1].colour;
  }

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
    /* The topbar is transparent over the hero (main.css:110) and only gains
       an opaque slate ground once stuck, so agents would otherwise drift
       behind paper links on the paper-coloured field and erase them. It is
       fixed, so this is one stationary rect at the top of the viewport. */
    '.topbar',
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
  const REP    = 3.6;    /* text repulsion strength */
  const DAMP   = 0.94;
  const V_MAX  = 1.5;
  const EDGE   = 60;     /* soft basin inset */
  const EDGE_K = 0.02;

  const TRUST_DECAY   = 0.0022;
  const TRUST_RECOVER = 0.003;
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

       A naive "push to the nearest edge of the rect that was hit" is not
       enough: repulsors commonly overlap (a card's title and its body
       both repel, a fixed topbar oversitting a headline), and the exit
       point of one rect routinely sits inside its neighbour. On the real
       page this produced an exact 2-cycle - four agents seeded into the
       vertical overlap of two full-width bands ping-ponged between them
       under any fixed pass count, confirmed by instrumenting their x/y
       during tuning. escapeTarget walks past the WHOLE overlapping chain
       in the chosen direction (not just the one rect that was hit)
       before considering that direction clear, which is what a fixed
       number of blind passes can never guarantee. */
    function escapeTarget(pos, other, axisIsY, dir) {
      let p = pos;
      let moved = true;
      let guard = 0;
      while (moved && guard < 16) {
        moved = false;
        guard++;
        for (let k = 0; k < rects.length; k++) {
          const r = rects[k];
          const lo = axisIsY ? r.top : r.left;
          const hi = axisIsY ? r.bottom : r.right;
          const oLo = axisIsY ? r.left : r.top;
          const oHi = axisIsY ? r.right : r.bottom;
          if (other <= oLo || other >= oHi) continue; /* not in the way on the other axis */
          if (p > lo && p < hi) { p = dir < 0 ? lo - 1 : hi + 1; moved = true; }
        }
      }
      return p;
    }

    function ejectFromRects() {
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        let guard = 0;
        while (guard < 8) {
          guard++;
          let hit = false;
          for (let k = 0; k < rects.length; k++) {
            const r = rects[k];
            if (a.x > r.left && a.x < r.right && a.y > r.top && a.y < r.bottom) { hit = true; break; }
          }
          if (!hit) break;

          const upY    = escapeTarget(a.y, a.x, true, -1);
          const downY  = escapeTarget(a.y, a.x, true, 1);
          const leftX  = escapeTarget(a.x, a.y, false, -1);
          const rightX = escapeTarget(a.x, a.y, false, 1);
          const dUp = a.y - upY, dDown = downY - a.y, dLeft = a.x - leftX, dRight = rightX - a.x;
          const m = Math.min(dUp, dDown, dLeft, dRight);

          if (m === dUp) a.y = upY;
          else if (m === dDown) a.y = downY;
          else if (m === dLeft) a.x = leftX;
          else a.x = rightX;

          a.vx = 0;
          a.vy = 0;
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

      /* The soft REP push above is anticipatory, not sufficient: some
         repulsors (the hero headline, the topbar) cover a large enough
         share of the viewport that cohesion pulling toward a flock on
         the far side can out-muscle a flat REP accel for several ticks
         in a row, leaking a steady low-rate intrusion across the run -
         confirmed by instrumenting hitCount per rect during tuning,
         not assumed. ejectFromRects is already the zero-tolerance
         guarantee used at seed time; running it every tick makes that
         guarantee hold continuously instead of only at t=0. */
      ejectFromRects();
    }

    return { agents: agents, step: step, setRepulsors: setRepulsors };
  }

  window.AgentField = {
    createField: createField,
    readBands: readBands,
    colourAt: colourAt,
    readRepulsors: readRepulsors,
    STANDOFF: STANDOFF
  };
}());
