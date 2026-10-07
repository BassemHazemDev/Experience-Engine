# Architecture

## Layers

```text
Application            Nova Commerce preview + Studio UI        (06-project)
      ↓
Framework adapter      ExperienceProvider, useExperience        (01-runtime/packages/react)
      ↓
Engine core            ExperienceEngine, runtime, protocol      (01-runtime/packages/core)
      ↓
Resolver               resolveExperience
      ↓
Registry               culture, theme and motion definitions    (06-project/engine/definitions.ts)
```

The Studio supplies definitions and renders from snapshots. It does not hold culture, theme or motion state of its own.

## Folder layout

```text
06-project/
├── app/
│   ├── layout.tsx              root layout: fonts, Studio theme script, settings provider
│   ├── fonts.ts                next/font declarations
│   ├── globals.css             Studio tokens (--studio-*), header, primitives
│   ├── studio.css              workbench, controls, inspector, graph
│   ├── pages.css               landing, research pages, playground, personalized
│   ├── (site)/                 every route except /personalized
│   │   ├── layout.tsx          one client engine shared by these routes
│   │   ├── page.tsx            landing
│   │   └── studio/ playground/ architecture/ benchmark/ evidence/
│   └── personalized/page.tsx   dynamic Server Component with its own per-request engine
├── engine/
│   ├── definitions.ts          cultures, themes, motions, ids, labels
│   ├── create-engine.ts        createEngine(initial): always a new instance
│   ├── presets.ts              presets and the rapid-test sequence
│   ├── resources.ts            instrumented loaders, fault switches, activity store
│   ├── experience-cookie.ts    whitelist parse and serialize
│   └── messages/               en-US, ar-EG, and the runtime catalog
├── components/
│   ├── engine-boundary.tsx     client engine, provider, hooks used across the app
│   ├── preview/                Nova Commerce
│   ├── shell/                  site header, settings (Research mode, Studio theme)
│   ├── ui/                     primitives, sheet, status badge
│   ├── architecture/           interactive explorer
│   └── benchmark/              in-browser runner
├── features/
│   ├── controls/               culture, theme, motion and preset controls
│   ├── transition-recorder/    records what happens around setExperience()
│   ├── transition-inspector/   pipeline, delta, commit views
│   ├── dependency-graph/       graph view
│   ├── resource-panel/         resource table
│   ├── research-mode/          raw-state panel
│   ├── studio/                 workbench layout
│   ├── playground/             rapid, failure and unknown-request labs
│   ├── personalized/           client half of /personalized
│   └── landing/                hero demo
├── lib/
│   ├── format.ts               Intl formatters built from the resolved culture
│   └── evidence.ts             every research figure shown, with its source file
├── tests/                      Vitest suites
├── scripts/validate-ssr.mjs    raw-HTTP SSR validation
└── public/textures/            the three theme textures (asset resources)
```

## How the engine packages are linked

The repository root is an npm workspace whose members are the two engine packages, this app and the examples. `package.json` here declares the packages by path:

```json
"@experience-engine/core": "file:../01-runtime/packages/core",
"@experience-engine/react": "file:../01-runtime/packages/react"
```

npm links them into the root `node_modules`. The Studio imports their built output (`dist/`), exactly as a project installing them from npm would. `npm install` at the root builds them through the root `prepare` script; after changing a package, run `npm run build:packages`.

Settings that go with this layout:

- `next.config.ts` sets `turbopack.root` and `outputFileTracingRoot` to the repository root, because dependencies are installed there.
- `tsconfig.json` sets `preserveSymlinks: true` and `vitest.config.ts` sets `resolve.preserveSymlinks`, so the linked packages are treated as living in `node_modules`.
- The root `package.json` pins one version of React with `overrides`, so the app and the adapter share a single copy.

## The engine boundary

`components/engine-boundary.tsx` is the one place a client engine is created.

```tsx
<EngineBoundary initialRequest={request} initialMessages={messages}>
  …
</EngineBoundary>
```

On mount it:

1. Creates an engine with `createEngine(initialRequest)`.
2. Resolves the initial request synchronously with the core's `resolveExperience()`. This snapshot is what the server render and the first client render both use, so the HTML matches.
3. Registers the server-provided copy for the initial locale.
4. Creates a transition recorder for the engine.
5. In an effect, calls `engine.init()` and marks the runtime as hydrated.

It then renders the adapter's `ExperienceProvider`.

Hooks exported from this file:

| Hook | Returns |
|---|---|
| `useResolvedExperience()` | The committed snapshot, or the initial one before the first commit |
| `useCurrentRequest()` | The `{ culture, theme, motion }` of that snapshot |
| `useTransition()` | The function every control calls to change experience |
| `useTransitionLog()` | Recorded requests and the number in flight |
| `useEngineStatus()` | `starting`, `preparing` or `ready` |
| `useMessages(experience)` | The copy for the snapshot's locale |
| `useStudioRuntime()` | The engine, recorder, initial snapshot and hydrated flag |

Two boundaries exist: one in `app/(site)/layout.tsx` for all ordinary routes, so an experience composed in the Studio is still committed when you open the Playground, and one in `app/personalized/page.tsx`, which starts from the cookie.

### How React learns about a commit

```text
runtime commits            this.committed = target
      ↓
engine.subscribe listeners run
      ↓
adapter store              snapshot = committed experience
      ↓
store listeners            useSyncExternalStore re-renders each reader
```

`engine.subscribe(listener)` fires only after an experience is committed. The adapter store (`packages/react/src/store.ts`) keeps one engine subscription for all of its React subscribers. `getSnapshot()` is a pure read, `getServerSnapshot()` is provided for server rendering and hydration, and there are no timers.

### When the first `init()` fails

If the initial resources cannot be prepared, nothing is committed. The boundary then reports `startFailed`, the header shows "Engine could not start" with a Retry button, and the page keeps showing the server-resolved snapshot. Any later commit, from a retry or from a normal request, marks the engine as running.

## One call for every change

No component sets a theme, a direction, a language or an animation. Every control ends in:

```ts
const transition = useTransition();
await transition({ culture, theme, motion });
```

which is `recorder.transition(request)`, which calls `engine.setExperience(request)`.

## The transition recorder

`features/transition-recorder/recorder.ts`

The core reports commits through `engine.subscribe()`, but not the stages before a commit, and not stale or failed outcomes. The recorder captures what can be observed around a single call:

1. Notes the current experience id and the start time.
2. Calls `engine.setExperience(request)`.
3. Immediately reads `engine.runtime.getLastTransaction()`. The runtime opens its transaction synchronously before its first `await`, so this is the transaction for this request. It is matched by object identity, which is why the recorder copies the request first.
4. Stores a `pending` record.
5. When the promise settles, marks the record `committed`, `stale` (error code `TRANSITION_STALE`) or `failed` (any other error), with the error code and the wall-clock duration.

A record holds the engine's request id, the request, the previous experience id, the outcome, the error code and message, the duration, and the transaction (delta, affected nodes, prepared resources). The store keeps the last 40 records.

The recorder does not alter what the engine does. It reads results and timings only.

## Rendering the preview

`components/preview/experience-preview.tsx`

The preview is one component tree for every experience.

- **Tokens to CSS.** Each resolved token becomes a CSS variable on the preview root: `surface` → `--xp-surface`, `radius.control` → `--xp-radius-control`. Numbers get a `px` unit unless the key contains `weight`. `component.*` tokens are skipped because they drive component selection, not styling.
- **Typography.** The culture's `fontFamily`, `lineHeight` and `letterSpacing` become `--xp-font-body`, `--xp-line-height` and `--xp-letter-spacing`. If a culture declares `displayFamily`, it replaces the theme's `--xp-font-display`.
- **Direction.** `dir` and `lang` on the root come from the snapshot. The stylesheet uses logical properties (`inline-start`, `border-inline-end`, `text-align: start`), so the sidebar, alignment, badges and table columns mirror without any culture-specific rules. Two things are mirrored explicitly: the revenue chart and the hero texture, both with a single `[dir="rtl"]` transform.
- **Copy.** `useMessages` reads the catalog entry for the snapshot's locale.
- **Formatting.** `lib/format.ts` builds `Intl` formatters from `experience.locale` and `experience.formatting` (currency, numbering system). Arabic therefore shows Arabic-Indic digits and Egyptian pounds.
- **Container queries.** The preview adapts to the width of the pane it sits in, not the window, so it works in the Studio, the landing hero and a phone.

### Component adaptation

`components/preview/adaptation.ts` uses the core `ComponentResolver`:

```ts
new ComponentResolver({
  Navigation:  { variants:     { compact: "NavigationCompact" } },
  OrdersTable: { replacements: { list:    "OrdersList" } },
});
```

The theme tokens `component.nav` and `component.orders` are passed as the variant and replacement context.

| Depth | Meaning | Example |
|---|---|---|
| Token | Same component, new values | Card radius, colour, shadow |
| Variant | Same component, different form | Navigation as labelled rail or icon-only |
| Replacement | A different component | Orders table → compact list |

`OrdersList` is a `React.lazy` chunk. The Midnight theme lists the same module as a `code` resource, so the engine has loaded it before the commit and no loading state appears.

## Motion

`components/preview/use-presented-experience.ts`

The engine commits; this hook decides how the commit is shown. It keeps a "presented" snapshot that follows the committed one:

| Resolved strategy | Presentation |
|---|---|
| `instant` | Presented snapshot is replaced immediately |
| `css` | Replaced immediately; colour properties transition over `durationMs` |
| `view-transition` | Replaced inside `document.startViewTransition`, scoped to the preview with `view-transition-name` |

If the visitor's system asks for reduced motion, any non-instant strategy is shown as `css` with a duration of at most 140 ms. That affects presentation only. The engine request and the resolved motion definition are unchanged, and Research mode shows both values.

Motion never reads the culture or theme id.

## Resources

`engine/resources.ts`

`resource(kind, id, loader)` returns a `ResourceReference` whose `load` function wraps the real loader. The wrapper records state changes (`preparing`, `ready`, `failed`), the number of times the engine actually invoked it, and the duration of the last load. The engine's `ResourceManager` still owns caching, de-duplication of in-flight loads and failure handling.

The wrapper also carries two test controls, both browser-only:

- **Fault switches** (`setFault(kind, on)`): the next load of that resource kind throws, so the engine raises `RESOURCE_LOAD_FAILED`.
- **Added latency** (`setSimulatedLatency(ms)`): delays each load. Off by default and labelled as simulated in the UI.

On the server the activity store, fault set and latency are never written, so one request cannot observe another.

## Studio theme versus experience theme

The Studio's own interface uses `--studio-*` variables with a dark and a light set, switched by `data-studio-theme` on `<html>` and remembered in `localStorage`. A small inline script applies the saved value before first paint.

The previewed application uses `--xp-*` variables written from the engine's resolved theme. The two sets never reference each other.
