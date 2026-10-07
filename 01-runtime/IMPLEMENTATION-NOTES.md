# Phase 37 Implementation Notes

Main changes:
- `packages/core/src/protocol/etp.ts` adds first-class ETP types and operators.
- `packages/core/src/runtime/runtime.ts` integrates delta, graph, closure, preparation and transaction lifecycle.
- `packages/core/src/resolver/resolver.ts` fixes cloning and inheritance precedence.
- `packages/core/src/engine.ts` uses function-safe definition cloning.
- `packages/core/src/index.ts` exports the protocol layer.
