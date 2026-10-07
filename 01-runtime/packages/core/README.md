# @experience-engine/core

[![npm version](https://img.shields.io/npm/v/@experience-engine/core.svg)](https://www.npmjs.com/package/@experience-engine/core)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/BassemHazemDev/Experience-Engine/blob/main/LICENSE)

A framework-agnostic runtime that changes an application's culture, theme and motion together, as one prepared and guarded transition.

This is the published npm package for the core runtime of [Experience Engine](https://github.com/BassemHazemDev/Experience-Engine).

- **npm Package**: [https://www.npmjs.com/package/@experience-engine/core](https://www.npmjs.com/package/@experience-engine/core)
- **Current Version**: `0.1.0`
- **Canonical Repository**: [https://github.com/BassemHazemDev/Experience-Engine](https://github.com/BassemHazemDev/Experience-Engine)
- **Live Studio Showcase**: [https://studio.bassemhazem.com](https://studio.bassemhazem.com)

**Status: Experimental (0.1.0).** An early research implementation; the API may change.

## Installation

Install from the npm registry:

```bash
npm install @experience-engine/core
```

## Quick Example

```ts
import { ExperienceEngine } from "@experience-engine/core";

const engine = new ExperienceEngine({
  cultures: {
    "en-US": { locale: "en-US", direction: "ltr" },
    "ar-EG": { locale: "ar-EG", direction: "rtl" },
  },
  themes: {
    light: { tokens: { surface: "#ffffff", text: "#14171c" } },
    dark: { tokens: { surface: "#12151a", text: "#e9ebf0" } },
  },
  motions: {
    instant: { defaultStrategy: "instant", durationMs: 0 },
    smooth: { defaultStrategy: "css", durationMs: 250 },
  },
  initial: { culture: "en-US", theme: "light", motion: "instant" },
});

await engine.init();

const experience = await engine.setExperience({ culture: "ar-EG", theme: "dark", motion: "smooth" });
experience.direction; // "rtl"
experience.tokens.surface; // "#12151a"
```

Each call to `setExperience()` resolves the target, computes a typed delta, finds what depends on it, loads the target's resources, and commits only if it is still the latest request. A failed or superseded request leaves the committed experience untouched.

## Features

- No dependencies, no framework, no browser globals. Runs in Node for server rendering.
- ESM and CommonJS builds with TypeScript declarations.
- React bindings available in [`@experience-engine/react`](https://www.npmjs.com/package/@experience-engine/react).

## Links & Documentation

- **Documentation & Examples**: [https://github.com/BassemHazemDev/Experience-Engine](https://github.com/BassemHazemDev/Experience-Engine)
- **Interactive Showcase**: [https://studio.bassemhazem.com](https://studio.bassemhazem.com)
- **React Adapter**: [https://www.npmjs.com/package/@experience-engine/react](https://www.npmjs.com/package/@experience-engine/react)

## License

MIT © 2026 Bassem Hazem
