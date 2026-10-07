# The Experience Transition Protocol

Every call to `engine.setExperience(request)` runs the same eight stages.

```text
Normalize → Resolve → Diff → Seeds → Closure → Prepare → Transition → Commit
```

## Stages

| Stage | What happens | In the core |
|---|---|---|
| **Normalize** | The request is validated. A missing motion defaults to `"instant"`. | `resolveExperience` |
| **Resolve** | The request becomes an immutable target snapshot: locale, direction, tokens, formatting, typography, resources, motion. | `resolveCulture`, `resolveTheme` |
| **Diff** | Current and target snapshots are compared into a typed delta, one section per dimension, plus tokens and resources. | `diffSnapshots` |
| **Seeds** | The graph nodes the delta touches directly are selected. | `seedNodes` |
| **Closure** | Dependency edges are followed from the seeds to find everything affected. | `dependencyClosure` |
| **Prepare** | The target's resources load together. Loaded resources are cached; concurrent loads of the same resource are shared. | `ResourceManager.preload` |
| **Transition** | The runtime marks itself as transitioning. How the change looks is left to the adapter or application. | `ExperienceRuntime` |
| **Commit** | If this is still the latest request, the committed snapshot is replaced in one assignment and subscribers are told. | `ExperienceRuntime.setExperience` |

## The typed delta

```ts
const tx = engine.runtime.getLastTransaction();

tx.delta.culture;   // { request?, locale?, direction?, formattingKeys, typographyKeys }
tx.delta.theme;     // { request?, tokenKeys, componentKeys }
tx.delta.motion;    // { request?, strategy? }
tx.delta.tokens;    // { changed: { [key]: { from, to } } }
tx.delta.resources; // { added, removed, retained }
tx.delta.changedKeys; // e.g. ["culture", "locale", "direction", "token:surface", ...]
```

A dimension that did not change has no `request` entry. The resolved experience also carries a compact summary as `experience.delta`.

## The dependency graph

For each transition the engine builds a small graph of the target experience:

```text
culture:<id> ── direction:<dir>, locale:<locale>, translation and font resources
theme:<id>   ── token:<key> …, asset and code resources
motion:<id>
```

`tx.affected` is the closure: the nodes reachable from the seeds. A motion-only change has a closure of one node. A culture-only change leaves every token node out.

## Invariants

These hold for every transition. They are what the Studio's playground and the test suite exercise.

- **Immutable snapshots.** A resolved experience is deeply frozen. Nothing can change it after resolution.
- **Deterministic identity.** The same request always resolves to the same id, `<culture>::<theme>::<motion>`.
- **Prepare before commit.** Nothing becomes visible until every resource of the target has loaded.
- **Failure preservation.** If resolution or preparation fails, the commit does not run and the committed experience is untouched. `setExperience()` rejects with `RESOURCE_LOAD_FAILED`, `UNKNOWN_CULTURE`, `UNKNOWN_THEME`, `UNKNOWN_MOTION` or `TRANSITION_FAILED`. Failed loads are not cached, so a retry can succeed.
- **Stale dominance.** If a newer request arrives while an older one is preparing, the older one rejects with `TRANSITION_STALE` and never commits. Of any burst of requests, only the last can become visible.
- **Atomic visibility.** The committed snapshot changes in a single assignment. Observers see the old experience or the new one, never a mixture.
- **Commit-only notification.** `engine.subscribe()` listeners run after a commit and never for a stale or failed request. A listener that throws cannot fail or undo the commit.

None of these are unique to this protocol. A carefully written manual controller can provide the same guarantees; the research baseline in this repository does exactly that. What the protocol gives you is one reusable place where they are implemented.

## What the protocol leaves to you

- **Playing the motion.** The engine resolves `motion.defaultStrategy` and `durationMs`. Animating is the application's job.
- **Mapping components.** `ComponentResolver` returns a component name. Your code maps names to components.
- **Stage events.** Only commits are observable through `subscribe`. Intermediate stages can be read after the fact from `engine.runtime.getLastTransaction()`.

## See it

The Studio's Transition Inspector shows all of this for each change you make: [`06-project`](../06-project).
