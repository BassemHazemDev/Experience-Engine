import { ExperienceEngine } from "@experience-engine/core";
import NextClientExperience from "./next-client-experience";

function createEngine() {
  return new ExperienceEngine<"en-US" | "ar-EG", "light" | "luxury", "instant" | "smooth">({
    cultures: {
      "en-US": { locale: "en-US", direction: "ltr", typography: { fontFamily: "system-ui" }, formatting: {} },
      "ar-EG": { locale: "ar-EG", direction: "rtl", typography: { fontFamily: "system-ui" }, formatting: {} },
    },
    themes: {
      light: { tokens: { surface: "#ffffff", text: "#111111", card: "#f4f4f4", radius: 16 } },
      luxury: { tokens: { surface: "#111111", text: "#f4f4f4", card: "#1c1c1c", radius: 24 } },
    },
    motions: {
      instant: { defaultStrategy: "instant", durationMs: 0 },
      smooth: { defaultStrategy: "css", durationMs: 250, easing: "ease" },
    },
    initial: { culture: "ar-EG", theme: "luxury", motion: "smooth" },
  });
}

export default async function Page() {
  const engine = createEngine();
  const experience = await engine.init();
  return <main id="server-experience" data-render-source="server-component" data-server-culture={experience.request.culture} data-server-theme={experience.request.theme} data-server-motion={experience.request.motion} dir={experience.direction}>
    <section><div id="server-proof"><h1>Experience Engine — Next.js</h1><p>Server Component rendered this experience before hydration.</p><pre>{JSON.stringify({ source: "server-component", id: experience.id, culture: experience.request.culture, theme: experience.request.theme, motion: experience.request.motion, direction: experience.direction }, null, 2)}</pre></div>
    <NextClientExperience initialRequest={{ culture: experience.request.culture as "en-US" | "ar-EG", theme: experience.request.theme as "light" | "luxury", motion: experience.request.motion as "instant" | "smooth" }} /></section>
  </main>;
}
