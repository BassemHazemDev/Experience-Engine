import React, {
  createContext,
  useContext,
  useMemo,
} from "react";
import { useSyncExternalStore } from "react";
import type { ExperienceEngine } from "@experience-engine/core";
import { createExperienceStore, type ExperienceStore } from "./store";

const EngineContext = createContext<ExperienceEngine<any, any, any> | null>(null);
const StoreContext = createContext<ExperienceStore | null>(null);

export interface ExperienceProviderProps {
  engine: ExperienceEngine<any, any, any>;
  children?: React.ReactNode;
}

export function ExperienceProvider({
  engine,
  children,
}: ExperienceProviderProps) {
  const store = useMemo(() => createExperienceStore(engine), [engine]);

  return React.createElement(
    EngineContext.Provider,
    { value: engine },
    React.createElement(
      StoreContext.Provider,
      { value: store },
      children,
    ),
  );
}

export function useExperienceEngine<
  C extends string = string,
  T extends string = string,
  M extends string = string,
>(): ExperienceEngine<C, T, M> {
  const engine = useContext(EngineContext);
  if (!engine) {
    throw new Error(
      "useExperienceEngine must be used inside ExperienceProvider.",
    );
  }
  return engine as ExperienceEngine<C, T, M>;
}

export function useExperience() {
  const store = useContext(StoreContext);

  if (!store) {
    throw new Error("useExperience must be used inside ExperienceProvider.");
  }

  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const engine = useExperienceEngine();

  return {
    experience: snapshot,
    setExperience: engine.setExperience.bind(engine),
    setCulture: engine.setCulture.bind(engine),
    setTheme: engine.setTheme.bind(engine),
    setMotion: engine.setMotion.bind(engine),
    preload: engine.preload.bind(engine),
  };
}

export function useCulture() {
  return useExperience().experience?.request.culture;
}

export function useTheme() {
  return useExperience().experience?.request.theme;
}

export function useMotion() {
  return useExperience().experience?.request.motion;
}

export function useDirection() {
  return useExperience().experience?.direction;
}
