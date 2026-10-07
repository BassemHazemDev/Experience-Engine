"use client";

import { useEffect, useId, useState } from "react";
import { useCurrentRequest, useStudioRuntime, useTransition } from "@/components/engine-boundary";
import { ExperienceTriplet } from "@/components/ui/primitives";
import { CULTURES, LABELS, MOTIONS, THEMES, sameRequest, type StudioRequest } from "@/engine/definitions";
import { PRESETS } from "@/engine/presets";

type Dimension = "culture" | "theme" | "motion";

const GROUPS: readonly { dim: Dimension; title: string; hint: string; options: readonly string[] }[] = [
  { dim: "culture", title: "Culture", hint: "Language, direction, type, formats", options: CULTURES },
  { dim: "theme", title: "Theme", hint: "Tokens and component adaptation", options: THEMES },
  { dim: "motion", title: "Motion", hint: "How a commit is shown", options: MOTIONS },
];

export function ExperienceControls({ showPresets = true }: { showPresets?: boolean }) {
  const current = useCurrentRequest();
  const transition = useTransition();
  const { engine } = useStudioRuntime();
  const [draft, setDraft] = useState<StudioRequest>(current);
  const [applyOnSelect, setApplyOnSelect] = useState(true);
  const name = useId();

  // Follow the engine: if anything else commits an experience, show it here.
  useEffect(() => {
    setDraft({ culture: current.culture, theme: current.theme, motion: current.motion });
  }, [current.culture, current.theme, current.motion]);

  const dirty = !sameRequest(draft, current);

  function choose(dim: Dimension, value: string) {
    const next = { ...draft, [dim]: value } as StudioRequest;
    setDraft(next);
    if (applyOnSelect) void transition(next);
    // Otherwise warm the target's resources so Apply has less to wait for.
    else void engine.preload(next).catch(() => undefined);
  }

  return (
    <div className="controls">
      {showPresets && (
        <section className="controls-section" aria-labelledby={`${name}-presets`}>
          <h3 id={`${name}-presets`} className="controls-title">
            Presets
          </h3>
          <div className="presets">
            {PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="preset"
                aria-pressed={sameRequest(preset.request, current)}
                onClick={() => void transition(preset.request)}
                onPointerEnter={() => void engine.preload(preset.request).catch(() => undefined)}
                onFocus={() => void engine.preload(preset.request).catch(() => undefined)}
              >
                <span className="preset-name">{preset.name}</span>
                <ExperienceTriplet request={preset.request} size="sm" />
              </button>
            ))}
          </div>
        </section>
      )}

      {GROUPS.map((group) => (
        <fieldset key={group.dim} className="dimension" data-dim={group.dim}>
          <legend>
            <span className="dimension-name">{group.title}</span>
            <span className="dimension-hint">{group.hint}</span>
          </legend>
          <div className="dimension-options">
            {group.options.map((option) => (
              <label key={option} className="option">
                <input
                  type="radio"
                  name={`${name}-${group.dim}`}
                  value={option}
                  checked={draft[group.dim] === option}
                  onChange={() => choose(group.dim, option)}
                />
                <span className="option-body">
                  <span lang={group.dim === "culture" ? option : undefined}>
                    {(LABELS[group.dim] as Record<string, string>)[option]}
                  </span>
                  <code>{option}</code>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}

      <section className="controls-section controls-apply">
        <pre className="request-code" aria-label="The call the Studio makes">
          <code>
            {"await engine.setExperience({\n"}
            {"  culture: "}
            <span data-dim="culture">"{draft.culture}"</span>
            {",\n  theme: "}
            <span data-dim="theme">"{draft.theme}"</span>
            {",\n  motion: "}
            <span data-dim="motion">"{draft.motion}"</span>
            {",\n});"}
          </code>
        </pre>
        <button type="button" className="btn btn-primary btn-block" disabled={!dirty} onClick={() => void transition(draft)}>
          {dirty ? "Apply experience" : "Applied"}
        </button>
        <label className="check">
          <input type="checkbox" checked={applyOnSelect} onChange={(event) => setApplyOnSelect(event.target.checked)} />
          Apply as soon as I choose
        </label>
      </section>
    </div>
  );
}
