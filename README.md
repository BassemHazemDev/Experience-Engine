# Experience Engine

[![CI](https://github.com/BassemHazemDev/Experience-Engine/actions/workflows/ci.yml/badge.svg)](https://github.com/BassemHazemDev/Experience-Engine/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A framework-agnostic runtime that changes an application's culture, theme and motion together, as one prepared and guarded transition.

```ts
await engine.setExperience({
  culture: "ar-EG",
  theme: "luxury",
  motion: "smooth",
});
```

One call. The engine works out what changed, loads what the new experience needs (translations, fonts, assets, code), and only then makes it visible. If something fails to load, or a newer request arrives first, the screen keeps showing the experience it already had.

**Status: experimental.** Version 0.1.0 is an early research implementation. The API may change, and it has not been used in production. See [Limitations](#limitations).

## Why Experience Engine?

Most applications already handle language, direction, theming and animation. They usually handle them separately:

- a localization library for copy and formats
- a `dir` attribute for direction
- a theme provider or CSS variables for colour and spacing
- conditional rendering for components that differ per theme or market
- ad-hoc loading for fonts, images and lazy chunks
- an animation setting

Each works on its own. The difficulty is the moment they change together. Switching a storefront from English and a light theme to Arabic and a dark one touches all six, and the application code is left to coordinate them: load the Arabic copy and font before flipping direction, do not show the new theme until its assets are ready, do not let a slow earlier request overwrite a newer one, and leave the screen alone if anything fails.

Experience Engine treats that whole change as one runtime operation. Culture, theme and motion stay independent, so you can change any one of them, but a change is always resolved, prepared and committed as a unit.

### How is this different from i18n or theme switching?

It does not replace either. You still write translations and design tokens. The engine sits above them and owns the transition: what differs between two experiences, what depends on those differences, what must load first, and when the result becomes visible.

## Core model

```text
Experience
├── Culture    locale, direction, typography, formatting, translations, fonts
├── Theme      design tokens, density, component adaptation, assets
└── Motion     how a committed change is shown
```

Every transition goes through the same steps, the Experience Transition Protocol (ETP):

```text
Experience State           one immutable, committed snapshot
        ↓
Experience Transition      a complete target request
        ↓
Typed Experience Delta     what differs, per dimension
        ↓
Dependency Closure         what depends on those differences
        ↓
Heterogeneous Preparation  translations, fonts, assets and code load together
        ↓
Guarded Commit             visible in one step, only if still the latest request
```

More in [docs/protocol.md](./docs/protocol.md).

## Quick example

```ts
import { ExperienceEngine } from "@experience-engine/core";

const engine = new ExperienceEngine({
  cultures: {
    "en-US": { locale: "en-US", direction: "ltr" },
    "ar-EG": {
      locale: "ar-EG",
      direction: "rtl",
      resources: [{ kind: "translation", id: "messages/ar-EG", load: () => import("./messages/ar-EG") }],
    },
  },
  themes: {
    light: { tokens: { surface: "#ffffff", text: "#14171c", radius: 12 } },
    luxury: { tokens: { surface: "#100e0b", text: "#f1e9da", radius: 2 } },
  },
  motions: {
    instant: { defaultStrategy: "instant", durationMs: 0 },
    smooth: { defaultStrategy: "view-transition", durationMs: 480 },
  },
  initial: { culture: "en-US", theme: "light", motion: "instant" },
});

await engine.init();

const experience = await engine.setExperience({ culture: "ar-EG", theme: "luxury", motion: "smooth" });

experience.direction; // "rtl"
experience.tokens.surface; // "#100e0b"
experience.delta; // { cultureChanged: true, themeChanged: true, motionChanged: true, changedKeys: [...] }
```

With React:

```tsx
import { ExperienceProvider, useExperience } from "@experience-engine/react";

function Page() {
  const { experience, setCulture } = useExperience();
  if (!experience) return null;
  return (
    <main dir={experience.direction} style={{ background: String(experience.tokens.surface) }}>
      <button onClick={() => void setCulture("ar-EG")}>العربية</button>
    </main>
  );
}

<ExperienceProvider engine={engine}>
  <Page />
</ExperienceProvider>;
```

## Installation

The packages are prepared for npm but **not published yet**. Once they are:

```bash
npm install @experience-engine/core
npm install @experience-engine/react   # for React or Next.js
```

Until then, use them from this repository (see [Run it locally](#run-it-locally)).

## Packages

| Package | Version | What it is |
|---|---|---|
| [`@experience-engine/core`](./01-runtime/packages/core) | 0.1.0 | The runtime: engine, resolver, typed delta, dependency closure, resource manager, component resolver. No dependencies, no framework. |
| [`@experience-engine/react`](./01-runtime/packages/react) | 0.1.0 | `ExperienceProvider` and hooks, built on `useSyncExternalStore`. Peer dependency: React 18 or newer. |

There is no separate Next.js package. Next.js is supported by using the core in Server Components and the React adapter on the client; see [docs/ssr.md](./docs/ssr.md).

## Studio

[`06-project`](./06-project) is Experience Engine Studio, a Next.js application built on the two packages. It previews a fictional storefront admin and takes each transition apart: the typed delta, the dependency graph, every resource, and the commit. It also has a playground for rapid switching and failure recovery, and a cookie-driven personalized SSR page.

```bash
npm install
npm run dev        # http://localhost:3000
```

There is no hosted demo yet. Deployment notes are in [06-project/docs/deployment.md](./06-project/docs/deployment.md).

## Run it locally

Requires Node 20 or newer and npm 10 or newer. The repository is an npm workspace.

```bash
git clone https://github.com/BassemHazemDev/Experience-Engine.git
cd Experience-Engine
npm install          # installs everything and builds the two packages

npm run dev          # Studio at http://localhost:3000
npm run typecheck    # packages, Studio, examples, runtime contract test
npm test             # core contract test + 48 Studio tests
npm run build        # packages, Studio and all examples
```

SSR validation, against the built Studio:

```bash
npm run start        # in one terminal
npm run test:ssr     # in another
```

## Examples

Small projects in [`examples/`](./examples), each a few files:

| Example | Shows |
|---|---|
| [`basic-react`](./examples/basic-react) | Engine, provider, switching culture, theme and motion, RTL |
| [`component-adaptation`](./examples/component-adaptation) | Token, variant, replacement |
| [`next-ssr`](./examples/next-ssr) | Resolving an experience in a Server Component |
| [`personalized-ssr`](./examples/personalized-ssr) | A cookie choosing the server-rendered experience |

```bash
npm run dev -w example-basic-react
```

## Documentation

| | |
|---|---|
| [Getting started](./docs/getting-started.md) | Install, define an experience, switch it, use it from React |
| [Architecture](./docs/architecture.md) | Layers and the boundaries between them |
| [Protocol](./docs/protocol.md) | The eight stages and the invariants |
| [Cultures, themes and motion](./docs/cultures-and-themes.md) | Definitions and who owns what |
| [Component adaptation](./docs/component-adaptation.md) | Token, variant, replacement |
| [SSR](./docs/ssr.md) | Server resolution, cookies, hydration, isolation |
| [Resources and motion](./docs/resources-and-motion.md) | Loading, caching, preload, transitions, reduced motion |
| [API reference](./docs/api.md) | Everything the two packages export |
| [Troubleshooting](./docs/troubleshooting.md) | Common problems |

## Repository layout

```text
Engineering
  01-runtime/packages/core     @experience-engine/core
  01-runtime/packages/react    @experience-engine/react
  06-project/                  Experience Engine Studio
  examples/                    small example projects
  docs/                        documentation

Research archive
  02-paper/                    paper sources and PDFs
  04-evidence/                 stored validation results
  05-audit/                    audit records
  03-submission/               historical submission material
  01-runtime/ (other files)    phase notes, manifests, evaluation harnesses
```

You do not need anything in the research archive to use the packages.

## Research

Experience Engine began as a research project on the Experience Transition Protocol. The paper, the stored evidence and the audit trail are kept in this repository for transparency and reproducibility. [RESEARCH.md](./RESEARCH.md) is the guide to them.

The research conclusions are deliberately narrow, and this README does not go beyond them:

- A carefully written manual controller reaches the same tested safety outcomes. The engine's contribution is the reusable abstraction, not a unique guarantee.
- It is not faster in general. In several measured scenarios the engine added orchestration overhead.
- Results on dependency locality come from synthetic graphs.
- No third party has independently replicated the results.

## Limitations

- **Early-stage.** 0.1.0, experimental, not production-tested. Breaking changes are likely.
- **Commits only.** `engine.subscribe()` reports commits. Individual stages are not observable as events.
- **Component changes are not in the delta directly.** Themes select component adaptation through tokens; the delta reports those token keys.
- **Motion is a description.** The engine resolves a motion definition; playing it is up to the adapter or application. The Studio uses the View Transitions API where available.
- **SSR is validated locally only.** Per-request rendering was checked against a local Next.js production server, not behind a CDN or cache.
- **React 19 in tests.** The current adapter is tested on React 19.2. The stored React 18 measurements in the research record were taken with an earlier adapter revision.
- **Chromium only.** Browser checks were done in Chromium-based browsers.
- **Two cultures in the demos.** `en-US` and `ar-EG`.

More detail: [06-project/docs/limitations.md](./06-project/docs/limitations.md).

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md), the [code of conduct](./CODE_OF_CONDUCT.md) and the [security policy](./SECURITY.md).

## License

[MIT](./LICENSE) © 2026 Bassem Hazem
