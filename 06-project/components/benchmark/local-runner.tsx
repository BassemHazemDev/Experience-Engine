"use client";

import { useState } from "react";
import { ExperienceEngineError } from "@experience-engine/core";
import { ProvenanceTag } from "@/components/ui/primitives";
import { createEngine } from "@/engine/create-engine";
import type { StudioRequest } from "@/engine/definitions";
import { RAPID_SEQUENCE } from "@/engine/presets";

const EN: StudioRequest = { culture: "en-US", theme: "light", motion: "instant" };
const AR_LUX: StudioRequest = { culture: "ar-EG", theme: "luxury", motion: "smooth" };
const AR: StudioRequest = { culture: "ar-EG", theme: "light", motion: "instant" };

interface Row {
  readonly scenario: string;
  readonly what: string;
  readonly ms: number;
  readonly note: string;
}

async function timed(run: () => Promise<unknown>): Promise<number> {
  const start = performance.now();
  await run();
  return performance.now() - start;
}

/**
 * Runs each scenario once on throwaway engine instances, so the site's own
 * engine is not disturbed. One run per scenario is a reading, not a benchmark.
 */
async function runScenarios(): Promise<Row[]> {
  const rows: Row[] = [];

  const cold = createEngine(EN);
  await cold.init();
  rows.push({
    scenario: "Cold",
    what: "First transition to an experience whose resources have never loaded",
    ms: await timed(() => cold.setExperience(AR_LUX)),
    note: `${cold.inspect().cachedResources} resources cached afterwards`,
  });

  await cold.setExperience(EN);
  rows.push({
    scenario: "Cached",
    what: "The same transition again, resources already in the engine’s cache",
    ms: await timed(() => cold.setExperience(AR_LUX)),
    note: "No loader runs",
  });

  const preloaded = createEngine(EN);
  await preloaded.init();
  await preloaded.preload(AR_LUX);
  rows.push({
    scenario: "Preloaded",
    what: "preload() called first, then the transition",
    ms: await timed(() => preloaded.setExperience(AR_LUX)),
    note: "Preload time is not included",
  });

  const rtl = createEngine(EN);
  await rtl.init();
  await rtl.preload(AR);
  const rtlMs = await timed(() => rtl.setExperience(AR));
  rows.push({
    scenario: "RTL",
    what: "Culture only: en-US to ar-EG, direction ltr to rtl",
    ms: rtlMs,
    note: `Resolved direction: ${rtl.getExperience()?.direction}`,
  });

  const rapid = createEngine(EN);
  await rapid.init();
  let stale = 0;
  const rapidMs = await timed(() =>
    Promise.all(
      RAPID_SEQUENCE.map((request) =>
        rapid.setExperience(request).catch((error) => {
          if (error instanceof ExperienceEngineError && error.code === "TRANSITION_STALE") stale += 1;
          else throw error;
        }),
      ),
    ),
  );
  rows.push({
    scenario: "Rapid",
    what: `${RAPID_SEQUENCE.length} requests without waiting, until all have settled`,
    ms: rapidMs,
    note: `${stale} stale, final ${rapid.getExperience()?.id}`,
  });

  return rows;
}

export function LocalRunner() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    try {
      setRows(await runScenarios());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
    setRunning(false);
  }

  return (
    <div className="runner">
      <div className="lab-actions">
        <button type="button" className="btn btn-primary" onClick={() => void run()} disabled={running}>
          {running ? "Running…" : rows ? "Run again" : "Run in this browser"}
        </button>
        <ProvenanceTag kind="measured">Measured in this browser, one run each</ProvenanceTag>
      </div>
      {error && (
        <p className="lab-result" role="alert">
          The run stopped: {error}
        </p>
      )}
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Scenario</th>
              <th scope="col">What is timed</th>
              <th scope="col" className="num">
                <code>setExperience()</code>
              </th>
              <th scope="col">Observed</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? PLACEHOLDER).map((row) => (
              <tr key={row.scenario}>
                <th scope="row">{row.scenario}</th>
                <td>{row.what}</td>
                <td className="num">{rows ? `${row.ms.toFixed(1)} ms` : "—"}</td>
                <td>{rows ? row.note : "Not run yet"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="note">
        These readings cover the engine call only: resolution, delta, closure, resource loading and commit. They exclude React rendering and painting, depend
        on your device and network cache, and are not comparable with the stored results above.
      </p>
    </div>
  );
}

const PLACEHOLDER: Row[] = [
  { scenario: "Cold", what: "First transition to an experience whose resources have never loaded", ms: 0, note: "" },
  { scenario: "Cached", what: "The same transition again, resources already in the engine’s cache", ms: 0, note: "" },
  { scenario: "Preloaded", what: "preload() called first, then the transition", ms: 0, note: "" },
  { scenario: "RTL", what: "Culture only: en-US to ar-EG, direction ltr to rtl", ms: 0, note: "" },
  { scenario: "Rapid", what: "5 requests without waiting, until all have settled", ms: 0, note: "" },
];
