import { ExperienceEngineError, type TransitionTransaction } from "@experience-engine/core";
import type { StudioEngine } from "@/engine/create-engine";
import type { StudioRequest } from "@/engine/definitions";

export type TransitionOutcome = "pending" | "committed" | "stale" | "failed";

export interface TransitionRecord {
  /** Order in which this Studio session issued the request. */
  readonly seq: number;
  /** The engine's own request id, when the request got far enough to open a transaction. */
  readonly requestId?: number;
  readonly request: StudioRequest;
  readonly fromId?: string;
  readonly outcome: TransitionOutcome;
  readonly errorCode?: string;
  readonly errorMessage?: string;
  /** Wall-clock time around `setExperience()` in this browser. Not a research measurement. */
  readonly durationMs?: number;
  /** The engine's transaction: typed delta, dependency closure, prepared resources. */
  readonly transaction?: TransitionTransaction;
}

export interface RecorderState {
  readonly records: readonly TransitionRecord[];
  readonly pending: number;
}

const HISTORY_LIMIT = 40;

/**
 * The engine reports commits, not individual stages, so the Studio records
 * what it can observe around the one call that matters:
 * `engine.setExperience(request)`.
 */
export function createTransitionRecorder(engine: StudioEngine) {
  let seq = 0;
  let state: RecorderState = { records: [], pending: 0 };
  const listeners = new Set<() => void>();

  const set = (next: RecorderState) => {
    state = next;
    for (const listener of listeners) listener();
  };

  const patch = (target: number, change: Partial<TransitionRecord>, settled: boolean) => {
    set({
      records: state.records.map((record) => (record.seq === target ? { ...record, ...change } : record)),
      pending: state.pending - (settled ? 1 : 0),
    });
  };

  async function transition(input: StudioRequest): Promise<TransitionRecord> {
    // A fresh object per call, so the transaction can be matched by identity.
    const request: StudioRequest = { ...input };
    const id = ++seq;
    const started = performance.now();
    const fromId = engine.getExperience()?.id;

    const promise = engine.setExperience(request);

    // The runtime opens its transaction synchronously, before the first await.
    const opened = engine.runtime.getLastTransaction();
    const transaction = opened?.request === request ? opened : undefined;

    const record: TransitionRecord = {
      seq: id,
      request,
      fromId,
      outcome: "pending",
      requestId: transaction?.requestId,
      transaction,
    };
    set({ records: [...state.records, record].slice(-HISTORY_LIMIT), pending: state.pending + 1 });

    let change: Partial<TransitionRecord>;
    try {
      await promise;
      change = { outcome: "committed" };
    } catch (error) {
      const code = error instanceof ExperienceEngineError ? error.code : "UNEXPECTED";
      change = {
        outcome: code === "TRANSITION_STALE" ? "stale" : "failed",
        errorCode: code,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
    change = {
      ...change,
      durationMs: performance.now() - started,
      transaction: transaction && { ...transaction, status: toStatus(change.outcome!) },
    };
    patch(id, change, true);
    return { ...record, ...change };
  }

  return {
    transition,
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    clear() {
      set({ records: state.records.filter((r) => r.outcome === "pending"), pending: state.pending });
    },
  };
}

function toStatus(outcome: TransitionOutcome): TransitionTransaction["status"] {
  if (outcome === "committed") return "COMMITTED";
  if (outcome === "stale") return "STALE";
  return "FAILED";
}

export type TransitionRecorder = ReturnType<typeof createTransitionRecorder>;
