// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ResolvedExperience } from "@experience-engine/core";
import { createExperienceStore, ExperienceProvider, useExperience } from "@experience-engine/react";
import { createEngine, type StudioEngine } from "@/engine/create-engine";
import { DEFAULT_REQUEST, type StudioRequest } from "@/engine/definitions";
import { RAPID_SEQUENCE } from "@/engine/presets";
import { clearFaults, setFault } from "@/engine/resources";

const AR: StudioRequest = { culture: "ar-EG", theme: "luxury", motion: "instant" };
const MIDNIGHT: StudioRequest = { culture: "en-US", theme: "midnight", motion: "instant" };

afterEach(() => {
  cleanup();
  clearFaults();
  vi.restoreAllMocks();
});

async function readyEngine(): Promise<StudioEngine> {
  const engine = createEngine(DEFAULT_REQUEST);
  await engine.init();
  return engine;
}

/** Counts how many commit listeners the engine currently holds. */
function trackSubscriptions(engine: StudioEngine) {
  let active = 0;
  const original = engine.subscribe.bind(engine);
  vi.spyOn(engine, "subscribe").mockImplementation((listener) => {
    active += 1;
    const off = original(listener);
    return () => {
      active -= 1;
      off();
    };
  });
  return { active: () => active };
}

function Reader({ name, counter }: { name: string; counter: { renders: number } }) {
  const { experience } = useExperience();
  counter.renders += 1;
  return <output data-testid={name}>{experience?.id ?? "none"}</output>;
}

describe("core commit subscription", () => {
  it("notifies after a commit, with the committed experience", async () => {
    const engine = await readyEngine();
    const seen: ResolvedExperience[] = [];
    engine.subscribe((experience) => {
      // The listener runs after the commit is visible, never before.
      expect(engine.getExperience()).toBe(experience);
      seen.push(experience);
    });

    const committed = await engine.setExperience(AR);
    expect(seen).toEqual([committed]);
  });

  it("does not notify for failed or stale transitions", async () => {
    const engine = await readyEngine();
    const listener = vi.fn();
    engine.subscribe(listener);

    setFault("translation", true);
    await engine.setExperience(AR).catch(() => undefined);
    expect(listener).not.toHaveBeenCalled();
    clearFaults();

    await Promise.allSettled(RAPID_SEQUENCE.map((request) => engine.setExperience(request)));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].id).toBe("ar-EG::luxury::smooth");
  });

  it("a throwing listener cannot fail or undo a commit", async () => {
    const engine = await readyEngine();
    const after = vi.fn();
    engine.subscribe(() => {
      throw new Error("observer bug");
    });
    engine.subscribe(after);

    const committed = await engine.setExperience(AR);
    expect(engine.getExperience()).toBe(committed);
    expect(engine.inspect().status).toBe("COMMITTED");
    expect(after).toHaveBeenCalledTimes(1);
  });

  it("stops notifying after unsubscribe", async () => {
    const engine = await readyEngine();
    const listener = vi.fn();
    const off = engine.subscribe(listener);
    off();
    await engine.setExperience(AR);
    expect(listener).not.toHaveBeenCalled();
  });
});

describe("React adapter store", () => {
  it("A: returns the initial snapshot", async () => {
    const engine = await readyEngine();
    const store = createExperienceStore(engine);
    expect(store.getSnapshot()).toBe(engine.getExperience());
    expect(store.getServerSnapshot()).toBe(engine.getExperience());
  });

  it("B: engine.setExperience() re-renders a React component", async () => {
    const engine = await readyEngine();
    const counter = { renders: 0 };
    render(
      <ExperienceProvider engine={engine}>
        <Reader name="a" counter={counter} />
      </ExperienceProvider>,
    );
    expect(screen.getByTestId("a").textContent).toBe("en-US::light::instant");
    const before = counter.renders;

    await act(async () => {
      await engine.setExperience(AR);
    });

    expect(screen.getByTestId("a").textContent).toBe("ar-EG::luxury::instant");
    expect(counter.renders).toBeGreaterThan(before);
  });

  it("C: two independent subscribers receive the same committed experience", async () => {
    const engine = await readyEngine();
    const a = { renders: 0 };
    const b = { renders: 0 };
    render(
      <ExperienceProvider engine={engine}>
        <section>
          <Reader name="a" counter={a} />
        </section>
        <section>
          <Reader name="b" counter={b} />
        </section>
      </ExperienceProvider>,
    );

    await act(async () => {
      await engine.setExperience(MIDNIGHT);
    });

    expect(screen.getByTestId("a").textContent).toBe("en-US::midnight::instant");
    expect(screen.getByTestId("b").textContent).toBe("en-US::midnight::instant");
  });

  it("D: a subscriber that reads the snapshot does not hide the update from another", async () => {
    const engine = await readyEngine();
    const store = createExperienceStore(engine);
    const seenByFirst: (string | undefined)[] = [];
    const seenBySecond: (string | undefined)[] = [];

    // The first listener reads the snapshot as soon as it is told, and extra
    // reads happen in between, exactly the pattern that used to swallow the
    // notification for everyone else.
    store.subscribe(() => seenByFirst.push(store.getSnapshot()?.id));
    store.subscribe(() => seenBySecond.push(store.getSnapshot()?.id));

    for (const request of [AR, MIDNIGHT, DEFAULT_REQUEST]) {
      store.getSnapshot();
      await engine.setExperience(request);
      store.getSnapshot();
    }

    const expected = ["ar-EG::luxury::instant", "en-US::midnight::instant", "en-US::light::instant"];
    expect(seenByFirst).toEqual(expected);
    expect(seenBySecond).toEqual(expected);
  });

  it("E: rapid requests keep the core's stale semantics and notify once", async () => {
    const engine = await readyEngine();
    const store = createExperienceStore(engine);
    const listener = vi.fn();
    store.subscribe(listener);

    const results = await Promise.allSettled(RAPID_SEQUENCE.map((request) => engine.setExperience(request)));

    expect(results.map((result) => result.status)).toEqual(["rejected", "rejected", "rejected", "rejected", "fulfilled"]);
    for (const result of results.slice(0, 4)) {
      expect((result as PromiseRejectedResult).reason.code).toBe("TRANSITION_STALE");
    }
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()?.id).toBe("ar-EG::luxury::smooth");
  });

  it("F: unmounted subscribers are removed from the engine", async () => {
    const engine = await readyEngine();
    const subscriptions = trackSubscriptions(engine);
    const counter = { renders: 0 };

    const view = render(
      <ExperienceProvider engine={engine}>
        <Reader name="a" counter={counter} />
        <Reader name="b" counter={counter} />
      </ExperienceProvider>,
    );
    // Any number of components share one engine subscription.
    expect(subscriptions.active()).toBe(1);

    view.unmount();
    expect(subscriptions.active()).toBe(0);

    const rendersAfterUnmount = counter.renders;
    await engine.setExperience(AR);
    expect(counter.renders).toBe(rendersAfterUnmount);
  });

  it("G: uses no polling timers", async () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    const engine = await readyEngine();
    const counter = { renders: 0 };

    const view = render(
      <ExperienceProvider engine={engine}>
        <Reader name="a" counter={counter} />
      </ExperienceProvider>,
    );
    await act(async () => {
      await engine.setExperience(AR);
    });
    // No waitFor here: it polls with setInterval itself.
    expect(screen.getByTestId("a").textContent).toBe("ar-EG::luxury::instant");
    view.unmount();

    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it("H: getSnapshot is referentially stable between commits", async () => {
    const engine = await readyEngine();
    const store = createExperienceStore(engine);
    store.subscribe(() => undefined);
    const first = store.getSnapshot();

    expect(store.getSnapshot()).toBe(first);

    // A failed transition and a stale one leave the snapshot untouched.
    setFault("translation", true);
    await engine.setExperience(AR).catch(() => undefined);
    clearFaults();
    expect(store.getSnapshot()).toBe(first);

    const committed = await engine.setExperience(AR);
    expect(store.getSnapshot()).toBe(committed);
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it("catches up when a commit lands before the first subscriber attaches", async () => {
    const engine = createEngine(DEFAULT_REQUEST);
    const store = createExperienceStore(engine);
    expect(store.getSnapshot()).toBeUndefined();

    const committed = await engine.init();
    store.subscribe(() => undefined);
    expect(store.getSnapshot()).toBe(committed);
  });
});
