# Features

Each section says what the feature shows and where its data comes from.

## Site header

- **Navigation** to every route.
- **Engine status**: `Starting` until the engine has committed its first experience, `Preparing` while any request is in flight, otherwise `Ready`. If the first `init()` cannot load its resources it shows `Could not start` with a Retry button. Status is shown as text and a shape, not colour alone.
- **Research mode** switch. Remembered in `localStorage`.
- **Studio interface toggle** between dark and light. This changes the Studio's chrome only, never the previewed application.
- **GitHub** button, disabled, because there is no public repository URL.

## Landing page (`/`)

The hero contains a live preview and one button that switches between `en-US · light · instant` and `ar-EG · luxury · smooth` through the engine. Below it, a readout shows the number of changed keys, prepared dependency nodes and added resources from the engine's transaction for that switch.

The rest of the page explains the three dimensions and the six protocol steps and links to the other routes.

## Studio (`/studio`)

### Layout

| Width | Layout |
|---|---|
| Desktop | Controls on the left, preview in the centre, inspector along the bottom, Research panel on the right when enabled |
| Tablet (≤ 1100 px) | Narrower controls column; the inspector can be collapsed; Research panel is hidden |
| Mobile (≤ 820 px) | Preview first; a bottom dock opens Controls, Inspector and Research as modal sheets |

The sheets are native `<dialog>` elements, so focus trapping and Escape are handled by the browser.

### Controls

- **Presets**: one click, one request. Hovering or focusing a preset calls `engine.preload()` for it.
- **Culture, Theme, Motion**: three radio groups, each marked with its dimension colour.
- **Request preview**: the exact `engine.setExperience({...})` call for the current selection.
- **Apply experience**: sends the selection. Disabled when the selection equals the committed experience.
- **Apply as soon as I choose** (on by default): sends the request on every selection. When off, a selection only preloads and you press Apply.

The controls follow the engine: if anything else commits an experience, the selection updates to match.

### Preview

Nova Commerce: top bar with brand, search, notifications and account; navigation; hero with two actions; four KPI cards; revenue chart; activity list; recent orders; store status. A bar above it shows the committed triplet and `dir`.

### Transition Inspector

Appears after the first transition. The header shows the previous and target triplets and the outcome.

**Pipeline strip.** Eight stages with a value from the engine's transaction under each:

| Stage | Value shown |
|---|---|
| Normalize | 1 request |
| Resolve | target experience id |
| Diff | number of changed keys |
| Seeds | number of seed nodes (`seedNodes()`) |
| Closure | number of affected nodes |
| Prepare | number of resources, or "a resource failed" |
| Transition | resolved motion strategy |
| Commit | guarded, discarded by guard, or current kept |

Two labels sit above the strip and are styled differently on purpose: **Result** (solid outline) for the values, which are read from the engine's transaction, and **Visual replay** (dashed outline) for the staggered entrance animation, which is not live stage timing. Each stage also carries a mark: completed, failed, skipped or pending.

**Delta tab.** Five panels, each marked changed or unchanged, with old and new values:

| Panel | Content | Source |
|---|---|---|
| Culture | culture, locale, direction, typography and formatting keys | `transaction.delta.culture` |
| Theme | theme, density, and every changed visual token with colour swatches | `transaction.delta.theme` and `.tokens`; density from the theme registry |
| Motion | motion, strategy, duration, easing | `transaction.delta.motion` and the two snapshots |
| Components | each adaptable component before and after, e.g. `OrdersTable (base) → OrdersList (replacement)`, with the selecting token | the core `ComponentResolver`, run on both snapshots |
| Resources | per type: added, retained, or no longer needed | `transaction.delta.resources` |

Below the panels, an expandable list holds every changed key exactly as the engine reports it, including the `token:component.*` keys.

**Dependencies tab.** The graph the engine builds for the transition, grouped by dimension into properties, resources and tokens. Nodes in the closure are filled; untouched nodes are outlined; seeds have a ring. A count states how many of the graph's nodes were prepared. Source: the core's `createDependencyGraph()`, `seedNodes()` and `transaction.affected`. The "Experience" root is added for orientation and is labelled as such.

**Resources tab.** A summary line comes first: one chip per resource type with its state, and a sentence saying how many resources the experience needs, how many are new for this transition, and whether they were all ready before the commit. Then one row per resource of the target experience: type, id, whether it was added or retained by this transition, state, how many times the loader has actually run, and the last load time. Resources no longer needed are listed below. Controls: added latency (simulated) and "Clear resource cache", which calls `engine.resources.clear()`.

Resource states:

| State | Meaning |
|---|---|
| Idle | Not involved yet |
| Needed | Part of a request that is still preparing |
| Preparing | Loader is running |
| Ready | Loaded; the request did not commit |
| Committed | Loaded and part of the committed experience |
| Failed | Loader rejected; the current experience was kept |

**Commit tab.** The outcome with a plain explanation, the engine's request id, target id, error code if any, and the time spent in `setExperience()`. A log lists every request this session; selecting one loads it into the inspector.

### Research mode

A panel of raw state read from the engine: experience id, previous id, lifecycle status (`engine.inspect().status`), direction and locale, resolved motion and the motion actually shown on this device, component adaptation results, resource and cache counts, registry sizes, the last request's outcome and duration, and expandable JSON for the request, the snapshot's delta, tokens, typography and formatting.

## Playground (`/playground`)

A sticky preview and a tally of committed, stale, failed and in-flight requests sit beside three labs.

### Rapid transition test

Sends five requests without awaiting any of them. Each row shows the engine's request id and outcome. Expected result: the first four are stale, the fifth commits, and the committed experience equals the last request.

### Break the transition

Four switches: translation, font, asset, component code. Choose a target and press **Attempt transition**.

What happens:

1. The lab invalidates the engine's cached copies of the affected resource kinds for that target, because a cached resource is never loaded again.
2. It sends the request.
3. The loader throws, the engine rejects with `RESOURCE_LOAD_FAILED`, and the commit never runs.
4. The result shows Current → Preparing → Failed → Current experience preserved, with the ids before and after.

**Fix the fault and retry** clears the switches and resends the same request, which then commits. A note appears if the chosen target has no resource of a switched kind (only Minimal loads component code).

This is the engine's real failure path. Nothing in it is mocked.

### Ask for something that is not registered

Sends a request with an unknown theme, culture or motion. The engine rejects during resolution with `UNKNOWN_THEME`, `UNKNOWN_CULTURE` or `UNKNOWN_MOTION`, and the committed experience is unchanged.

## Personalized SSR (`/personalized`)

See [Personalized SSR](./personalized-ssr.md).

## Architecture (`/architecture`)

- **Layers**: five selectable layers with the responsibility of each and the relevant call.
- **Eight stages**: selectable stages, each with what it does, the function in the core that implements it, and its value in your most recent transition.
- **How components adapt**: the token, variant and replacement depths with the current state for the committed experience.
- **Where the orchestration lives**: the concerns an application coordinates by hand next to the single engine call. The manual code is an illustrative sketch and is labelled so. The section states that this is a structural comparison, not a performance one.

## Benchmark (`/benchmark`)

| Section | Label | Source |
|---|---|---|
| Position statement | Quoted from the paper | `02-paper/main_author.tex` |
| React 18 end-to-end, three samples | Measured locally, stored result | `04-evidence/phase-92-runtime-validation/phase-92-runtime-validation.json` |
| Next.js client runtime, three samples | Measured locally, stored result | same file |
| Locality, heterogeneous consequences, rapid requests | Synthetic workload | `02-paper/main_author.tex` |
| Take your own readings | Measured in this browser, one run each | runs now, on throwaway engines |

The in-browser runner times `setExperience()` for five scenarios: cold, cached, preloaded, RTL and rapid. It uses separate engine instances so the site's committed experience is not disturbed.

## Evidence (`/evidence`)

Eleven gates, each with a status badge (`PASS`, `PASS_WITH_SCOPE`, `PENDING`), the result, its scope, and the file it comes from. A second list shows what is `NOT CLAIMED`. A third lists the limits of the Studio itself. All content is in `lib/evidence.ts`.

## Accessibility

- Native controls throughout: radio inputs, buttons, selects, `<dialog>`.
- Visible focus rings in both the Studio and the preview.
- Inspector tabs use the ARIA tab pattern with arrow-key movement.
- Status is never colour alone: outcomes, gates, order statuses and resource states each have a text label and a distinct mark or shape.
- `lang` is set on Arabic labels and on the preview root.
- Reduced-motion preference is respected in both the Studio chrome and the preview.
