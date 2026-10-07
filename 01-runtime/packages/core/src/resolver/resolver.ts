import {
  ExperienceEngineError,
} from "../errors/index";
import type {
  CultureDefinition,
  CultureId,
  ExperienceDelta,
  ExperienceRequest,
  MotionDefinition,
  ResolvedExperience,
  ThemeDefinition,
  ThemeId,
} from "../types/index";
import { Registry } from "../registry/registry";

const MAX_INHERITANCE_DEPTH = 16;

const clone = <T>(value: T): T => {
  if (typeof value === "function" || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => clone(item)) as T;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    out[key] = clone(child);
  }
  return out as T;
};

const freezeDeep = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      freezeDeep(child);
    }
  }
  return value;
};

function merge<T extends object>(base: T, override: Partial<T>): T {
  const out = clone(base) as Record<string, unknown>;
  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined) out[key] = value;
  }
  return out as T;
}

export interface ResolverRegistries {
  readonly cultures: Registry<CultureDefinition>;
  readonly themes: Registry<ThemeDefinition>;
  readonly motions: Registry<MotionDefinition>;
}

export function resolveCulture(
  id: CultureId,
  registries: ResolverRegistries,
): CultureDefinition {
  const visited = new Set<string>();
  const chain: CultureDefinition[] = [];
  let currentId: string | undefined = id;

  for (let depth = 0; currentId; depth++) {
    if (depth >= MAX_INHERITANCE_DEPTH) {
      throw new ExperienceEngineError(
        "INHERITANCE_DEPTH_EXCEEDED",
        `Culture inheritance exceeded ${MAX_INHERITANCE_DEPTH} levels.`,
      );
    }
    if (visited.has(currentId)) {
      throw new ExperienceEngineError(
        "INHERITANCE_CYCLE",
        `Culture inheritance cycle detected at ${currentId}.`,
      );
    }
    visited.add(currentId);
    const current = registries.cultures.get(currentId);
    if (!current) {
      throw new ExperienceEngineError("UNKNOWN_CULTURE", `Unknown culture: ${currentId}`);
    }
    chain.push(current);
    currentId = current.extends;
  }

  let result: CultureDefinition = { locale: id, direction: "ltr" };
  for (let i = chain.length - 1; i >= 0; i--) {
    result = merge(result, chain[i]);
  }
  return result;
}

export function resolveTheme(
  id: ThemeId,
  registries: ResolverRegistries,
): ThemeDefinition {
  const visited = new Set<string>();
  const chain: ThemeDefinition[] = [];
  let currentId: string | undefined = id;

  for (let depth = 0; currentId; depth++) {
    if (depth >= MAX_INHERITANCE_DEPTH) {
      throw new ExperienceEngineError(
        "INHERITANCE_DEPTH_EXCEEDED",
        `Theme inheritance exceeded ${MAX_INHERITANCE_DEPTH} levels.`,
      );
    }
    if (visited.has(currentId)) {
      throw new ExperienceEngineError(
        "INHERITANCE_CYCLE",
        `Theme inheritance cycle detected at ${currentId}.`,
      );
    }
    visited.add(currentId);
    const current = registries.themes.get(currentId);
    if (!current) {
      throw new ExperienceEngineError("UNKNOWN_THEME", `Unknown theme: ${currentId}`);
    }
    chain.push(current);
    currentId = current.extends;
  }

  let result: ThemeDefinition = { tokens: {} };
  for (let i = chain.length - 1; i >= 0; i--) {
    const current = chain[i];
    result = {
      ...merge(result, current),
      tokens: { ...(result.tokens ?? {}), ...(current.tokens ?? {}) },
    };
  }
  return result;
}

function computeDelta(
  previous: ResolvedExperience | undefined,
  next: ResolvedExperience,
): ExperienceDelta {
  if (!previous) {
    return {
      cultureChanged: true,
      themeChanged: true,
      motionChanged: true,
      changedKeys: ["culture", "theme", "motion", "direction", "locale", "tokens"],
    };
  }

  const changedKeys: string[] = [];
  const previousRequest = previous.request;
  const nextRequest = next.request;

  if (previousRequest.culture !== nextRequest.culture) changedKeys.push("culture");
  if (previousRequest.theme !== nextRequest.theme) changedKeys.push("theme");
  if (previousRequest.motion !== nextRequest.motion) changedKeys.push("motion");
  if (previous.direction !== next.direction) changedKeys.push("direction");
  if (previous.locale !== next.locale) changedKeys.push("locale");

  const allTokens = new Set([...Object.keys(previous.tokens), ...Object.keys(next.tokens)]);
  for (const token of allTokens) {
    if (previous.tokens[token] !== next.tokens[token]) changedKeys.push(`token:${token}`);
  }

  return {
    cultureChanged: previousRequest.culture !== nextRequest.culture,
    themeChanged: previousRequest.theme !== nextRequest.theme,
    motionChanged: previousRequest.motion !== nextRequest.motion,
    changedKeys,
  };
}

export function resolveExperience(
  request: ExperienceRequest,
  registries: ResolverRegistries,
  previous?: ResolvedExperience,
): ResolvedExperience {
  if (!request?.culture || !request?.theme) {
    throw new ExperienceEngineError(
      "INVALID_REQUEST",
      "culture and theme are required.",
    );
  }

  const culture = resolveCulture(request.culture, registries);
  const theme = resolveTheme(request.theme, registries);

  let motion: MotionDefinition = { defaultStrategy: "instant", durationMs: 0 };
  if (request.motion !== undefined) {
    const motionDefinition = registries.motions.get(request.motion);
    if (!motionDefinition) {
      throw new ExperienceEngineError(
        "UNKNOWN_MOTION",
        `Unknown motion: ${request.motion}`,
      );
    }
    motion = motionDefinition;
  }

  const resources = [
    ...(culture.resources ?? []),
    ...(theme.resources ?? []),
  ];

  const base: ResolvedExperience = {
    id: `${request.culture}::${request.theme}::${request.motion ?? "instant"}`,
    request: {
      culture: request.culture,
      theme: request.theme,
      motion: request.motion ?? "instant",
    },
    locale: culture.locale,
    direction: culture.direction,
    tokens: { ...(theme.tokens ?? {}) },
    formatting: { ...(culture.formatting ?? {}) },
    typography: { ...(culture.typography ?? {}) },
    resources,
    motion,
  };

  const next: ResolvedExperience = {
    ...base,
    delta: computeDelta(previous, base),
  };

  return freezeDeep(next);
}
