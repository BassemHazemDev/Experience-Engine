import { ExperienceEngine } from "@experience-engine/core";

export type Culture = "en-US" | "ar-EG";
export type Theme = "light" | "dark";
export type Motion = "instant" | "smooth";

type Messages = { greeting: string; price: string };

const bundles: Record<Culture, Messages> = {
  "en-US": { greeting: "Good morning", price: "Total" },
  "ar-EG": { greeting: "صباح الخير", price: "الإجمالي" },
};

// Filled by the translation resources. The engine loads a culture's resources
// before it commits that culture, so a committed locale always has its copy.
export const messages = new Map<string, Messages>();

const translation = (culture: Culture) => ({
  kind: "translation" as const,
  id: `messages/${culture}`,
  version: "1",
  // Stands in for a fetch or a dynamic import.
  load: async () => messages.set(culture, bundles[culture]),
});

export const engine = new ExperienceEngine<Culture, Theme, Motion>({
  cultures: {
    "en-US": { locale: "en-US", direction: "ltr", formatting: { currency: "USD" }, resources: [translation("en-US")] },
    "ar-EG": { locale: "ar-EG", direction: "rtl", formatting: { currency: "EGP" }, resources: [translation("ar-EG")] },
  },
  themes: {
    light: { tokens: { surface: "#ffffff", text: "#14171c", accent: "#2f5bea", radius: 12 } },
    dark: { tokens: { surface: "#12151a", text: "#e9ebf0", accent: "#8b93ff", radius: 4 } },
  },
  motions: {
    instant: { defaultStrategy: "instant", durationMs: 0 },
    smooth: { defaultStrategy: "css", durationMs: 300, easing: "ease" },
  },
  initial: { culture: "en-US", theme: "light", motion: "instant" },
});
