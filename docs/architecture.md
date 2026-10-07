# Architecture

```text
Application            renders from the resolved snapshot; sends complete requests
      ↓
Framework adapter      @experience-engine/react: provider and hooks
      ↓
Core runtime           ExperienceEngine → ExperienceRuntime: the transition protocol
      ↓
Resolver               request → immutable resolved experience
      ↓
Registry               culture, theme and motion definitions
```

Each layer talks only to the one below it.

## Application

Declares the experiences it supports and renders from `ResolvedExperience`: tokens, direction, locale, formatting, typography, motion. It does not keep its own culture, theme or motion state. To change anything it sends a complete request, `{ culture, theme, motion }`.

## Framework adapter

`@experience-engine/react` connects the engine to React through `useSyncExternalStore`.

```text
runtime commits
      ↓
engine.subscribe listeners run
      ↓
adapter store replaces its snapshot
      ↓
React re-renders the components that read it
```

The store holds one engine subscription no matter how many components use the hooks, and releases it when the last one unmounts. Reading the snapshot never changes it. There are no timers.

There is no Next.js adapter package. A Server Component uses the core directly; client components use the React adapter. See [ssr.md](./ssr.md).

## Core runtime

`ExperienceEngine` is the public object. It owns three registries, a `ResourceManager`, and an `ExperienceRuntime`.

`ExperienceRuntime` runs the protocol and owns the single committed experience. Its only state change that matters is one assignment at the end of a successful transition. Everything before that works on a proposed target and leaves the committed snapshot alone.

The core has no framework dependency and does not touch browser globals, which is why the same code runs in Node for server rendering.

## Resolver

`resolveExperience(request, registries, previous?)` turns a request into a `ResolvedExperience`:

- follows `extends` chains for cultures and themes (cycle detection, depth limit of 16)
- merges theme tokens, with the more specific theme winning
- collects resources from the culture and the theme
- looks up the motion definition
- deep-freezes the result

It is synchronous and has no side effects. The React hydration pattern relies on that.

## Registry

`Registry<T>` is a map from id to definition with duplicate detection. Definitions are cloned and frozen when the engine is constructed, so changing your definition objects afterwards has no effect.

## The three dimensions

| Dimension | Owns | Does not own |
|---|---|---|
| **Culture** | Locale, direction, typography, formatting, translations, fonts | Colours, spacing, animation |
| **Theme** | Tokens, density, component adaptation, visual assets | Language, direction |
| **Motion** | Transition strategy, duration, easing | Anything about what is shown |

They are independent: changing only the culture produces a delta with no token keys, and changing only the motion prepares nothing but the motion node. Keeping them independent is the application's job as much as the engine's; do not read the culture id to pick a colour.

## Repository map

| Path | Role |
|---|---|
| `01-runtime/packages/core/src/engine.ts` | `ExperienceEngine` |
| `01-runtime/packages/core/src/runtime/runtime.ts` | `ExperienceRuntime`: transactions, stale guard, commit, subscription |
| `01-runtime/packages/core/src/resolver/resolver.ts` | Resolution and inheritance |
| `01-runtime/packages/core/src/protocol/etp.ts` | Typed delta, dependency graph, seeds, closure |
| `01-runtime/packages/core/src/resources/resource-manager.ts` | Loading, caching, de-duplication |
| `01-runtime/packages/core/src/components/component-resolver.ts` | Variant and replacement lookup |
| `01-runtime/packages/react/src/` | Provider, hooks, store |
| `06-project/` | The Studio; its own architecture notes are in `06-project/docs/architecture.md` |
