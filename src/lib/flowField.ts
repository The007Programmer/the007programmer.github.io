/**
 * Pointer steering for the hero flow field.
 *
 * The maths lives here rather than inside the canvas effect because it is the
 * only part of the field with a right and a wrong answer — angle blending wraps
 * at ±π, and getting that wrong sends a particle the long way round the circle,
 * which reads on screen as a stream flicking backwards. Kept pure so it can be
 * asserted; the component owns the rAF loop and the DOM.
 */

/**
 * Signed angular distance from `from` to `to`, wrapped into (-π, π].
 * Blending raw radians is what makes a stream take the 300° route instead of
 * the 60° one.
 */
export function shortestArc(from: number, to: number): number {
  const d = to - from
  return Math.atan2(Math.sin(d), Math.cos(d))
}

/**
 * Pointer influence at an offset, on a smooth inverse-square falloff:
 * 1 directly under the pointer, 0.5 at `radius`, tending to 0 far away.
 * It never reaches exactly 0, which is deliberate — the far field still leans
 * very slightly, so the whole surface feels attached to the cursor rather than
 * only a disc of it.
 */
export function proximity(dx: number, dy: number, radius: number): number {
  const r2 = radius * radius
  return r2 / (dx * dx + dy * dy + r2)
}

/**
 * Bend a field angle toward the pointer.
 *
 * `swirl` offsets the target from "straight at the pointer": pure attraction
 * funnels every trail into one point and the field goes dead there, so the
 * target is rotated off-axis to turn the pull into an orbit.
 *
 * `pull` is expected in [0, 1]; combined with the proximity weight it can only
 * ever close a fraction of the gap, so the result never overshoots the target.
 */
export function steer(
  angle: number,
  dx: number,
  dy: number,
  radius: number,
  pull: number,
  swirl: number
): number {
  if (pull <= 0) return angle
  const target = Math.atan2(dy, dx) + swirl
  return angle + shortestArc(angle, target) * proximity(dx, dy, radius) * pull
}

/**
 * Smooth organic 2D noise as an angle, via a multi-octave trigonometric series.
 * Evolves continuously with `t`.
 *
 * Lifted out of the FlowField component so the seam strips between sections can
 * run the same field: the point of the seams is that the hero's weather leaks
 * through the joins, and it only reads that way if it is literally the same
 * function, sampled in the same units.
 */
export function fieldAngle(x: number, y: number, t: number): number {
  const s = 0.0025
  return (
    // The first four octaves are all at or below the base frequency, whose
    // period is about 2500px. Across a laptop viewport that is barely half a
    // wavelength, so at full amplitude they agreed with each other nearly
    // everywhere and the field resolved into two enormous streams pointing the
    // same way. Their weight is pulled back and three higher-frequency terms
    // added on top, at angles that are not multiples of each other — that gives
    // several coherent groups per screen instead of one or two, each free to
    // point somewhere different, without breaking the grouping into noise.
    Math.sin(x * s + t * 0.0007) * Math.PI * 0.7 +
    Math.cos(y * s + t * 0.0005) * Math.PI * 0.7 +
    Math.sin((x + y) * s * 0.6 + t * 0.0009) * Math.PI * 0.5 +
    Math.cos((x - y) * s * 0.4 + t * 0.0006) * Math.PI * 0.35 +
    Math.sin((x * 1.7 - y * 2.6) * s + t * 0.0011) * Math.PI * 0.55 +
    Math.cos((x * 3.1 + y * 1.4) * s + t * 0.0013) * Math.PI * 0.45 +
    Math.sin((x * 2.2 + y * 3.4) * s + t * 0.0017) * Math.PI * 0.3
  )
}

/** A click shockwave: where it started and how many frames ago. */
export interface Pulse {
  x: number
  y: number
  age: number
}

export interface PulseShape {
  /** Pixels the ring expands per frame. */
  speed: number
  /** Half-thickness of the ring, in pixels. Only particles inside it are moved. */
  width: number
  /** Frames the shockwave lives for. */
  life: number
  /** Peak outward displacement, in pixels per frame, on the ring itself. */
  power: number
}

/**
 * Outward push a shockwave applies to a particle at `dist` from its origin.
 *
 * A ring, not a disc. Pushing everything inside a growing circle just inflates a
 * hole and leaves it there; confining the force to a travelling band means the
 * field closes back up behind the wave, which is what makes it read as a pulse
 * rather than as damage. Zero outside the band and after the life, so a dead
 * pulse costs one comparison and can be dropped.
 */
export function pulseForce(dist: number, age: number, s: PulseShape): number {
  if (age >= s.life) return 0
  const band = 1 - Math.abs(dist - age * s.speed) / s.width
  if (band <= 0) return 0
  return s.power * band * (1 - age / s.life)
}
