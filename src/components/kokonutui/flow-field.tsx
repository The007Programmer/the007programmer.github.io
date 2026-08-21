"use client";

/**
 * @name: FlowField
 * @description: Canvas particle flow field background — organic noise-driven streams of glowing light.
 * @version: 1.0.0
 * @author: @dorian_baffier
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotionGate } from "@/hooks/useReducedMotionGate";
import { fieldAngle, pulseForce, steer, type Pulse } from "@/lib/flowField";

// ─── Types ────────────────────────────────────────────────────────────────────

type ColorTheme = "aurora" | "ember" | "ocean" | "signal";
type ParticleDensity = "sparse" | "medium" | "dense";

interface Particle {
  x: number;
  y: number;
  speed: number;
  hue: number;
  life: number;
  maxLife: number;
  /** Points currently held in this particle's slice of the trail buffer. */
  trail: number;
}

interface ThemeConfig {
  hueStart: number;
  hueRange: number;
  saturation: number;
  lightness: number;
  bg: string;
  /** Points kept per trail. Its length on screen is roughly this many times the
      particle's per-frame speed. */
  trail: number;
  /** Degrees of hue drift applied from the field angle. `fieldAngle` returns
      roughly ±3π, so this is multiplied by ±1.5 — a value of 70 swings ±105°,
      which is wider than the whole visible-red band. Narrow palettes need a
      small number here or they wash out into the wrong colour entirely. */
  hueShift: number;
}

export interface FlowFieldProps {
  className?: string;
  children?: ReactNode;
  theme?: ColorTheme;
  density?: ParticleDensity;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Lower than they were. Each particle now draws a real polyline rather than one
// dot per frame, so the same count reads far denser on screen.
const PARTICLE_COUNTS: Record<ParticleDensity, number> = {
  sparse: 350,
  medium: 700,
  dense: 1500,
} as const;

/** Frames between recorded trail points. What this field costs is rasterised
    line segments, not draw calls — batching by colour cut the call count by two
    orders of magnitude and bought back nothing. Sampling every other frame
    halves the segments for the same trail length on screen; at these speeds the
    head lags the particle by about two pixels, which nobody can see. */
const SAMPLE_EVERY = 2;

/** Width of a trail stroke, CSS px. */
const LINE_W = 1.45;
/** Fraction of a trail drawn at full strength; the rest is the faded tail behind
    it. Two strokes per particle rather than one per segment — a per-segment
    gradient is the obvious way to taper and it is tens of thousands of extra
    draw calls a frame. */
const HEAD_FRACTION = 0.42;
const TAIL_ALPHA = 0.32;

// Trails are batched by colour before they are drawn. Stroking each one on its
// own is 3400 stroke calls a frame and cost about 15fps; every stroke needs its
// own strokeStyle, so the only way to cut them is to quantise the colour and
// merge every trail landing in the same bucket into one path. The quantisation
// has to be coarse enough to collapse thousands of trails into dozens of strokes
// and fine enough that nobody can see the steps.
//
// Bucketing across the whole colour circle is the obvious way to do that and it
// is wrong here: the palette straddles 0°, so with 45°-wide buckets a hue of
// 340 snapped to 337.5 and the field grew magenta streaks it has no colour for.
// The buckets span the theme's own hue range instead, which for this palette is
// about 50° — six degrees a step, and nothing to see.
const HUE_BUCKETS = 8;
const ALPHA_LEVELS = 7;
const LIGHT_LEVELS = 3;
const BUCKETS = HUE_BUCKETS * ALPHA_LEVELS * LIGHT_LEVELS;
/** Extra lightness at the crest of a click shockwave. */
const FLARE_LIGHT = 22;

// ─── Pointer steering ─────────────────────────────────────────────────────────
// The field answers to the cursor, but slowly. Every constant here is tuned for
// "the whole surface leans your way over a second or two", not "particles snap
// to the mouse" — the second thing is a toy, the first is weather.

/** Pointer influence radius, CSS px. At this distance the bend is half-strength. */
const CURSOR_RADIUS = 420;
/** Hardest bend applied, directly under the pointer — a nudge, not a capture.
    At 0.72 this built a genuine vortex: particles spiralled in, piled onto one
    ring and left the rest of the canvas visibly empty. A third of the gap curls
    the streams past the cursor and lets them carry on. */
const CURSOR_PULL = 0.32;
/** Radians the target is rotated off "straight at the pointer" (~86°). Nearly
    tangential on purpose: the inward component is what drains the field, and
    what is wanted here is a curl around the cursor, not a drain into it. */
const CURSOR_SWIRL = 1.5;
/** Per-frame easing on the pointer the field actually chases. This is the whole
    reason the shift reads as slow: the raw pointer teleports, this lags it by
    roughly half a second and arrives without a visible start. */
const CURSOR_EASE = 0.022;
/** How far the noise field slides, per pixel the pointer moves off centre.
    This is the effect that carries. Adding a flat rotation to every angle was
    the obvious way to make the whole field lean, and it wrecked the texture:
    a constant bias on a noise field turns its gentle basins into hard attractors,
    so the streams collapsed onto a few filaments and left most of the canvas
    empty. Sliding where the field is *sampled* instead translates the pattern
    without touching its structure — same weather, moved. */
const CURSOR_DRIFT = 0.4;
/** Easing on the fade-in when the pointer arrives and the fade-out when it
    leaves the window, so neither is a cut. */
const STRENGTH_EASE = 0.03;

const THEMES: Record<ColorTheme, ThemeConfig> = {
  aurora: {
    hueShift: 70,
    hueStart: 120,
    hueRange: 200,
    saturation: 90,
    lightness: 62,
    bg: "5, 5, 8",
    trail: 12,
  },
  ember: {
    hueShift: 70,
    hueStart: 0,
    hueRange: 55,
    saturation: 95,
    lightness: 58,
    bg: "8, 4, 2",
    trail: 12,
  },
  ocean: {
    hueShift: 70,
    hueStart: 180,
    hueRange: 90,
    saturation: 88,
    lightness: 60,
    bg: "2, 6, 10",
    trail: 12,
  },
  // Ours. The stock themes ground themselves in near-black; this one grounds in
  // --color-void so the hero is continuous with the rest of the page, and the
  // hue band is narrow (red through orange, no yellow) so the field reads as
  // one colour moving rather than a rainbow.
  signal: {
    // Narrow, and narrower than it looks: hueShift widens the band by ±1.5× at
    // the extremes. At 14/36 the top of the range reached hue 49, which is
    // yellow-green, and with the longer trails below it showed as an olive cast
    // over half the hero. 8/26 caps the drift at hue 30 — orange, and no
    // further.
    hueShift: 8,
    hueStart: 352,
    hueRange: 26,
    saturation: 92,
    lightness: 60,
    bg: "10, 13, 19",
    trail: 15,
  },
} as const;

// ─── Click shockwave ──────────────────────────────────────────────────────────

const PULSE = {
  /** Pixels the ring travels per frame — about a second to cross a laptop. */
  speed: 11,
  /** Half-thickness of the moving band. Wide enough that a stream gets several
      frames inside it and bends, rather than being teleported across it. */
  width: 150,
  /** Frames it lives. */
  life: 95,
  /** Peak displacement per frame, on the ring itself. Deliberately small: the
      ask was that a click nudges the field, and a shove big enough to clear a
      visible hole takes seconds to heal, which reads as breakage. */
  power: 3.4,
} as const;

/** Concurrent shockwaves kept alive. Past this the oldest is dropped, so
    hammering the mouse cannot grow the per-particle cost without bound. */
const MAX_PULSES = 4;

// ─── Main component ───────────────────────────────────────────────────────────

export default function FlowField({
  className,
  children,
  theme = "aurora",
  density = "medium",
}: FlowFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The site treats prefers-reduced-motion as a hard gate, not a softening.
  const reduced = useReducedMotionGate();

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cfg = THEMES[theme];
    const count = PARTICLE_COUNTS[density];
    const dpr = window.devicePixelRatio ?? 1;

    let width = 0;
    let height = 0;
    let animId = 0;
    let time = 0;
    let particles: Particle[] = [];
    // Flat and preallocated: one Float32Array holding every trail's points, in
    // slots of `trail * 2`. Per-particle arrays would allocate and grow 1700
    // times a frame.
    let trailBuf = new Float32Array(0);
    // Two banks — the faded tails and the bright heads — so a tail never picks
    // up a head's alpha by sharing its bucket.
    const bucketPaths: (Path2D | null)[] = new Array(BUCKETS * 2).fill(null);

    // Pointer state lives in the closure, not in React state. It changes on
    // every mousemove and every frame; none of it should re-render anything.
    let moved = false;
    let cursorX = 0;
    let cursorY = 0;
    let targetX = 0;
    let targetY = 0;
    let strength = 0;
    let targetStrength = 0;
    let pulses: Pulse[] = [];

    const spawnParticle = (): Particle => {
      const maxLife = 200 + Math.floor(Math.random() * 300);
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 1.1 + Math.random() * 1.8,
        hue: cfg.hueStart + Math.random() * cfg.hueRange,
        life: Math.floor(Math.random() * maxLife),
        maxLife,
        trail: 0,
      };
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // setTransform, not scale: scale() multiplies onto the existing matrix, so
      // every resize compounded the device-pixel-ratio and shrank the field.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // The canvas carries only the light. Its ground is the wrapper's CSS
      // background — see the fade below for why it cannot paint its own.
      ctx.clearRect(0, 0, width, height);

      // Re-seed particles spread across the canvas
      particles = Array.from({ length: count }, spawnParticle);
      trailBuf = new Float32Array(count * cfg.trail * 2);

      // Until the pointer shows up the field centres on itself. Only reset while
      // untouched — clobbering a live cursor on resize would yank the field.
      if (!moved) {
        cursorX = targetX = width / 2;
        cursorY = targetY = height / 2;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      // Canvas-local, via the live rect: the hero scrolls away under the page,
      // and once it does this correctly reports the pointer as far outside the
      // field rather than pinning it to the top edge.
      const rect = canvas.getBoundingClientRect();
      targetX = e.clientX - rect.left;
      targetY = e.clientY - rect.top;
      targetStrength = 1;
      moved = true;
    };

    // Pointer gone from the window entirely — let the field relax back to its
    // own drift instead of holding the last known position forever.
    const onPointerLeave = () => {
      targetStrength = 0;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Clicks land all over the page; only the ones inside the field mean
      // anything, and a shockwave centred a section away would ripple in from
      // an edge for no visible reason.
      if (x < 0 || y < 0 || x > width || y > height) return;
      if (pulses.length >= MAX_PULSES) pulses.shift();
      pulses.push({ x, y, age: 0 });
    };

    const render = () => {
      time++;

      // The canvas is wiped every frame and each trail is redrawn from the
      // points it actually visited.
      //
      // It used to accumulate instead, fading the previous frame by a fraction.
      // That leaves a permanent ghost of every path ever drawn: the fade is
      // multiplicative, so once a pixel is down at alpha 11 the decrement is
      // 11 * 0.042 = 0.46, which rounds to zero in an 8-bit buffer — and it
      // rounds to zero again on every frame after. The web of grey traces across
      // the hero was every stream the field had ever run, stalled just above
      // nothing and unable to finish dying. Nothing here can stall, because
      // nothing is left over.
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = LINE_W;
      // Butt caps: round ones add four rasterised discs per trail and at 1.45px
      // nobody can tell the difference.
      ctx.lineCap = "butt";
      ctx.lineJoin = "round";
      bucketPaths.fill(null);

      // Chase the pointer rather than tracking it. Done once per frame, before
      // the particle loop, so all 1200 streams agree on where the cursor is.
      cursorX += (targetX - cursorX) * CURSOR_EASE;
      cursorY += (targetY - cursorY) * CURSOR_EASE;
      strength += (targetStrength - strength) * STRENGTH_EASE;

      // Age the wavefronts and retire the dead ones before the particle loop, so
      // the inner loop never walks a pulse that can only contribute zero.
      if (pulses.length > 0) {
        for (const q of pulses) q.age++;
        pulses = pulses.filter((q) => q.age < PULSE.life);
      }

      const driftX = (cursorX - width / 2) * CURSOR_DRIFT * strength;
      const driftY = (cursorY - height / 2) * CURSOR_DRIFT * strength;
      const pull = CURSOR_PULL * strength;

      const span = cfg.trail;
      // The band the hue can actually occupy: the theme's range, widened by the
      // most the field angle can shift it either way. fieldAngle spans about
      // ±3.5π, so the drift reaches ±1.75 × hueShift.
      const hueLo = cfg.hueStart - cfg.hueShift * 1.8;
      const hueHi = cfg.hueStart + cfg.hueRange + cfg.hueShift * 1.8;
      const hueScale = HUE_BUCKETS / (hueHi - hueLo);
      for (let pi = 0; pi < particles.length; pi++) {
        const p = particles[pi];
        const base = pi * span * 2;
        const angle = steer(
          fieldAngle(p.x - driftX, p.y - driftY, time),
          cursorX - p.x,
          cursorY - p.y,
          CURSOR_RADIUS,
          pull,
          CURSOR_SWIRL
        );

        p.x += Math.cos(angle) * p.speed;
        p.y += Math.sin(angle) * p.speed;

        // Total push this frame, kept so the wavefront can also be lit. A
        // displacement of a few pixels a frame is a real effect but a subtle
        // one, and without the brightening the click mostly reads as nothing
        // happening.
        let push = 0;
        for (const q of pulses) {
          const qx = p.x - q.x;
          const qy = p.y - q.y;
          const dist = Math.hypot(qx, qy);
          const force = pulseForce(dist, q.age, PULSE);
          // dist can be 0 on a direct hit; the force is 0 there anyway (the ring
          // has left the origin by then) but guard the divide regardless.
          if (force > 0 && dist > 0) {
            p.x += (qx / dist) * force;
            p.y += (qy / dist) * force;
            push += force;
          }
        }

        p.life++;

        // Respawn aged-out particles at a random position
        if (p.life > p.maxLife) {
          p.x = Math.random() * width;
          p.y = Math.random() * height;
          p.life = 0;
          p.hue = cfg.hueStart + Math.random() * cfg.hueRange;
          // Drop the history with the position. A trail carried across a
          // respawn draws a straight line from wherever the particle died to
          // wherever it was reborn, right across the canvas.
          p.trail = 0;
          continue;
        }

        // Wrap edges. Same reasoning as respawn: the jump is not a path, so the
        // trail cannot be allowed to span it.
        let jumped = false;
        if (p.x < 0) { p.x += width; jumped = true; }
        else if (p.x > width) { p.x -= width; jumped = true; }
        if (p.y < 0) { p.y += height; jumped = true; }
        else if (p.y > height) { p.y -= height; jumped = true; }
        if (jumped) p.trail = 0;

        // Record on sample frames only; the trail is still drawn every frame,
        // from the points already stored. Oldest first, so drawing walks forward
        // and the shift costs only the two floats it drops.
        if (time % SAMPLE_EVERY === 0) {
          if (p.trail < span) {
            trailBuf[base + p.trail * 2] = p.x;
            trailBuf[base + p.trail * 2 + 1] = p.y;
            p.trail++;
          } else {
            trailBuf.copyWithin(base, base + 2, base + span * 2);
            trailBuf[base + (span - 1) * 2] = p.x;
            trailBuf[base + (span - 1) * 2 + 1] = p.y;
          }
        }
        if (p.trail < 2) continue;

        // Fade in / out over particle lifetime
        const progress = p.life / p.maxLife;
        const fadeIn = Math.min(progress * 8, 1);
        const fadeOut = Math.min((1 - progress) * 6, 1);
        const flare = Math.min(push / PULSE.power, 1);
        const alpha = Math.min(fadeIn * fadeOut * 0.85 * (1 + flare * 1.4), 1);

        // Hue shifts subtly with field direction for colour variety. Kept
        // un-wrapped so it can be bucketed on a continuous scale; the wrap to
        // 0–360 happens once, when the colour is built.
        const hueRaw = p.hue + (angle / (Math.PI * 2)) * cfg.hueShift;

        const hb = Math.min(HUE_BUCKETS - 1, Math.max(0, ((hueRaw - hueLo) * hueScale) | 0));
        const ab = Math.min(ALPHA_LEVELS - 1, (alpha * ALPHA_LEVELS) | 0);
        const lb = Math.min(LIGHT_LEVELS - 1, (flare * LIGHT_LEVELS) | 0);
        const key = (hb * ALPHA_LEVELS + ab) * LIGHT_LEVELS + lb;

        const headFrom = Math.max(0, p.trail - 1 - Math.round((p.trail - 1) * HEAD_FRACTION));

        // Tail and head overlap by one point, which is what makes the join
        // between the two strokes invisible.
        let tail = bucketPaths[key];
        if (!tail) { tail = new Path2D(); bucketPaths[key] = tail; }
        tail.moveTo(trailBuf[base], trailBuf[base + 1]);
        for (let k = 1; k <= headFrom; k++) {
          tail.lineTo(trailBuf[base + k * 2], trailBuf[base + k * 2 + 1]);
        }

        let head = bucketPaths[BUCKETS + key];
        if (!head) { head = new Path2D(); bucketPaths[BUCKETS + key] = head; }
        head.moveTo(trailBuf[base + headFrom * 2], trailBuf[base + headFrom * 2 + 1]);
        for (let k = headFrom + 1; k < p.trail; k++) {
          head.lineTo(trailBuf[base + k * 2], trailBuf[base + k * 2 + 1]);
        }
      }

      // One stroke per occupied bucket. The colour is rebuilt from the bucket
      // index, so it is the quantised value the trails were sorted by rather
      // than whichever particle happened to land there last.
      for (let key = 0; key < BUCKETS; key++) {
        const tail = bucketPaths[key];
        const head = bucketPaths[BUCKETS + key];
        if (!tail && !head) continue;

        const lb = key % LIGHT_LEVELS;
        const ab = ((key / LIGHT_LEVELS) | 0) % ALPHA_LEVELS;
        const hb = (key / (LIGHT_LEVELS * ALPHA_LEVELS)) | 0;
        // Mid-bucket, so quantising neither darkens nor brightens on average.
        const hue = ((hueLo + ((hb + 0.5) / HUE_BUCKETS) * (hueHi - hueLo)) % 360 + 360) % 360;
        const a = (ab + 0.5) / ALPHA_LEVELS;
        const light = cfg.lightness + ((lb + 0.5) / LIGHT_LEVELS) * FLARE_LIGHT;

        if (tail) {
          ctx.strokeStyle = `hsla(${hue}, ${cfg.saturation}%, ${light}%, ${a * TAIL_ALPHA})`;
          ctx.stroke(tail);
        }
        if (head) {
          ctx.strokeStyle = `hsla(${hue}, ${cfg.saturation}%, ${light}%, ${a})`;
          ctx.stroke(head);
        }
      }

      animId = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [theme, density, reduced]);

  const bgColor = THEMES[theme].bg;

  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full items-center justify-center overflow-hidden",
        className
      )}
      style={{ background: `rgb(${bgColor})` }}
    >
      <canvas
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        ref={canvasRef}
      />

      {/* Radial vignette — focuses center, dims edges */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 65% 60% at 50% 50%, transparent 20%, rgba(${bgColor}, 0.92) 100%)`,
        }}
      />

      {/* Soft top / bottom fades */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{
          background: `linear-gradient(to bottom, rgb(${bgColor}), transparent)`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64"
        style={{
          background: `linear-gradient(to top, rgb(${bgColor}), transparent)`,
        }}
      />

      {children}
    </div>
  );
}
