# Experience Engine — Final Package v2

Consolidated handoff package for the Experience Engine / Experience Transition Protocol (ETP) project.

This package supersedes the earlier phase-by-phase handoff for normal use and incorporates the latest local runtime validation recorded on 2026-10-06.

## Contents
- `01-runtime/` — Core ETP reference implementation, React adapter, browser harness, React 18 E2E harness, Next.js validation harness, and independent reference model.
- `02-paper/` — anonymous EICS 2027 manuscript (PDF + LaTeX source).
- `03-submission/` — PCS submission guidance, checklists, and venue verification.
- `04-evidence/` — selected consolidated evidence bundles, including Phase 92 runtime validation.
- `05-audit/` — final audits, reviewer simulation, GO/NO-GO, and submission handoff records.
- `LOCAL-VALIDATION-2026-10-06.md` — local test record supplied during handoff.

## Core local run
```bash
cd 01-runtime
npm install
npm run typecheck
npm run test:contract
```

## Independent semantic reproduction
```bash
cd 01-runtime/reproduction
bash run.sh
```

The reference model is author-created and is not third-party replication.

## React 18 E2E
The browser bundle in `01-runtime/browser/react-e2e.ts` exercises the actual React adapter using React 18.3.1. Bundle it with esbuild and serve `01-runtime/browser/react-e2e.html` from a local HTTP server.

## Next.js validation
`01-runtime/next-e2e/` contains the successful local validation setup used with Next.js 16.2.0 and React 19.2.0. The observed build prerendered the page statically; dynamic per-request SSR remains out of scope.

## Submission
Primary paper upload:
`02-paper/Experience-Engine-EICS2027-Anonymous.pdf`

Use `03-submission/PCS-FIELD-BY-FIELD.md` and the final checklists for PCS entry. Real author metadata, conflicts, and active submission round must be supplied by the authors.

## Claim boundary
Retained claim: a formalized and reusable experience-level transition protocol abstraction.

Not claimed:
- first adaptive UI framework;
- unique atomicity or stale-safety semantics;
- universal performance superiority;
- dynamic SSR across all Next.js modes;
- third-party replication.

## Package status
**FINAL RUNTIME VALIDATION: PASS_WITH_SCOPE**

Research submission remains conditional on actual PCS submission, real author metadata/conflict entry, final platform checks, and human verification.
