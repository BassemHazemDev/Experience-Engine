export interface CacheEntry<T> {
  readonly version: string;
  readonly value: T;
}

export class VersionedCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  get(key: string, version: string): T | undefined {
    const entry = this.entries.get(key);
    return entry?.version === version ? entry.value : undefined;
  }

  set(key: string, version: string, value: T): void {
    this.entries.set(key, { version, value });
  }

  invalidate(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  size(): number {
    return this.entries.size;
  }
}
