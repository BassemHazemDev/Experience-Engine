import { seedNodes } from "@experience-engine/core";
import type { TransitionRecord } from "@/features/transition-recorder/recorder";

const STAGE_MARK = { done: "✓", failed: "✕", skipped: "–", pending: "…" } as const;

type StageState = keyof typeof STAGE_MARK;

/**
 * The eight protocol stages for one recorded transition. The value under each
 * stage is read from the engine's transaction. The staggered entrance is only
 * a visual replay: the engine reports commits, not individual stages.
 */
export function Pipeline({ record }: { record: TransitionRecord }) {
  const transaction = record.transaction!;
  const seeds = seedNodes(transaction.delta, transaction.to);
  const failed = record.outcome === "failed";
  const stale = record.outcome === "stale";
  const pending = record.outcome === "pending";
  const tail: StageState = failed || stale ? "skipped" : pending ? "pending" : "done";

  const stages: { name: string; detail: string; state: StageState }[] = [
    { name: "Normalize", detail: "1 request", state: "done" },
    { name: "Resolve", detail: transaction.to.id, state: "done" },
    { name: "Diff", detail: `${transaction.delta.changedKeys.length} changed keys`, state: "done" },
    { name: "Seeds", detail: `${seeds.length} seed nodes`, state: "done" },
    { name: "Closure", detail: `${transaction.affected.length} nodes`, state: "done" },
    {
      name: "Prepare",
      detail: failed ? "a resource failed" : `${transaction.to.resources.length} resources`,
      state: failed ? "failed" : pending ? "pending" : "done",
    },
    { name: "Transition", detail: transaction.to.motion.defaultStrategy ?? "instant", state: tail },
    { name: "Commit", detail: failed ? "current kept" : stale ? "discarded by guard" : pending ? "waiting" : "guarded", state: tail },
  ];

  return (
    <div className="pipeline-wrap">
      <div className="pipeline-labels">
        <span className="pipeline-label" data-kind="result">
          <strong>Result</strong> Values read from the engine’s transaction
        </span>
        <span className="pipeline-label" data-kind="replay">
          <strong>Visual replay</strong> The entrance animation is not live stage timing
        </span>
      </div>
      <ol className="pipeline" aria-label="Protocol stages for this transition">
        {stages.map((stage, index) => (
          <li key={stage.name} data-state={stage.state} style={{ animationDelay: `${index * 70}ms` }}>
            <span className="pipeline-name">
              {stage.name}
              <span className="pipeline-mark" aria-hidden="true">
                {STAGE_MARK[stage.state]}
              </span>
              <span className="sr-only">{stage.state === "done" ? ", completed" : `, ${stage.state}`}</span>
            </span>
            <span className="pipeline-detail">{stage.detail}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
