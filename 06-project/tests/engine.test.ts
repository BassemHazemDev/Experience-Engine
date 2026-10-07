// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { ExperienceEngineError } from "@experience-engine/core";
import { createEngine } from "@/engine/create-engine";
import { DEFAULT_REQUEST, type StudioRequest } from "@/engine/definitions";
import { getMessages } from "@/engine/messages";
import { RAPID_SEQUENCE } from "@/engine/presets";
import { clearFaults, setFault } from "@/engine/resources";
import { createTransitionRecorder } from "@/features/transition-recorder/recorder";

const AR_LUXURY: StudioRequest = { culture: "ar-EG", theme: "luxury", motion: "smooth" };

afterEach(() => clearFaults());

describe("core integration", () => {
  it("initialises with the initial request", async () => {
    const engine = createEngine(DEFAULT_REQUEST);
    const experience = await engine.init();
    expect(experience.id).toBe("en-US::light::instant");
    expect(engine.getExperience()).toBe(experience);
    expect(engine.inspect().status).toBe("COMMITTED");
  });

  it("setExperience resolves a complete, immutable snapshot", async () => {
    const engine = createEngine(DEFAULT_REQUEST);
    await engine.init();
    const experience = await engine.setExperience(AR_LUXURY);

    expect(experience.request).toEqual(AR_LUXURY);
    expect(experience.locale).toBe("ar-EG");
    expect(experience.direction).toBe("rtl");
    expect(experience.tokens.surface).toBe("#100e0b");
    expect(experience.motion.defaultStrategy).toBe("view-transition");
    expect(experience.formatting.currency).toBe("EGP");
    expect(Object.isFrozen(experience)).toBe(true);
    expect(experience.delta).toMatchObject({ cultureChanged: true, themeChanged: true, motionChanged: true });
  });

  it("resolves direction from culture: ar-EG is rtl, en-US is ltr", async () => {
    const engine = createEngine(DEFAULT_REQUEST);
    expect((await engine.init()).direction).toBe("ltr");
    expect((await engine.setCulture("ar-EG")).direction).toBe("rtl");
    expect((await engine.setCulture("en-US")).direction).toBe("ltr");
  });

  it("keeps the dimensions independent", async () => {
    const engine = createEngine(DEFAULT_REQUEST);
    await engine.init();
    const arabic = await engine.setCulture("ar-EG");
    // Changing culture leaves theme tokens and motion untouched.
    expect(arabic.request.theme).toBe("light");
    expect(arabic.motion.defaultStrategy).toBe("instant");
    expect(arabic.delta).toMatchObject({ cultureChanged: true, themeChanged: false, motionChanged: false });
    expect(arabic.delta?.changedKeys.some((key) => key.startsWith("token:"))).toBe(false);
  });

  it("prepares the translation before the culture is committed", async () => {
    const engine = createEngine(DEFAULT_REQUEST);
    await engine.init();
    await engine.setExperience(AR_LUXURY);
    expect(getMessages("ar-EG")?.brand).toBe("نوفا كوميرس");
  });

  it("exposes the typed delta and dependency closure on the transaction", async () => {
    const engine = createEngine(DEFAULT_REQUEST);
    await engine.init();
    await engine.setExperience(AR_LUXURY);
    const transaction = engine.runtime.getLastTransaction()!;

    expect(transaction.status).toBe("COMMITTED");
    expect(transaction.delta.culture.direction).toEqual({ from: "ltr", to: "rtl" });
    expect(transaction.delta.theme.tokenKeys).toContain("surface");
    expect(transaction.delta.motion.strategy).toEqual({ from: "instant", to: "view-transition" });
    expect(transaction.affected).toContain("direction:rtl");
    expect(transaction.affected).toContain("token:surface");
  });

  it("a motion-only change prepares a closure with no tokens in it", async () => {
    const engine = createEngine(DEFAULT_REQUEST);
    await engine.init();
    await engine.setMotion("smooth");
    const transaction = engine.runtime.getLastTransaction()!;
    expect(transaction.affected).toEqual(["motion:smooth"]);
  });
});

describe("rapid transitions", () => {
  it("commits only the latest request and reports the rest as stale", async () => {
    const engine = createEngine(DEFAULT_REQUEST);
    await engine.init();
    const recorder = createTransitionRecorder(engine);

    const records = await Promise.all(RAPID_SEQUENCE.map((request) => recorder.transition(request)));

    expect(records.map((record) => record.outcome)).toEqual(["stale", "stale", "stale", "stale", "committed"]);
    expect(records.slice(0, 4).every((record) => record.errorCode === "TRANSITION_STALE")).toBe(true);
    expect(engine.getExperience()?.id).toBe("ar-EG::luxury::smooth");
    expect(recorder.getState().pending).toBe(0);
  });
});

describe("failure and recovery", () => {
  it("preserves the committed experience when a resource fails, then succeeds on retry", async () => {
    const engine = createEngine(DEFAULT_REQUEST);
    const before = await engine.init();

    setFault("translation", true);
    const failure = await engine.setExperience(AR_LUXURY).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ExperienceEngineError);
    expect((failure as ExperienceEngineError).code).toBe("RESOURCE_LOAD_FAILED");
    expect(engine.getExperience()).toBe(before);
    expect(engine.runtime.getLastTransaction()?.status).toBe("FAILED");

    clearFaults();
    const retried = await engine.setExperience(AR_LUXURY);
    expect(retried.id).toBe("ar-EG::luxury::smooth");
    expect(engine.getExperience()).toBe(retried);
  });

  it("rejects an unregistered theme without changing state", async () => {
    const engine = createEngine(DEFAULT_REQUEST);
    const before = await engine.init();
    const recorder = createTransitionRecorder(engine);

    const record = await recorder.transition({ culture: "en-US", theme: "neon", motion: "instant" } as unknown as StudioRequest);

    expect(record.outcome).toBe("failed");
    expect(record.errorCode).toBe("UNKNOWN_THEME");
    expect(engine.getExperience()).toBe(before);
  });
});

describe("isolation", () => {
  it("two engines never share committed state", async () => {
    const a = createEngine(AR_LUXURY);
    const b = createEngine(DEFAULT_REQUEST);
    await Promise.all([a.init(), b.init()]);
    expect(a.getExperience()?.id).toBe("ar-EG::luxury::smooth");
    expect(b.getExperience()?.id).toBe("en-US::light::instant");
  });
});
