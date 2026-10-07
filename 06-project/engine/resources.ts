import type { ResourceReference } from "@experience-engine/core";

export type ResourceKind = ResourceReference["kind"];
export type ResourceState = "idle" | "preparing" | "ready" | "failed";

export interface ResourceActivity {
  readonly key: string;
  readonly kind: ResourceKind;
  readonly id: string;
  readonly state: ResourceState;
  /** How many times the engine actually invoked the loader (cache hits do not count). */
  readonly loads: number;
  /** Wall-clock duration of the last load in this browser. */
  readonly lastLoadMs?: number;
  readonly error?: string;
}

const isBrowser = typeof window !== "undefined";

// Browser-only instrumentation. On the server these stay empty so nothing about
// one request can be observed by another.
const activity = new Map<string, ResourceActivity>();
const listeners = new Set<() => void>();
const faults = new Set<ResourceKind>();
let simulatedLatencyMs = 0;
let snapshot: readonly ResourceActivity[] = [];
const EMPTY_ACTIVITY: readonly ResourceActivity[] = [];
const EMPTY_CONTROLS = { faults: [] as readonly ResourceKind[], latencyMs: 0 };
let controlSnapshot = EMPTY_CONTROLS;

function emit() {
  snapshot = [...activity.values()];
  controlSnapshot = { faults: [...faults], latencyMs: simulatedLatencyMs };
  for (const listener of listeners) listener();
}

function update(key: string, patch: Partial<ResourceActivity>) {
  if (!isBrowser) return;
  const current = activity.get(key);
  if (!current) return;
  activity.set(key, { ...current, ...patch });
  emit();
}

export const activityKey = (resource: Pick<ResourceReference, "kind" | "id">) => `${resource.kind}:${resource.id}`;

export const resourceActivity = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot: () => snapshot,
  getServerSnapshot: () => EMPTY_ACTIVITY,
  getControls: () => controlSnapshot,
  getServerControls: () => EMPTY_CONTROLS,
};

/** Makes the next real load of this resource kind reject inside the engine. */
export function setFault(kind: ResourceKind, enabled: boolean) {
  if (enabled) faults.add(kind);
  else faults.delete(kind);
  emit();
}

export function clearFaults() {
  faults.clear();
  emit();
}

/** Adds an artificial delay to every resource load. Always labelled as simulated in the UI. */
export function setSimulatedLatency(ms: number) {
  simulatedLatencyMs = ms;
  emit();
}

/**
 * Wraps a loader so the UI can observe what the engine's ResourceManager does
 * with it. The engine still owns caching, de-duplication and failure handling.
 */
export function resource(kind: ResourceKind, id: string, loader: () => Promise<unknown>): ResourceReference {
  const key = activityKey({ kind, id });
  if (isBrowser && !activity.has(key)) {
    activity.set(key, { key, kind, id, state: "idle", loads: 0 });
    snapshot = [...activity.values()];
  }

  return {
    kind,
    id,
    version: "1",
    load: async () => {
      const started = isBrowser ? performance.now() : 0;
      update(key, { state: "preparing", error: undefined, loads: (activity.get(key)?.loads ?? 0) + 1 });
      try {
        if (isBrowser && simulatedLatencyMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, simulatedLatencyMs));
        }
        if (isBrowser && faults.has(kind)) {
          throw new Error(`Injected ${kind} failure`);
        }
        const value = await loader();
        update(key, { state: "ready", lastLoadMs: performance.now() - started });
        return value;
      } catch (error) {
        update(key, { state: "failed", error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
    },
  };
}

/** Loads a web font through the CSS Font Loading API. A no-op on the server. */
export function loadFont(cssVariable: string, sample: string) {
  return async () => {
    if (!isBrowser || !document.fonts?.load) return { font: cssVariable, loaded: false };
    const family = getComputedStyle(document.documentElement).getPropertyValue(cssVariable).trim();
    if (!family) return { font: cssVariable, loaded: false };
    await document.fonts.load(`500 16px ${family}`, sample);
    return { font: cssVariable, loaded: true };
  };
}

/** Fetches and decodes an image so it can paint in the same frame as the commit. */
export function loadImage(src: string) {
  return async () => {
    if (!isBrowser || typeof Image === "undefined") return { src, decoded: false };
    const image = new Image();
    image.src = src;
    if (typeof image.decode !== "function") return { src, decoded: false };
    await image.decode();
    return { src, decoded: true };
  };
}
