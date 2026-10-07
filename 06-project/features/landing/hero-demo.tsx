"use client";

import { useCurrentRequest, useEngineStatus, useTransition, useTransitionLog } from "@/components/engine-boundary";
import { resolveComponents } from "@/components/preview/adaptation";
import { ExperiencePreview } from "@/components/preview/experience-preview";
import { ExperienceTriplet, ProvenanceTag } from "@/components/ui/primitives";
import { sameRequest, type StudioRequest } from "@/engine/definitions";
import type { TransitionRecord } from "@/features/transition-recorder/recorder";

const START: StudioRequest = { culture: "en-US", theme: "light", motion: "instant" };
const END: StudioRequest = { culture: "ar-EG", theme: "luxury", motion: "smooth" };

type Transaction = NonNullable<TransitionRecord["transaction"]>;

/** What one committed transition changed, read from the engine's transaction. */
function changes(tx: Transaction): { label: string; value: string; dim?: "culture" | "theme" | "motion" }[] {
  const { delta, from, to } = tx;
  const visualTokens = Object.keys(delta.tokens.changed).filter((key) => !key.startsWith("component.")).length;
  const before = from ? resolveComponents(from) : undefined;
  const after = resolveComponents(to);
  const swapped = (["navigation", "orders"] as const)
    .filter((key) => before && before[key].component !== after[key].component)
    .map((key) => `${before![key].component} → ${after[key].component}`);
  const arrow = (pair?: { from: unknown; to: unknown }) => (pair ? `${pair.from} → ${pair.to}` : "unchanged");

  return [
    { label: "Language", value: arrow(delta.culture.locale), dim: "culture" },
    { label: "Direction", value: arrow(delta.culture.direction), dim: "culture" },
    { label: "Typography", value: delta.culture.typographyKeys.length ? `${delta.culture.typographyKeys.length} properties` : "unchanged", dim: "culture" },
    { label: "Theme tokens", value: visualTokens ? `${visualTokens} changed` : "unchanged", dim: "theme" },
    { label: "Components", value: swapped.length ? swapped.join(", ") : "unchanged in this transition", dim: "theme" },
    { label: "Resources", value: delta.resources.added.length ? delta.resources.added.map((resource) => resource.kind).join(", ") + " loaded first" : "already loaded" },
    { label: "Motion", value: arrow(delta.motion.strategy), dim: "motion" },
  ];
}

/** The landing hero is the product: one button, one real engine transition. */
export function HeroDemo() {
  const current = useCurrentRequest();
  const transition = useTransition();
  const status = useEngineStatus();
  const { records } = useTransitionLog();

  const target = sameRequest(current, END) ? START : END;
  const last = [...records].reverse().find((record) => record.transaction && record.outcome === "committed");
  const tx = last?.transaction;

  return (
    <div className="hero-demo">
      <div className="hero-demo-bar">
        <ExperienceTriplet request={current} />
        <button type="button" className="btn btn-primary" disabled={status === "starting"} onClick={() => void transition(target)}>
          Switch to {target.culture === "ar-EG" ? "Arabic, Luxury, Smooth" : "English, Light, Instant"}
        </button>
      </div>

      <div className="hero-demo-frame">
        <ExperiencePreview sections="brief" />
      </div>

      <div className="hero-demo-readout" aria-live="polite">
        {tx ? (
          <>
            <p>
              One call to <code>setExperience()</code> changed all of this together: <ProvenanceTag kind="engine" />
            </p>
            <dl className="hero-changes">
              {changes(tx).map((change) => (
                <div key={change.label} data-dim={change.dim}>
                  <dt>{change.label}</dt>
                  <dd>{change.value}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <p>Press the button. The application above is live; the engine coordinates language, direction, type, theme, resources and motion as one transition.</p>
        )}
      </div>
    </div>
  );
}
