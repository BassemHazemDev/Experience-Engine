"use client";

import { useResolvedExperience, useStudioRuntime, useTransitionLog } from "@/components/engine-boundary";
import { resolveComponents } from "@/components/preview/adaptation";
import { effectiveMotion, usePrefersReducedMotion } from "@/components/preview/use-presented-experience";
import { ProvenanceTag } from "@/components/ui/primitives";

/** Research mode: the raw state behind the preview, read straight from the engine. */
export function ResearchPanel() {
  const experience = useResolvedExperience();
  const { engine, hydrated } = useStudioRuntime();
  const { records, pending } = useTransitionLog();
  const prefersReduced = usePrefersReducedMotion();

  const inspect = engine.inspect();
  const motion = effectiveMotion(experience.motion, prefersReduced);
  const components = resolveComponents(experience);
  const committed = records.filter((record) => record.outcome === "committed");
  const previousId = committed[committed.length - 1]?.fromId;
  const last = records[records.length - 1];

  return (
    <aside className="research" aria-label="Research mode">
      <header className="research-head">
        <h2>Research mode</h2>
        <ProvenanceTag kind="engine" />
      </header>

      <dl className="facts facts-stack">
        <div>
          <dt>Experience ID</dt>
          <dd>
            <code>{experience.id}</code>
          </dd>
        </div>
        <div>
          <dt>Previous</dt>
          <dd>
            <code>{previousId ?? "—"}</code>
          </dd>
        </div>
        <div>
          <dt>Lifecycle</dt>
          <dd>
            <code>{hydrated ? inspect.status : "not initialised"}</code>
            {pending > 0 && ` · ${pending} in flight`}
          </dd>
        </div>
        <div>
          <dt>Direction / locale</dt>
          <dd>
            <code>
              {experience.direction} / {experience.locale}
            </code>
          </dd>
        </div>
        <div>
          <dt>Motion strategy</dt>
          <dd>
            <code>
              {experience.motion.defaultStrategy} · {experience.motion.durationMs} ms
            </code>
          </dd>
        </div>
        <div>
          <dt>Shown on this device as</dt>
          <dd>
            <code>
              {motion.strategy} · {motion.durationMs} ms
            </code>
            {motion.clampedByPreference && " (reduced-motion preference)"}
          </dd>
        </div>
        <div>
          <dt>Component adaptation</dt>
          <dd>
            <code>
              Navigation → {components.navigation.mode}
              <br />
              OrdersTable → {components.orders.mode}
              {components.orders.mode === "replacement" && ` (${components.orders.component})`}
            </code>
          </dd>
        </div>
        <div>
          <dt>Resources / cached</dt>
          <dd>
            <code>
              {experience.resources.length} / {inspect.cachedResources}
            </code>
          </dd>
        </div>
        <div>
          <dt>Registries</dt>
          <dd>
            <code>
              {inspect.registries.cultures.length} cultures · {inspect.registries.themes.length} themes · {inspect.registries.motions.length} motions
            </code>
          </dd>
        </div>
        {last?.durationMs !== undefined && (
          <div>
            <dt>Last request</dt>
            <dd>
              <code>
                {last.outcome} · {last.durationMs.toFixed(1)} ms
              </code>{" "}
              <ProvenanceTag kind="measured" />
            </dd>
          </div>
        )}
      </dl>

      <details className="research-details">
        <summary>Request</summary>
        <pre>{JSON.stringify(experience.request, null, 2)}</pre>
      </details>
      <details className="research-details">
        <summary>Delta on the committed snapshot</summary>
        <pre>{JSON.stringify(experience.delta ?? null, null, 2)}</pre>
      </details>
      <details className="research-details">
        <summary>Resolved tokens</summary>
        <pre>{JSON.stringify(experience.tokens, null, 2)}</pre>
      </details>
      <details className="research-details">
        <summary>Typography and formatting</summary>
        <pre>{JSON.stringify({ typography: experience.typography, formatting: experience.formatting }, null, 2)}</pre>
      </details>
    </aside>
  );
}
