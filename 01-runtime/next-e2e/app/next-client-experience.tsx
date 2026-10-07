"use client";
import { useEffect, useRef, useState } from "react";
import { ExperienceProvider, useExperience } from "@experience-engine/react";
import { ExperienceEngine } from "@experience-engine/core";

type Request = { culture: "en-US" | "ar-EG"; theme: "light" | "luxury"; motion: "instant" | "smooth" };

function createClientEngine(initial: Request) {
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
    initial,
  });
}

async function waitForClientExperience(request: Request) {
  const deadline = performance.now() + 2000;
  while (performance.now() < deadline) {
    const element = document.querySelector("#client-experience");
    if (element instanceof HTMLElement && element.dataset.culture === request.culture && element.dataset.theme === request.theme && element.dataset.motion === request.motion && element.getAttribute("dir") === (request.culture === "ar-EG" ? "rtl" : "ltr")) return;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  throw new Error(`Client DOM did not converge to ${JSON.stringify(request)}`);
}

function Runtime() {
  const { experience, setExperience } = useExperience();
  const [results, setResults] = useState<unknown[]>([]);
  if (!experience) return <div data-client-status="loading">Initializing client...</div>;
  async function runBenchmark() {
    const requests: Request[] = [
      { culture: "en-US", theme: "light", motion: "instant" },
      { culture: "ar-EG", theme: "luxury", motion: "smooth" },
      { culture: "en-US", theme: "light", motion: "instant" },
    ];
    const measured = [];
    for (const request of requests) {
      const start = performance.now();
      await setExperience(request);
      await waitForClientExperience(request);
      const final = document.querySelector("#client-experience");
      measured.push({ request, final: { culture: final?.getAttribute("data-culture"), theme: final?.getAttribute("data-theme"), motion: final?.getAttribute("data-motion"), direction: final?.getAttribute("dir") }, latencyMs: performance.now() - start });
    }
    setResults(measured);
  }
  return <section id="client-experience" data-render-source="react-client-adapter" data-culture={experience.request.culture} data-theme={experience.request.theme} data-motion={experience.request.motion} dir={experience.direction}>
    <h2>Client Experience</h2>
    <p id="client-state">{experience.request.culture} · {experience.request.theme} · {experience.request.motion}</p>
    <button id="run-next-e2e" onClick={() => void runBenchmark()}>Run Next.js E2E Benchmark</button>
    <pre id="next-results">{results.length === 0 ? "Ready." : JSON.stringify(results, null, 2)}</pre>
  </section>;
}

export default function NextClientExperience({ initialRequest }: { initialRequest: Request }) {
  const engineRef = useRef<ReturnType<typeof createClientEngine> | null>(null);
  const [ready, setReady] = useState(false);
  if (!engineRef.current) engineRef.current = createClientEngine(initialRequest);
  useEffect(() => { let active = true; void engineRef.current!.init().then(() => { if (active) setReady(true); }); return () => { active = false; }; }, []);
  if (!ready) return <section id="client-bootstrap" data-client-ready="false"><p>Hydrating Experience Engine client adapter...</p></section>;
  return <ExperienceProvider engine={engineRef.current!}><Runtime /></ExperienceProvider>;
}
