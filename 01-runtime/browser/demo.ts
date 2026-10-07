import {
  ExperienceEngine,
  type ExperienceRequest,
} from "@experience-engine/core";

export function mountExperienceDemo(
  root: HTMLElement,
  engine: ExperienceEngine<string, string, string>,
) {
  root.innerHTML = `
    <section data-experience-app>
      <header>
        <strong data-current-experience>loading…</strong>
      </header>

      <div data-controls>
        <button data-culture="en-US">English</button>
        <button data-culture="ar-EG">العربية</button>
        <button data-theme="light">Light</button>
        <button data-theme="luxury">Luxury</button>
        <button data-motion="smooth">Smooth</button>
        <button data-motion="instant">Instant</button>
      </div>

      <main>
        <article data-card>
          <h2 data-title>Experience Engine</h2>
          <p data-copy>Switching UI experience without application-level branching.</p>
        </article>
      </main>
    </section>
  `;

  const title = root.querySelector<HTMLElement>("[data-current-experience]");
  const app = root.querySelector<HTMLElement>("[data-experience-app]");

  const render = () => {
    const experience = engine.getExperience();
    if (!experience || !title || !app) return;

    app.dir = experience.direction;
    app.dataset.culture = experience.request.culture;
    app.dataset.theme = experience.request.theme;
    app.dataset.motion = experience.request.motion;
    title.textContent =
      `${experience.request.culture} · ${experience.request.theme} · ${experience.request.motion}`;
  };

  const switchExperience = async (
    partial: Partial<ExperienceRequest<string, string, string>>,
  ) => {
    const current = engine.getExperience();
    if (!current) return;

    await engine.setExperience({
      culture: partial.culture ?? current.request.culture,
      theme: partial.theme ?? current.request.theme,
      motion: partial.motion ?? current.request.motion,
    });

    render();
  };

  root.querySelectorAll<HTMLElement>("[data-culture]").forEach((button) => {
    button.addEventListener("click", () => {
      void switchExperience({ culture: button.dataset.culture });
    });
  });

  root.querySelectorAll<HTMLElement>("[data-theme]").forEach((button) => {
    button.addEventListener("click", () => {
      void switchExperience({ theme: button.dataset.theme });
    });
  });

  root.querySelectorAll<HTMLElement>("[data-motion]").forEach((button) => {
    button.addEventListener("click", () => {
      void switchExperience({ motion: button.dataset.motion });
    });
  });

  render();

  return {
    render,
    switchExperience,
  };
}
