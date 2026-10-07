function cloneDefinition<T>(value: T): T {
  if (typeof value === "function" || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => cloneDefinition(item)) as T;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) out[key] = cloneDefinition(child);
  return out as T;
}

import type {
  CultureDefinition,
  ExperienceRequest,
  MotionDefinition,
  ResolvedExperience,
  ThemeDefinition,
} from "./types/index";
import { Registry } from "./registry/registry";
import { ResourceManager } from "./resources/resource-manager";
import { resolveExperience } from "./resolver/resolver";
import { ExperienceRuntime } from "./runtime/runtime";

export interface ExperienceEngineConfig<
  C extends string = string,
  T extends string = string,
  M extends string = string,
> {
  readonly cultures: Record<C, CultureDefinition>;
  readonly themes: Record<T, ThemeDefinition>;
  readonly motions?: Record<M, MotionDefinition>;
  readonly initial?: ExperienceRequest<C, T, M>;
}

export class ExperienceEngine<
  C extends string,
  T extends string,
  M extends string = string,
> {
  readonly cultures: Registry<CultureDefinition>;
  readonly themes: Registry<ThemeDefinition>;
  readonly motions: Registry<MotionDefinition>;
  readonly resources: ResourceManager;
  readonly runtime: ExperienceRuntime;

  constructor(private readonly config: ExperienceEngineConfig<C, T, M>) {
    this.cultures = new Registry<CultureDefinition>();
    this.themes = new Registry<ThemeDefinition>();
    this.motions = new Registry<MotionDefinition>();

    for (const [id, definition] of Object.entries(config.cultures) as [C, CultureDefinition][]) {
      this.cultures.register(id, Object.freeze(cloneDefinition(definition)));
    }
    for (const [id, definition] of Object.entries(config.themes) as [T, ThemeDefinition][]) {
      this.themes.register(id, Object.freeze(cloneDefinition(definition)));
    }
    for (const [id, definition] of Object.entries(config.motions ?? {}) as [M, MotionDefinition][]) {
      this.motions.register(id, Object.freeze(cloneDefinition(definition)));
    }

    this.resources = new ResourceManager();

    this.runtime = new ExperienceRuntime(
      {
        cultures: this.cultures,
        themes: this.themes,
        motions: this.motions,
      },
      this.resources,
    );
  }

  async init(): Promise<ResolvedExperience> {
    if (!this.config.initial) {
      throw new Error("ExperienceEngine requires an initial request.");
    }
    return this.setExperience(this.config.initial);
  }

  getExperience(): ResolvedExperience | undefined {
    return this.runtime.getCommitted();
  }

  async setExperience(
    request: ExperienceRequest<C, T, M>,
  ): Promise<ResolvedExperience> {
    return this.runtime.setExperience(request);
  }

  async setCulture(
    culture: C,
  ): Promise<ResolvedExperience> {
    const current = this.getExperience();
    if (!current) throw new Error("Engine has not been initialized.");
    return this.setExperience({
      culture,
      theme: current.request.theme as T,
      motion: current.request.motion as M,
    });
  }

  async setTheme(
    theme: T,
  ): Promise<ResolvedExperience> {
    const current = this.getExperience();
    if (!current) throw new Error("Engine has not been initialized.");
    return this.setExperience({
      culture: current.request.culture as C,
      theme,
      motion: current.request.motion as M,
    });
  }

  async setMotion(
    motion: M,
  ): Promise<ResolvedExperience> {
    const current = this.getExperience();
    if (!current) throw new Error("Engine has not been initialized.");
    return this.setExperience({
      culture: current.request.culture as C,
      theme: current.request.theme as T,
      motion,
    });
  }

  /**
   * Observes commits. The listener runs after a new experience has become the
   * committed one, and never for stale or failed transitions.
   */
  subscribe(listener: (experience: ResolvedExperience) => void): () => void {
    return this.runtime.subscribe(listener);
  }

  async preload(
    request: ExperienceRequest<C, T, M>,
  ): Promise<void> {
    return this.runtime.preload(request);
  }

  inspect() {
    return {
      status: this.runtime.getStatus(),
      committed: this.getExperience(),
      registries: {
        cultures: this.cultures.list(),
        themes: this.themes.list(),
        motions: this.motions.list(),
      },
      cachedResources: this.resources.cachedCount(),
    };
  }
}
