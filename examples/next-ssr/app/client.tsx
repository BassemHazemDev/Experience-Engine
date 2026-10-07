"use client";

import { useEffect, useState } from "react";
import { resolveExperience } from "@experience-engine/core";
import { ExperienceProvider, useExperience } from "@experience-engine/react";
import { copy, createEngine, CULTURES, MOTIONS, THEMES, type Culture, type Request } from "./experience";

function View({ fallback }: { fallback: ReturnType<typeof resolveExperience> }) {
  const { experience, setCulture, setTheme, setMotion } = useExperience();
  // Until the client engine has committed, render exactly what the server rendered.
  const current = experience ?? fallback;
  const text = copy[current.request.culture as Culture];
  const ignoreStale = () => undefined;

  return (
    <main
      dir={current.direction}
      lang={current.locale}
      style={{
        minHeight: "100vh",
        padding: 32,
        background: String(current.tokens.surface),
        color: String(current.tokens.text),
        transition: `background ${current.motion.durationMs ?? 0}ms, color ${current.motion.durationMs ?? 0}ms`,
      }}
    >
      <h1>{text.title}</h1>
      <p>{text.body}</p>
      <p>
        <code>{current.id}</code> · dir=<code>{current.direction}</code>
      </p>

      <p>
        {CULTURES.map((culture) => (
          <button key={culture} onClick={() => void setCulture(culture).catch(ignoreStale)}>
            {culture}
          </button>
        ))}{" "}
        {THEMES.map((theme) => (
          <button key={theme} onClick={() => void setTheme(theme).catch(ignoreStale)}>
            {theme}
          </button>
        ))}{" "}
        {MOTIONS.map((motion) => (
          <button key={motion} onClick={() => void setMotion(motion).catch(ignoreStale)}>
            {motion}
          </button>
        ))}
      </p>
    </main>
  );
}

export default function ClientExperience({ initialRequest }: { initialRequest: Request }) {
  // One engine per browser tab, started from the request the server resolved.
  const [engine] = useState(() => createEngine(initialRequest));
  // resolveExperience is synchronous, so the first client render matches the server HTML.
  const [fallback] = useState(() => resolveExperience(initialRequest, engine));

  useEffect(() => {
    void engine.init().catch(() => undefined);
  }, [engine]);

  return (
    <ExperienceProvider engine={engine}>
      <View fallback={fallback} />
    </ExperienceProvider>
  );
}
