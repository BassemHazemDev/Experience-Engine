# Experience Engine Studio

A showcase application for the Experience Engine research runtime. One fictional application (Nova Commerce) changes language, direction, visual system and motion by sending a single request to the engine, and the Studio takes each transition apart: typed delta, dependency closure, resources, guarded commit.

It uses the real packages in `../01-runtime/packages` (`@experience-engine/core`, `@experience-engine/react`). Neither is reimplemented here. Studio documentation is in [`docs/`](./docs/README.md); documentation for the packages themselves is in the repository's [`docs/`](../docs).

## Setup

Requires Node 20 or newer.

The Studio is a member of the npm workspace at the repository root. Install there once; that also builds the two engine packages the Studio consumes.

```bash
# at the repository root
npm install
npm run dev          # http://localhost:3000
```

The commands below can be run from the repository root or from `06-project`. After changing an engine package, run `npm run build:packages` at the root.

Deployment notes: [`docs/deployment.md`](./docs/deployment.md).

## Production build

```bash
npm run build
npm start            # http://localhost:3000
```

`/personalized` is the only dynamic route; everything else is prerendered.

## Tests

```bash
npm run typecheck
npm test             # 48 tests: core, adapter subscription, React, server rendering, cookie parsing
npm run test:ssr     # needs the production server running; checks raw HTTP responses
```

`test:ssr` requests `/personalized` with five different cookies and asserts on the HTML text only. Set `BASE_URL` if the server is not on port 3000.

| Suite | What it covers |
|---|---|
| `tests/engine.test.ts` | init, `setExperience`, immutable snapshot, RTL/LTR, dimension independence, delta and closure, rapid requests (4 stale, 1 committed), resource failure preserves state and retry succeeds, engine isolation |
| `tests/react.test.tsx` | `ExperienceProvider` mounts, hook returns the snapshot, a real re-render happens, the DOM reflects the final experience |
| `tests/ssr.test.tsx` | cookie A and cookie B render different HTML from the same code path, visible before hydration; invalid cookie falls back |
| `tests/cookie.test.ts` | whitelist parsing and safe fallback |

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing page. The hero runs a real transition. |
| `/studio` | Controls, live preview, Transition Inspector, Research mode. |
| `/playground` | Rapid transition test, failure injection and retry, unregistered requests. |
| `/personalized` | Cookie → server-resolved experience → hydration → runtime switching. |
| `/architecture` | Layers, the eight protocol stages, component adaptation, where orchestration lives. |
| `/benchmark` | Stored results, synthetic-workload results, and an in-browser runner, each labelled. |
| `/evidence` | Gate table with scope and source file per row, and what is not claimed. |

## Architecture notes

```
app/                  routes; (site)/layout.tsx owns one client engine for the site
engine/               definitions, createEngine, presets, cookie parsing, resource loaders
components/preview/   Nova Commerce, rendered only from the resolved snapshot
components/           shell, UI primitives, architecture and benchmark pieces
features/             controls, recorder, inspector, dependency graph, resources, research, playground, personalized
lib/                  formatting (Intl from the resolved culture), evidence data with sources
tests/  scripts/
```

**One call.** Every change in the UI goes through `recorder.transition(request)`, which calls `engine.setExperience(request)` and records the outcome. There are no separate theme, direction, language or animation setters in the app.

**Rendering.** Resolved tokens and typography become `--xp-*` CSS variables on the preview root. `dir` and `lang` come from the snapshot and layout uses CSS logical properties, so mirroring needs no culture branches. Copy comes from the catalog filled by the translation resource; numbers and dates use `Intl` with the resolved locale and formatting.

**Dimensions.** Culture owns locale, direction, typography, formatting, translation and font. Theme owns tokens, an asset, and component adaptation. Motion owns the transition strategy. Nothing reads a culture id to decide motion or theme behaviour.

**Component adaptation.** Token → variant → replacement, resolved with the core `ComponentResolver` from `component.*` theme tokens. The Midnight theme switches navigation to an icon-only variant and replaces the orders table with a compact list whose code is loaded as a `code` resource before commit.

**Inspector data.** Delta, closure and request id come from `engine.runtime.getLastTransaction()`. The graph is rebuilt with the core's `createDependencyGraph` for that transaction. Resource states come from instrumented loaders; the engine still does the caching and failure handling.

**Failure injection is real.** The Playground switches make the actual loaders reject, so the engine itself raises `RESOURCE_LOAD_FAILED` and keeps the committed experience.

**Server.** `/personalized` reads the `experience` cookie (`<culture>.<theme>.<motion>`), whitelists each part, creates a new engine for that request, awaits `init()`, and renders. The client engine starts from the same request; its first render uses the synchronous `resolveExperience()` result plus server-passed copy, so the HTML matches and there is no loading swap.

**Studio chrome vs. experience theme.** `--studio-*` tokens style the Studio itself (dark or light). They are unrelated to the engine's Theme dimension, which only affects the preview.

## What is simulated, and how it is labelled

| Item | Status |
|---|---|
| Delta, closure, graph, request ids, outcomes, error codes | From the engine |
| Resource failure and recovery | From the engine (real loader rejections) |
| Timings in the inspector and the benchmark runner | Measured in the visitor's browser, single readings |
| Figures on Benchmark and Evidence | Copied from files in this repository, each cited in `lib/evidence.ts` |
| Inspector stage animation | Replay of a recorded transaction |
| "Added latency" control | Simulated, off by default |
| Manual orchestration code on Architecture | Illustrative sketch |
| Nova Commerce and its numbers | Fictional demo data |

## Known limitations

- Intermediate lifecycle stages are not observable live; the inspector replays the recorded transaction and labels the replay.
- The resolver does not carry a theme's `components` into the resolved experience, so the engine's delta lists component changes as `token:component.*`. The inspector's Components panel shows what they resolve to.
- The core reports commits through `engine.subscribe()` but not the stages before a commit.
- Four engine files changed for the commit subscription, so two entries in `01-runtime/manifest.json` are stale. See `docs/limitations.md`, item 21.
- The Smooth motion uses the View Transitions API and falls back to an immediate update where it is unavailable.
- Amounts are shown in the culture's currency without conversion.
- SSR personalization was checked against a local production server only.
