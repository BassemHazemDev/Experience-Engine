import type {
  CultureDefinition,
  ExperienceRequest,
  MotionDefinition,
  ThemeDefinition,
} from "@experience-engine/core";
import { messageLoaders, registerMessages } from "./messages";
import { loadFont, loadImage, resource } from "./resources";

export const CULTURES = ["en-US", "ar-EG"] as const;
export const THEMES = ["light", "luxury", "midnight"] as const;
export const MOTIONS = ["instant", "smooth", "reduced"] as const;

export type Culture = (typeof CULTURES)[number];
export type Theme = (typeof THEMES)[number];
export type Motion = (typeof MOTIONS)[number];
export type StudioRequest = Required<ExperienceRequest<Culture, Theme, Motion>>;

export const DEFAULT_REQUEST: StudioRequest = { culture: "en-US", theme: "light", motion: "instant" };

const translation = (culture: Culture) =>
  resource("translation", `messages/${culture}`, async () =>
    registerMessages(culture, await messageLoaders[culture]()),
  );

export const cultures: Record<Culture, CultureDefinition> = {
  "en-US": {
    locale: "en-US",
    direction: "ltr",
    typography: { fontFamily: "var(--font-latin)", lineHeight: 1.5, letterSpacing: "-0.005em" },
    formatting: { currency: "USD", numberingSystem: "latn", dateStyle: "medium" },
    resources: [translation("en-US"), resource("font", "latin-text", loadFont("--font-latin", "Nova"))],
  },
  "ar-EG": {
    locale: "ar-EG",
    direction: "rtl",
    // Arabic has no counterpart for a theme’s Latin display face, so this culture
    // names the family headings should use.
    typography: { fontFamily: "var(--font-arabic)", displayFamily: "var(--font-arabic)", lineHeight: 1.75, letterSpacing: "0" },
    formatting: { currency: "EGP", numberingSystem: "arab", dateStyle: "medium" },
    resources: [translation("ar-EG"), resource("font", "arabic-text", loadFont("--font-arabic", "نوفا"))],
  },
};

// Themes are plain semantic tokens. The `component.*` tokens select how a
// component adapts (variant or replacement); the preview feeds them to the
// core ComponentResolver.
export const themes: Record<Theme, ThemeDefinition> = {
  light: {
    density: "comfortable",
    tokens: {
      surface: "#f5f6f8",
      sidebar: "#ffffff",
      card: "#ffffff",
      raised: "#eef0f4",
      text: "#171a1f",
      muted: "#646b78",
      border: "#e2e5ea",
      accent: "#2f5bea",
      accentText: "#ffffff",
      accentSoft: "#e8eeff",
      positive: "#0f7553",
      negative: "#c2362f",
      warning: "#965900",
      radius: 12,
      "radius.control": 8,
      shadow: "0 1px 2px rgba(16,24,40,.06), 0 8px 24px -12px rgba(16,24,40,.14)",
      space: 16,
      "font.display": "var(--font-latin)",
      "heading.weight": 650,
      "heading.tracking": "-0.02em",
      "button.bg": "#2f5bea",
      "button.text": "#ffffff",
      "button.border": "#2f5bea",
      texture: "url(/textures/light.svg)",
      "component.nav": "rail",
      "component.orders": "table",
    },
    resources: [resource("asset", "texture/light", loadImage("/textures/light.svg"))],
  },
  luxury: {
    density: "spacious",
    tokens: {
      surface: "#100e0b",
      sidebar: "#15120e",
      card: "#1a1612",
      raised: "#231e18",
      text: "#f1e9da",
      muted: "#a39780",
      border: "#3a3125",
      accent: "#c8a25a",
      accentText: "#17120a",
      accentSoft: "rgba(200,162,90,.14)",
      positive: "#8fbf8a",
      negative: "#e08a78",
      warning: "#d9b25f",
      radius: 2,
      "radius.control": 2,
      shadow: "0 0 0 1px rgba(200,162,90,.08), 0 24px 48px -24px rgba(0,0,0,.7)",
      space: 22,
      "font.display": "var(--font-serif)",
      "heading.weight": 500,
      "heading.tracking": "0em",
      "button.bg": "transparent",
      "button.text": "#c8a25a",
      "button.border": "#c8a25a",
      texture: "url(/textures/luxury.svg)",
      "component.nav": "rail",
      "component.orders": "table",
    },
    resources: [
      resource("asset", "texture/luxury", loadImage("/textures/luxury.svg")),
      resource("font", "serif-display", loadFont("--font-serif", "Nova")),
    ],
  },
  midnight: {
    density: "compact",
    tokens: {
      surface: "#0b1220",
      sidebar: "#0d1526",
      card: "#111b2e",
      raised: "#18243b",
      text: "#dce6f5",
      muted: "#7f8fa8",
      border: "#1f2c44",
      accent: "#4cc9f0",
      accentText: "#04121c",
      accentSoft: "rgba(76,201,240,.12)",
      positive: "#4ade9a",
      negative: "#ff7a85",
      warning: "#f5c35b",
      radius: 6,
      "radius.control": 5,
      shadow: "none",
      space: 11,
      "font.display": "var(--font-latin)",
      "heading.weight": 600,
      "heading.tracking": "-0.01em",
      "button.bg": "#4cc9f0",
      "button.text": "#04121c",
      "button.border": "#4cc9f0",
      texture: "url(/textures/midnight.svg)",
      "component.nav": "compact",
      "component.orders": "list",
    },
    resources: [
      resource("asset", "texture/midnight", loadImage("/textures/midnight.svg")),
      // The compact list that replaces the orders table ships as its own chunk.
      resource("code", "components/orders-list", () => import("@/components/preview/orders-list")),
    ],
  },
};

export const motions: Record<Motion, MotionDefinition> = {
  instant: { defaultStrategy: "instant", durationMs: 0 },
  smooth: { defaultStrategy: "view-transition", durationMs: 480, easing: "cubic-bezier(.2,.8,.2,1)" },
  reduced: { defaultStrategy: "css", durationMs: 140, easing: "linear" },
};

export const isCulture = (value: unknown): value is Culture => CULTURES.includes(value as Culture);
export const isTheme = (value: unknown): value is Theme => THEMES.includes(value as Theme);
export const isMotion = (value: unknown): value is Motion => MOTIONS.includes(value as Motion);

export const LABELS = {
  culture: { "en-US": "English", "ar-EG": "العربية" } satisfies Record<Culture, string>,
  theme: { light: "Light", luxury: "Luxury", midnight: "Midnight" } satisfies Record<Theme, string>,
  motion: { instant: "Instant", smooth: "Smooth", reduced: "Reduced" } satisfies Record<Motion, string>,
};

export const requestId = (r: StudioRequest) => `${r.culture}::${r.theme}::${r.motion}`;
export const sameRequest = (a: StudioRequest, b: StudioRequest) =>
  a.culture === b.culture && a.theme === b.theme && a.motion === b.motion;
