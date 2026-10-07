# @experience-engine/core

A framework-agnostic runtime that changes an application's culture, theme and motion together, as one prepared and guarded transition.

**Experimental.** Version 0.1.0 is an early research implementation; the API may change.

```bash
npm install @experience-engine/core
```

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

- No dependencies, no framework, no browser globals. Runs in Node for server rendering.
- ESM and CommonJS builds with TypeScript declarations.
- React bindings: [`@experience-engine/react`](https://www.npmjs.com/package/@experience-engine/react).

Documentation, examples and the Studio showcase: <https://github.com/BassemHazemDev/Experience-Engine>

## License

MIT
