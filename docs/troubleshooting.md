# Troubleshooting

## Setup

**`Cannot find module '@experience-engine/core'` right after cloning.**
The packages are consumed from their built output in `dist/`. `npm install` at the repository root builds them. If you installed with `--ignore-scripts`, or deleted `dist/`, run:

```bash
npm run build:packages
```

**I changed the core and the Studio does not see it.**
Rebuild the packages (`npm run build:packages`) and restart the dev server.

**"Incompatible React versions" or "Invalid hook call".**
Two copies of React are installed. In this repository the root `package.json` pins one version with `overrides`; reinstall from the root (`rm -rf node_modules package-lock.json && npm install`). In your own project, make sure `react` and `react-dom` match and that only one copy is resolved.

**`npm run build` fails fetching fonts.**
The Studio downloads its typefaces from Google Fonts at build time. The build needs network access.

**`npm run test:ssr` fails to connect.**
It checks a running production server. Run `npm run build`, then `npm run start`, then `npm run test:ssr` in another terminal. Set `BASE_URL` if the server is not on port 3000.

## Runtime

**`experience` is `undefined` in my component.**
`engine.init()` has not committed yet, or was never called. `ExperienceProvider` does not call it. Either await `init()` before rendering, or render a fallback (see [ssr.md](./ssr.md#hydration)).

**"ExperienceEngine requires an initial request."**
`init()` was called on an engine constructed without `initial`.

**"Engine has not been initialized."**
`setCulture`, `setTheme` or `setMotion` was called before the first commit. Call `init()` first, or use `setExperience` with a complete request.

**Unhandled promise rejection: `TRANSITION_STALE`.**
A newer request superseded this one. That is the guard working. Catch it:

```ts
void engine.setExperience(request).catch((error) => {
  if (error.code !== "TRANSITION_STALE") throw error;
});
```

**`UNKNOWN_CULTURE` / `UNKNOWN_THEME` / `UNKNOWN_MOTION`.**
The id is not a key of the definitions passed to the engine. On a server this usually means an unvalidated cookie or query parameter; whitelist it first.

**`RESOURCE_LOAD_FAILED`.**
A resource's `load()` rejected. `error.details.key` names the resource and `error.cause` is the original error. The previous experience is still committed, and the same request can be retried.

**A resource changed but the old content is still used.**
Loaded resources are cached by `kind`, `id` and `version`. Bump `version`, or call `engine.resources.invalidate(resource)`.

**My loader runs only once.**
That is the cache. See above.

**Changing my definitions object has no effect.**
Definitions are cloned and frozen when the engine is constructed. Create a new engine.

## Rendering

**Layout does not mirror in RTL.**
Set `dir={experience.direction}` on a root element and use CSS logical properties (`margin-inline-start`, `inset-inline-end`, `text-align: start`). Physical properties (`margin-left`) do not flip.

**Arabic headings render in a system font.**
A Latin display typeface has no Arabic glyphs, and its fallback may win over your Arabic face. Give the culture its own heading family, or put the Arabic face before generic fallbacks in the stack.

**Hydration mismatch on formatted numbers or dates.**
Node and browsers format the same locale slightly differently. Add `suppressHydrationWarning` to the element.

**Hydration mismatch on the whole page.**
The server and the first client render must use the same request. Pass the server's resolved request to the client and render from `resolveExperience(request, engine)` until `init()` commits.

**The smooth transition does not animate.**
`document.startViewTransition` is missing in that browser, the tab is hidden, or the system asks for reduced motion. In all three cases the experience still commits. See [resources-and-motion.md](./resources-and-motion.md#fallback-behaviour).

**One visitor sees another visitor's language on the server.**
The engine is shared between requests. Create a new engine per request. See [ssr.md](./ssr.md#isolation).

## The manifest verifier fails

`npm run verify:manifest` describes one specific state of the repository and fails after any further change. It is a provenance record for the research archive, not a test. See [RESEARCH.md](../RESEARCH.md#manifests).
