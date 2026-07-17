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
    for (let i = 0; i < bands.length; i++) {
      if (y >= bands[i].top && y < bands[i].bottom) return bands[i].colour;
    }
    return bands.length ? bands[bands.length - 1].colour : 'rgb(57, 67, 79)';
  }

  window.AgentField = {
    createField: function () {
      return null; /* Task 4 */
    },
    readBands: readBands,
    colourAt: colourAt
  };
}());
