import { CULTURES, DEFAULT_REQUEST, MOTIONS, THEMES, type Request } from "./experience";

export const COOKIE = "experience";

/**
 * Cookie format: <culture>.<theme>.<motion>, for example ar-EG.dark.smooth.
 * Each part must equal a registered id. Anything else gets the default.
 * The value is only compared, never evaluated.
 */
export function parseCookie(value: string | undefined): Request {
  const [culture, theme, motion, ...rest] = (value ?? "").split(".");
  const valid =
    rest.length === 0 &&
    (CULTURES as readonly string[]).includes(culture) &&
    (THEMES as readonly string[]).includes(theme) &&
    (MOTIONS as readonly string[]).includes(motion);
  return valid ? ({ culture, theme, motion } as Request) : DEFAULT_REQUEST;
}
