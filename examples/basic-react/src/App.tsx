import { useDirection, useExperience } from "@experience-engine/react";
import { messages, type Culture, type Motion, type Theme } from "./experience";

// A request that loses to a newer one rejects with TRANSITION_STALE. That is expected.
const ignoreStale = () => undefined;

export function App() {
  const { experience, setCulture, setTheme, setMotion, setExperience } = useExperience();
  const direction = useDirection();
  if (!experience) return null;

  const text = messages.get(experience.locale)!;
  const price = new Intl.NumberFormat(experience.locale, {
    style: "currency",
    currency: String(experience.formatting.currency),
  }).format(1280);

  return (
    <main
      dir={direction}
      lang={experience.locale}
      style={{
        minHeight: "100vh",
        padding: 32,
        fontFamily: "system-ui, sans-serif",
        background: String(experience.tokens.surface),
        color: String(experience.tokens.text),
        transition: `background ${experience.motion.durationMs ?? 0}ms, color ${experience.motion.durationMs ?? 0}ms`,
      }}
    >
      <h1>{text.greeting}</h1>
      <p style={{ border: `1px solid ${experience.tokens.accent}`, borderRadius: Number(experience.tokens.radius), padding: 16 }}>
        {text.price}: <strong>{price}</strong>
      </p>
      <p>
        <code>{experience.id}</code> · dir=<code>{direction}</code>
      </p>

      <h2>One dimension at a time</h2>
      {(["en-US", "ar-EG"] as Culture[]).map((culture) => (
        <button key={culture} onClick={() => void setCulture(culture).catch(ignoreStale)}>
          {culture}
        </button>
      ))}{" "}
      {(["light", "dark"] as Theme[]).map((theme) => (
        <button key={theme} onClick={() => void setTheme(theme).catch(ignoreStale)}>
          {theme}
        </button>
      ))}{" "}
      {(["instant", "smooth"] as Motion[]).map((motion) => (
        <button key={motion} onClick={() => void setMotion(motion).catch(ignoreStale)}>
          {motion}
        </button>
      ))}

      <h2>All three in one request</h2>
      <button onClick={() => void setExperience({ culture: "ar-EG", theme: "dark", motion: "smooth" }).catch(ignoreStale)}>
        ar-EG · dark · smooth
      </button>{" "}
      <button onClick={() => void setExperience({ culture: "en-US", theme: "light", motion: "instant" }).catch(ignoreStale)}>
        en-US · light · instant
      </button>
    </main>
  );
}
