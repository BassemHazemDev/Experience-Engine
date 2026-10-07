import type { ExperienceEngine, ResolvedExperience } from "@experience-engine/core";

export type ExperienceListener = () => void;

export interface ExperienceStore {
  getSnapshot(): ResolvedExperience | undefined;
  getServerSnapshot(): ResolvedExperience | undefined;
  subscribe(listener: ExperienceListener): () => void;
}

/**
 * Bridges the engine to React’s external-store contract.
 *
 * The snapshot only changes at two boundaries: when the engine reports a
 * commit, and when the first subscriber attaches (to catch up on anything
 * committed while nobody was listening). `getSnapshot` is a pure read, so one
 * component reading it can never hide a change from another.
 */
export function createExperienceStore(
  engine: Pick<ExperienceEngine<string, string, string>, "getExperience" | "subscribe">,
): ExperienceStore {
  const listeners = new Set<ExperienceListener>();
  let snapshot = engine.getExperience();
  let detach: (() => void) | undefined;

  const onCommit = (experience: ResolvedExperience) => {
    snapshot = experience;
    for (const listener of [...listeners]) listener();
  };

  const getSnapshot = () => snapshot;

  return {
    getSnapshot,
    getServerSnapshot: getSnapshot,

    subscribe(listener) {
      if (listeners.size === 0) {
        detach = engine.subscribe(onCommit);
        // React re-reads the snapshot right after subscribing, so a commit
        // that landed before this point is picked up without a notification.
        snapshot = engine.getExperience();
      }
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          detach?.();
          detach = undefined;
        }
      };
    },
  };
}
