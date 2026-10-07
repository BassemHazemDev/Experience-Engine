import { createBrowserHarness } from "./harness.js";

const app = document.querySelector("[data-app]");
const result = document.querySelector("[data-result]");

let current = {
  culture: "en-US",
  theme: "light",
  motion: "instant",
};

const profiles = {
  "en-US": { dir: "ltr", label: "Experience Engine" },
  "ar-EG": { dir: "rtl", label: "محرك التجربة" },
};

const themes = {
  light: { surface: "#fff", text: "#111", card: "#f4f4f4", radius: "16px" },
  luxury: { surface: "#111", text: "#f4f4f4", card: "#1c1c1c", radius: "24px" },
};

function apply(experience) {
  const culture = profiles[experience.culture];
  const theme = themes[experience.theme];

  app.dir = culture.dir;
  app.dataset.culture = experience.culture;
  app.dataset.theme = experience.theme;
  app.dataset.motion = experience.motion;

  const root = document.documentElement;
  root.style.setProperty("--surface", theme.surface);
  root.style.setProperty("--text", theme.text);
  root.style.setProperty("--card", theme.card);
  root.style.setProperty("--radius", theme.radius);

  document.querySelector("[data-card] h1").textContent = culture.label;
}

const subscribers = new Set();

async function switchExperience(request, hooks = {}) {
  const next = {
    culture: request.culture ?? current.culture,
    theme: request.theme ?? current.theme,
    motion: request.motion ?? current.motion,
  };

  hooks.onTransitionStart?.();

  // In the real adapter these hooks are emitted from the Core/runtime lifecycle.
  // The demo intentionally models them around the same atomic switch boundary.
  apply(next);

  hooks.onResourceReady?.();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));

  current = next;
  hooks.onTransitionEnd?.();

  for (const notify of subscribers) notify();
}

const harness = createBrowserHarness({
  switchExperience,
  getExperience: () => ({ ...current }),
});

function renderResult(value) {
  result.textContent = JSON.stringify(value, null, 2);
}

document.querySelectorAll("[data-culture]").forEach((button) => {
  button.addEventListener("click", () => {
    void switchExperience({ culture: button.dataset.culture });
  });
});

document.querySelectorAll("[data-theme]").forEach((button) => {
  button.addEventListener("click", () => {
    void switchExperience({ theme: button.dataset.theme });
  });
});

document.querySelectorAll("[data-motion]").forEach((button) => {
  button.addEventListener("click", () => {
    void switchExperience({ motion: button.dataset.motion });
  });
});

document.querySelector("[data-run]").addEventListener("click", async () => {
  const samples = [];

  for (const next of [
    { culture: "ar-EG", theme: "luxury", motion: "smooth" },
    { culture: "en-US", theme: "light", motion: "instant" },
    { culture: "ar-EG", theme: "luxury", motion: "smooth" },
  ]) {
    samples.push(await harness.measureSwitch(next));
  }

  renderResult({
    environment: {
      userAgent: navigator.userAgent,
      viewport: `${innerWidth}x${innerHeight}`,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    },
    samples,
  });
});

apply(current);
