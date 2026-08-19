import type { Transition } from "motion/react";

/** Default clip-reveal easing for cartesian charts. */
export const DEFAULT_ANIMATION_EASING = "cubic-bezier(0.85, 0, 0.15, 1)";

export const DEFAULT_ANIMATION_DURATION_MS = 1100;

/** Default enter transition — matches the original line chart reveal. */
export const DEFAULT_CHART_ENTER_TRANSITION: Transition = {
  type: "tween",
  duration: DEFAULT_ANIMATION_DURATION_MS / 1000,
  ease: [0.85, 0, 0.15, 1],
};

/** `DEFAULT_CHART_ENTER_TRANSITION.ease`, pulled out once since `Transition`'s
 * property-specific union (tween/spring/inertia/...) means TS can't confirm
 * an `.ease` field exists without an `in` narrowing check at each read site. */
export const DEFAULT_CHART_ENTER_EASE =
  "ease" in DEFAULT_CHART_ENTER_TRANSITION
    ? DEFAULT_CHART_ENTER_TRANSITION.ease
    : undefined;

/**
 * Clip-path width reveal must use tween — spring does not reliably animate SVG width.
 */
export function clipRevealTransition(enterTransition?: Transition): Transition {
  if (enterTransition?.type === "tween") {
    const ease =
      "ease" in enterTransition ? enterTransition.ease : undefined;
    return {
      ...enterTransition,
      ease: ease ?? DEFAULT_CHART_ENTER_EASE,
    };
  }

  const duration =
    enterTransition &&
    "duration" in enterTransition &&
    typeof enterTransition.duration === "number"
      ? enterTransition.duration
      : DEFAULT_ANIMATION_DURATION_MS / 1000;

  return {
    type: "tween",
    duration,
    ease: DEFAULT_CHART_ENTER_EASE,
  };
}
