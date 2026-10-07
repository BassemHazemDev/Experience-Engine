"use client";

import { useId, useState, type KeyboardEvent } from "react";
import type { TransitionTransaction } from "@experience-engine/core";
import { useResolvedExperience, useTransitionLog } from "@/components/engine-boundary";
import { ExperienceTriplet, OutcomeBadge, ProvenanceTag, requestFromId } from "@/components/ui/primitives";
import { DependencyGraph } from "@/features/dependency-graph/dependency-graph";
import { ResourcePanel } from "@/features/resource-panel/resource-panel";
import type { TransitionRecord } from "@/features/transition-recorder/recorder";
import { DeltaView } from "./delta-view";
import { Pipeline } from "./pipeline";

const TABS = [
  { id: "delta", label: "Delta" },
  { id: "dependencies", label: "Dependencies" },
  { id: "resources", label: "Resources" },
  { id: "commit", label: "Commit" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function TransitionInspector() {
  const { records } = useTransitionLog();
  const current = useResolvedExperience();
  const [tab, setTab] = useState<TabId>("delta");
  const [selectedSeq, setSelectedSeq] = useState<number | null>(null);
  const baseId = useId();

  const inspectable = records.filter((record) => record.transaction);
  const record = inspectable.find((r) => r.seq === selectedSeq) ?? inspectable[inspectable.length - 1];

  function onTabKey(event: KeyboardEvent) {
    const index = TABS.findIndex((t) => t.id === tab);
    const next = event.key === "ArrowRight" ? index + 1 : event.key === "ArrowLeft" ? index - 1 : -1;
    if (next < 0) return;
    const target = TABS[(next + TABS.length) % TABS.length];
    setTab(target.id);
    document.getElementById(`${baseId}-tab-${target.id}`)?.focus();
  }

  if (!record) {
    return (
      <section className="inspector" aria-label="Transition inspector">
        <header className="inspector-head">
          <h2>Transition inspector</h2>
        </header>
        <div className="inspector-empty">
          <p>
            The engine has committed <code>{current.id}</code>. Change culture, theme, or motion and the transition it runs will be taken apart here: what
            changed, what depended on it, what had to load, and how it was committed.
          </p>
        </div>
      </section>
    );
  }

  const transaction = record.transaction!;
  const from = requestFromId(transaction.from?.id);

  return (
    <section className="inspector" aria-label="Transition inspector">
      <header className="inspector-head">
        <h2>Transition inspector</h2>
        <div className="inspector-route">
          {from ? <ExperienceTriplet request={from} /> : <span className="note">no previous experience</span>}
          <span className="inspector-arrow" aria-label="to">
            <svg viewBox="0 0 28 10" width="28" height="10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <path d="M0 5h26M22 1l4 4-4 4" />
            </svg>
          </span>
          <ExperienceTriplet request={transaction.to.request} />
        </div>
        <OutcomeBadge outcome={record.outcome} />
      </header>

      <Pipeline key={record.seq} record={record} />

      <div className="tabs" role="tablist" aria-label="Transition details" onKeyDown={onTabKey}>
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${baseId}-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={`${baseId}-panel`}
            tabIndex={tab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
          >
            {item.label}
            <span className="tab-count">{tabCount(item.id, transaction, records.length)}</span>
          </button>
        ))}
      </div>

      <div className="inspector-panel" role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${tab}`} tabIndex={0}>
        {tab === "delta" && <DeltaView transaction={transaction} />}
        {tab === "dependencies" && <DependencyGraph transaction={transaction} />}
        {tab === "resources" && <ResourcePanel record={record} />}
        {tab === "commit" && <CommitView record={record} records={records} onSelect={setSelectedSeq} />}
      </div>
    </section>
  );
}

function tabCount(tab: TabId, transaction: TransitionTransaction, records: number) {
  if (tab === "delta") return transaction.delta.changedKeys.length;
  if (tab === "dependencies") return transaction.affected.length;
  if (tab === "resources") return transaction.to.resources.length;
  return records;
}

/* ───────────────────────── Commit ───────────────────────── */

const GUARD_TEXT = {
  committed: "Every resource was ready and no newer request had arrived, so the engine swapped the committed experience in one assignment.",
  stale: "A newer request arrived while this one was preparing. The guard discarded it before it could become visible.",
  failed: "Preparation did not finish, so the commit never ran. The experience on screen is the one that was already committed.",
  pending: "Preparing. Nothing is visible until every resource is ready and the guard confirms this is still the latest request.",
} as const;

function CommitView({ record, records, onSelect }: { record: TransitionRecord; records: readonly TransitionRecord[]; onSelect: (seq: number) => void }) {
  return (
    <div className="commit">
      <div className="commit-summary">
        <OutcomeBadge outcome={record.outcome} />
        <p>{GUARD_TEXT[record.outcome]}</p>
        <dl className="facts">
          <div>
            <dt>Engine request</dt>
            <dd>{record.requestId === undefined ? "—" : `#${record.requestId}`}</dd>
          </div>
          <div>
            <dt>Target</dt>
            <dd>
              <code>{record.transaction?.to.id}</code>
            </dd>
          </div>
          {record.errorCode && (
            <div>
              <dt>Error code</dt>
              <dd>
                <code>{record.errorCode}</code>
              </dd>
            </div>
          )}
          <div>
            <dt>
              Time in <code>setExperience()</code>
            </dt>
            <dd>
              {record.durationMs === undefined ? "—" : `${record.durationMs.toFixed(1)} ms`} <ProvenanceTag kind="measured" />
            </dd>
          </div>
        </dl>
      </div>

      <div className="commit-log">
        <h3>Requests this session</h3>
        <ol>
          {[...records].reverse().map((entry) => (
            <li key={entry.seq}>
              <button type="button" onClick={() => onSelect(entry.seq)} aria-current={entry.seq === record.seq} disabled={!entry.transaction}>
                <span className="commit-log-id">{entry.requestId === undefined ? "—" : `#${entry.requestId}`}</span>
                <ExperienceTriplet request={entry.request} size="sm" />
                <OutcomeBadge outcome={entry.outcome} />
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
