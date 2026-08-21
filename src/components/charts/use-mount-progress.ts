"use client";

import { animate, type Transition, useMotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import { clipRevealTransition, probeTransition } from "./animation";
import { springOptionsFromTransition } from "./motion-utils";

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
    // Built as a concrete literal per arm rather than spread from the
    // `Transition` union. Spreading the union produces a type matching no
    // single arm, which sends TypeScript to `animate`'s object-target overload
    // and reports the nonsense error that `1` has no properties in common with
    // an animation target.
    const base = transitionRef.current;
    const controls =
      probeTransition(base, "type") === "spring"
        ? animate(progress, 1, {
            type: "spring",
            ...springOptionsFromTransition(base),
            delay: delaySeconds,
          })
        : animate(progress, 1, {
            ...clipRevealTransition(base),
            delay: delaySeconds,
          });
    return () => controls.stop();
  }, [delaySeconds, replayKey, progress]);

  return progress;
}
