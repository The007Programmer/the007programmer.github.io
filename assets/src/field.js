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

  window.AgentField = {
    createField: function () {
      return null; /* Task 4 */
    },
    readBands: readBands,
    colourAt: colourAt,
    readRepulsors: readRepulsors,
    STANDOFF: STANDOFF
  };
}());
