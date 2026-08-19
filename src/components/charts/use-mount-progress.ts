"use client";

import {
  animate,
  type AnimationPlaybackControls,
  type MotionValue,
  type Transition,
  useMotionValue,
} from "motion/react";
import { useEffect, useRef } from "react";
import { DEFAULT_CHART_ENTER_TRANSITION } from "./animation";

// `animate`'s numeric-MotionValue overload takes an options param typed
// against motion-dom's internal Transition — a distinct (structurally
// near-identical) type from the `Transition` re-exported by motion/react
// used everywhere else in this codebase. TS overload resolution can't
// reconcile the two and falls through to an unrelated object-animation
// overload, so this call is made through an explicitly narrowed signature
// instead of fighting that mismatch at the call site.
const animateNumberValue = animate as (
  value: MotionValue<number>,
  keyframes: number,
  options?: Record<string, unknown>
) => AnimationPlaybackControls;

/** Drives 0→1 enter progress using the studio motion transition (spring or tween). */
export function useMountProgress(
  enterTransition: Transition | undefined,
  delaySeconds: number,
  replayKey: number | string
) {
  const progress = useMotionValue(0);
  const transitionRef = useRef(enterTransition);
  transitionRef.current = enterTransition;

  // replayKey intentionally retriggers enter when motion settings change
  // biome-ignore lint/correctness/useExhaustiveDependencies: replayKey
  useEffect(() => {
    progress.set(0);
    const controls = animateNumberValue(progress, 1, {
      ...(transitionRef.current ?? DEFAULT_CHART_ENTER_TRANSITION),
      delay: delaySeconds,
    });
    return () => controls.stop();
  }, [delaySeconds, replayKey, progress]);

  return progress;
}
