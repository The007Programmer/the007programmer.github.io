/* ============================================================
   Aahil Shaikh — portfolio
   1. The trajectory graph: my career, drawn as the directed
      graph it actually is. Layout is hand-placed, not simulated,
      so it reads the same every load, and it builds in causal order.
   2. The name decodes out of noise.
   3. Hero parallax.
   4. Mono labels decode; the tally counts up.
   5. Topbar ground past the hero.
   6. Scroll reveals.
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. The graph ──────────────────────────────────────── */

  const VIEW_X = -40;
  const VIEW_Y = -24;
  const VIEW_W = 1060;
  const VIEW_H = 508;
  const NS = 'http://www.w3.org/2000/svg';

  // kind "role" renders filled (the two jobs); everything else is
  // outlined (the things those jobs caused). x/y seed the simulation —
  // they are a hand-placed layout that already reads well, so the graph
  // relaxes out from a good arrangement instead of finding its own from
  // random noise and possibly landing on a tangle.
  const NODES = {
    hacks:    { x: 95,  y: 55,  label: 'Chinatown Hacks', sub: 'Mar 2025', kind: 'event' },
    sentinel: { x: 305, y: 155, label: 'Sentinel', sub: 'Prototype', kind: 'artifact' },
    devex:    { x: 545, y: 55,  label: 'TwelveLabs · DevEx', sub: 'Jun–Dec 2025', kind: 'role' },
    tamu:     { x: 150, y: 335, label: 'Texas A&M', sub: 'Aug 2025 →', kind: 'event' },
    sage:     { x: 420, y: 300, label: 'SAGE', sub: 'Shipped', kind: 'artifact' },
    bastion:  { x: 575, y: 405, label: 'Bastion', sub: 'Shipped', kind: 'artifact' },
    recurser: { x: 750, y: 295, label: 'Recurser', sub: 'Proposed, then shipped', kind: 'artifact' },
    agentsec: { x: 843, y: 55,  label: 'TwelveLabs · Agent Security', sub: 'Feb–Jun 2026', kind: 'role' },
    electra:  { x: 885, y: 405, label: 'Electra', sub: 'Beta', kind: 'artifact' }
  };

  const EDGES = [
    { from: 'hacks',    to: 'sentinel', label: 'prototyped' },
    { from: 'sentinel', to: 'devex',    label: 'led to an offer' },
    { from: 'devex',    to: 'sage',     label: 'built' },
    { from: 'devex',    to: 'bastion',  label: 'built' },
    { from: 'devex',    to: 'recurser', label: 'proposed' },
    { from: 'devex',    to: 'agentsec', label: 'returned as' },
    { from: 'agentsec', to: 'electra',  label: 'led the build' },
    { from: 'devex',    to: 'tamu',     label: 'alongside', soft: true }
  ];

  // Martian Mono is a wide monospace; these advances size the boxes
  // closely enough without a layout pass.
  const LABEL_ADV = 6.9;  // 10px / 600
  const SUB_ADV = 5.2;    // 7.5px
  const EDGE_ADV = 5.4;   // 8.5px
  const PAD_X = 12;
  const BOX_H = 36;

  // Simulation. Every node is sprung to its seed position, so the graph
  // relaxes out of the hand-placed layout and returns to it after you
  // let go of a node. Without that anchor the repulsion wins, the graph
  // expands until every box is pinned against the frame, and it never
  // cools. These numbers were solved offline against the real node
  // sizes: they reach zero energy with no overlapping boxes.
  const REP = 16000;      // node-node repulsion
  const K_SPRING = 0.03;  // edge stiffness
  const K_ANCHOR = 0.02;  // pull back toward the seed position
  const DAMP = 0.86;
  const V_MAX = 6;
  const GAP = 30;         // clear space demanded between two boxes
  const COOL = 0.02;      // kinetic energy below which the graph is at rest

  const STEP = 300;      // ms between one causal hop and the next
  const NODE_IN = 380;   // a node settles before its edges leave it
  const DRAW = 550;      // how long an edge takes to reach its target
  const POP = 420;       // how long a node takes to appear

  function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }

  function measure(node) {
    const w = Math.max(node.label.length * LABEL_ADV, node.sub.length * SUB_ADV);
    return { w: w + PAD_X * 2, h: BOX_H };
  }

  // Stop an edge at the box border instead of the node center.
  function trim(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (dx === 0 && dy === 0) return { x: from.x, y: from.y };
    const sx = dx === 0 ? Infinity : (from.w / 2) / Math.abs(dx);
    const sy = dy === 0 ? Infinity : (from.h / 2) / Math.abs(dy);
    const s = Math.min(sx, sy);
    return { x: from.x + dx * s, y: from.y + dy * s };
  }

  // How many causal hops each node sits from a root. This drives the
  // spawn order, so the graph grows along the actual chain.
  function depths() {
    const d = {};
    const incoming = {};
    Object.keys(NODES).forEach(function (id) { incoming[id] = 0; });
    EDGES.forEach(function (e) { incoming[e.to]++; });

    let frontier = Object.keys(NODES).filter(function (id) { return !incoming[id]; });
    frontier.forEach(function (id) { d[id] = 0; });

    for (let pass = 0; pass < Object.keys(NODES).length && frontier.length; pass++) {
      const next = [];
      EDGES.forEach(function (e) {
        if (frontier.indexOf(e.from) === -1) return;
        const cand = d[e.from] + 1;
        if (d[e.to] === undefined || cand > d[e.to]) {
          d[e.to] = cand;
          if (next.indexOf(e.to) === -1) next.push(e.to);
        }
      });
      frontier = next;
    }
    Object.keys(NODES).forEach(function (id) { if (d[id] === undefined) d[id] = 0; });
    return d;
  }

  function buildGraph(mount) {
    const svg = el('svg', {
      viewBox: VIEW_X + ' ' + VIEW_Y + ' ' + VIEW_W + ' ' + VIEW_H,
      class: 'g-svg',
      'aria-hidden': 'true',
      focusable: 'false'
    });

    const defs = el('defs');
    const marker = el('marker', {
      id: 'g-arrow', viewBox: '0 0 8 8', refX: '7', refY: '4',
      markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse'
    });
    marker.appendChild(el('path', {
      d: 'M0.5,1 L7,4 L0.5,7', fill: 'none', stroke: 'currentColor',
      'stroke-width': '1.4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    const edgeLayer = el('g');
    const nodeLayer = el('g');
    const depth = depths();

    // ── Build the simulation state ──────────────────────────
    const sim = {};
    Object.keys(NODES).forEach(function (id) {
      const n = NODES[id];
      const box = measure(n);
      sim[id] = {
        id: id, x: n.x, y: n.y, ax: n.x, ay: n.y, vx: 0, vy: 0,
        w: box.w, h: box.h, kind: n.kind,
        born: depth[id] * STEP, held: false
      };
    });

    const links = EDGES.map(function (e, i) {
      const a = sim[e.from], b = sim[e.to];
      const seed = Math.hypot(b.x - a.x, b.y - a.y);
      const labelW = e.label.length * EDGE_ADV;
      return {
        i: i, from: e.from, to: e.to, label: e.label, soft: !!e.soft,
        labelW: labelW,
        // An edge is never shorter than the words written on it need.
        // This is what stops the labels from being cramped: the layout
        // is obliged to make room for its own annotations.
        rest: Math.max(seed, labelW + 76),
        born: depth[e.from] * STEP + NODE_IN
      };
    });

    const spawnDone = Math.max.apply(null, links.map(function (l) { return l.born + DRAW; })
      .concat(Object.keys(sim).map(function (id) { return sim[id].born + POP; })));

    // ── DOM ─────────────────────────────────────────────────
    const touches = {};
    links.forEach(function (l) {
      l.line = el('line', {
        class: 'g-edge' + (l.soft ? ' g-edge-soft' : ''), 'data-edge': l.i
      });
      l.patch = el('rect', { class: 'g-edge-patch', height: 16, 'data-edge': l.i,
        width: l.labelW + 16 });
      l.text = el('text', { class: 'g-edge-label', 'text-anchor': 'middle', 'data-edge': l.i });
      l.text.textContent = l.label;
      edgeLayer.appendChild(l.line);
      edgeLayer.appendChild(l.patch);
      edgeLayer.appendChild(l.text);
      (touches[l.from] = touches[l.from] || []).push(l.i);
      (touches[l.to] = touches[l.to] || []).push(l.i);
    });

    Object.keys(sim).forEach(function (id) {
      const n = sim[id], src = NODES[id];
      const g = el('g', { class: 'g-node', 'data-kind': n.kind, 'data-node': id });
      g.appendChild(el('rect', {
        class: 'g-node-box', x: -n.w / 2, y: -n.h / 2, width: n.w, height: n.h, rx: 2
      }));
      const label = el('text', { class: 'g-node-label', x: 0, y: -1, 'text-anchor': 'middle' });
      label.textContent = src.label;
      g.appendChild(label);
      const sub = el('text', { class: 'g-node-sub', x: 0, y: 11, 'text-anchor': 'middle' });
      sub.textContent = src.sub;
      g.appendChild(sub);
      n.g = g;
      nodeLayer.appendChild(g);
    });

    svg.appendChild(edgeLayer);
    svg.appendChild(nodeLayer);
    mount.insertBefore(svg, mount.firstChild);

    // ── Physics ─────────────────────────────────────────────
    const ids = Object.keys(sim);

    function step(active) {
      for (let a = 0; a < active.length; a++) {
        const i = sim[active[a]];
        if (i.held) continue;
        let fx = 0, fy = 0;

        for (let b = 0; b < active.length; b++) {
          if (a === b) continue;
          const j = sim[active[b]];
          let dx = i.x - j.x, dy = i.y - j.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 1) { dx = (i.x < j.x ? -1 : 1) * 0.5; dy = 0.5; d2 = 0.5; }
          const d = Math.sqrt(d2);
          const f = REP / d2;
          fx += (dx / d) * f;
          fy += (dy / d) * f;

          // Boxes are rectangles, so plain point repulsion still lets
          // two wide labels sit on top of each other. Push apart along
          // whichever axis is least overlapped.
          const ox = (i.w + j.w) / 2 + GAP - Math.abs(dx);
          const oy = (i.h + j.h) / 2 + GAP - Math.abs(dy);
          if (ox > 0 && oy > 0) {
            if (ox < oy) fx += (dx < 0 ? -1 : 1) * ox * 0.35;
            else fy += (dy < 0 ? -1 : 1) * oy * 0.35;
          }
        }

        fx += (i.ax - i.x) * K_ANCHOR;
        fy += (i.ay - i.y) * K_ANCHOR;

        i.fx = fx; i.fy = fy;
      }

      links.forEach(function (l) {
        const a = sim[l.from], b = sim[l.to];
        if (active.indexOf(l.from) === -1 || active.indexOf(l.to) === -1) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.01;
        const f = K_SPRING * (d - l.rest);
        const ux = dx / d, uy = dy / d;
        if (!a.held) { a.fx += ux * f; a.fy += uy * f; }
        if (!b.held) { b.fx -= ux * f; b.fy -= uy * f; }
      });

      let energy = 0;
      for (let a = 0; a < active.length; a++) {
        const i = sim[active[a]];
        if (i.held) { i.vx = 0; i.vy = 0; continue; }
        i.vx = (i.vx + i.fx) * DAMP;
        i.vy = (i.vy + i.fy) * DAMP;
        i.vx = Math.max(-V_MAX, Math.min(V_MAX, i.vx));
        i.vy = Math.max(-V_MAX, Math.min(V_MAX, i.vy));
        let nx = i.x + i.vx, ny = i.y + i.vy;

        // Keep every box inside the frame. Zeroing the velocity on
        // contact matters: a node pressed against a wall otherwise keeps
        // banking speed it can never spend, and the graph never cools.
        const loX = VIEW_X + i.w / 2 + 4, hiX = VIEW_X + VIEW_W - i.w / 2 - 4;
        const loY = VIEW_Y + i.h / 2 + 4, hiY = VIEW_Y + VIEW_H - i.h / 2 - 4;
        if (nx < loX || nx > hiX) { nx = Math.max(loX, Math.min(hiX, nx)); i.vx = 0; }
        if (ny < loY || ny > hiY) { ny = Math.max(loY, Math.min(hiY, ny)); i.vy = 0; }
        i.x = nx; i.y = ny;
        energy += i.vx * i.vx + i.vy * i.vy;
      }
      return energy;
    }

    function render(t) {
      ids.forEach(function (id) {
        const n = sim[id];
        const p = t === null ? 1 : Math.max(0, Math.min(1, (t - n.born) / POP));
        if (p <= 0) { n.g.setAttribute('opacity', '0'); return; }
        const s = 0.9 + 0.1 * p;
        n.g.setAttribute('opacity', p.toFixed(3));
        n.g.setAttribute('transform',
          'translate(' + n.x.toFixed(1) + ',' + n.y.toFixed(1) + ') scale(' + s.toFixed(3) + ')');
      });

      links.forEach(function (l) {
        const a = sim[l.from], b = sim[l.to];
        const p = t === null ? 1 : Math.max(0, Math.min(1, (t - l.born) / DRAW));
        if (p <= 0) {
          l.line.setAttribute('opacity', '0');
          l.text.setAttribute('opacity', '0');
          l.patch.setAttribute('opacity', '0');
          l.line.removeAttribute('marker-end');
          return;
        }
        const s0 = trim(a, b), e0 = trim(b, a);
        // The line grows toward its target, following the endpoints even
        // while the graph is still settling.
        const ex = s0.x + (e0.x - s0.x) * p;
        const ey = s0.y + (e0.y - s0.y) * p;
        l.line.setAttribute('x1', s0.x.toFixed(1));
        l.line.setAttribute('y1', s0.y.toFixed(1));
        l.line.setAttribute('x2', ex.toFixed(1));
        l.line.setAttribute('y2', ey.toFixed(1));
        l.line.removeAttribute('opacity');
        if (p >= 1) l.line.setAttribute('marker-end', 'url(#g-arrow)');
        else l.line.removeAttribute('marker-end');

        const mx = (s0.x + e0.x) / 2, my = (s0.y + e0.y) / 2;
        l.text.setAttribute('x', mx.toFixed(1));
        l.text.setAttribute('y', (my + 3).toFixed(1));
        l.patch.setAttribute('x', (mx - l.labelW / 2 - 8).toFixed(1));
        l.patch.setAttribute('y', (my - 8).toFixed(1));
        const lp = Math.max(0, Math.min(1, (p - 0.5) * 2));
        l.text.setAttribute('opacity', lp.toFixed(2));
        l.patch.setAttribute('opacity', lp.toFixed(2));
      });
    }

    // ── Loop ────────────────────────────────────────────────
    let raf = null, t0 = 0, dragging = false;

    function activeAt(t) {
      return ids.filter(function (id) { return t >= sim[id].born; });
    }

    function frame(now) {
      const t = now - t0;
      const energy = step(activeAt(t));
      render(t);
      if (dragging || t < spawnDone + 400 || energy > COOL) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = null;   // settled: stop burning frames until something moves
      }
    }

    function kick() {
      if (raf === null) {
        t0 = performance.now() - (spawnDone + 500);   // already grown
        raf = requestAnimationFrame(frame);
      }
    }

    // ── Drag ────────────────────────────────────────────────
    const pt = svg.createSVGPoint();
    function toLocal(evt) {
      pt.x = evt.clientX; pt.y = evt.clientY;
      const m = svg.getScreenCTM();
      return m ? pt.matrixTransform(m.inverse()) : null;
    }

    ids.forEach(function (id) {
      const n = sim[id];
      n.g.addEventListener('pointerdown', function (evt) {
        evt.preventDefault();
        n.held = true;
        dragging = true;
        n.g.setPointerCapture(evt.pointerId);
        n.g.classList.add('is-held');
        kick();
      });
      n.g.addEventListener('pointermove', function (evt) {
        if (!n.held) return;
        const p = toLocal(evt);
        if (!p) return;
        n.x = p.x; n.y = p.y;
      });
      const release = function (evt) {
        if (!n.held) return;
        n.held = false;
        dragging = false;
        n.g.classList.remove('is-held');
        try { n.g.releasePointerCapture(evt.pointerId); } catch (err) { /* already gone */ }
        kick();
      };
      n.g.addEventListener('pointerup', release);
      n.g.addEventListener('pointercancel', release);

      // Hovering a node pulls its neighbourhood forward.
      const near = touches[id] || [];
      n.g.addEventListener('mouseenter', function () { light(id, near); });
      n.g.addEventListener('mouseleave', dim);
    });

    function light(id, near) {
      svg.classList.add('is-tracing');
      const linked = {};
      linked[id] = true;
      near.forEach(function (i) { linked[EDGES[i].from] = true; linked[EDGES[i].to] = true; });
      svg.querySelectorAll('[data-edge]').forEach(function (n) {
        n.classList.toggle('is-lit', near.indexOf(Number(n.getAttribute('data-edge'))) !== -1);
      });
      svg.querySelectorAll('[data-node]').forEach(function (n) {
        n.classList.toggle('is-lit', !!linked[n.getAttribute('data-node')]);
      });
    }
    function dim() {
      svg.classList.remove('is-tracing');
      svg.querySelectorAll('.is-lit').forEach(function (n) { n.classList.remove('is-lit'); });
    }

    // ── Start ───────────────────────────────────────────────
    // Reduced motion: solve the layout without showing the work, then
    // render it once. Dragging still runs, because that is the reader's
    // own doing rather than something moving at them.
    if (prefersReduced()) {
      for (let i = 0; i < 600; i++) step(ids);
      render(null);
      return;
    }

    render(0);

    const start = function () {
      if (t0) return;
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    };

    if (!('IntersectionObserver' in window)) { start(); return; }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.disconnect();
        start();
      });
    }, { threshold: 0.25 });
    io.observe(svg);
    // If the observer never fires, the graph must still appear.
    setTimeout(start, 2500);
  }

  const mount = document.querySelector('[data-graph-canvas]');
  if (mount) buildGraph(mount);

  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ── 2. The name decodes itself ────────────────────────── */

  const NOISE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const HOLD = 160;      // ms of pure noise before anything resolves
  const STAGGER = 70;    // ms between one letter landing and the next
  const SETTLE = 420;    // ms each letter spends unresolved
  const SWAP = 45;       // ms between glyph swaps — mechanical, not smooth

  function pick(pool) {
    return pool[(Math.random() * pool.length) | 0];
  }

  // Width of every candidate letter, measured in the real display face
  // at the real size by probing inside the heading itself.
  function measureNoise(host) {
    const probe = document.createElement('span');
    probe.className = 'ch';
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.width = 'auto';
    host.appendChild(probe);
    const out = [];
    NOISE.split('').forEach(function (ch) {
      probe.textContent = ch;
      out.push({ ch: ch, w: probe.getBoundingClientRect().width });
    });
    host.removeChild(probe);
    return out;
  }

  // The letters closest in width to the slot they have to sit in.
  function nearestWidths(widths, target) {
    const close = widths.filter(function (x) {
      return Math.abs(x.w - target) <= target * 0.12;
    });
    if (close.length >= 5) return close.map(function (x) { return x.ch; });
    // Nothing near enough (a very narrow letter like "i"): take the
    // closest handful rather than widening into glyphs that would spill.
    return widths.slice().sort(function (a, b) {
      return Math.abs(a.w - target) - Math.abs(b.w - target);
    }).slice(0, 8).map(function (x) { return x.ch; });
  }

  function scrambleName() {
    const host = document.querySelector('[data-scramble]');
    if (!host) return;

    // Split into per-character spans, keeping the real letters in place
    // so they can be measured before any scrambling starts.
    const cells = [];
    host.querySelectorAll('.line').forEach(function (line) {
      const text = line.textContent.trim();
      line.textContent = '';
      text.split('').forEach(function (ch) {
        const span = document.createElement('span');
        span.className = 'ch';
        span.textContent = ch;
        line.appendChild(span);
        if (ch.trim()) cells.push({ el: span, final: ch });
      });
    });

    if (prefersReduced() || !cells.length) return;

    // Wait for the real face: measuring against a fallback font would
    // lock every letter to the wrong width.
    const start = function () {
      const widths = measureNoise(host);

      cells.forEach(function (c) {
        const w = c.el.getBoundingClientRect().width;
        c.el.style.width = w + 'px';
        // Each slot only ever swaps among letters about as wide as the
        // one it will become. Picking freely lets an M land in an i's
        // slot and collide with its neighbours.
        c.pool = nearestWidths(widths, w);
        c.el.textContent = pick(c.pool);
        c.el.classList.add('is-noise');
        c.done = false;
      });

      cells.forEach(function (c, i) { c.lockAt = HOLD + i * STAGGER + SETTLE; });
      const total = HOLD + (cells.length - 1) * STAGGER + SETTLE;
      const t0 = performance.now();
      let last = -SWAP;

      const frame = function (now) {
        const t = now - t0;
        if (t - last >= SWAP) {
          last = t;
          cells.forEach(function (c) {
            if (c.done) return;
            if (t >= c.lockAt) {
              c.el.textContent = c.final;
              c.el.classList.remove('is-noise');
              c.done = true;
            } else {
              c.el.textContent = pick(c.pool);
            }
          });
        }
        if (t < total + SWAP) {
          requestAnimationFrame(frame);
        } else {
          // Never leave a letter stuck as noise.
          cells.forEach(function (c) {
            c.el.textContent = c.final;
            c.el.classList.remove('is-noise');
          });
        }
      };
      requestAnimationFrame(frame);
    };

    // The scramble has to measure in the real display face — widths in
    // the fallback font would be wrong. But waiting on fonts unbounded
    // means a slow network shows the name correctly and THEN scrambles
    // it seconds later, which just looks broken. Wait briefly; past that,
    // skip the effect and leave the name alone.
    let ran = false;
    const go = function (scramble) {
      if (ran) return;
      ran = true;
      if (scramble) start();
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { go(true); });
      setTimeout(function () { go(false); }, 900);
    } else {
      go(true);
    }
  }

  scrambleName();

  /* ── 3. Parallax ───────────────────────────────────────── */

  function parallax() {
    if (prefersReduced()) return;
    const hero = document.querySelector('.hero');
    const layers = [];
    document.querySelectorAll('[data-parallax]').forEach(function (el) {
      layers.push({ el: el, speed: parseFloat(el.getAttribute('data-parallax')) || 0 });
    });
    if (!hero || !layers.length) return;

    let ticking = false;
    const apply = function () {
      ticking = false;
      const y = window.scrollY;
      const h = hero.offsetHeight || 1;
      // Past the hero this is off-screen; moving it is wasted work.
      if (y > h) return;
      // One layer. Giving each line its own rate looks like depth for
      // about 200px and then the lines converge and overlap, because
      // they share a column — the gap between them shrinks by the
      // difference in rates. The hero drifts as a block and fades out
      // before it can reach anything below it.
      const fade = Math.max(0, 1 - y / (h * 0.62));
      layers.forEach(function (l) {
        l.el.style.transform = 'translate3d(0,' + (y * l.speed).toFixed(1) + 'px,0)';
        l.el.style.opacity = fade.toFixed(3);
      });
    };

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    }, { passive: true });
    apply();
  }

  parallax();

  /* ── 4. Mono labels decode; the tally counts up ─────────── */

  // Every label that decodes is monospace, so glyphs are interchangeable
  // and nothing reflows — none of the width work the name needs.
  const MONO_NOISE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/';

  function decode(el) {
    const finalText = el.textContent.trim();
    const n = finalText.length;
    let step = 0;
    const id = setInterval(function () {
      step++;
      let out = '';
      for (let i = 0; i < n; i++) {
        const c = finalText.charAt(i);
        if (c === ' ') { out += ' '; continue; }
        // Resolves left to right, two characters behind the leading edge.
        out += (i < step - 2) ? c : MONO_NOISE[(Math.random() * MONO_NOISE.length) | 0];
      }
      el.textContent = out;
      if (step - 2 >= n) {
        clearInterval(id);
        el.textContent = finalText;
      }
    }, 45);
  }

  // The repo count comes from GitHub so it can't go stale. If the call
  // fails, is rate-limited, or is blocked, the number already in the
  // markup stands and nobody sees a difference.
  const GH_USER = 'The007Programmer';
  let livePromise = null;

  function liveRepos() {
    if (livePromise) return livePromise;
    livePromise = fetch('https://api.github.com/users/' + GH_USER)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return d && typeof d.public_repos === 'number' ? d.public_repos : null; })
      .catch(function () { return null; });
    return livePromise;
  }

  function countUp(el) {
    const dp = parseInt(el.getAttribute('data-decimals') || '0', 10);

    if (el.getAttribute('data-live') === 'repos') {
      // Give the network a moment, then count to whatever we have.
      const timeout = new Promise(function (res) { setTimeout(function () { res(null); }, 1200); });
      Promise.race([liveRepos(), timeout]).then(function (n) {
        runCount(el, n === null ? parseFloat(el.getAttribute('data-count')) : n, dp);
      });
      return;
    }
    runCount(el, parseFloat(el.getAttribute('data-count')), dp);
  }

  function runCount(el, target, dp) {
    if (isNaN(target)) return;
    const dur = 1100;
    const t0 = performance.now();
    const frame = function (now) {
      const p = Math.min(1, (now - t0) / dur);
      // Ease out: fast off the line, then settles onto the number.
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(dp);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target.toFixed(dp);
    };
    requestAnimationFrame(frame);
  }

  function onReveal(selector, run) {
    const nodes = document.querySelectorAll(selector);
    if (!nodes.length) return;
    if (prefersReduced() || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        run(entry.target);
      });
    }, { threshold: 0.6 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  onReveal('[data-decode]', decode);
  onReveal('[data-count]', countUp);

  /* ── 5. Topbar ─────────────────────────────────────────── */

  const topbar = document.querySelector('.topbar');
  if (topbar) {
    const onScroll = function () {
      topbar.classList.toggle('is-stuck', window.scrollY > 90);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 6. Reveals ────────────────────────────────────────── */

  const targets = document.querySelectorAll(
    '.section-head, .feature, .card, .oss-item, .ledger-row, .kit-group, .contact-pitch, .form'
  );

  if (!prefersReduced() && 'IntersectionObserver' in window) {
    targets.forEach(function (t, i) {
      t.setAttribute('data-reveal', '');
      t.style.transitionDelay = (i % 6) * 45 + 'ms';
    });

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (t) { io.observe(t); });
  }
})();
