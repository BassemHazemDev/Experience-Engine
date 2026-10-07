import type { StudioRequest } from "./definitions";

export interface Preset {
  readonly id: string;
  readonly name: string;
  readonly request: StudioRequest;
}

// Every preset is one complete experience request and nothing more.
export const PRESETS: readonly Preset[] = [
  { id: "international", name: "International", request: { culture: "en-US", theme: "light", motion: "instant" } },
  { id: "arabic-luxury", name: "Arabic Luxury", request: { culture: "ar-EG", theme: "luxury", motion: "instant" } },
  { id: "arabic-executive", name: "Arabic Executive", request: { culture: "ar-EG", theme: "luxury", motion: "smooth" } },
  { id: "minimal", name: "Minimal", request: { culture: "en-US", theme: "midnight", motion: "instant" } },
  { id: "executive-dark", name: "Executive Dark", request: { culture: "en-US", theme: "luxury", motion: "reduced" } },
];

export const RAPID_SEQUENCE: readonly StudioRequest[] = [
  { culture: "en-US", theme: "light", motion: "instant" },
  { culture: "ar-EG", theme: "light", motion: "instant" },
  { culture: "ar-EG", theme: "luxury", motion: "instant" },
  { culture: "ar-EG", theme: "light", motion: "instant" },
  { culture: "ar-EG", theme: "luxury", motion: "smooth" },
];
