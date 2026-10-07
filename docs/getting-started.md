# Getting started

## Prerequisites

- Node 20 or newer.
- For the React adapter: React 18 or newer.

## Install

The packages are not on npm yet. Once published:

```bash
npm install @experience-engine/core
npm install @experience-engine/react   # optional
```

Until then, work inside this repository: `npm install` at the root builds both packages and links them into the Studio and the examples.

## 1. Define cultures

A culture owns locale, reading direction, typography, formatting, and the resources that go with them.

```ts
import type { CultureDefinition } from "@experience-engine/core";

const cultures: Record<"en-US" | "ar-EG", CultureDefinition> = {
  "en-US": {
    locale: "en-US",
    direction: "ltr",
    formatting: { currency: "USD" },
  },
  "ar-EG": {
    locale: "ar-EG",
    direction: "rtl",
    formatting: { currency: "EGP" },
    typography: { fontFamily: "'IBM Plex Sans Arabic', sans-serif" },
    resources: [
      { kind: "translation", id: "messages/ar-EG", version: "1", load: () => import("./messages/ar-EG") },
    ],
  },
};
```

## 2. Define themes

A theme is a set of semantic tokens. Values are strings or numbers.

```ts
import type { ThemeDefinition } from "@experience-engine/core";

const themes: Record<"light" | "dark", ThemeDefinition> = {
  light: { tokens: { surface: "#ffffff", text: "#14171c", radius: 12 } },
  dark: { tokens: { surface: "#12151a", text: "#e9ebf0", radius: 4 } },
};
```

## 3. Define motions

A motion says how a committed change should be shown. The engine resolves it; your application or adapter plays it.

```ts
import type { MotionDefinition } from "@experience-engine/core";

const motions: Record<"instant" | "smooth", MotionDefinition> = {
  instant: { defaultStrategy: "instant", durationMs: 0 },
  smooth: { defaultStrategy: "css", durationMs: 250, easing: "ease" },
};
```

## 4. Create the engine

```ts
import { ExperienceEngine } from "@experience-engine/core";

const engine = new ExperienceEngine({
  cultures,
  themes,
  motions,
  initial: { culture: "en-US", theme: "light", motion: "instant" },
});

await engine.init(); // resolves, prepares and commits the initial experience
```

The three type parameters are inferred from the keys, so `setExperience({ theme: "neon" })` is a compile error.

## 5. Switch experience

```ts
const experience = await engine.setExperience({
  culture: "ar-EG",
  theme: "dark",
  motion: "smooth",
});

experience.id;        // "ar-EG::dark::smooth"
experience.direction; // "rtl"
experience.tokens;    // { surface: "#12151a", text: "#e9ebf0", radius: 4 }
```

To change one dimension and keep the others:

```ts
await engine.setCulture("en-US");
await engine.setTheme("light");
await engine.setMotion("instant");
```

Read the committed experience at any time with `engine.getExperience()`.

### Handle rejections

`setExperience()` rejects with an `ExperienceEngineError` in three situations. In all of them the committed experience is unchanged.

```ts
import { ExperienceEngineError } from "@experience-engine/core";

try {
  await engine.setExperience(request);
} catch (error) {
  if (error instanceof ExperienceEngineError) {
    switch (error.code) {
      case "TRANSITION_STALE":     // a newer request arrived first; usually safe to ignore
      case "RESOURCE_LOAD_FAILED": // a resource did not load; retrying is allowed
      case "UNKNOWN_THEME":        // also UNKNOWN_CULTURE, UNKNOWN_MOTION
    }
  }
}
```

## 6. Use it from React

```tsx
import { ExperienceProvider, useExperience, useDirection } from "@experience-engine/react";

function Page() {
  const { experience, setExperience, setCulture } = useExperience();
  const direction = useDirection();
  if (!experience) return null; // before init() has committed

  return (
    <main dir={direction} lang={experience.locale} style={{ background: String(experience.tokens.surface) }}>
      <button onClick={() => void setCulture("ar-EG").catch(() => undefined)}>العربية</button>
      <button onClick={() => void setExperience({ culture: "en-US", theme: "light", motion: "instant" }).catch(() => undefined)}>
        Reset
      </button>
    </main>
  );
}

await engine.init();

root.render(
  <ExperienceProvider engine={engine}>
    <Page />
  </ExperienceProvider>,
);
```

Components re-render when the engine commits. They do not re-render for stale or failed requests.

## Next steps

- A runnable version of this page: [`examples/basic-react`](../examples/basic-react).
- Server rendering: [ssr.md](./ssr.md).
- What happens inside `setExperience()`: [protocol.md](./protocol.md).
- Everything exported: [api.md](./api.md).
