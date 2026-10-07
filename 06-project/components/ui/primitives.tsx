import type { ReactNode } from "react";
import type { Culture, Motion, StudioRequest, Theme } from "@/engine/definitions";

const PROVENANCE = {
  engine: "From the engine",
  measured: "Measured in this browser",
  stored: "Measured locally, stored result",
  structural: "Structural comparison",
  synthetic: "Synthetic workload",
  illustrative: "Illustrative",
  simulated: "Simulated",
  replay: "Replay of a recorded transaction",
} as const;

export type Provenance = keyof typeof PROVENANCE;

/** Says where a number or visual comes from. Used wherever that could be unclear. */
export function ProvenanceTag({ kind, children }: { kind: Provenance; children?: ReactNode }) {
  return (
    <span className="tag" data-kind={kind}>
      {children ?? PROVENANCE[kind]}
    </span>
  );
}

/** The three dimensions of a request, always in the same order and colours. */
export function ExperienceTriplet({ request, size = "md" }: { request: { culture: string; theme: string; motion: string }; size?: "sm" | "md" }) {
  return (
    <span className="triplet" data-size={size}>
      <span data-dim="culture">{request.culture}</span>
      <span data-dim="theme">{request.theme}</span>
      <span data-dim="motion">{request.motion}</span>
    </span>
  );
}

export function requestFromId(id: string | undefined): StudioRequest | undefined {
  if (!id) return undefined;
  const [culture, theme, motion] = id.split("::");
  if (!culture || !theme || !motion) return undefined;
  return { culture: culture as Culture, theme: theme as Theme, motion: motion as Motion };
}

const OUTCOME = {
  pending: { label: "Preparing", mark: "…" },
  committed: { label: "Committed", mark: "✓" },
  stale: { label: "Stale, discarded", mark: "↷" },
  failed: { label: "Failed, current kept", mark: "✕" },
} as const;

export function OutcomeBadge({ outcome }: { outcome: keyof typeof OUTCOME }) {
  return (
    <span className="outcome" data-outcome={outcome}>
      <span aria-hidden="true">{OUTCOME[outcome].mark}</span>
      {OUTCOME[outcome].label}
    </span>
  );
}
