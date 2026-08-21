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
