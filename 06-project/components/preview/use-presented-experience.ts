"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { MotionDefinition, ResolvedExperience } from "@experience-engine/core";

export interface EffectiveMotion {
  readonly strategy: NonNullable<MotionDefinition["defaultStrategy"]>;
  readonly durationMs: number;
  readonly easing: string;
  /** True when the visitor's OS preference shortened what the motion definition asked for. */
  readonly clampedByPreference: boolean;
}

const REDUCED_MAX_MS = 140;

/**
 * Presentation only: turns the resolved motion definition into what this
 * device will actually play. The engine request is never altered.
 */
export function effectiveMotion(motion: MotionDefinition, prefersReduced: boolean): EffectiveMotion {
  const strategy = motion.defaultStrategy ?? "instant";
  const durationMs = motion.durationMs ?? 0;
  const easing = motion.easing ?? "ease";
  if (prefersReduced && strategy !== "instant") {
    return { strategy: "css", durationMs: Math.min(durationMs, REDUCED_MAX_MS), easing: "linear", clampedByPreference: true };
  }
  return { strategy, durationMs, easing, clampedByPreference: false };
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return reduced;
}

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void>; ready: Promise<void> };
};

/**
 * Applies each newly committed experience to the screen using its own motion
 * definition. The engine has already committed; this only decides how the
 * change is shown.
 */
export function usePresentedExperience(experience: ResolvedExperience) {
  const [presented, setPresented] = useState(experience);
  const prefersReduced = usePrefersReducedMotion();
  const latest = useRef(experience);
  latest.current = experience;

  useEffect(() => {
    if (experience === presented) return;
    const motion = effectiveMotion(experience.motion, prefersReduced);
    const doc = document as ViewTransitionDocument;

    const canAnimate = "startViewTransition" in document && document.visibilityState === "visible";
    if (experience.id !== presented.id && motion.strategy === "view-transition" && canAnimate) {
      const root = document.documentElement;
      root.style.setProperty("--xp-vt-ms", `${motion.durationMs}ms`);
      root.style.setProperty("--xp-vt-ease", motion.easing);
      // The browser may skip the animation (hidden tab, a newer transition). The
      // update itself still runs, so a skipped animation is not an error.
      const transition = doc.startViewTransition!(() => flushSync(() => setPresented(experience)));
      // If it skipped the update too, show the newest committed experience anyway.
      const settle = () => setPresented(latest.current);
      transition.ready.catch(() => undefined);
      transition.finished.then(settle, settle);
      // A tab that stops rendering (backgrounded mid-transition) never runs the
      // update callback, so do not let the screen depend on it.
      window.setTimeout(settle, motion.durationMs + 400);
      return;
    }
    setPresented(experience);
  }, [experience, presented, prefersReduced]);

  return { presented, motion: effectiveMotion(presented.motion, prefersReduced) };
}
