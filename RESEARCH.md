# Research archive

Experience Engine started as a research project on the Experience Transition Protocol (ETP). This file is the guide to the research material kept in the repository. None of it is needed to use the packages; it is here so the work can be inspected and reproduced.

For the engineering entry point, see [README.md](./README.md).

## Where things are

| Path | Contents |
|---|---|
| [`02-paper/`](./02-paper) | Paper PDFs and LaTeX sources |
| [`04-evidence/`](./04-evidence) | Stored validation results: Phase 92 (React 18 and Next.js runtime) and Phase 94 (dynamic per-request SSR) |
| [`05-audit/`](./05-audit) | Final runtime gate and the archived audit packages from Phases 84 to 91 |
| [`03-submission/`](./03-submission) | Historical submission checklists. Kept for the record; not maintained |
| [`01-runtime/`](./01-runtime) | Besides the two packages: phase notes, the browser and Next.js evaluation harnesses, the independent reference model, the core contract test, and two manifests |
| [`PAPER-UPDATE-LOG.md`](./PAPER-UPDATE-LOG.md), [`README-v2-archive.md`](./README-v2-archive.md), [`SHA256SUMS.txt`](./SHA256SUMS.txt) | Earlier top-level records, unchanged |

`SHA256SUMS.txt` is the hash list of the research package as it was at version 4. Files changed since then, including the top-level `README.md`, no longer match it.

## What the research does and does not claim

Supported, within the tested scope:

- ETP as a formalized, reusable protocol abstraction for experience-level transitions.
- Coordination of typed delta, dependency closure, heterogeneous preparation and guarded commit.

Scoped:

- Locality results come from synthetic dependency graphs.
- Browser stress results come from controlled headless Chromium runs.
- React and Next.js runtime validation was done in local environments. Dynamic per-request SSR was validated on a local production server only.

Not claimed:

- Being the first adaptive, multi-dimensional, dependency-aware or transactional UI system.
- Unique atomicity or stale-request guarantees. A strong manual baseline reproduces the tested safety semantics.
- Universal performance superiority. In several measured scenarios the engine added overhead.
- Third-party replication. It has not happened.

## Manifests

Two manifests in `01-runtime/` record file hashes at two points in time.

| File | Records | Status |
|---|---|---|
| `manifest.json` | The core as evaluated at Phase 37 | Historical, never modified |
| `manifest-pass2.json` | Every file changed since the commit before Pass 2, with hashes | Updated when those files change |

Check the second one from the repository root:

```bash
npm run verify:manifest
```

It verifies the listed files, the Phase 37 manifest's own hash, and that nothing changed since the base commit without being listed. Because of that last check it describes one specific state of the repository: after further commits it fails until the manifest is regenerated with `node 01-runtime/scripts/update-manifest-pass2.mjs`. It is a provenance record, not a test, and it is not part of CI.

Four Phase 37 entries differ from the current files:

- `packages/core/src/engine.ts` and `packages/core/src/runtime/runtime.ts` changed when the commit subscription was added to the core.
- `packages/core/package.json` changed when the package was given a build step and npm metadata. No source file changed with it.
- `01-runtime/package.json` already differed before any of that.

## Relationship between the paper and the current code

The paper's evaluation describes the core before the commit subscription (`engine.subscribe`) was added and before the React adapter moved from polling to that subscription. Resolution, delta, closure, preparation, the stale guard and transactions were not changed by that work. The stored React 18 and Next.js measurements were taken with the earlier adapter and have not been re-measured.

## The previous top-level README

The research package's README, as it stood before this repository was prepared for public release, is reproduced below unchanged.

---

## Experience Engine — Final Research Package v4

Date: 2026-10-07

This package consolidates the runnable Experience Engine implementation, evidence, updated paper, and submission materials.

### Paper
- `02-paper/Experience-Engine-EICS2027-Bassem-Hazem.pdf` — named author/reference copy.
- `02-paper/Experience-Engine-EICS2027-Anonymous.pdf` — anonymous submission copy.
- `02-paper/main_author.tex` — named source.
- `02-paper/main_anonymous.tex` — anonymous source.

The paper incorporates the Phase 94 dynamic per-request SSR result and no longer contains the red review line numbering.

### Runtime validation
- React 18.3.1 exact E2E: PASS within tested environment.
- Next.js 16.2.0 App Router/RSC and client runtime: PASS within tested environment.
- Personalized dynamic per-request SSR: PASS_WITH_SCOPE in the tested Next.js production-server setup.
- Third-party independent replication: pending and explicitly not claimed.

### Submission
The official EICS 2027 call uses double-blind review for Full Papers and Technical Notes and requires ACM TAPS formatting/workflow with submission through Precision Conference. The current official schedule lists Round 2 paper submissions on 12 November 2026 (AoE). Verify the live PCS round immediately before upload.

### Important upload rule
This ZIP is a **research archive**, not the anonymous manuscript upload. In PCS, upload the anonymous PDF as the review manuscript. Do not upload the whole archive as the anonymous manuscript because the archive contains the named PDF and author source.

### Claim discipline
The package does not claim first/unique adaptive UI, unique atomicity, universal performance superiority, universal deployment/cache behavior, or third-party replication.
