import { DEFAULT_REQUEST, isCulture, isMotion, isTheme, type StudioRequest } from "./definitions";

export const EXPERIENCE_COOKIE = "experience";

export interface ParsedExperienceCookie {
  readonly request: StudioRequest;
  /** "cookie" when the cookie named a known experience, otherwise why the fallback was used. */
  readonly source: "cookie" | "missing" | "invalid";
}

/**
 * Cookie format: `<culture>.<theme>.<motion>`, e.g. `ar-EG.luxury.smooth`.
 * Each part must match a registered id exactly; anything else falls back to
 * the default experience. The value is only ever compared, never evaluated.
 */
export function parseExperienceCookie(value: string | undefined | null): ParsedExperienceCookie {
  if (!value) return { request: DEFAULT_REQUEST, source: "missing" };
  const parts = value.split(".");
  if (parts.length !== 3) return { request: DEFAULT_REQUEST, source: "invalid" };
  const [culture, theme, motion] = parts;
  if (!isCulture(culture) || !isTheme(theme) || !isMotion(motion)) {
    return { request: DEFAULT_REQUEST, source: "invalid" };
  }
  return { request: { culture, theme, motion }, source: "cookie" };
}

export function serializeExperienceCookie(request: StudioRequest): string {
  return `${request.culture}.${request.theme}.${request.motion}`;
}
