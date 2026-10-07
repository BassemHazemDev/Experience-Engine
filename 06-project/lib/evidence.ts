// Every figure on the Benchmark and Evidence pages comes from this file, and
// every entry names the repository file it was copied from. Nothing here is
// measured by the Studio and nothing is estimated.

export type GateStatus = "PASS" | "PASS_WITH_SCOPE" | "PENDING" | "NOT_CLAIMED";

export const SOURCES = {
  paper: "02-paper/main_author.tex",
  phase92: "04-evidence/phase-92-runtime-validation/phase-92-runtime-validation.json",
  gates: "04-evidence/phase-92-runtime-validation/gate-table.md",
  phase94: "04-evidence/phase-94-dynamic-ssr/phase-94-final-result.json",
  core: "01-runtime/results/verification-summary.json",
} as const;

export type SourceKey = keyof typeof SOURCES;

export interface EvidenceRow {
  readonly name: string;
  readonly status: GateStatus;
  readonly result: string;
  readonly scope: string;
  readonly source: SourceKey;
}

export const EVIDENCE: readonly EvidenceRow[] = [
  {
    name: "Formal model",
    status: "PASS",
    result: "Experience state, transition, typed delta, dependency closure, preparation and guarded commit are defined with their invariants.",
    scope: "The invariants are not claimed to be unique to this protocol.",
    source: "paper",
  },
  {
    name: "Implementation",
    status: "PASS",
    result: "Typecheck passes. 1,000 resolution runs, 50 concurrent batches and 100 stale requests; failure preservation and snapshot immutability hold.",
    scope: "Core runtime, Phase 37 verification run.",
    source: "core",
  },
  {
    name: "Property testing",
    status: "PASS",
    result: "Generated tests cover deterministic identity, immutable snapshots, direction, failure preservation, stale dominance and dependency closure. No invariant violations observed.",
    scope: "Stored generated workloads only.",
    source: "paper",
  },
  {
    name: "Traditional+ baseline",
    status: "PASS",
    result: "10,000 matched transitions with injected failures and stale requests: 0 partial commits, 0 stale overwrites.",
    scope: "The strong manual baseline reaches the same tested safety outcomes, so the safety semantics are not unique.",
    source: "paper",
  },
  {
    name: "Ablation",
    status: "PASS",
    result:
      "500 graphs, 10,000 transitions. Without typed delta: 1.358× prepared work. Without closure: 7,661 downstream omissions. Without the guard: 1,050 stale overwrites. Without prepare-before-commit: 1,200 partial states.",
    scope: "12% failure injection and 12% stale-request injection on generated graphs.",
    source: "paper",
  },
  {
    name: "Browser stress",
    status: "PASS",
    result: "301 cases in headless Chromium (50 resource failures, 50 stale races, 101 rapid requests, 100 mixed): 0 invariant violations.",
    scope: "Controlled headless Chromium workloads.",
    source: "paper",
  },
  {
    name: "Reference model",
    status: "PASS",
    result: "A separate implementation that does not import the engine passed 1,000 identity checks and 5,000 randomized transitions with 0 failure-preservation violations.",
    scope: "Written by the author. This is not third-party replication.",
    source: "paper",
  },
  {
    name: "React 18 end-to-end",
    status: "PASS",
    result: "React 18.3.1 with createRoot and useSyncExternalStore: 3 of 3 transitions ended in the requested state, each with an observed React re-render.",
    scope: "Three samples in one local browser, recorded with the earlier polling adapter; not re-measured since the adapter moved to a commit subscription.",
    source: "phase92",
  },
  {
    name: "Next.js RSC",
    status: "PASS_WITH_SCOPE",
    result: "Next.js 16.2.0 App Router production build. The HTTP 200 response carried the server-resolved experience, then the client hydrated and ran 3 transitions correctly.",
    scope: "Local production server; the tested page was statically prerendered.",
    source: "phase92",
  },
  {
    name: "Dynamic per-request SSR",
    status: "PASS_WITH_SCOPE",
    result: "Two cookies on the same route returned two exact server-resolved identities (ar-EG::luxury::smooth and en-US::light::instant), both HTTP 200 with matching direction.",
    scope: "Local Next.js production server. Says nothing about CDN, cache or other deployment topologies.",
    source: "phase94",
  },
  {
    name: "Third-party replication",
    status: "PENDING",
    result: "No independent party has reproduced these results yet.",
    scope: "External replication is still required.",
    source: "gates",
  },
];

export const NOT_CLAIMED: readonly string[] = [
  "Universal performance superiority or lower latency",
  "The first adaptive, multi-dimensional, dependency-aware or transactional UI system",
  "Unique atomicity or stale-request guarantees",
  "Dynamic per-request SSR across every deployment, CDN or cache topology",
  "Third-party independent replication",
];

/** Stored React 18.3.1 samples, copied from the Phase 92 result file. */
export const REACT18_SAMPLES = [
  { target: "ar-EG::luxury::smooth", switchLatencyMs: 23.9, resourceWaitMs: 1.1, commitToPaintMs: 5.2, cls: 0, longTasks: 2, droppedFrames: 0, renders: 1 },
  { target: "en-US::light::instant", switchLatencyMs: 34.0, resourceWaitMs: 0.7, commitToPaintMs: 13.6, cls: 0, longTasks: 2, droppedFrames: 0, renders: 1 },
  { target: "ar-EG::luxury::smooth", switchLatencyMs: 27.4, resourceWaitMs: 0.3, commitToPaintMs: 13.9, cls: 0, longTasks: 2, droppedFrames: 0, renders: 1 },
] as const;

/** Stored Next.js 16.2.0 client samples, copied from the Phase 92 result file. */
export const NEXT_CLIENT_SAMPLES = [
  { target: "en-US::light::instant", latencyMs: 15.8 },
  { target: "ar-EG::luxury::smooth", latencyMs: 18.6 },
  { target: "en-US::light::instant", latencyMs: 13.8 },
] as const;

export const SYNTHETIC_RESULTS = [
  { name: "Locality", size: "10,000-node DAG, 6 required nodes", outcome: "The 6-node closure was prepared instead of all 10,000 nodes: 99.94% less than full invalidation." },
  { name: "Heterogeneous consequences", size: "144 ordered transitions, then 5,000 random", outcome: "0 semantic mismatches against the manual baseline." },
  { name: "Rapid requests", size: "101 requests in headless Chromium", outcome: "1 committed, 100 classified stale; the final state matched the final request." },
] as const;

export const STORED_ADAPTER_NOTE =
  "Recorded with the earlier adapter revision, which polled the core every 16 ms. The adapter now subscribes to commits, and these samples have not been re-measured.";

export const PERFORMANCE_STATEMENT =
  "Core microbenchmarks do not support a universal performance-superiority claim. In several measured scenarios, the engine introduced orchestration overhead. Performance is therefore treated as systems characterization.";
