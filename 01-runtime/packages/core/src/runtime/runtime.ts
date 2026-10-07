import { ExperienceEngineError } from "../errors/index";
import { ResourceManager } from "../resources/resource-manager";
import { resolveExperience, type ResolverRegistries } from "../resolver/resolver";
import type { ExperienceRequest, ResolvedExperience } from "../types/index";
import {
  createDependencyGraph,
  dependencyClosure,
  diffSnapshots,
  seedNodes,
  type PreparedExperience,
  type TransitionStatus,
  type TransitionTransaction,
} from "../protocol/etp";

export type RuntimeStatus =
  | "IDLE"
  | "PREPARING"
  | "READY"
  | "TRANSITIONING"
  | "COMMITTED"
  | "FAILED";

export interface RuntimeOptions {
  readonly onStatusChange?: (status: RuntimeStatus) => void;
  readonly transitionDelayMs?: number;
}

export type CommitListener = (experience: ResolvedExperience) => void;

export class ExperienceRuntime {
  private status: RuntimeStatus = "IDLE";
  private committed?: ResolvedExperience;
  private sequence = 0;
  private lastTransaction?: TransitionTransaction;
  private readonly commitListeners = new Set<CommitListener>();

  constructor(
    private readonly registries: ResolverRegistries,
    private readonly resources: ResourceManager,
    private readonly options: RuntimeOptions = {},
  ) {}

  getStatus(): RuntimeStatus {
    return this.status;
  }

  getCommitted(): ResolvedExperience | undefined {
    return this.committed;
  }

  getLastTransaction(): TransitionTransaction | undefined {
    return this.lastTransaction;
  }

  /**
   * Registers a listener that runs after an experience has been committed.
   * It never fires for stale or failed transitions. Returns an unsubscribe.
   */
  subscribe(listener: CommitListener): () => void {
    this.commitListeners.add(listener);
    return () => {
      this.commitListeners.delete(listener);
    };
  }

  private notifyCommitted(experience: ResolvedExperience): void {
    for (const listener of [...this.commitListeners]) {
      try {
        listener(experience);
      } catch {
        // The commit has already happened; an observer cannot undo or fail it.
      }
    }
  }

  private setStatus(status: RuntimeStatus): void {
    this.status = status;
    this.options.onStatusChange?.(status);
  }

  async preload(request: ExperienceRequest): Promise<void> {
    const resolved = resolveExperience(request, this.registries, this.committed);
    await this.resources.preload(resolved.resources);
  }

  async setExperience(request: ExperienceRequest): Promise<ResolvedExperience> {
    const requestId = ++this.sequence;
    const previous = this.committed;
    this.setStatus("PREPARING");

    try {
      const target = resolveExperience(request, this.registries, previous);
      const delta = diffSnapshots(previous, target);
      const graph = createDependencyGraph(previous, target, delta);
      const seeds = seedNodes(delta, target);
      const affected = dependencyClosure(graph, seeds);

      const prepared: PreparedExperience = {
        from: previous,
        to: target,
        delta,
        affected,
        resources: target.resources,
      };

      this.lastTransaction = {
        requestId,
        request,
        from: previous,
        to: target,
        delta,
        affected,
        prepared,
        status: "PREPARING" satisfies TransitionStatus,
      };

      await this.resources.preload(target.resources);

      if (requestId !== this.sequence) {
        this.lastTransaction = { ...this.lastTransaction, status: "STALE" };
        throw new ExperienceEngineError("TRANSITION_STALE", "A newer experience transition superseded this one.");
      }

      this.setStatus("READY");
      this.lastTransaction = { ...this.lastTransaction, status: "READY" };
      this.setStatus("TRANSITIONING");
      this.lastTransaction = { ...this.lastTransaction, status: "TRANSITIONING" };

      if (this.options.transitionDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, this.options.transitionDelayMs));
      }

      if (requestId !== this.sequence) {
        this.lastTransaction = { ...this.lastTransaction, status: "STALE" };
        throw new ExperienceEngineError("TRANSITION_STALE", "A newer experience transition superseded this one.");
      }

      // The only authoritative state mutation is this atomic assignment.
      this.committed = target;
      this.lastTransaction = { ...this.lastTransaction, status: "COMMITTED" };
      this.setStatus("COMMITTED");
      this.notifyCommitted(target);
      return target;
    } catch (error) {
      if (error instanceof ExperienceEngineError && error.code === "TRANSITION_STALE") {
        this.setStatus(previous ? "COMMITTED" : "IDLE");
        throw error;
      }

      if (this.lastTransaction?.requestId === requestId) {
        this.lastTransaction = { ...this.lastTransaction, status: "FAILED" };
      }
      this.setStatus("FAILED");
      this.setStatus(previous ? "COMMITTED" : "IDLE");

      if (error instanceof ExperienceEngineError) throw error;
      throw new ExperienceEngineError("TRANSITION_FAILED", "Experience transition failed.", { cause: error });
    }
  }
}
