"use client";

import { useSyncExternalStore } from "react";
import { resourceKey, type ResourceReference } from "@experience-engine/core";
import { useStudioRuntime } from "@/components/engine-boundary";
import { ProvenanceTag } from "@/components/ui/primitives";
import { activityKey, resourceActivity, setSimulatedLatency, type ResourceActivity } from "@/engine/resources";
import type { TransitionRecord } from "@/features/transition-recorder/recorder";

export function useResourceActivity() {
  return useSyncExternalStore(resourceActivity.subscribe, resourceActivity.getSnapshot, resourceActivity.getServerSnapshot);
}

export function useResourceControls() {
  return useSyncExternalStore(resourceActivity.subscribe, resourceActivity.getControls, resourceActivity.getServerControls);
}

const KIND_LABEL = { translation: "Translation", font: "Font", asset: "Asset", code: "Code" } as const;

type Stage = "idle" | "needed" | "preparing" | "ready" | "committed" | "failed";

const STAGE: Record<Stage, { label: string; mark: string }> = {
  idle: { label: "Idle", mark: "–" },
  needed: { label: "Needed", mark: "○" },
  preparing: { label: "Preparing", mark: "◐" },
  ready: { label: "Ready", mark: "●" },
  committed: { label: "Committed", mark: "✓" },
  failed: { label: "Failed", mark: "✕" },
};

function stageOf(activity: ResourceActivity | undefined, record: TransitionRecord): Stage {
  if (!activity) return "idle";
  if (activity.state === "failed") return "failed";
  if (activity.state === "preparing") return "preparing";
  if (activity.state === "ready") return record.outcome === "committed" ? "committed" : "ready";
  return record.outcome === "pending" ? "needed" : "idle";
}

/** What the engine prepared for one transition, and what each loader actually did. */
export function ResourcePanel({ record }: { record: TransitionRecord }) {
  const activity = useResourceActivity();
  const controls = useResourceControls();
  const { engine } = useStudioRuntime();
  const transaction = record.transaction!;
  const byKey = new Map(activity.map((entry) => [entry.key, entry]));
  const added = new Set(transaction.delta.resources.added.map(resourceKey));
  const removed = transaction.delta.resources.removed;

  // One chip per resource type, showing the least-finished resource of that type.
  const ORDER: Stage[] = ["failed", "preparing", "needed", "ready", "committed", "idle"];
  const kinds = (Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[]).map((kind) => {
    const stages = transaction.to.resources
      .filter((resource) => resource.kind === kind)
      .map((resource) => stageOf(byKey.get(activityKey(resource)), record));
    return { kind, stage: stages.length ? ORDER.find((stage) => stages.includes(stage))! : undefined };
  });
  const total = transaction.to.resources.length;
  const verdict =
    record.outcome === "committed"
      ? "All were ready before the commit."
      : record.outcome === "failed"
        ? "One did not load, so nothing was committed."
        : record.outcome === "stale"
          ? "A newer request replaced this one before it could commit."
          : "Waiting for all of them before committing.";

  return (
    <div className="resources">
      <div className="resource-summary">
        {kinds.map(({ kind, stage }) => (
          <span key={kind} className="resource-chip" data-stage={stage ?? "absent"}>
            <span aria-hidden="true">{stage ? STAGE[stage].mark : "·"}</span>
            {KIND_LABEL[kind]}
            <span className="sr-only">: </span>
            <span>{stage ? STAGE[stage].label.toLowerCase() : "not needed"}</span>
          </span>
        ))}
        <p>
          This experience needs {total} {total === 1 ? "resource" : "resources"}: {added.size} new for this transition,{" "}
          {total - added.size} already in use. {verdict}
        </p>
      </div>

      <table className="data-table">
        <caption className="sr-only">Resources for the target experience</caption>
        <thead>
          <tr>
            <th scope="col">Type</th>
            <th scope="col">Resource</th>
            <th scope="col">In this transition</th>
            <th scope="col">State</th>
            <th scope="col" className="num">
              Loader runs
            </th>
            <th scope="col" className="num">
              Last load
            </th>
          </tr>
        </thead>
        <tbody>
          {transaction.to.resources.map((resource: ResourceReference) => {
            const entry = byKey.get(activityKey(resource));
            const stage = stageOf(entry, record);
            return (
              <tr key={resourceKey(resource)}>
                <td>
                  <span className="kind" data-kind={resource.kind}>
                    {KIND_LABEL[resource.kind]}
                  </span>
                </td>
                <td>
                  <code>{resource.id}</code>
                </td>
                <td>{added.has(resourceKey(resource)) ? "Added" : "Retained"}</td>
                <td>
                  <span className="resource-state" data-stage={stage}>
                    <span aria-hidden="true">{STAGE[stage].mark}</span>
                    {STAGE[stage].label}
                    {stage === "failed" && <span className="resource-preserve">→ current kept</span>}
                  </span>
                </td>
                <td className="num">{entry?.loads ?? 0}</td>
                <td className="num">{entry?.lastLoadMs === undefined ? "—" : `${entry.lastLoadMs.toFixed(1)} ms`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {removed.length > 0 && (
        <p className="note">
          No longer needed after this transition:{" "}
          {removed.map((resource, index) => (
            <span key={resourceKey(resource)}>
              {index > 0 && ", "}
              <code>{resource.id}</code>
            </span>
          ))}
          . They stay in the engine’s cache.
        </p>
      )}

      <div className="resources-foot">
        <p className="note">
          Load times are <ProvenanceTag kind="measured" />. A loader that has already run is served from the engine’s cache ({engine.inspect().cachedResources}{" "}
          cached), so its run count does not rise again.
        </p>
        <label className="field-inline">
          <span>
            Added latency <ProvenanceTag kind="simulated" />
          </span>
          <select value={controls.latencyMs} onChange={(event) => setSimulatedLatency(Number(event.target.value))}>
            <option value={0}>None</option>
            <option value={400}>400 ms per load</option>
            <option value={1200}>1200 ms per load</option>
          </select>
        </label>
        <button type="button" className="btn btn-ghost" onClick={() => engine.resources.clear()}>
          Clear resource cache
        </button>
      </div>
    </div>
  );
}
