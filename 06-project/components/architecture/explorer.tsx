"use client";

import { useState } from "react";
import { seedNodes } from "@experience-engine/core";
import { useResolvedExperience, useTransitionLog } from "@/components/engine-boundary";
import { resolveComponents } from "@/components/preview/adaptation";
import { ProvenanceTag } from "@/components/ui/primitives";

const LAYERS = [
  {
    id: "application",
    name: "Application",
    role: "Decides which experience it wants and renders from the resolved snapshot.",
    detail:
      "In this Studio the application is Nova Commerce. It reads tokens, direction, locale and formatting from the snapshot and sends complete requests. It holds no culture, theme or motion state of its own.",
    code: "await engine.setExperience({ culture, theme, motion })",
  },
  {
    id: "adapter",
    name: "Framework adapter",
    role: "Connects the engine to a UI framework. React and Next.js here.",
    detail:
      "The React adapter exposes ExperienceProvider and hooks built on useSyncExternalStore. Its store subscribes to the engine and updates its snapshot only when the engine reports a commit, so there is no polling.",
    code: "<ExperienceProvider engine={engine}> · useExperience()",
  },
  {
    id: "core",
    name: "Experience Engine core",
    role: "Runs the transition protocol and owns the single committed experience.",
    detail:
      "Framework-agnostic. The inspected core source has no direct dependency on browser globals, which is why the same code resolves an experience inside a Next.js Server Component.",
    code: "new ExperienceEngine({ cultures, themes, motions, initial })",
  },
  {
    id: "resolver",
    name: "Resolver",
    role: "Turns a request into an immutable resolved experience.",
    detail: "Follows inheritance between definitions, merges tokens, collects resources, and freezes the result so nothing can change it after the fact.",
    code: "resolveExperience(request, registries, previous)",
  },
  {
    id: "registry",
    name: "Registry and definitions",
    role: "Declarative culture, theme and motion definitions.",
    detail: "Definitions are plain data registered once. Adding the Midnight theme to this Studio was one more entry here, with no change to the core.",
    code: "cultures · themes · motions",
  },
] as const;

const STAGES = [
  { id: "normalize", name: "Normalize", what: "Validate the request and fill the default motion.", where: "resolveExperience()" },
  { id: "resolve", name: "Resolve", what: "Build the immutable target snapshot from the registries.", where: "resolveCulture() · resolveTheme()" },
  { id: "diff", name: "Diff", what: "Compare current and target into a typed delta, per dimension.", where: "diffSnapshots()" },
  { id: "seeds", name: "Seeds", what: "Pick the graph nodes the delta touches directly.", where: "seedNodes()" },
  { id: "closure", name: "Closure", what: "Follow dependency edges from the seeds to find everything affected.", where: "dependencyClosure()" },
  { id: "prepare", name: "Prepare", what: "Load translations, fonts, assets and code together, with caching and de-duplication.", where: "ResourceManager.preload()" },
  { id: "transition", name: "Transition", what: "Mark the runtime as transitioning. How the change looks is up to the adapter and application.", where: "ExperienceRuntime" },
  { id: "commit", name: "Commit", what: "If this is still the latest request, swap the committed snapshot in one assignment.", where: "ExperienceRuntime.setExperience()" },
] as const;

export function ArchitectureExplorer() {
  const [layer, setLayer] = useState<string>("core");
  const [stage, setStage] = useState<string>("diff");
  const { records } = useTransitionLog();
  const experience = useResolvedExperience();

  const activeLayer = LAYERS.find((item) => item.id === layer)!;
  const activeStage = STAGES.find((item) => item.id === stage)!;
  const tx = [...records].reverse().find((record) => record.transaction)?.transaction;

  const live: Record<string, string | undefined> = tx
    ? {
        normalize: JSON.stringify(tx.to.request),
        resolve: tx.to.id,
        diff: `${tx.delta.changedKeys.length} changed keys`,
        seeds: `${seedNodes(tx.delta, tx.to).length} seed nodes`,
        closure: `${tx.affected.length} nodes in closure`,
        prepare: `${tx.to.resources.length} resources (${tx.delta.resources.added.length} added, ${tx.delta.resources.retained.length} retained)`,
        transition: `${tx.to.motion.defaultStrategy}, ${tx.to.motion.durationMs} ms`,
        commit: tx.status,
      }
    : {};

  return (
    <>
      <section className="band" aria-labelledby="layers-title">
        <div className="band-head">
          <h2 id="layers-title">Layers</h2>
          <p>Each layer only talks to the one below it. Select a layer to see what it is responsible for.</p>
        </div>
        <div className="explorer">
          <ol className="stack">
            {LAYERS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={layer === item.id}
                  onClick={() => setLayer(item.id)}
                  onMouseEnter={() => setLayer(item.id)}
                  onFocus={() => setLayer(item.id)}
                >
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="explorer-detail" aria-live="polite">
            <h3>{activeLayer.name}</h3>
            <p>{activeLayer.detail}</p>
            <pre>
              <code>{activeLayer.code}</code>
            </pre>
          </div>
        </div>
      </section>

      <section className="band" aria-labelledby="pipeline-title">
        <div className="band-head">
          <h2 id="pipeline-title">The eight stages of a transition</h2>
          <p>
            Every call to <code>setExperience()</code> runs these in order. Select a stage to see what it does and where it lives in the core.
          </p>
        </div>
        <div className="explorer explorer-stages">
          <ol className="stage-list">
            {STAGES.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={stage === item.id}
                  onClick={() => setStage(item.id)}
                  onMouseEnter={() => setStage(item.id)}
                  onFocus={() => setStage(item.id)}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ol>
          <div className="explorer-detail" aria-live="polite">
            <h3>{activeStage.name}</h3>
            <p>{activeStage.what}</p>
            <dl className="facts">
              <div>
                <dt>In the core</dt>
                <dd>
                  <code>{activeStage.where}</code>
                </dd>
              </div>
              <div>
                <dt>In your last transition</dt>
                <dd>
                  {live[activeStage.id] ? (
                    <>
                      <code>{live[activeStage.id]}</code> <ProvenanceTag kind="engine" />
                    </>
                  ) : (
                    <span className="note">Run a transition in the Studio and this fills in.</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <AdaptationSection experienceId={experience.id} adaptation={resolveComponents(experience)} radius={String(experience.tokens.radius)} />
    </>
  );
}

function AdaptationSection({
  experienceId,
  adaptation,
  radius,
}: {
  experienceId: string;
  adaptation: ReturnType<typeof resolveComponents>;
  radius: string;
}) {
  const rows = [
    {
      level: "Token",
      meaning: "The component stays the same and reads new values.",
      example: "Card radius, colour and shadow",
      now: `radius ${radius}px`,
    },
    {
      level: "Variant",
      meaning: "The same component takes a different form.",
      example: "Navigation: labelled rail or icon-only",
      now: adaptation.navigation.mode === "variant" ? `variant → ${adaptation.navigation.component}` : "base",
    },
    {
      level: "Replacement",
      meaning: "A different component takes its place, and its code is prepared first.",
      example: "Orders: data table or compact list",
      now: adaptation.orders.mode === "replacement" ? `replacement → ${adaptation.orders.component}` : "base",
    },
  ];
  return (
    <section className="band" aria-labelledby="adaptation-title">
      <div className="band-head">
        <h2 id="adaptation-title">How components adapt</h2>
        <p>A theme can change a component at three depths. The cheapest one that does the job is used.</p>
      </div>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Depth</th>
              <th scope="col">What changes</th>
              <th scope="col">In Nova Commerce</th>
              <th scope="col">
                Right now (<code>{experienceId}</code>)
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.level}>
                <th scope="row">{row.level}</th>
                <td>{row.meaning}</td>
                <td>{row.example}</td>
                <td>
                  <code>{row.now}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
