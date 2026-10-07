import type { Messages } from "./en-US";

export type { Messages };

// Catalogs are filled by the translation resources that the engine prepares
// before it commits a culture. Nothing is registered up front: a locale's copy
// is only readable once its resource has loaded (or the server handed it over
// for the first render).
const catalog = new Map<string, Messages>();

export function registerMessages(locale: string, messages: Messages): Messages {
  catalog.set(locale, messages);
  return messages;
}

export function getMessages(locale: string): Messages | undefined {
  return catalog.get(locale);
}

export const messageLoaders: Record<string, () => Promise<Messages>> = {
  "en-US": () => import("./en-US").then((m) => m.default),
  "ar-EG": () => import("./ar-EG").then((m) => m.default),
};
