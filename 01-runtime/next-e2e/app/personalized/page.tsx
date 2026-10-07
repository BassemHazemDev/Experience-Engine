import { cookies } from "next/headers";
import { ExperienceEngine, type ExperienceRequest } from "@experience-engine/core";
import PersonalizedClient from "./personalized-client";

export const dynamic = "force-dynamic";

type Culture = "en-US" | "ar-EG";
type Theme = "light" | "luxury";
type Motion = "instant" | "smooth";
type Request = ExperienceRequest<Culture, Theme, Motion>;

function createEngine(initial: Request) {
  return new ExperienceEngine<Culture, Theme, Motion>({
    cultures: {
      "en-US": {
        locale: "en-US",
        direction: "ltr",
        typography: { fontFamily: "system-ui" },
        formatting: {},
      },
      "ar-EG": {
        locale: "ar-EG",
        direction: "rtl",
        typography: { fontFamily: "system-ui" },
        formatting: {},
      },
    },

    themes: {
      light: {
        tokens: {
          surface: "#ffffff",
          text: "#111111",
          card: "#f4f4f4",
          radius: 16,
        },
      },
      luxury: {
        tokens: {
          surface: "#111111",
          text: "#f4f4f4",
          card: "#1c1c1c",
          radius: 24,
        },
      },
    },

    motions: {
      instant: {
        defaultStrategy: "instant",
        durationMs: 0,
      },
      smooth: {
        defaultStrategy: "css",
        durationMs: 250,
        easing: "ease",
      },
    },

    initial,
  });
}

function parseExperienceCookie(value: string | undefined): Request {
  const fallback: Request = {
    culture: "en-US",
    theme: "light",
    motion: "instant",
  };

  if (!value) return fallback;

  const [culture, theme, motion] = value.split(".");

  const validCulture = culture === "ar-EG" || culture === "en-US";
  const validTheme = theme === "luxury" || theme === "light";
  const validMotion = motion === "smooth" || motion === "instant";

  if (!validCulture || !validTheme || !validMotion) {
    return fallback;
  }

  return {
    culture: culture as Culture,
    theme: theme as Theme,
    motion: motion as Motion,
  };
}

export default async function PersonalizedPage() {
  const cookieStore = await cookies();
  const initialRequest = parseExperienceCookie(
    cookieStore.get("experience")?.value,
  );

  const engine = createEngine(initialRequest);
  const experience = await engine.init();

  return (
    <main
      id="server-personalized-experience"
      data-render-source="dynamic-server-component"
      data-server-experience-id={experience.id}
      data-server-culture={experience.request.culture}
      data-server-theme={experience.request.theme}
      data-server-motion={experience.request.motion}
      data-server-direction={experience.direction}
      dir={experience.direction}
      style={{
        minHeight: "100vh",
        padding: 32,
        boxSizing: "border-box",
        background: String(experience.tokens.surface),
        color: String(experience.tokens.text),
      }}
    >
      <section
        style={{
          maxWidth: 820,
          margin: "48px auto",
          padding: 40,
          borderRadius: Number(experience.tokens.radius),
          background: String(experience.tokens.card),
          boxSizing: "border-box",
        }}
      >
        <h1>Experience Engine — Personalized SSR</h1>

        <p id="server-proof">
          This experience was resolved from the HTTP request cookie on the
          server before hydration.
        </p>

        <pre id="server-experience-json">
          {JSON.stringify(
            {
              source: "dynamic-server-component",
              id: experience.id,
              culture: experience.request.culture,
              theme: experience.request.theme,
              motion: experience.request.motion,
              direction: experience.direction,
            },
            null,
            2,
          )}
        </pre>

        <PersonalizedClient
          initialRequest={{
            culture: experience.request.culture as Culture,
            theme: experience.request.theme as Theme,
            motion: experience.request.motion as Motion,
          }}
        />
      </section>
    </main>
  );
}
