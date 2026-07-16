/* ============================================================
   Aahil Shaikh — portfolio
   1. The trajectory graph: my career, drawn as the directed
      graph it actually is. Layout is hand-placed, not simulated,
      so it reads the same every load.
   2. Scroll reveals.
   ============================================================ */

(function () {
  'use strict';

  /* ── 1. The graph ──────────────────────────────────────── */

  const VIEW_W = 1000;
  const VIEW_H = 460;
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

  function buildGraph(mount) {
    const svg = el('svg', {
      viewBox: '0 0 ' + VIEW_W + ' ' + VIEW_H,
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

    EDGES.forEach(function (edge, i) {
      const a = NODES[edge.from];
      const b = NODES[edge.to];
      const start = trim(a, b);
      const end = trim(b, a);

      edgeLayer.appendChild(el('line', {
        class: 'g-edge' + (edge.soft ? ' g-edge-soft' : ''),
        x1: start.x, y1: start.y, x2: end.x, y2: end.y,
        'marker-end': 'url(#g-arrow)',
        'data-edge': i
      }));

      // Label at the midpoint, over a patch of the field colour so the
      // line doesn't strike through the words.
      const mx = (start.x + end.x) / 2;
      const my = (start.y + end.y) / 2;
      const w = edge.label.length * EDGE_ADV;

      edgeLayer.appendChild(el('rect', {
        class: 'g-edge-patch',
        x: mx - w / 2 - 5,
        y: my - 6.5,
        width: w + 10,
        height: 13,
        'data-edge': i
      }));

      const text = el('text', {
        class: 'g-edge-label',
        x: mx, y: my + 3,
        'text-anchor': 'middle',
        'data-edge': i
      });
      text.textContent = edge.label;
      edgeLayer.appendChild(text);

      (touches[edge.from] = touches[edge.from] || []).push(i);
      (touches[edge.to] = touches[edge.to] || []).push(i);
    });

    Object.keys(NODES).forEach(function (id) {
      const node = NODES[id];
      const box = measure(node);
      const g = el('g', { class: 'g-node', 'data-kind': node.kind, 'data-node': id });

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
  }

  const mount = document.querySelector('[data-graph-canvas]');
  if (mount) buildGraph(mount);

  /* ── 2. Topbar ─────────────────────────────────────────── */

  const topbar = document.querySelector('.topbar');
  if (topbar) {
    const onScroll = function () {
      topbar.classList.toggle('is-stuck', window.scrollY > 90);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 3. Reveals ────────────────────────────────────────── */

  const targets = document.querySelectorAll(
    '.section-head, .feature, .card, .oss-item, .ledger-row, .kit-group, .contact-pitch, .form'
  );

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduced && 'IntersectionObserver' in window) {
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
