# Phase 37 — First-Class ETP Implementation

## Objective

Upgrade the Core so the formal Experience Transition Protocol (ETP) is represented directly by first-class runtime objects.

Implemented:

- `ETPExperienceDelta`
- `DependencyNode`
- `DependencyGraph`
- `PreparedExperience`
- `TransitionTransaction`
- deterministic seed selection
- dependency closure
- `runtime.getLastTransaction()`

Runtime lifecycle:

```text
Resolve
  ↓
Typed Diff
  ↓
Seed Selection
  ↓
Dependency Closure
  ↓
Preparation
  ↓
Transition
  ↓
Guarded Atomic Commit
```

## Verification-driven fixes

Formal verification exposed and corrected three earlier defects:

1. `structuredClone()` failed on function-valued resource loaders.
2. Resolver cloning had the same problem.
3. Inheritance precedence was reversed, allowing parent values to overwrite child values.

The implementation now preserves executable loaders and resolves inheritance:

```text
base → parent → child
```

## Verification

Strict TypeScript typecheck:

```text
PASS
```

Direct compiled-runtime verification:

```json
{
  "resolutionRuns": 1000,
  "concurrentBatches": 50,
  "staleRequests": 100,
  "failurePreservation": "PASS",
  "snapshotImmutability": "PASS",
  "firstClassDelta": "PASS",
  "firstClassDependencyClosure": "PASS",
  "firstClassTransaction": "PASS"
}
```

The 100 stale requests correspond to two superseded requests in each of the 50 race batches.

## What is now first-class

```text
ExperienceSnapshot
        ↓
ETPExperienceDelta
        ↓
DependencyGraph
        ↓
AffectedClosure
        ↓
PreparedExperience
        ↓
TransitionTransaction
        ↓
Commit
```

The committed transaction is observable through:

```ts
runtime.getLastTransaction()
```

## Limitation

The dependency graph is currently derived from known Core semantics rather than being a fully arbitrary user-extensible graph.

Component dependency semantics and complete motion-preparation semantics remain partial.

Therefore the core ETP is now directly represented and exercised, but the most general formal model is not yet fully implemented.

## Research significance

Phase 37 changes the implementation status from:

```text
formal model
+
behaviorally compatible runtime
```

to:

```text
formal model
+
first-class protocol implementation
+
executable verification
```

The defensible implementation claim is:

> The reference Core directly realizes the central ETP objects and executes them during experience transitions.

This is an implementation result, not a novelty proof.

## Next step

Compare this explicit protocol with a matched traditional architecture for:

- partial-state prevention;
- stale-transition correctness;
- dependency-local preparation;
- application orchestration complexity.
