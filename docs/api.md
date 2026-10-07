# API reference

What the two packages export at version 0.1.0. The API is experimental and may change.

## `@experience-engine/core`

### `ExperienceEngine`

```ts
new ExperienceEngine<C extends string, T extends string, M extends string>(config: {
  cultures: Record<C, CultureDefinition>;
  themes: Record<T, ThemeDefinition>;
  motions?: Record<M, MotionDefinition>;
  initial?: ExperienceRequest<C, T, M>;
})
```

There is no `createExperienceEngine` factory; construct the class.

| Member | Description |
|---|---|
| `init(): Promise<ResolvedExperience>` | Commits `config.initial`. Throws if no initial request was given. |
| `setExperience(request): Promise<ResolvedExperience>` | Runs a transition to a complete request. Resolves with the committed experience. Rejects with `ExperienceEngineError`; the committed experience is then unchanged. |
| `setCulture(id)`, `setTheme(id)`, `setMotion(id)` | `setExperience` with the other two dimensions taken from the committed experience. Throw if the engine is not initialised. |
| `getExperience(): ResolvedExperience \| undefined` | The committed experience. `undefined` before the first commit. |
| `preload(request): Promise<void>` | Loads the request's resources without changing the experience. |
| `subscribe(listener): () => void` | Calls `listener(experience)` after each commit. Never called for stale or failed transitions. Returns an unsubscribe function. A listener that throws does not affect the commit. |
| `inspect()` | `{ status, committed, registries: { cultures, themes, motions }, cachedResources }`. For debugging and tooling. |
| `cultures`, `themes`, `motions` | The three `Registry` instances. |
| `resources` | The `ResourceManager`. |
| `runtime` | The `ExperienceRuntime`. Exposes `getStatus()`, `getCommitted()`, `getLastTransaction()`. |

### Requests and results

```ts
interface ExperienceRequest<C, T, M> {
  culture: C;
  theme: T;
  motion?: M; // defaults to "instant"
}

interface ResolvedExperience {
  id: string; // "<culture>::<theme>::<motion>"
  request: Required<ExperienceRequest>;
  locale: string;
  direction: "ltr" | "rtl";
  tokens: Record<string, string | number>;
  formatting: Record<string, unknown>;
  typography: Record<string, unknown>;
  resources: ResourceReference[];
  motion: MotionDefinition;
  delta?: ExperienceDelta; // { cultureChanged, themeChanged, motionChanged, changedKeys }
}
```

Resolved experiences are deeply frozen.

### Definitions

`CultureDefinition`, `ThemeDefinition`, `MotionDefinition`, `ResourceReference`. See [cultures-and-themes.md](./cultures-and-themes.md) and [resources-and-motion.md](./resources-and-motion.md).

### Errors

```ts
class ExperienceEngineError extends Error {
  code: ExperienceErrorCode;
  cause?: unknown;
  details?: Record<string, unknown>;
}
```

| Code | When |
|---|---|
| `INVALID_REQUEST` | The request has no culture or no theme |
| `UNKNOWN_CULTURE`, `UNKNOWN_THEME`, `UNKNOWN_MOTION` | An id is not registered |
| `INHERITANCE_CYCLE`, `INHERITANCE_DEPTH_EXCEEDED` | A problem in an `extends` chain |
| `RESOURCE_LOAD_FAILED` | A resource's `load()` rejected. `details.key` names it |
| `TRANSITION_STALE` | A newer request superseded this one |
| `TRANSITION_FAILED` | Any other failure during a transition |
| `INVALID_DEFINITION` | Reserved; not raised in 0.1.0 |

### `resolveExperience`

```ts
resolveExperience(request, registries, previous?): ResolvedExperience
```

Synchronous, side-effect free. `registries` is anything with `cultures`, `themes` and `motions` registries, so an engine can be passed directly. Does not load resources. Used for the first client render when hydrating; see [ssr.md](./ssr.md).

`resolveCulture(id, registries)` and `resolveTheme(id, registries)` resolve one definition with inheritance applied.

### `ComponentResolver`

```ts
new ComponentResolver(definitions: Record<string, { variants?: Record<string, string>; replacements?: Record<string, string> }>)

resolver.resolve(component, context?: { variant?: string; replacement?: string }): ComponentResolution
// { mode: "base", component } | { mode: "variant", component, variant } | { mode: "replacement", component }
```

See [component-adaptation.md](./component-adaptation.md).

### `ResourceManager`

Available as `engine.resources`.

| Member | Description |
|---|---|
| `load(resource)` | Loads one resource, or returns the cached value |
| `preload(resources)` | Loads several in parallel |
| `invalidate(resource)` | Removes one from the cache |
| `clear()` | Empties the cache |
| `cachedCount()` | Number of cached resources |

### `Registry<T>`

`register(id, definition)`, `get(id)`, `has(id)`, `list()`. Registering the same id twice throws.

### Protocol functions and types

Exported for tooling such as the Studio's inspector. Applications do not normally call them.

| Export | Description |
|---|---|
| `diffSnapshots(previous, next)` | Builds the typed delta (`ETPExperienceDelta`) |
| `createDependencyGraph(from, to, delta)` | Builds the dependency graph for a transition |
| `seedNodes(delta, to)` | The directly affected nodes |
| `dependencyClosure(graph, seeds)` | Everything reachable from the seeds |
| `resourceKey(resource)` | `"<kind>:<id>@<version>"` |
| `TransitionTransaction` | `{ requestId, request, from, to, delta, affected, prepared, status }`, returned by `engine.runtime.getLastTransaction()` |
| `ExperienceRuntime`, `RuntimeStatus`, `CommitListener` | The runtime class and its types |

`engine.runtime` and the protocol functions are the least stable part of the API.

## `@experience-engine/react`

Peer dependency: `react >= 18`.

### `ExperienceProvider`

```tsx
<ExperienceProvider engine={engine}>{children}</ExperienceProvider>
```

Makes the engine available to the hooks below. It does not call `init()`; do that yourself.

### `useExperience()`

```ts
const { experience, setExperience, setCulture, setTheme, setMotion, preload } = useExperience();
```

`experience` is the committed `ResolvedExperience`, or `undefined` before the first commit. The component re-renders when the engine commits. The functions are the engine's methods.

### `useCulture()`, `useTheme()`, `useMotion()`, `useDirection()`

Return `experience.request.culture`, `.theme`, `.motion` and `experience.direction`. Each is `undefined` before the first commit.

### `useExperienceEngine()`

Returns the engine passed to the provider. Use it for `inspect()`, `subscribe()` or `resources`.

### `createExperienceStore(engine)`

The `useSyncExternalStore`-compatible store behind the hooks: `{ subscribe, getSnapshot, getServerSnapshot }`. Exported for building other adapters or for tests.

All hooks throw if used outside `ExperienceProvider`.
