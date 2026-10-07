import { ExperienceEngine } from "@experience-engine/core";
import { cultures, motions, themes, type Culture, type Motion, type StudioRequest, type Theme } from "./definitions";

export type StudioEngine = ExperienceEngine<Culture, Theme, Motion>;

/**
 * Always returns a new engine. Server code calls this once per request, so no
 * committed experience is ever shared between two visitors.
 */
export function createEngine(initial: StudioRequest): StudioEngine {
  return new ExperienceEngine<Culture, Theme, Motion>({ cultures, themes, motions, initial });
}
