# Provenance & Authorship

This document establishes the public provenance, authorship, and publication record for the Experience Engine project.

## Author & Maintainer

Experience Engine is an original software project developed and maintained by **Bassem Hazem**.

- **Author**: Bassem Hazem
- **Canonical Repository**: [https://github.com/BassemHazemDev/Experience-Engine](https://github.com/BassemHazemDev/Experience-Engine)
- **Live Studio Showcase**: [https://studio.bassemhazem.com](https://studio.bassemhazem.com)
- **License**: MIT ([LICENSE](../LICENSE)) — Copyright (c) 2026 Bassem Hazem

## Provenance Chain

The project's development and release follow a traceable provenance chain:

```text
Research & Design
  │   Experience Transition Protocol (ETP) formalization
  │   Multi-dimensional UI state model across culture, theme, and motion
  ▼
Implementation
  │   @experience-engine/core: framework-agnostic runtime
  │   @experience-engine/react: React adapter with external store
  ▼
Verification
  │   Core contract testing (core-contract.test.ts)
  │   Per-request SSR validation matrix
  │   Unit, adapter, and component test suites (Vitest)
  │   Cryptographic file manifest verification (Pass 2)
  ▼
Open-Source Repository
  │   Canonical source code, examples, documentation, and evaluation record
  │   https://github.com/BassemHazemDev/Experience-Engine
  ▼
npm Packages
  │   @experience-engine/core@0.1.0
  │   @experience-engine/react@0.1.0
  ▼
Live Studio Showcase
      Production deployment on Vercel
      https://studio.bassemhazem.com
```

## Published Artifacts

### 1. Runtime Packages on npm

The runtime packages are published to the public npm registry under the `@experience-engine` namespace:

| Package | Version | Registry URL | Purpose |
|---|---|---|---|
| `@experience-engine/core` | 0.1.0 | [npmjs.com/package/@experience-engine/core](https://www.npmjs.com/package/@experience-engine/core) | Framework-agnostic runtime for prepared and guarded experience transitions |
| `@experience-engine/react` | 0.1.0 | [npmjs.com/package/@experience-engine/react](https://www.npmjs.com/package/@experience-engine/react) | React adapter providing `ExperienceProvider` and reactive hooks |

### 2. Live Application Showcase

The showcase application demonstrates the runtime in an interactive Next.js environment:

- **URL**: [https://studio.bassemhazem.com](https://studio.bassemhazem.com)
- **Hosting**: Vercel
- **Source Workspace**: `06-project/` (Experience Engine Studio)
- **Features Demonstrated**: Transition inspector, delta view, dependency graph, resource loading pipeline, failure recovery, rapid-switching guard, and personalized SSR.

### 3. Canonical Git Repository

- **Repository**: [https://github.com/BassemHazemDev/Experience-Engine](https://github.com/BassemHazemDev/Experience-Engine)
- **Default Branch**: `main`
- **Release Tag**: `v0.1.0`

## Provenance Statement

The Git commit history, repository contents, npm package publications, and live deployment collectively form the public project record.

These links and artifacts provide a public provenance and authorship record for Experience Engine. This statement documents the technical history, releases, and maintainer attribution of the project under the terms of the MIT License. It does not assert legal copyright registration, patent claims, certifications, or independent third-party replication.
