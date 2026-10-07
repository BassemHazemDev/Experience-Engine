# Limitations

Each limitation is listed with what you will notice, why it exists, and what would remove it. They are grouped by where the cause sits.

## Summary

| # | Limitation | Cause sits in |
|---|---|---|
| 1 | Lifecycle stages cannot be observed live | Engine core |
| 2 | The engine's delta reports component changes as token keys | Engine core |
| 3 | The dependency graph is small and shallow | Engine core |
| 4 | Resolved in Pass 2: a subscriber could miss a change notification | React adapter |
| 5 | Resolved in Pass 2: the adapter polled instead of subscribing | React adapter |
| 6 | Smooth motion depends on the View Transitions API | Studio |
| 7 | A background tab delays the smooth transition | Browser |
| 8 | The motion-only and `css` transitions are subtle | Studio |
| 9 | Timings are single wall-clock readings | Studio |
| 10 | "Cold" in the benchmark runner is cold for the engine only | Studio |
| 11 | Cached resources hide repeated failures and latency | Engine core, by design |
| 12 | Amounts are not converted between currencies | Studio demo data |
| 13 | Only two cultures, with hand-written Arabic copy | Studio demo data |
| 14 | Server and browser may format numbers slightly differently | Platform |
| 15 | SSR was checked on a local server only | Scope of validation |
| 16 | Fonts are fetched at build time | Studio |
| 17 | Linked packages need three config settings | Repository layout |
| 18 | Parts of the UI were not visually verified | Verification |
| 19 | Accessibility was not audited | Verification |
| 20 | Only Chromium-based browsers were used | Verification |
| 21 | Two core files and two adapter files no longer match the Phase 37 manifest | Repository records |
| 22 | Stored React and Next.js samples predate the adapter change | Evidence |

---

## Engine core

### 1. Lifecycle stages cannot be observed live

**What you notice.** The inspector's pipeline strip fills in after a transition has settled. It does not light up stage by stage while the engine works.

**Why.** The runtime moves through `PREPARING`, `READY`, `TRANSITIONING` and `COMMITTED`, and it accepts an `onStatusChange` callback, but `ExperienceEngine` constructs its runtime without passing options. Pass 2 added `engine.subscribe()`, which reports commits only; that was deliberate, to keep the core change as small as possible. Individual stages are still not observable. The Studio can read `getStatus()` and `getLastTransaction()`, but only by asking.

**What the Studio does.** It reads the transaction right after calling `setExperience()` and again when the promise settles. Stage values are real and sit under a "Result" label. The entrance animation sits under a separate, dashed "Visual replay" label that says it is not live stage timing.

**What would remove it.** An event source or `onStatusChange` option on the engine.

### 2. Component changes appear as token changes

**What you notice.** Switching to Midnight replaces the orders table, but the delta lists `token:component.orders`, not a component entry. The delta's component section is always empty.

**Why.** `ThemeDefinition` has a `components` field and the protocol's `diffSnapshots` compares `components`, but `resolveExperience` does not copy a theme's `components` into the resolved experience. There is nothing for the diff to compare.

**What the Studio does.** It expresses component adaptation as string tokens (`component.nav`, `component.orders`) and passes them to the core `ComponentResolver`. Since Pass 2 the inspector has a Components panel that runs the resolver on the previous and the target snapshot and shows the result, for example `OrdersTable (base) → OrdersList (replacement)`, with the selecting token named underneath. Those tokens are no longer listed among the visual tokens. The engine's own key list still contains `token:component.*`, and the inspector says so.

**Why the core was not changed for this.** Making the resolver carry `components` would change resolution output and the delta the paper's evaluation was run against. Pass 2 was limited to changes that leave resolution, the delta and transaction behaviour untouched.

**What would remove it.** The resolver projecting `components` onto the resolved experience.

### 3. The dependency graph is small and shallow

**What you notice.** The graph has a few dozen nodes in two levels. A full three-dimension change puts most of them in the closure (for example 35 of 35), so locality is only visible on single-dimension changes, such as a motion-only change with a closure of one node.

**Why.** `createDependencyGraph` builds dimensions, direction, locale, tokens and resources for the target experience. It has no edges from tokens to the components that use them. The graph is also built for the target only.

**What this does not show.** The paper's locality result (a 6-node closure in a 10,000-node graph) comes from synthetic graphs. The Studio does not reproduce it and does not display fabricated large graphs.

### 11. Cached resources hide repeated failures and latency

**What you notice.** After a resource has loaded once, turning on a fault switch or added latency in the inspector has no effect on it.

**Why.** This is the engine working as designed. `ResourceManager` caches successful loads and never calls the loader again.

**What the Studio does.** The Break-the-transition lab invalidates the relevant cached entries before each attempt with `engine.resources.invalidate()`. The Resources tab has a "Clear resource cache" button that calls `engine.resources.clear()`.

---

## React adapter

### 4. Resolved in Pass 2: a subscriber could miss a change notification

**What it was.** In the adapter's store, `getSnapshot()` updated a shared cached snapshot whenever it saw a new committed experience. If any component rendered for another reason and read the snapshot first, every poll then saw "no change" and no listener was notified. A component with no re-rendering parent stayed on the old experience.

**What changed.** `getSnapshot()` is now a pure read. The snapshot is replaced in exactly two places: when the engine reports a commit, and when the first subscriber attaches (to catch up on a commit that landed before anyone was listening). The Studio's workaround in `useResolvedExperience` was removed.

**How it is checked.** `tests/adapter.test.tsx`, tests C, D and H.

### 5. Resolved in Pass 2: the adapter polled instead of subscribing

**What it was.** Each subscriber ran a 16 ms `setInterval` and compared snapshots.

**What changed.** The core gained one method, `engine.subscribe(listener)`, which runs listeners after an experience has been committed and never for stale or failed transitions. A listener that throws cannot fail or undo the commit. The adapter store holds one engine subscription for all its React subscribers and releases it when the last one unmounts. No timers are involved.

**What did not change.** Resolution, delta computation, dependency closure, preparation, the stale guard and the transaction record are untouched. The notification is the last statement before `setExperience()` returns.

**How it is checked.** `tests/adapter.test.tsx`, the four core subscription tests and tests B, E, F and G.

---

## Studio

### 6. Smooth motion depends on the View Transitions API

**What you notice.** In a browser without `document.startViewTransition`, the Smooth motion applies the change immediately with no animation.

**Why.** A direction flip, a font change and a layout change cannot be interpolated with CSS transitions, so the Studio uses a view transition to cross-fade the old and new preview. There is no JavaScript animation fallback.

**Also.** One element per page can carry the transition name, so a page should render one preview.

### 7. A background tab delays the smooth transition

**What you notice.** If the tab is hidden when a Smooth transition commits, the animation is skipped.

**Why.** The browser does not run view transitions for a hidden document, and a tab that has stopped rendering frames may never call the update callback.

**What the Studio does.** It checks visibility before starting a view transition, and it applies the committed experience from a timer as well, so the screen cannot stay on the old experience.

### 8. The motion-only and `css` transitions are subtle

**What you notice.** Changing only the motion dimension changes nothing visible until the next transition. The Reduced motion is a 140 ms colour fade.

**Why.** Motion describes how a change is shown; with no other change there is nothing to show. The `css` strategy animates colour properties only, by intent.

### 9. Timings are single wall-clock readings

**What you notice.** Durations in the inspector, Research mode and the benchmark runner vary between runs.

**Why.** They are `performance.now()` differences around one `setExperience()` call in your browser. They include resource loading and whatever else the main thread was doing, and exclude React rendering and painting. They are labelled "Measured in this browser".

**What they are not.** Research measurements. The stored results on the Benchmark page were taken with a different harness and are not comparable.

### 10. "Cold" in the benchmark runner is cold for the engine only

**Why.** The runner uses a new engine with an empty resource cache, but the browser may already hold the message module, the font and the image from earlier use of the site. The page says so next to the runner.

### 12. Amounts are not converted between currencies

**What you notice.** Revenue is $48,250 in English and ٤٨٬٢٥٠ ج.م. in Arabic.

**Why.** The demo data is one set of numbers formatted with the culture's currency. It shows formatting, not exchange rates. Nova Commerce is fictional and all figures are demo data.

### 13. Only two cultures, with hand-written Arabic copy

The Arabic text was written for this demo and has not been reviewed by a professional translator. Weekday order, calendars and plural rules are not exercised.

### 16. Fonts are fetched at build time

`next/font/google` downloads Schibsted Grotesk, JetBrains Mono, Figtree, IBM Plex Sans Arabic and Fraunces during `next build`. A build without network access fails unless the fonts are cached.

---

## Platform and layout

### 14. Server and browser may format numbers slightly differently

Node and the browser ship different ICU data versions, so `Intl` output for the same locale can differ by a character such as a directional mark. Formatted values carry `suppressHydrationWarning` so this does not surface as a hydration warning. The visible value is the browser's after hydration.

### 15. SSR was checked on a local server only

The five cookie cases pass against `next start` on one machine. This says nothing about CDNs, shared caches, edge runtimes or other hosts. A cache in front of `/personalized` must vary on the `experience` cookie or bypass the route.

### 17. Linked packages need three config settings

The engine packages are workspace members that live outside `06-project`. This requires `preserveSymlinks` in `tsconfig.json`, `turbopack.root` in `next.config.ts`, and matching settings in `vitest.config.ts`. Moving the app or the packages means updating these paths. The Studio uses the packages' built output, so a change to a package needs `npm run build:packages` before the Studio sees it. See [Architecture](./architecture.md#how-the-engine-packages-are-linked).

---

## Verification

### 18. Visual verification was done from screenshots of a headless browser

Pass 2 drove headless Microsoft Edge through the DevTools protocol and captured screenshots that were then inspected: every route in the dark and the light Studio interface at 1440 px, the four reference experiences in the Studio, all four inspector tabs, the mobile Studio and its sheets at 390 px, and tablet layouts at 768 px. Overflow and clipped text were also checked programmatically on every route at each width.

Not covered: animation smoothness and the look of the view transition in motion (screenshots are still frames), and a person using a real phone.

### 19. Accessibility was checked, not certified

Done in Pass 2: a keyboard walkthrough with real key events (Tab, Shift+Tab, Enter, Space, arrow keys, Escape), focus-ring presence on every tab stop, focus trapping and focus return for the mobile sheets, and WCAG contrast ratios computed for every text and status colour of both Studio interfaces and all three experience themes. Three colours that fell below 4.5:1 were darkened.

Not done: screen reader testing, and contrast of text on the tinted backgrounds that are produced with `color-mix()` (the ratios were computed against the solid surfaces).

### 20. Only Chromium-based browsers were used

Firefox and Safari were not tested. Container queries, `color-mix()`, `<dialog>` and logical properties are required; view transitions are optional (see 6).

### 21. Four engine files no longer match the Phase 37 manifest

Pass 2 changed `packages/core/src/runtime/runtime.ts`, `packages/core/src/engine.ts`, `packages/react/src/store.ts` and `packages/react/src/provider.tsx`. `01-runtime/manifest.json` records SHA-256 hashes for the two core files as they were at Phase 37, so those two entries are now stale. The Phase 37 manifest is immutable and was left exactly as it is. The Pass 2 revision is recorded separately in `01-runtime/manifest-pass2.json`, which lists every file Pass 2 changed with its SHA-256 hash, the test and QA results, and the scoped limitations, and which references the Phase 37 manifest by hash. It can be re-checked at any time with `node 01-runtime/scripts/verify-manifest-pass2.mjs`, which is read-only and exits non-zero on any mismatch. One further Phase 37 entry, `01-runtime/package.json`, already differed before Pass 2 began; Pass 2 did not touch it.

### 22. Stored React and Next.js samples predate the adapter change

The React 18 and Next.js client samples on the Benchmark page were recorded with the polling adapter. They have not been re-measured with the subscription-based adapter, and the Benchmark and Evidence pages say so. The correctness properties those runs checked (requested state equals final state, a re-render is observed) are covered for the new adapter by this project's tests, on React 19.2 only.

---

## What is simulated, and how it is labelled

| Item | Status | Label in the UI |
|---|---|---|
| Delta, closure, graph, request ids, outcomes, error codes | From the engine | "From the engine" |
| Resource failure and recovery | From the engine, using real loader rejections | "From the engine" |
| Durations in the inspector, Research mode and runner | Read in the visitor's browser | "Measured in this browser" |
| Figures on Benchmark and Evidence | Copied from repository files, cited in `lib/evidence.ts` | "Measured locally, stored result" or "Synthetic workload" |
| Pipeline entrance animation | Replay | "Replay … not live timing" |
| Added latency | Artificial delay, off by default | "Simulated" |
| Manual orchestration code on Architecture | Written for illustration | "Illustrative sketch" |
| "Experience" root in the graph | Added for orientation | Stated under the graph |
| Nova Commerce and its numbers | Fictional | "Demo data" |

## Claim boundaries

The site's wording follows the research package's claim discipline.

**Not claimed anywhere in the app:**

- Universal performance superiority or lower latency
- Being the first adaptive, multi-dimensional, dependency-aware or transactional UI system
- Unique atomicity or stale-request guarantees
- SSR support across every deployment topology
- Third-party independent replication

**Stated explicitly where relevant:**

- The Traditional+ manual baseline reaches the same tested safety outcomes, so the safety semantics are not unique (Evidence, Architecture).
- The paper reports that the engine introduced orchestration overhead in several measured scenarios (Benchmark).
- The orchestration comparison is structural, not a performance comparison (Architecture).
- The reference model was written by the author and is not third-party replication (Evidence).
- Third-party replication is pending (Evidence).

The landing headline is broader than the research claims, and the page footer says so and links to Evidence.
