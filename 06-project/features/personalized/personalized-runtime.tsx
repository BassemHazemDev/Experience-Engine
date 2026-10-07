"use client";

import { useState } from "react";
import { useCurrentRequest, useResolvedExperience, useStudioRuntime, useTransition } from "@/components/engine-boundary";
import { ExperiencePreview } from "@/components/preview/experience-preview";
import { ExperienceTriplet, ProvenanceTag } from "@/components/ui/primitives";
import { CULTURES, LABELS, MOTIONS, THEMES, type StudioRequest } from "@/engine/definitions";
import { EXPERIENCE_COOKIE, serializeExperienceCookie } from "@/engine/experience-cookie";
import { PRESETS } from "@/engine/presets";

const ONE_YEAR = 60 * 60 * 24 * 365;

function writeCookie(value: string | null) {
  document.cookie =
    value === null
      ? `${EXPERIENCE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
      : `${EXPERIENCE_COOKIE}=${value}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`;
}

interface RawResponse {
  readonly status: number;
  readonly bytes: number;
  readonly markers: Record<string, string>;
}

/** Client half of /personalized. `part` picks which region of the page this instance fills. */
export function PersonalizedRuntime({ serverId, part }: { serverId: string; part: "trace" | "stage" }) {
  if (part === "stage") {
    return (
      <div className="ssr-frame">
        <ExperiencePreview />
      </div>
    );
  }
  return <Trace serverId={serverId} />;
}

function Trace({ serverId }: { serverId: string }) {
  const { hydrated, startFailed, retryStart } = useStudioRuntime();
  const experience = useResolvedExperience();
  const current = useCurrentRequest();
  const transition = useTransition();
  const [preference, setPreference] = useState<StudioRequest>(current);
  const [raw, setRaw] = useState<RawResponse | null>(null);
  const [rawError, setRawError] = useState<string | null>(null);

  const changedAtRuntime = experience.id !== serverId;

  function save(value: string | null) {
    writeCookie(value);
    window.location.reload();
  }

  async function fetchRaw() {
    setRawError(null);
    try {
      const response = await fetch(window.location.pathname, { cache: "no-store", credentials: "same-origin" });
      const html = await response.text();
      const markers: Record<string, string> = {};
      for (const match of html.matchAll(/data-server-([a-z-]+)="([^"]*)"/g)) markers[match[1]] = match[2];
      setRaw({ status: response.status, bytes: new Blob([html]).size, markers });
    } catch (error) {
      setRawError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <>
      <div className="trace-step">
        <h3>Hydration</h3>
        <p className="hydration" data-hydrated={hydrated} role="status" id="client-runtime-status" data-client-ready={hydrated}>
          <span aria-hidden="true">{hydrated ? "✓" : startFailed ? "✕" : "…"}</span>
          {hydrated
            ? "Hydrated. The client engine committed the same experience."
            : startFailed
              ? "The client engine could not load this experience’s resources. The server-rendered page is still shown."
              : "Hydrating…"}
        </p>
        {startFailed && (
          <button type="button" className="btn" onClick={retryStart}>
            Retry
          </button>
        )}
        <p className="note">
          Runtime experience: <code id="client-state">{experience.id}</code>
          {changedAtRuntime ? " (changed in the browser since the server render)" : " (matches the server)"}
        </p>
      </div>

      <div className="trace-step">
        <h3>Switch at runtime</h3>
        <p className="note">No request to the server; the hydrated engine runs the transition.</p>
        <div className="chip-row">
          {PRESETS.map((preset) => (
            <button key={preset.id} type="button" className="btn" disabled={!hydrated} onClick={() => void transition(preset.request)}>
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="trace-step">
        <h3>Change the preference</h3>
        <p className="note">Saves the cookie and reloads, so the server renders the new experience from the first byte.</p>
        <div className="pref-form">
          {(
            [
              ["culture", CULTURES],
              ["theme", THEMES],
              ["motion", MOTIONS],
            ] as const
          ).map(([dim, options]) => (
            <label key={dim} className="field-inline" data-dim={dim}>
              <span className="pref-label">{dim}</span>
              <select value={preference[dim]} onChange={(event) => setPreference({ ...preference, [dim]: event.target.value } as StudioRequest)}>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {(LABELS[dim] as Record<string, string>)[option]}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <pre className="code-block">
          <code>
            {EXPERIENCE_COOKIE}={serializeExperienceCookie(preference)}
          </code>
        </pre>
        <div className="chip-row">
          <button type="button" className="btn btn-primary" onClick={() => save(serializeExperienceCookie(preference))}>
            Save preference and reload
          </button>
          <button type="button" className="btn" onClick={() => save("fr-FR.neon.fast")}>
            Send an invalid cookie
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => save(null)}>
            Clear cookie
          </button>
        </div>
      </div>

      <div className="trace-step">
        <h3>Check the raw response</h3>
        <p className="note">Requests this URL again with your current cookie and reads the markers out of the HTML text, before any script runs on it.</p>
        <button type="button" className="btn" onClick={() => void fetchRaw()}>
          Fetch raw HTML
        </button>
        {rawError && (
          <p className="note" role="alert">
            The request failed: {rawError}
          </p>
        )}
        {raw && (
          <div role="status">
            <dl className="facts facts-rows">
              <div>
                <dt>HTTP status</dt>
                <dd>
                  <code>{raw.status}</code>
                </dd>
              </div>
              <div>
                <dt>HTML size</dt>
                <dd>
                  <code>{raw.bytes.toLocaleString("en-US")} bytes</code>
                </dd>
              </div>
              {Object.entries(raw.markers).map(([key, value]) => (
                <div key={key}>
                  <dt>data-server-{key}</dt>
                  <dd>
                    <code>{value}</code>
                  </dd>
                </div>
              ))}
            </dl>
            <ProvenanceTag kind="engine">Read from the raw HTTP response</ProvenanceTag>
          </div>
        )}
      </div>

      <p className="note">
        Committed now: <ExperienceTriplet request={current} size="sm" />
      </p>
    </>
  );
}
