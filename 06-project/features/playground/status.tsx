"use client";

import { useResolvedExperience, useTransitionLog } from "@/components/engine-boundary";
import { ExperienceTriplet } from "@/components/ui/primitives";

export function PlaygroundStatus() {
  const experience = useResolvedExperience();
  const { records, pending } = useTransitionLog();
  const count = (outcome: string) => records.filter((record) => record.outcome === outcome).length;

  return (
    <div className="playground-status">
      <div>
        <span className="note">Committed experience</span>
        <ExperienceTriplet request={experience.request} />
      </div>
      <dl className="tally" aria-label="Requests this session">
        <div>
          <dt>Committed</dt>
          <dd>{count("committed")}</dd>
        </div>
        <div>
          <dt>Stale</dt>
          <dd>{count("stale")}</dd>
        </div>
        <div>
          <dt>Failed</dt>
          <dd>{count("failed")}</dd>
        </div>
        <div>
          <dt>In flight</dt>
          <dd>{pending}</dd>
        </div>
      </dl>
    </div>
  );
}
