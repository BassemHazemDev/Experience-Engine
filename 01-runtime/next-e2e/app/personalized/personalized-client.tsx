"use client";

import { useEffect, useRef, useState } from "react";
import {
  ExperienceProvider,
  useExperience,
} from "@experience-engine/react";
import { ExperienceEngine, type ExperienceRequest } from "@experience-engine/core";

type Culture = "en-US" | "ar-EG";
type Theme = "light" | "luxury";
type Motion = "instant" | "smooth";
type Request = ExperienceRequest<Culture, Theme, Motion>;

function createClientEngine(initial: Request) {
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

function Runtime() {
  const { experience, setExperience } = useExperience();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!experience || !ready) {
    return (
      <div id="client-runtime-status" data-client-ready="false">
        Hydrating…
      </div>
    );
  }

  return (
    <div
      id="client-personalized-experience"
      data-client-ready="true"
      data-culture={experience.request.culture}
      data-theme={experience.request.theme}
      data-motion={experience.request.motion}
      data-direction={experience.direction}
      dir={experience.direction}
      style={{
        marginTop: 24,
        padding: 24,
        border: "1px solid #888",
        borderRadius: 16,
      }}
    >
      <h2>Runtime Experience</h2>

      <p id="client-state">
        {experience.request.culture} · {experience.request.theme} ·{" "}
        {experience.request.motion}
      </p>

      <button
        id="runtime-arabic-luxury"
        onClick={() =>
          void setExperience({
            culture: "ar-EG",
            theme: "luxury",
            motion: "smooth",
          })
        }
      >
        Switch at runtime → Arabic / Luxury / Smooth
      </button>
    </div>
  );
}

export default function PersonalizedClient({
  initialRequest,
}: {
  initialRequest: Request;
}) {
  const engineRef = useRef<ExperienceEngine<Culture, Theme, Motion> | null>(
    null,
  );
  const [initialized, setInitialized] = useState(false);

  if (!engineRef.current) {
    engineRef.current = createClientEngine(initialRequest);
  }

  useEffect(() => {
    let active = true;

    void engineRef.current!.init().then(() => {
      if (active) setInitialized(true);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!initialized) {
    return (
      <div id="client-bootstrap" data-client-ready="false">
        Initializing Experience Engine…
      </div>
    );
  }

  return (
    <ExperienceProvider engine={engineRef.current!}>
      <Runtime />
    </ExperienceProvider>
  );
}
