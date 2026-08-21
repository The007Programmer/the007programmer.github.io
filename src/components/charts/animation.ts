import type { Transition } from "motion/react";

/** Default clip-reveal easing for cartesian charts. */
export const DEFAULT_ANIMATION_EASING = "cubic-bezier(0.85, 0, 0.15, 1)";

export const DEFAULT_ANIMATION_DURATION_MS = 1100;

/**
 * The tween arm of Motion's `Transition`, spelled out.
 *
 * `Transition` is a discriminated union in the version of Motion this project
 * pins, so a value annotated with it cannot have `.ease` or `.duration` read
 * back off it — not even inside a `typeof` guard, because the compiler has no
 * way to know which arm it is. These charts pass transitions around and
 * interrogate them constantly, so the ones they own are typed concretely, and
 * the ones arriving from callers are read through `probeTransition`.
 */
export interface ChartTween {
  type: "tween";
  duration: number;
  ease: [number, number, number, number];
}

/** Default enter transition — matches the original line chart reveal. */
export const DEFAULT_CHART_ENTER_TRANSITION: ChartTween = {
  type: "tween",
  duration: DEFAULT_ANIMATION_DURATION_MS / 1000,
  ease: [0.85, 0, 0.15, 1],
};

/** Read one field off a transition of unknown arm. */
export function probeTransition(
  transition: Transition | undefined,
  key: string
): unknown {
  return transition
    ? (transition as unknown as Record<string, unknown>)[key]
    : undefined;
}

function easeOf(value: unknown): [number, number, number, number] | undefined {
  return Array.isArray(value) && value.length === 4 && value.every((n) => typeof n === "number")
    ? (value as [number, number, number, number])
    : undefined;
}

/**
 * Clip-path width reveal must use tween — spring does not reliably animate SVG
 * width.
 */
export function clipRevealTransition(enterTransition?: Transition): ChartTween {
  const duration = probeTransition(enterTransition, "duration");
  return {
    type: "tween",
    duration:
      typeof duration === "number"
        ? duration
        : DEFAULT_CHART_ENTER_TRANSITION.duration,
    ease:
      easeOf(probeTransition(enterTransition, "ease")) ??
      DEFAULT_CHART_ENTER_TRANSITION.ease,
  };
}
