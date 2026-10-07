import type { Metadata } from "next";
import { StatusBadge } from "@/components/ui/gate";
import { EVIDENCE, NOT_CLAIMED, SOURCES } from "@/lib/evidence";

export const metadata: Metadata = { title: "Evidence" };

export default function EvidencePage() {
  return (
    <main className="page">
      <header className="page-head">
        <h1>Evidence</h1>
        <p className="lede">
          What was tested, how far each result reaches, and what this work does not claim. Every row cites the file in the research package it comes from.
        </p>
      </header>

      <section className="band" aria-labelledby="gates-title">
        <h2 id="gates-title" className="sr-only">
          Evidence gates
        </h2>
        <ul className="evidence-list">
          {EVIDENCE.map((row) => (
            <li key={row.name}>
              <div className="evidence-name">
                <h3>{row.name}</h3>
                <StatusBadge status={row.status} />
              </div>
              <div className="evidence-body">
                <p>{row.result}</p>
                <p className="note">
                  <strong>Scope.</strong> {row.scope}
                </p>
                <p className="evidence-source">
                  <code>{SOURCES[row.source]}</code>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="band" aria-labelledby="notclaimed-title">
        <div className="band-head">
          <h2 id="notclaimed-title">Not claimed</h2>
          <p>These statements were considered and rejected or left open by the final audit. Nothing on this site should be read as asserting them.</p>
        </div>
        <ul className="evidence-list">
          {NOT_CLAIMED.map((claim) => (
            <li key={claim}>
              <div className="evidence-name">
                <h3>{claim}</h3>
                <StatusBadge status="NOT_CLAIMED" />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="band" aria-labelledby="limits-title">
        <div className="band-head">
          <h2 id="limits-title">Limits of this Studio</h2>
        </div>
        <ul className="prose-list">
          <li>The Studio is a demonstration. Timings it shows are wall-clock readings in your browser and are not research measurements.</li>
          <li>The dependency graph here has a few dozen nodes. The locality results in the paper come from synthetic graphs of up to 10,000 nodes.</li>
          <li>The inspector’s stage-by-stage animation replays a recorded transaction, because the core does not emit live stage events.</li>
          <li>The work evaluates system properties. It does not measure outcomes for people using an adapted interface.</li>
        </ul>
      </section>
    </main>
  );
}
