# Changelog

Notable changes to the packages and the Studio. Versions follow semantic versioning; while the version is below 1.0.0, minor releases may contain breaking changes.

## 0.1.0 — unreleased

First public version. An early research implementation: experimental, not production-tested, and likely to change.

### `@experience-engine/core`

- Experience model with three independent dimensions: culture, theme and motion.
- `ExperienceEngine` with `init`, `setExperience`, `setCulture`, `setTheme`, `setMotion`, `getExperience`, `preload`, `subscribe` and `inspect`.
- Resolution of requests into immutable snapshots, with inheritance for cultures and themes.
- Typed experience delta per dimension, with token and resource changes.
- Dependency graph, seeds and closure for each transition.
- Prepare, transition and commit flow: resources load before a commit, a failed transition leaves the committed experience unchanged, and a superseded request never commits.
- Resource manager with caching and de-duplication of concurrent loads.
- Component resolver for variants and replacements.
- ESM and CommonJS builds with type declarations.

### `@experience-engine/react`

- `ExperienceProvider`, `useExperience`, `useCulture`, `useTheme`, `useMotion`, `useDirection`, `useExperienceEngine`.
- External store that subscribes to engine commits.

### Server rendering

- Documented pattern for Next.js: the core in Server Components, the React adapter on the client, with hydration from a synchronously resolved snapshot.
- Cookie-driven per-request rendering, validated against a local production server.

### Studio

- Showcase application with a live preview, transition inspector, playground for rapid switching and failure recovery, personalized SSR page, case study, and research pages.

### Repository

- npm workspace, CI, examples and documentation.
