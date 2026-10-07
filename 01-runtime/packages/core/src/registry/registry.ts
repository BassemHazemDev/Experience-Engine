export class Registry<T extends object> {
  private readonly entries = new Map<string, T>();

  register(id: string, definition: T): void {
    if (!id) throw new Error("Registry id cannot be empty.");
    if (this.entries.has(id)) {
      throw new Error(`Duplicate registry entry: ${id}`);
    }
    this.entries.set(id, definition);
  }

  get(id: string): T | undefined {
    return this.entries.get(id);
  }

  has(id: string): boolean {
    return this.entries.has(id);
  }

  list(): readonly string[] {
    return [...this.entries.keys()];
  }
}
