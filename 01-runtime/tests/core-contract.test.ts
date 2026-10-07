import { ExperienceEngine, ExperienceEngineError, ComponentResolver } from "../packages/core/src/index";

const calls: string[] = [];

const engine = new ExperienceEngine<"en-US" | "ar-EG", "light" | "luxury", "instant" | "smooth">({
  cultures: {
    "en-US": {
      locale: "en-US",
      direction: "ltr",
      formatting: { currency: "USD" },
    },
    "ar-EG": {
      locale: "ar-EG",
      direction: "rtl",
      extends: "en-US",
      formatting: { currency: "EGP" },
    },
  },
  themes: {
    light: {
      tokens: { surface: "#fff", radius: 8 },
    },
    luxury: {
      tokens: { surface: "#111", radius: 16 },
      extends: "light",
    },
  },
  motions: {
    instant: { defaultStrategy: "instant", durationMs: 0 },
    smooth: { defaultStrategy: "css", durationMs: 250 },
  },
  initial: { culture: "en-US", theme: "light", motion: "instant" },
});

const run = async () => {
  const first = await engine.init();
  if (first.direction !== "ltr") throw new Error("Initial direction failed");

  const second = await engine.setExperience({
    culture: "ar-EG",
    theme: "luxury",
    motion: "smooth",
  });

  if (second.direction !== "rtl") throw new Error("RTL resolution failed");
  if (second.locale !== "ar-EG") throw new Error("Locale resolution failed");
  if (second.tokens.radius !== 16) throw new Error("Theme inheritance failed");
  if (second.tokens.surface !== "#111") throw new Error("Theme token resolution failed");
  if (!second.delta?.cultureChanged || !second.delta?.themeChanged) {
    throw new Error("Delta contract failed");
  }
  if (!Object.isFrozen(second)) throw new Error("Snapshot is not immutable");

  let failed = false;
  try {
    await engine.setExperience({
      culture: "ar-EG",
      theme: "missing",
      motion: "instant",
    } as never);
  } catch (error) {
    failed = error instanceof ExperienceEngineError &&
      error.code === "UNKNOWN_THEME";
  }
  if (!failed) throw new Error("Stable error code contract failed");
  if (engine.getExperience()?.request.theme !== "luxury") {
    throw new Error("Failed transition mutated committed state");
  }

  const resourceEngine = new ExperienceEngine<"en", "base", "instant">({
    cultures: {
      en: {
        locale: "en",
        direction: "ltr",
        resources: [{
          kind: "font",
          id: "brand",
          version: "1",
          load: async () => {
            calls.push("load");
            return { ok: true };
          },
        }],
      },
    },
    themes: {
      base: { tokens: {} },
    },
    initial: { culture: "en", theme: "base" },
  });

  await resourceEngine.init();
  await resourceEngine.preload({ culture: "en", theme: "base" });
  await resourceEngine.preload({ culture: "en", theme: "base" });
  if (calls.length !== 1) throw new Error("Resource dedup/cache failed");

  const resolver = new ComponentResolver({
    Button: {
      variants: { pill: "PillButton" },
      replacements: { mobile: "CompactButton" },
    },
  });
  if (resolver.resolve("Button", { variant: "pill" }).mode !== "variant") {
    throw new Error("Component variant failed");
  }
  if (resolver.resolve("Button", { replacement: "mobile" }).mode !== "replacement") {
    throw new Error("Component replacement failed");
  }

  console.log("ALL CORE V0.1 CONTRACT TESTS PASSED");
};

void run();
