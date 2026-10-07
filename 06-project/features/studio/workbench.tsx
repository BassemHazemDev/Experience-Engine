"use client";

import { useState } from "react";
import { useResolvedExperience, useTransitionLog } from "@/components/engine-boundary";
import { ExperiencePreview } from "@/components/preview/experience-preview";
import { useSettings } from "@/components/shell/settings";
import { ExperienceTriplet } from "@/components/ui/primitives";
import { Sheet, useMediaQuery } from "@/components/ui/sheet";
import { ExperienceControls } from "@/features/controls/experience-controls";
import { ResearchPanel } from "@/features/research-mode/research-panel";
import { TransitionInspector } from "@/features/transition-inspector/transition-inspector";

type Panel = "controls" | "inspector" | "research" | null;

export function Workbench() {
  const experience = useResolvedExperience();
  const { researchMode } = useSettings();
  const { records } = useTransitionLog();
  const narrow = useMediaQuery("(max-width: 820px)");
  const [sheet, setSheet] = useState<Panel>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);

  const close = () => setSheet(null);

  return (
    <div className="workbench" data-research={researchMode && !narrow} data-inspector={inspectorOpen}>
      {!narrow && (
        <aside className="workbench-controls" aria-label="Experience controls">
          <ExperienceControls />
        </aside>
      )}

      <section className="workbench-stage" aria-label="Live application preview">
        <div className="stage-bar">
          <span className="stage-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <ExperienceTriplet request={experience.request} />
          <span className="stage-dir">
            dir=<strong>{experience.direction}</strong>
          </span>
          <span className="stage-note">Nova Commerce is a fictional app with demo data</span>
        </div>
        <div className="stage-frame">
          <ExperiencePreview />
        </div>
      </section>

      {researchMode && !narrow && <ResearchPanel />}

      {!narrow && (
        <div className="workbench-inspector">
          <button
            type="button"
            className="inspector-toggle"
            aria-expanded={inspectorOpen}
            onClick={() => setInspectorOpen(!inspectorOpen)}
          >
            <span aria-hidden="true">{inspectorOpen ? "▾" : "▸"}</span>
            {inspectorOpen ? "Hide inspector" : `Show inspector (${records.length} requests)`}
          </button>
          {inspectorOpen && <TransitionInspector />}
        </div>
      )}

      {narrow && (
        <>
          <div className="workbench-dock" role="toolbar" aria-label="Studio panels">
            <button type="button" className="btn btn-primary" onClick={() => setSheet("controls")}>
              Change experience
            </button>
            <button type="button" className="btn" onClick={() => setSheet("inspector")}>
              Inspector
            </button>
            {researchMode && (
              <button type="button" className="btn" onClick={() => setSheet("research")}>
                Research
              </button>
            )}
          </div>
          <Sheet open={sheet === "controls"} onClose={close} title="Experience">
            <ExperienceControls />
          </Sheet>
          <Sheet open={sheet === "inspector"} onClose={close} title="Transition inspector">
            <TransitionInspector />
          </Sheet>
          <Sheet open={sheet === "research"} onClose={close} title="Research mode">
            <ResearchPanel />
          </Sheet>
        </>
      )}
    </div>
  );
}
