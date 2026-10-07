"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { ExperienceEngineError, resolveExperience, type ResolvedExperience } from "@experience-engine/core";
import { ExperienceProvider, useExperience } from "@experience-engine/react";
import { createEngine, type StudioEngine } from "@/engine/create-engine";
import type { StudioRequest } from "@/engine/definitions";
import { getMessages, registerMessages, type Messages } from "@/engine/messages";
import {
  createTransitionRecorder,
  type RecorderState,
  type TransitionRecorder,
} from "@/features/transition-recorder/recorder";

interface StudioRuntime {
  readonly engine: StudioEngine;
  readonly recorder: TransitionRecorder;
  /** Resolved synchronously from the initial request; used until the engine commits. */
  readonly initial: ResolvedExperience;
  readonly hydrated: boolean;
  /** True when the first `init()` could not prepare its resources and nothing is committed yet. */
  readonly startFailed: boolean;
  readonly retryStart: () => void;
}

const RuntimeContext = createContext<StudioRuntime | null>(null);
const EMPTY: RecorderState = { records: [], pending: 0 };

export interface EngineBoundaryProps {
  readonly initialRequest: StudioRequest;
  /** Copy for the initial culture, handed over by the server so the first render needs no loading state. */
  readonly initialMessages: Messages;
  readonly children: ReactNode;
}

/**
 * Owns one client engine for everything below it. The server and the first
 * client render both read the same synchronously resolved snapshot, so the
 * HTML matches; `engine.init()` then commits it and later changes go through
 * `setExperience()`.
 */
export function EngineBoundary({ initialRequest, initialMessages, children }: EngineBoundaryProps) {
  const [runtime] = useState(() => {
    const engine = createEngine(initialRequest);
    const initial = resolveExperience(initialRequest, engine);
    registerMessages(initial.locale, initialMessages);
    return { engine, initial, recorder: createTransitionRecorder(engine) };
  });
  const [start, setStart] = useState<"starting" | "ready" | "failed">("starting");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const { engine } = runtime;
    // Any commit means the engine is running, whichever request produced it.
    const off = engine.subscribe(() => {
      if (active) setStart("ready");
    });
    engine.init().catch((error: unknown) => {
      if (!active || engine.getExperience()) return;
      // A stale init only means a newer request is already on its way.
      const stale = error instanceof ExperienceEngineError && error.code === "TRANSITION_STALE";
      if (!stale) setStart("failed");
    });
    return () => {
      active = false;
      off();
    };
  }, [runtime, attempt]);

  const retryStart = useCallback(() => {
    setStart("starting");
    setAttempt((count) => count + 1);
  }, []);

  const value = useMemo(
    () => ({ ...runtime, hydrated: start === "ready", startFailed: start === "failed", retryStart }),
    [runtime, start, retryStart],
  );

  return (
    <RuntimeContext.Provider value={value}>
      <ExperienceProvider engine={runtime.engine}>{children}</ExperienceProvider>
    </RuntimeContext.Provider>
  );
}

export function useStudioRuntime(): StudioRuntime {
  const runtime = useContext(RuntimeContext);
  if (!runtime) throw new Error("useStudioRuntime must be used inside EngineBoundary.");
  return runtime;
}

/** The committed experience, or the server-resolved one before the first commit. */
export function useResolvedExperience(): ResolvedExperience {
  const { initial } = useStudioRuntime();
  return useExperience().experience ?? initial;
}

export function useCurrentRequest(): StudioRequest {
  return useResolvedExperience().request as StudioRequest;
}

/** The single way the Studio changes experience: one complete request to the engine. */
export function useTransition() {
  return useStudioRuntime().recorder.transition;
}

export function useTransitionLog(): RecorderState {
  const { recorder } = useStudioRuntime();
  return useSyncExternalStore(recorder.subscribe, recorder.getState, () => EMPTY);
}

export function useMessages(experience: ResolvedExperience): Messages {
  const messages = getMessages(experience.locale);
  if (!messages) {
    // Unreachable when transitions go through the engine: the translation
    // resource is prepared before the culture is committed.
    throw new Error(`Messages for ${experience.locale} were not prepared before commit.`);
  }
  return messages;
}

export type EngineStatus = "starting" | "preparing" | "ready" | "failed";

export function useEngineStatus(): EngineStatus {
  const { hydrated, startFailed } = useStudioRuntime();
  const { pending } = useTransitionLog();
  if (startFailed) return "failed";
  if (!hydrated) return "starting";
  return pending > 0 ? "preparing" : "ready";
}
