# Phase 9 — Real Core Implementation / v0.1

## Goal

Move from architectural prototype to a runnable framework-independent Core.

## Implemented

```text
Registry
Resolver
Resource Manager
Versioned Cache
Runtime lifecycle
Experience Delta
Component Resolver
Stable errors
Immutable resolved snapshots
Public Core exports
```

## Runtime

```text
setExperience()
    ↓
resolve
    ↓
prepare resources
    ↓
stale check
    ↓
transition
    ↓
commit
```

A failed preparation never replaces the committed experience.

## Core boundaries

The implementation contains no React or Next.js imports.

Framework adapters remain separate packages.

## Resource semantics

Resource identity includes:

```text
kind + id + version
```

Concurrent requests for the same resource are deduplicated through an in-flight promise.

Failed loads are not cached.

## Inheritance

Culture and Theme definitions may explicitly extend another definition.

Cycles and excessive depth are rejected.

## Component resolution

The resolver distinguishes:

```text
Base
Variant
Replacement
```

Application rendering can continue to request the logical component name while the Engine resolves the experience-specific implementation.

## API

```ts
const engine = new ExperienceEngine({
  cultures,
  themes,
  motions,
  initial,
});

await engine.init();

await engine.setExperience({
  culture: "ar-EG",
  theme: "luxury",
  motion: "smooth",
});
```

## Contract tests

The test suite covers:

- initial resolution
- RTL
- culture inheritance
- theme inheritance
- token resolution
- delta generation
- immutable snapshots
- stable error codes
- rollback after invalid transition
- resource preload/cache deduplication
- component variants
- component replacements

## Important limitation

This is a **real Core implementation**, but it is not yet a production-published npm package.

Next work should add:

```text
package build artifacts
React adapter
Next adapter
browser benchmark
real browser transition tests
documentation examples
CI
```

## Validation

TypeScript contract compilation passes with strict mode and bundler module resolution.

Two implementation issues discovered during validation were fixed: registry key inference is now preserved explicitly at the engine boundary, and immutable resolved snapshots are constructed in one step before deep-freezing.

## Status

**Phase 9 — Core v0.1 implementation COMPLETE**
