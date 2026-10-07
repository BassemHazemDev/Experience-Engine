# Cultures, themes and motion

## Culture

```ts
interface CultureDefinition {
  locale: string;
  direction: "ltr" | "rtl";
  typography?: Record<string, unknown>;
  formatting?: Record<string, unknown>;
  resources?: ResourceReference[];
  extends?: string;
}
```

```ts
const cultures = {
  "en-US": {
    locale: "en-US",
    direction: "ltr",
    typography: { fontFamily: "Figtree, sans-serif", lineHeight: 1.5 },
    formatting: { currency: "USD", numberingSystem: "latn" },
  },
  "ar-EG": {
    locale: "ar-EG",
    direction: "rtl",
    typography: { fontFamily: "'IBM Plex Sans Arabic', sans-serif", lineHeight: 1.75 },
    formatting: { currency: "EGP", numberingSystem: "arab" },
    resources: [
      { kind: "translation", id: "messages/ar-EG", version: "1", load: () => import("./messages/ar-EG") },
      { kind: "font", id: "arabic-text", version: "1", load: () => document.fonts.load("16px 'IBM Plex Sans Arabic'") },
    ],
  },
} as const;
```

`typography` and `formatting` are free-form. The engine carries them to the resolved experience and reports which keys changed; what they mean is up to your application. A common use of `formatting`:

```ts
new Intl.NumberFormat(`${experience.locale}-u-nu-${experience.formatting.numberingSystem}`, {
  style: "currency",
  currency: String(experience.formatting.currency),
});
```

## Theme

```ts
interface ThemeDefinition {
  tokens: Record<string, string | number>;
  density?: string;
  components?: Record<string, unknown>;
  resources?: ResourceReference[];
  extends?: string;
}
```

```ts
const themes = {
  light: {
    density: "comfortable",
    tokens: { surface: "#ffffff", text: "#14171c", accent: "#2f5bea", radius: 12, space: 16 },
  },
  luxury: {
    density: "spacious",
    tokens: { surface: "#100e0b", text: "#f1e9da", accent: "#c8a25a", radius: 2, space: 22 },
    resources: [{ kind: "asset", id: "texture/luxury", version: "1", load: () => decodeImage("/textures/luxury.svg") }],
  },
} as const;
```

Use semantic names (`surface`, `text`, `accent`) rather than raw palette names, so components do not need to know which theme is active. A typical way to apply tokens is to write them as CSS variables on a root element:

```tsx
const style = Object.fromEntries(Object.entries(experience.tokens).map(([key, value]) => [`--${key}`, String(value)]));
<div style={style} dir={experience.direction}>…</div>;
```

Only `tokens` reach the resolved experience today. `density` and `components` stay on the definition; read them from the registry with `engine.themes.get(id)` if you need them.

## Motion

```ts
interface MotionDefinition {
  defaultStrategy?: "instant" | "css" | "view-transition" | "js";
  durationMs?: number;
  easing?: string;
}
```

```ts
const motions = {
  instant: { defaultStrategy: "instant", durationMs: 0 },
  smooth: { defaultStrategy: "view-transition", durationMs: 480, easing: "cubic-bezier(.2,.8,.2,1)" },
  reduced: { defaultStrategy: "css", durationMs: 140, easing: "linear" },
} as const;
```

The engine resolves the definition onto `experience.motion`. It does not animate anything. See [resources-and-motion.md](./resources-and-motion.md).

## Inheritance

Cultures and themes can extend another definition of the same kind.

```ts
const themes = {
  light: { tokens: { surface: "#fff", text: "#111", radius: 8 } },
  highContrast: { extends: "light", tokens: { text: "#000" } },
};
// highContrast resolves to { surface: "#fff", text: "#000", radius: 8 }
```

Tokens merge key by key, the more specific definition winning. Other fields are replaced as a whole. Cycles and chains deeper than 16 are rejected with `INHERITANCE_CYCLE` and `INHERITANCE_DEPTH_EXCEEDED`.

## Semantic ownership

Keep each concern in exactly one dimension.

| Concern | Belongs to |
|---|---|
| Language, copy, reading direction | Culture |
| Number, date and currency formats | Culture |
| Body typeface for a script | Culture |
| Colours, radius, spacing, shadow | Theme |
| Which component variant or replacement is used | Theme |
| Display typeface that is part of a visual identity | Theme |
| How a change is animated | Motion |

Two rules follow:

1. **Do not branch on ids.** `if (culture === "ar-EG") useSmoothMotion()` couples two dimensions. Put the property on the definition and read it from the resolved experience.
2. **Use CSS logical properties** (`margin-inline-start`, `text-align: start`). With `dir` set from `experience.direction`, layout mirrors with no culture-specific styles.

Where two dimensions genuinely meet, express it as data on one of them. In the Studio, the Arabic culture declares its own heading typeface because the themes' Latin display faces have no Arabic glyphs.
