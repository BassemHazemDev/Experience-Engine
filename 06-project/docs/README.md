# Experience Engine Studio — Documentation

Experience Engine Studio is a Next.js application that demonstrates the Experience Engine research runtime. A fictional storefront admin, Nova Commerce, changes its language, reading direction, visual system and motion by sending one request to the engine. The Studio then shows what the engine did with that request: the typed delta, the dependency closure, the resources it prepared and how it committed.

The application uses the real packages in `01-runtime/packages` (`@experience-engine/core` and `@experience-engine/react`). Neither is wrapped in a substitute or reimplemented. Pass 2 made one addition to them: a commit subscription in the core, which the React adapter now uses instead of polling. See [Limitations](./limitations.md), items 4, 5 and 21.

## Contents

| Document | What it covers |
|---|---|
| [Architecture](./architecture.md) | Folder layout, how the app talks to the engine, rendering, motion, the transition recorder |
| [Experience model](./experience-model.md) | Cultures, themes, motions, tokens, resources, presets, and how to add a new one |
| [Features](./features.md) | Each route and panel: what it shows and where its data comes from |
| [Personalized SSR](./personalized-ssr.md) | Cookie format, server resolution, hydration, validation |
| [Testing](./testing.md) | Test suites, the SSR validation script, what was and was not verified |
| [Deployment](./deployment.md) | Local development, production build, hosting, cookies |
| [Limitations](./limitations.md) | Known limitations with the reason for each, simulated content, claim boundaries |

## Quick start

Requires Node 20 or newer.

```bash
# at the repository root
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Checks:

```bash
npm run typecheck
npm test           # 48 tests
npm run test:ssr   # needs the production server running
```

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing page. The hero runs a real engine transition. |
| `/studio` | Controls, live preview, Transition Inspector, Research mode. |
| `/playground` | Rapid transition test, failure injection and retry, unregistered requests. |
| `/personalized` | Cookie → server-resolved experience → hydration → runtime switching. |
| `/architecture` | Layers, the eight protocol stages, component adaptation, where orchestration lives. |
| `/benchmark` | Stored results, synthetic-workload results, and an in-browser runner. |
| `/evidence` | Evidence gates with scope and source file, and what is not claimed. |

## The idea in one diagram

```text
Culture + Theme + Motion
          ↓
   ExperienceRequest
          ↓
 engine.setExperience()
          ↓
  Resolved experience      (immutable snapshot)
          ↓
     Typed delta           (what changed, per dimension)
          ↓
  Dependency closure       (what depends on the change)
          ↓
     Preparation           (translation, font, asset, code)
          ↓
    Guarded commit         (visible in one step, only if still the latest request)
```

The application's job ends at the third line. Everything below it is the engine's.

## Stack

- Next.js 16.2.0 (App Router, Turbopack), React 19.2.0, TypeScript in strict mode
- `@experience-engine/core` and `@experience-engine/react`, linked from `../01-runtime/packages`
- Plain CSS with custom properties; no UI, chart or animation libraries
- Vitest, Testing Library and jsdom for tests
