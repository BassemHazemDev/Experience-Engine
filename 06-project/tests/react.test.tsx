// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EngineBoundary, useResolvedExperience, useStudioRuntime, useTransition } from "@/components/engine-boundary";
import { ExperiencePreview } from "@/components/preview/experience-preview";
import { DEFAULT_REQUEST } from "@/engine/definitions";
import { messageLoaders } from "@/engine/messages";

afterEach(cleanup);

let renders = 0;

function Probe() {
  const experience = useResolvedExperience();
  const { hydrated } = useStudioRuntime();
  const transition = useTransition();
  renders += 1;
  return (
    <div>
      <output data-testid="id">{experience.id}</output>
      <output data-testid="hydrated">{String(hydrated)}</output>
      <button onClick={() => void transition({ culture: "ar-EG", theme: "luxury", motion: "instant" })}>arabic</button>
      <button onClick={() => void transition({ culture: "en-US", theme: "light", motion: "instant" })}>english</button>
    </div>
  );
}

async function mount() {
  const initialMessages = await messageLoaders["en-US"]();
  return render(
    <EngineBoundary initialRequest={DEFAULT_REQUEST} initialMessages={initialMessages}>
      <Probe />
      <ExperiencePreview />
    </EngineBoundary>,
  );
}

describe("React adapter integration", () => {
  it("mounts the provider and exposes the snapshot through the hook", async () => {
    await mount();
    expect(screen.getByTestId("id").textContent).toBe("en-US::light::instant");
    await waitFor(() => expect(screen.getByTestId("hydrated").textContent).toBe("true"));
  });

  it("re-renders and updates the DOM after setExperience", async () => {
    const { container } = await mount();
    await waitFor(() => expect(screen.getByTestId("hydrated").textContent).toBe("true"));
    const root = container.querySelector(".xp-root") as HTMLElement;
    expect(root.getAttribute("dir")).toBe("ltr");
    expect(root.textContent).toContain("Nova Commerce");

    const before = renders;
    await act(async () => {
      fireEvent.click(screen.getByText("arabic"));
    });

    await waitFor(() => expect(root.getAttribute("data-experience-id")).toBe("ar-EG::luxury::instant"));
    expect(renders).toBeGreaterThan(before);
    expect(screen.getByTestId("id").textContent).toBe("ar-EG::luxury::instant");
    expect(root.getAttribute("dir")).toBe("rtl");
    expect(root.getAttribute("lang")).toBe("ar-EG");
    expect(root.textContent).toContain("نوفا كوميرس");
    expect(root.style.getPropertyValue("--xp-surface")).toBe("#100e0b");

    await act(async () => {
      fireEvent.click(screen.getByText("english"));
    });
    await waitFor(() => expect(root.getAttribute("dir")).toBe("ltr"));
    expect(root.style.getPropertyValue("--xp-surface")).toBe("#f5f6f8");
  });
});
