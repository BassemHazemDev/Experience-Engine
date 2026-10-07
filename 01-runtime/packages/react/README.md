# @experience-engine/react

[![npm version](https://img.shields.io/npm/v/@experience-engine/react.svg)](https://www.npmjs.com/package/@experience-engine/react)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/BassemHazemDev/Experience-Engine/blob/main/LICENSE)

React bindings for [Experience Engine](https://github.com/BassemHazemDev/Experience-Engine): a provider and hooks built on `useSyncExternalStore`.

This is the published npm package for the React adapter of Experience Engine.

- **npm Package**: [https://www.npmjs.com/package/@experience-engine/react](https://www.npmjs.com/package/@experience-engine/react)
- **Current Version**: `0.1.0`
- **Canonical Repository**: [https://github.com/BassemHazemDev/Experience-Engine](https://github.com/BassemHazemDev/Experience-Engine)
- **Live Studio Showcase**: [https://studio.bassemhazem.com](https://studio.bassemhazem.com)

**Status: Experimental (0.1.0).** An early research implementation; the API may change.

## Installation

Install from the npm registry:

```bash
npm install @experience-engine/core @experience-engine/react
```

Requires React 18 or newer (`react >= 18` peer dependency).

## Quick Example

```tsx
import { ExperienceEngine } from "@experience-engine/core";
import { ExperienceProvider, useExperience } from "@experience-engine/react";

const engine = new ExperienceEngine({ /* cultures, themes, motions, initial */ });
await engine.init();

function Page() {
  const { experience, setCulture } = useExperience();
  if (!experience) return null;
  return (
    <main dir={experience.direction} style={{ background: String(experience.tokens.surface) }}>
      <button onClick={() => void setCulture("ar-EG").catch(() => undefined)}>العربية</button>
    </main>
  );
}

root.render(
  <ExperienceProvider engine={engine}>
    <Page />
  </ExperienceProvider>,
);
```

## Exports

| Export | Returns |
|---|---|
| `ExperienceProvider` | Makes an engine available to the hooks |
| `useExperience()` | `{ experience, setExperience, setCulture, setTheme, setMotion, preload }` |
| `useCulture()`, `useTheme()`, `useMotion()`, `useDirection()` | One field of the committed experience |
| `useExperienceEngine()` | The engine |
| `createExperienceStore(engine)` | The external store behind the hooks |

Components re-render when the engine commits an experience, and not for stale or failed requests. The store subscribes to the engine; there is no polling.

For server rendering with Next.js, use the core in Server Components and this package on the client. See the SSR guide in the repository.

## Links & Documentation

- **Documentation & Examples**: [https://github.com/BassemHazemDev/Experience-Engine](https://github.com/BassemHazemDev/Experience-Engine)
- **Interactive Showcase**: [https://studio.bassemhazem.com](https://studio.bassemhazem.com)
- **Core Runtime**: [https://www.npmjs.com/package/@experience-engine/core](https://www.npmjs.com/package/@experience-engine/core)

## License

MIT © 2026 Bassem Hazem
