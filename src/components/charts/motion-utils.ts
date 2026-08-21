import type { Transition } from "motion/react";
import { DEFAULT_CHART_ENTER_TRANSITION, probeTransition } from "./animation";

export function transitionWithDelay(
  transition: Transition | undefined,
  delaySeconds: number,
  fallback: Transition = DEFAULT_CHART_ENTER_TRANSITION
): Transition {
  const base = transition ?? fallback;
  return { ...base, delay: delaySeconds };
}

export interface SpringOptions {
  stiffness: number;
  damping: number;
  mass?: number;
}

export function springOptionsFromTransition(
  transition?: Transition,
  fallback: SpringOptions = { stiffness: 60, damping: 20 }
): SpringOptions {
  if (!transition) {
    return fallback;
  }
  // Read through probeTransition rather than off the narrowed value: the
  // discriminated union does not carry spring fields on the arm the compiler
  // picks, even under this guard. See ChartTween in animation.ts.
  if (probeTransition(transition, "type") === "spring") {
    const rawBounce = probeTransition(transition, "bounce");
    const bounce = typeof rawBounce === "number" ? rawBounce : undefined;
    const rawStiffness = probeTransition(transition, "stiffness");
    const baseStiffness =
      typeof rawStiffness === "number" ? rawStiffness : fallback.stiffness;
    const rawDamping = probeTransition(transition, "damping");
    const baseDamping =
      typeof rawDamping === "number" ? rawDamping : fallback.damping;
    const rawMass = probeTransition(transition, "mass");
    return {
      stiffness:
        bounce == null
          ? baseStiffness
          : Math.min(400, Math.max(80, baseStiffness * (1 + bounce * 0.35))),
      damping:
        bounce == null
          ? baseDamping
          : Math.max(8, baseDamping * (1 - bounce * 0.25)),
      mass: typeof rawMass === "number" ? rawMass : fallback.mass,
    };
  }
  const duration =
    "duration" in transition && typeof transition.duration === "number"
      ? transition.duration
      : 0.8;
  return {
    stiffness: Math.min(500, Math.max(40, 280 / duration)),
    damping: Math.min(40, Math.max(12, 18 + duration * 4)),
  };
}
