"use client";

import { useState } from "react";
import { resolveExperience } from "@experience-engine/core";
import { useResolvedExperience, useStudioRuntime, useTransition } from "@/components/engine-boundary";
import { ExperienceTriplet, OutcomeBadge, ProvenanceTag } from "@/components/ui/primitives";
import { type StudioRequest } from "@/engine/definitions";
import { PRESETS, RAPID_SEQUENCE } from "@/engine/presets";
import { clearFaults, setFault, type ResourceKind } from "@/engine/resources";
import { useResourceControls } from "@/features/resource-panel/resource-panel";
import type { TransitionRecord } from "@/features/transition-recorder/recorder";

/* ───────────────────────── Rapid transition test ───────────────────────── */

export function RapidLab() {
  const transition = useTransition();
  const { engine } = useStudioRuntime();
  const [results, setResults] = useState<TransitionRecord[] | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    setResults(null);
    // Nothing is awaited between requests: all five are in flight at once.
    const settled = await Promise.all(RAPID_SEQUENCE.map((request) => transition(request)));
    setResults(settled);
    setRunning(false);
  }

  const committed = results?.filter((record) => record.outcome === "committed") ?? [];
  const finalId = engine.getExperience()?.id;
  const lastRequested = results?.[results.length - 1];

  return (
    <section className="lab" aria-labelledby="rapid-title">
      <header className="lab-head">
        <h2 id="rapid-title">Rapid transition test</h2>
        <p>
          Five requests are sent back to back without waiting for any of them. Each one starts preparing; the guard lets only the latest become visible.
        </p>
      </header>

      <ol className="rapid">
        {RAPID_SEQUENCE.map((request, index) => {
          const record = results?.[index];
          return (
            <li key={index} data-outcome={record?.outcome ?? "idle"}>
              <span className="rapid-id">{record?.requestId === undefined ? `step ${index + 1}` : `Request #${record.requestId}`}</span>
              <ExperienceTriplet request={request} size="sm" />
              {record ? <OutcomeBadge outcome={record.outcome} /> : <span className="note">{running ? "in flight" : "not sent"}</span>}
            </li>
          );
        })}
      </ol>

      <div className="lab-actions">
        <button type="button" className="btn btn-primary" onClick={() => void run()} disabled={running}>
          {running ? "Running…" : "Send five requests"}
        </button>
        {results && (
          <p className="lab-result" role="status">
            {committed.length} committed, {results.length - committed.length} discarded as stale. The engine’s committed experience is <code>{finalId}</code>
            {lastRequested && finalId === lastRequested.transaction?.to.id ? ", which is the last one requested." : "."} <ProvenanceTag kind="engine" />
          </p>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────── Break the transition ───────────────────────── */

const FAULTS: readonly { kind: ResourceKind; label: string; preset: string }[] = [
  { kind: "translation", label: "Translation fails to load", preset: "arabic-luxury" },
  { kind: "font", label: "Font fails to load", preset: "arabic-luxury" },
  { kind: "asset", label: "Asset fails to load", preset: "arabic-luxury" },
  { kind: "code", label: "Component code fails to load", preset: "minimal" },
];

interface Attempt {
  readonly beforeId: string;
  readonly afterId: string | undefined;
  readonly record: TransitionRecord;
}

export function FailureLab() {
  const transition = useTransition();
  const { engine } = useStudioRuntime();
  const current = useResolvedExperience();
  const controls = useResourceControls();
  const [targetId, setTargetId] = useState("arabic-luxury");
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [busy, setBusy] = useState(false);

  const target = PRESETS.find((preset) => preset.id === targetId)!.request;
  const targetResources = resolveExperience(target, engine).resources;
  const armed = controls.faults;
  const unused = armed.filter((kind) => !targetResources.some((resource) => resource.kind === kind));

  async function run(request: StudioRequest) {
    setBusy(true);
    const beforeId = engine.getExperience()?.id ?? current.id;
    // A resource the engine has already cached is never loaded again, so drop
    // the cached copies of the kinds we are about to break.
    for (const resource of resolveExperience(request, engine).resources) {
      if (armed.includes(resource.kind)) engine.resources.invalidate(resource);
    }
    const record = await transition(request);
    // With nothing committed yet, the screen still shows what it showed before.
    setAttempt({ beforeId, afterId: engine.getExperience()?.id ?? beforeId, record });
    setBusy(false);
  }

  function toggle(kind: ResourceKind, preset: string, on: boolean) {
    setFault(kind, on);
    if (on) setTargetId(preset);
  }

  const preserved = attempt && attempt.record.outcome === "failed" && attempt.afterId === attempt.beforeId;

  return (
    <section className="lab" aria-labelledby="failure-title">
      <header className="lab-head">
        <h2 id="failure-title">Break the transition</h2>
        <p>
          Choose what should go wrong, then ask for a new experience. The switches make the real resource loaders reject, so what you see is the engine’s own
          failure handling, not a mock-up.
        </p>
      </header>

      <fieldset className="faults">
        <legend>What should fail</legend>
        {FAULTS.map((fault) => (
          <label key={fault.kind} className="check">
            <input type="checkbox" checked={armed.includes(fault.kind)} onChange={(event) => toggle(fault.kind, fault.preset, event.target.checked)} />
            {fault.label}
          </label>
        ))}
      </fieldset>

      <div className="lab-actions">
        <label className="field-inline">
          Target
          <select value={targetId} onChange={(event) => setTargetId(event.target.value)}>
            {PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>
        <ExperienceTriplet request={target} size="sm" />
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void run(target)}>
          Attempt transition
        </button>
      </div>

      {unused.length > 0 && (
        <p className="note">
          The chosen target has no {unused.join(" or ")} resource, so that switch will have no effect here.
          {unused.includes("code") && " Only the Minimal preset loads component code."}
        </p>
      )}

      {attempt && (
        <div className="failure-result" role="status">
          <ol className="failure-steps">
            <li data-state="ok">
              <span>Current</span>
              <code>{attempt.beforeId}</code>
            </li>
            <li data-state="ok">
              <span>Preparing</span>
              <code>{attempt.record.transaction?.to.id}</code>
            </li>
            {attempt.record.outcome === "failed" ? (
              <>
                <li data-state="failed">
                  <span>Failed</span>
                  <code>{attempt.record.errorCode}</code>
                </li>
                <li data-state={preserved ? "ok" : "failed"}>
                  <span>{preserved ? "Current experience preserved" : "State changed"}</span>
                  <code>{attempt.afterId}</code>
                </li>
              </>
            ) : (
              <li data-state="ok">
                <span>{attempt.record.outcome === "committed" ? "Committed" : "Discarded as stale"}</span>
                <code>{attempt.afterId}</code>
              </li>
            )}
          </ol>
          {attempt.record.outcome === "failed" && (
            <div className="lab-actions">
              <p className="lab-result">
                The engine rejected with <code>{attempt.record.errorCode}</code> and never ran the commit. Failed loads are not cached, so the same request can
                be retried.
              </p>
              <button
                type="button"
                className="btn"
                disabled={busy}
                onClick={() => {
                  clearFaults();
                  void run(attempt.record.request);
                }}
              >
                Fix the fault and retry
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ───────────────────────── Unknown request ───────────────────────── */

const UNKNOWN: readonly { label: string; request: Record<string, string> }[] = [
  { label: "theme: \"neon\"", request: { culture: "en-US", theme: "neon", motion: "instant" } },
  { label: "culture: \"fr-FR\"", request: { culture: "fr-FR", theme: "light", motion: "instant" } },
  { label: "motion: \"bouncy\"", request: { culture: "en-US", theme: "light", motion: "bouncy" } },
];

export function UnknownLab() {
  const transition = useTransition();
  const { engine } = useStudioRuntime();
  const [result, setResult] = useState<{ record: TransitionRecord; afterId?: string; beforeId?: string } | null>(null);

  async function run(request: Record<string, string>) {
    const beforeId = engine.getExperience()?.id;
    const record = await transition(request as unknown as StudioRequest);
    setResult({ record, beforeId, afterId: engine.getExperience()?.id });
  }

  return (
    <section className="lab" aria-labelledby="unknown-title">
      <header className="lab-head">
        <h2 id="unknown-title">Ask for something that is not registered</h2>
        <p>A request must name a registered culture, theme and motion. Anything else is rejected during resolution, before any preparation starts.</p>
      </header>
      <div className="lab-actions">
        {UNKNOWN.map((item) => (
          <button key={item.label} type="button" className="btn" onClick={() => void run(item.request)}>
            <code>{item.label}</code>
          </button>
        ))}
      </div>
      {result && (
        <p className="lab-result" role="status">
          Rejected with <code>{result.record.errorCode}</code>: {result.record.errorMessage} The committed experience is still <code>{result.afterId}</code>
          {result.afterId === result.beforeId ? " (unchanged)." : "."} <ProvenanceTag kind="engine" />
        </p>
      )}
    </section>
  );
}
