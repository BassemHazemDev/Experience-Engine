// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EngineBoundary, useEngineStatus, useStudioRuntime } from "@/components/engine-boundary";
import { resolveComponents } from "@/components/preview/adaptation";
import { effectiveMotion } from "@/components/preview/use-presented-experience";
import { createEngine } from "@/engine/create-engine";
import { DEFAULT_REQUEST, motions } from "@/engine/definitions";
import { messageLoaders } from "@/engine/messages";
import { clearFaults, setFault } from "@/engine/resources";

afterEach(() => {
  cleanup();
  clearFaults();
});

describe("motion presentation", () => {
  it("plays each motion definition as declared when there is no preference", () => {
    expect(effectiveMotion(motions.instant, false)).toMatchObject({ strategy: "instant", durationMs: 0, clampedByPreference: false });
    expect(effectiveMotion(motions.smooth, false)).toMatchObject({ strategy: "view-transition", durationMs: 480, clampedByPreference: false });
    expect(effectiveMotion(motions.reduced, false)).toMatchObject({ strategy: "css", durationMs: 140, clampedByPreference: false });
  });

  it("a reduced-motion preference shortens presentation without touching the definition", () => {
    const shown = effectiveMotion(motions.smooth, true);
    expect(shown).toMatchObject({ strategy: "css", clampedByPreference: true });
    expect(shown.durationMs).toBeLessThanOrEqual(140);
    // The engine's definition is untouched.
    expect(motions.smooth).toMatchObject({ defaultStrategy: "view-transition", durationMs: 480 });
    // Instant has nothing to reduce.
    expect(effectiveMotion(motions.instant, true)).toMatchObject({ strategy: "instant", clampedByPreference: false });
  });
});

describe("component adaptation", () => {
  it("is derived from the resolved experience through the core ComponentResolver", async () => {
    const engine = createEngine(DEFAULT_REQUEST);
    const light = resolveComponents(await engine.init());
    expect(light.navigation).toEqual({ mode: "base", component: "Navigation" });
    expect(light.orders).toEqual({ mode: "base", component: "OrdersTable" });

    const midnight = resolveComponents(await engine.setTheme("midnight"));
    expect(midnight.navigation).toEqual({ mode: "variant", component: "NavigationCompact", variant: "compact" });
    expect(midnight.orders).toEqual({ mode: "replacement", component: "OrdersList" });

    // The engine's own delta reports the selecting tokens.
    const { changedKeys } = engine.runtime.getLastTransaction()!.delta;
    expect(changedKeys).toContain("token:component.nav");
    expect(changedKeys).toContain("token:component.orders");
  });
});

function Status() {
  const status = useEngineStatus();
  const { retryStart } = useStudioRuntime();
  return (
    <div>
      <output data-testid="status">{status}</output>
      <button onClick={retryStart}>retry</button>
    </div>
  );
}

describe("engine start", () => {
  it("reports a failed start instead of claiming to be ready, and recovers on retry", async () => {
    setFault("translation", true);
    render(
      <EngineBoundary initialRequest={DEFAULT_REQUEST} initialMessages={await messageLoaders["en-US"]()}>
        <Status />
      </EngineBoundary>,
    );
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("failed"));

    clearFaults();
    await act(async () => {
      fireEvent.click(screen.getByText("retry"));
    });
    await waitFor(() => expect(screen.getByTestId("status").textContent).toBe("ready"));
  });
});
