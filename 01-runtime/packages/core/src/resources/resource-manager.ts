import { ExperienceEngineError } from "../errors/index";
import type { ResourceReference } from "../types/index";

export class ResourceManager {
  private readonly cache = new Map<string, unknown>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  private key(resource: ResourceReference): string {
    return `${resource.kind}:${resource.id}:${resource.version ?? "0"}`;
  }

  async load(resource: ResourceReference): Promise<unknown> {
    const key = this.key(resource);

    if (this.cache.has(key)) return this.cache.get(key);

    const pending = this.inFlight.get(key);
    if (pending) return pending;

    const task = (async () => {
      try {
        const value = resource.load ? await resource.load() : undefined;
        this.cache.set(key, value);
        return value;
      } catch (cause) {
        throw new ExperienceEngineError(
          "RESOURCE_LOAD_FAILED",
          `Failed to load resource ${key}`,
          { cause, details: { key } },
        );
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, task);
    return task;
  }

  async preload(resources: readonly ResourceReference[]): Promise<void> {
    await Promise.all(resources.map((resource) => this.load(resource)));
  }

  invalidate(resource: ResourceReference): void {
    this.cache.delete(this.key(resource));
  }

  clear(): void {
    this.cache.clear();
  }

  cachedCount(): number {
    return this.cache.size;
  }
}
