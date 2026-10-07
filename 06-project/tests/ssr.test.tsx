import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { EngineBoundary } from "@/components/engine-boundary";
import { ExperiencePreview } from "@/components/preview/experience-preview";
import { createEngine } from "@/engine/create-engine";
import type { StudioRequest } from "@/engine/definitions";
import { parseExperienceCookie } from "@/engine/experience-cookie";
import { messageLoaders } from "@/engine/messages";

/** Same steps as app/personalized/page.tsx: cookie → fresh engine → server HTML. */
async function renderFor(cookie: string | undefined) {
  const { request, source } = parseExperienceCookie(cookie);
  const engine = createEngine(request);
  const experience = await engine.init();
  const initial = experience.request as StudioRequest;
  const html = renderToString(
    <EngineBoundary initialRequest={initial} initialMessages={await messageLoaders[initial.culture]()}>
      <ExperiencePreview />
    </EngineBoundary>,
  );
  return { html, experience, source };
}

describe("server rendering", () => {
  it("cookie A renders experience A before any client code runs", async () => {
    const { html, experience } = await renderFor("ar-EG.luxury.smooth");
    expect(experience.id).toBe("ar-EG::luxury::smooth");
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('data-experience-id="ar-EG::luxury::smooth"');
    expect(html).toContain("نوفا كوميرس");
    expect(html).toContain("--xp-surface:#100e0b");
  });

  it("cookie B renders experience B from the same code path", async () => {
    const { html, experience } = await renderFor("en-US.light.instant");
    expect(experience.id).toBe("en-US::light::instant");
    expect(html).toContain('dir="ltr"');
    expect(html).toContain("Nova Commerce");
    expect(html).not.toContain("نوفا كوميرس");
  });

  it("different cookies produce different server output", async () => {
    const [a, b] = await Promise.all([renderFor("ar-EG.luxury.smooth"), renderFor("en-US.light.instant")]);
    expect(a.html).not.toBe(b.html);
  });

  it("an invalid cookie renders the safe default", async () => {
    const { html, experience, source } = await renderFor("fr-FR.neon.fast");
    expect(source).toBe("invalid");
    expect(experience.id).toBe("en-US::light::instant");
    expect(html).toContain('dir="ltr"');
  });
});
