import React from "react";
import { useExperience, ExperienceProvider } from "../packages/react/src/index.ts";
import { createRoot } from "react-dom/client";
import { ExperienceEngine } from "@experience-engine/core";
import { createBrowserHarness } from "./harness.js";

type Request = {
  culture: "en-US" | "ar-EG";
  theme: "light" | "luxury";
  motion: "instant" | "smooth";
};

const rootElement = document.querySelector("#root");
if (!(rootElement instanceof HTMLElement)) throw new Error("Missing #root element.");

const engine = new ExperienceEngine<"en-US" | "ar-EG", "light" | "luxury", "instant" | "smooth">({
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
  initial: { culture: "en-US", theme: "light", motion: "instant" },
});

let latestSetExperience: ((request: Request) => Promise<unknown>) | undefined;
let renderCount = 0;

function ReactExperienceApp() {
  const { experience, setExperience } = useExperience();
  renderCount++;
  latestSetExperience = setExperience as unknown as (request: Request) => Promise<unknown>;
  if (!experience) return React.createElement("div", null, "Loading...");
  const tokens = experience.tokens;
  return React.createElement(
    "main",
    {
      id: "experience-root",
      dir: experience.direction,
      "data-culture": experience.request.culture,
      "data-theme": experience.request.theme,
      "data-motion": experience.request.motion,
      style: { minHeight: "100vh", padding: "32px", boxSizing: "border-box", background: String(tokens.surface), color: String(tokens.text) },
    },
    React.createElement(
      "section",
      { style: { maxWidth: "760px", margin: "64px auto", padding: "48px", borderRadius: `${tokens.radius}px`, background: String(tokens.card), boxSizing: "border-box" } },
      React.createElement("h1", { id: "experience-title" }, experience.request.culture === "ar-EG" ? "محرك التجربة" : "Experience Engine"),
      React.createElement("p", { id: "experience-state" }, `${experience.request.culture} · ${experience.request.theme} · ${experience.request.motion}`),
      React.createElement("button", { id: "run-benchmark" }, "Run React E2E Benchmark"),
      React.createElement("pre", { id: "benchmark-result" }, "Ready."),
    ),
  );
}

async function waitForReactDOM(request: Request) {
  const deadline = performance.now() + 2000;
  while (performance.now() < deadline) {
    const root = document.querySelector("#experience-root");
    if (root instanceof HTMLElement && root.dataset.culture === request.culture && root.dataset.theme === request.theme && root.dataset.motion === request.motion && root.dir === (request.culture === "ar-EG" ? "rtl" : "ltr")) return;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
  throw new Error(`React DOM did not converge to ${JSON.stringify(request)}`);
}

const benchmarkHarness = createBrowserHarness({
  switchExperience: async (request, hooks) => {
    if (!latestSetExperience) throw new Error("React adapter is not mounted yet.");
    const reactRequest = request as Request;
    hooks.onTransitionStart?.();
    const resolved = await latestSetExperience(reactRequest);
    hooks.onResourceReady?.();
    await waitForReactDOM(reactRequest);
    hooks.onTransitionEnd?.();
    return resolved;
  },
  getExperience: () => engine.getExperience(),
});

function assertSample(request: Request, sample: any) {
  const final = sample.finalExperience?.request;
  return Boolean(final && final.culture === request.culture && final.theme === request.theme && final.motion === request.motion);
}

async function runBenchmark() {
  const output = document.querySelector("#benchmark-result");
  if (!(output instanceof HTMLElement)) throw new Error("Missing #benchmark-result.");
  const requests: Request[] = [
    { culture: "ar-EG", theme: "luxury", motion: "smooth" },
    { culture: "en-US", theme: "light", motion: "instant" },
    { culture: "ar-EG", theme: "luxury", motion: "smooth" },
  ];
  const samples = [];
  const renderCounts = [];
  for (const request of requests) {
    const before = renderCount;
    const sample = await benchmarkHarness.measureSwitch(request);
    const after = renderCount;
    samples.push({ ...sample, correctness: assertSample(request, sample), reactRenders: after - before });
    renderCounts.push(after - before);
  }
  const status = samples.length === requests.length && samples.every((s) => s.correctness && s.reactRenders >= 1) ? "PASS" : "FAIL";
  output.textContent = JSON.stringify({ status, react: { version: "18.3.1", adapter: "@experience-engine/react", createRoot: true, useSyncExternalStore: true, actualReactRenders: renderCounts }, environment: { userAgent: navigator.userAgent, viewport: `${innerWidth}x${innerHeight}`, reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches }, assertions: { requestedStateMatchesFinalState: samples.every((s) => s.correctness), actualReactRerenderObserved: samples.every((s) => s.reactRenders >= 1) }, samples }, null, 2);
}

await engine.init();
const root = createRoot(rootElement);
root.render(React.createElement(ExperienceProvider, { engine }, React.createElement(ReactExperienceApp)));
await waitForReactDOM({ culture: "en-US", theme: "light", motion: "instant" });
document.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.id === "run-benchmark") void runBenchmark();
});
