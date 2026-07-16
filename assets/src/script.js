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
  // outlined (the things those jobs caused).
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
    const box = measure(from);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    if (dx === 0 && dy === 0) return { x: from.x, y: from.y };
    const sx = dx === 0 ? Infinity : (box.w / 2) / Math.abs(dx);
    const sy = dy === 0 ? Infinity : (box.h / 2) / Math.abs(dy);
    const s = Math.min(sx, sy);
    return { x: from.x + dx * s, y: from.y + dy * s };
  }

  // How many causal hops each node sits from a root. This drives the
  // build order, so the animation replays the actual chain instead of an
  // arbitrary stagger.
  function depths() {
    const d = {};
    const incoming = {};
    Object.keys(NODES).forEach(function (id) { incoming[id] = 0; });
    EDGES.forEach(function (e) { incoming[e.to]++; });

    let frontier = Object.keys(NODES).filter(function (id) { return !incoming[id]; });
    frontier.forEach(function (id) { d[id] = 0; });

    // The graph is small and acyclic; this settles in a few passes.
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

  const STEP = 300;      // ms between one causal hop and the next
  const NODE_IN = 380;   // a node settles before its edges leave it
  const DRAW = 550;      // how long an edge takes to reach its target

  function buildGraph(mount) {
    const svg = el('svg', {
      viewBox: VIEW_X + ' ' + VIEW_Y + ' ' + VIEW_W + ' ' + VIEW_H,
      class: 'g-svg',
      'aria-hidden': 'true',
      focusable: 'false'
    });

    const defs = el('defs');
    const marker = el('marker', {
      id: 'g-arrow',
      viewBox: '0 0 8 8',
      refX: '7',
      refY: '4',
      markerWidth: '7',
      markerHeight: '7',
      orient: 'auto-start-reverse'
    });
    marker.appendChild(el('path', {
      d: 'M0.5,1 L7,4 L0.5,7',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.4',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    const edgeLayer = el('g');
    const nodeLayer = el('g');
    const touches = {};
    const depth = depths();
    let settles = 0;   // when the last thing in the sequence lands

    EDGES.forEach(function (edge, i) {
      const a = NODES[edge.from];
      const b = NODES[edge.to];
      const start = trim(a, b);
      const end = trim(b, a);

      // An edge leaves only once its source node has settled.
      const delay = depth[edge.from] * STEP + NODE_IN;
      const length = Math.hypot(end.x - start.x, end.y - start.y);
      settles = Math.max(settles, delay + DRAW);

      const line = el('line', {
        class: 'g-edge' + (edge.soft ? ' g-edge-soft' : ''),
        x1: start.x, y1: start.y, x2: end.x, y2: end.y,
        'marker-end': 'url(#g-arrow)',
        'data-edge': i
      });
      line.style.setProperty('--draw', length.toFixed(1));
      line.style.setProperty('--delay', delay + 'ms');
      edgeLayer.appendChild(line);

      // Label at the midpoint, over a patch of the field colour so the
      // line doesn't strike through the words.
      const mx = (start.x + end.x) / 2;
      const my = (start.y + end.y) / 2;
      const w = edge.label.length * EDGE_ADV;

      // The label lands with the line that carries it.
      const labelDelay = delay + DRAW * 0.5 + 'ms';

      const patch = el('rect', {
        class: 'g-edge-patch',
        x: mx - w / 2 - 5,
        y: my - 6.5,
        width: w + 10,
        height: 13,
        'data-edge': i
      });
      patch.style.setProperty('--delay', labelDelay);
      edgeLayer.appendChild(patch);

      const text = el('text', {
        class: 'g-edge-label',
        x: mx, y: my + 3,
        'text-anchor': 'middle',
        'data-edge': i
      });
      text.textContent = edge.label;
      text.style.setProperty('--delay', labelDelay);
      edgeLayer.appendChild(text);

      (touches[edge.from] = touches[edge.from] || []).push(i);
      (touches[edge.to] = touches[edge.to] || []).push(i);
    });

    Object.keys(NODES).forEach(function (id) {
      const node = NODES[id];
      const box = measure(node);
      const g = el('g', { class: 'g-node', 'data-kind': node.kind, 'data-node': id });
      g.style.setProperty('--delay', depth[id] * STEP + 'ms');
      settles = Math.max(settles, depth[id] * STEP + NODE_IN);

      g.appendChild(el('rect', {
        class: 'g-node-box',
        x: node.x - box.w / 2,
        y: node.y - box.h / 2,
        width: box.w,
        height: box.h,
        rx: 2
      }));

      const label = el('text', {
        class: 'g-node-label',
        x: node.x, y: node.y - 1,
        'text-anchor': 'middle'
      });
      label.textContent = node.label;
      g.appendChild(label);

      const sub = el('text', {
        class: 'g-node-sub',
        x: node.x, y: node.y + 11,
        'text-anchor': 'middle'
      });
      sub.textContent = node.sub;
      g.appendChild(sub);

      const near = touches[id] || [];
      g.addEventListener('mouseenter', function () { light(id, near); });
      g.addEventListener('mouseleave', dim);

      nodeLayer.appendChild(g);
    });

    svg.appendChild(edgeLayer);
    svg.appendChild(nodeLayer);

    // Hovering a node pulls its neighbourhood forward and pushes the
    // rest back — tracing one thought through the graph.
    function light(id, near) {
      svg.classList.add('is-tracing');
      const linked = {};
      linked[id] = true;
      near.forEach(function (i) {
        linked[EDGES[i].from] = true;
        linked[EDGES[i].to] = true;
      });
      svg.querySelectorAll('[data-edge]').forEach(function (n) {
        n.classList.toggle('is-lit', near.indexOf(Number(n.getAttribute('data-edge'))) !== -1);
      });
      svg.querySelectorAll('[data-node]').forEach(function (n) {
        n.classList.toggle('is-lit', !!linked[n.getAttribute('data-node')]);
      });
    }

    function dim() {
      svg.classList.remove('is-tracing');
      svg.querySelectorAll('.is-lit').forEach(function (n) {
        n.classList.remove('is-lit');
      });
    }

    mount.insertBefore(svg, mount.firstChild);

    // Anyone who asked for less motion gets the finished graph, not a
    // performance of it.
    if (prefersReduced()) {
      svg.setAttribute('data-build', 'done');
      return;
    }

    svg.setAttribute('data-build', 'pending');

    let started = false;
    const run = function () {
      if (started) return;
      started = true;
      svg.setAttribute('data-build', 'running');
      // Reveal each arrowhead only once its line has actually arrived.
      svg.querySelectorAll('.g-edge').forEach(function (line) {
        const at = parseFloat(line.style.getPropertyValue('--delay')) + DRAW;
        setTimeout(function () { line.classList.add('is-drawn'); }, at);
      });
      // Once everything has landed, drop the build state so hover and
      // tracing take over cleanly.
      setTimeout(function () { svg.setAttribute('data-build', 'done'); }, settles + 400);
    };

    if (!('IntersectionObserver' in window)) { run(); return; }

    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.disconnect();
        run();
      });
    }, { threshold: 0.25 });
    io.observe(svg);

    // "pending" holds the graph at opacity 0, so anything that stops the
    // observer from firing would hide it for good. The graph matters more
    // than its entrance: if nothing has started it shortly after load,
    // play it anyway.
    setTimeout(run, 2500);
  }

  function prefersReduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  const mount = document.querySelector('[data-graph-canvas]');
  if (mount) buildGraph(mount);

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

  function countUp(el) {
    const target = parseFloat(el.getAttribute('data-count'));
    const dp = parseInt(el.getAttribute('data-decimals') || '0', 10);
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
