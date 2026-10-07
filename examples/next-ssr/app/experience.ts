import { ExperienceEngine, type ExperienceRequest } from "@experience-engine/core";

export const CULTURES = ["en-US", "ar-EG"] as const;
export const THEMES = ["light", "dark"] as const;
export const MOTIONS = ["instant", "smooth"] as const;

export type Culture = (typeof CULTURES)[number];
export type Theme = (typeof THEMES)[number];
export type Motion = (typeof MOTIONS)[number];
export type Request = Required<ExperienceRequest<Culture, Theme, Motion>>;

export const DEFAULT_REQUEST: Request = { culture: "en-US", theme: "light", motion: "instant" };

export const copy: Record<Culture, { title: string; body: string }> = {
  "en-US": { title: "Hello", body: "This HTML was resolved on the server." },
  "ar-EG": { title: "مرحبًا", body: "تم تجهيز هذه الصفحة على الخادم." },
};

/** A new engine every time. On the server, call this once per request. */
export function createEngine(initial: Request) {
  return new ExperienceEngine<Culture, Theme, Motion>({
    cultures: {
      "en-US": { locale: "en-US", direction: "ltr" },
      "ar-EG": { locale: "ar-EG", direction: "rtl" },
    },
    themes: {
      light: { tokens: { surface: "#ffffff", text: "#14171c", accent: "#2f5bea" } },
      dark: { tokens: { surface: "#12151a", text: "#e9ebf0", accent: "#8b93ff" } },
    },
    motions: {
      instant: { defaultStrategy: "instant", durationMs: 0 },
      smooth: { defaultStrategy: "css", durationMs: 250, easing: "ease" },
    },
    initial,
  });
}
