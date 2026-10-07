# Testing

## Commands

```bash
npm run typecheck    # tsc --noEmit, strict
npm test             # Vitest, 48 tests in 6 files
npm run build        # production build
npm run test:ssr     # raw-HTTP checks; needs `npm start` running
```

Artifact integrity, from the repository root:

```bash
node 01-runtime/scripts/verify-manifest-pass2.mjs
```

This checks every file listed in `01-runtime/manifest-pass2.json` (existence, size, SHA-256, with CRLF-to-LF normalization where a checkout converted line endings), that the Phase 37 manifest still has the recorded hash, and that nothing changed since the base commit without being listed. It writes nothing and exits non-zero on any mismatch.

## Test suites

### `tests/engine.test.ts` — core integration (11 tests, jsdom)

| Test | Asserts |
|---|---|
| Initialises with the initial request | `init()` returns `en-US::light::instant`, status is `COMMITTED` |
| `setExperience` resolves a complete, immutable snapshot | Request, locale, direction, tokens, motion strategy, currency, frozen object, delta flags |
| Direction from culture | `ar-EG` → `rtl`, `en-US` → `ltr`, and back |
| Dimensions are independent | A culture-only change has no token keys in its delta and leaves theme and motion alone |
| Translation is prepared before commit | Arabic copy is in the catalog once the transition resolves |
| Typed delta and closure | Direction delta, token keys, motion strategy delta, affected nodes |
| Motion-only change | Closure is exactly `["motion:smooth"]` |
| Rapid transitions | Five un-awaited requests → four `stale` with `TRANSITION_STALE`, one `committed`; final id is the last request; nothing left pending |
| Failure and recovery | Injected translation failure → `RESOURCE_LOAD_FAILED`, committed snapshot is the same object as before, transaction status `FAILED`; retry commits |
| Unregistered theme | `UNKNOWN_THEME`, state unchanged |
| Isolation | Two engines initialised together hold different committed experiences |

This file runs in jsdom because the fault switches are browser-only.

### `tests/adapter.test.tsx` — commit subscription and adapter store (13 tests, jsdom)

Core subscription:

| Test | Asserts |
|---|---|
| Notifies after a commit | The listener receives the committed experience, and `getExperience()` already returns it |
| No notification for failed or stale transitions | A failed load notifies nobody; five rapid requests notify exactly once, with the last request |
| A throwing listener | The commit stands, status is `COMMITTED`, later listeners still run |
| Unsubscribe | No further notifications |

Adapter store, lettered as in the Pass 2 brief:

| Test | Asserts |
|---|---|
| A | Initial snapshot is returned, for client and server |
| B | `engine.setExperience()` called directly re-renders a React component |
| C | Two independent subscribers both show the committed experience |
| D | A subscriber that reads the snapshot does not hide the update from another, across three commits |
| E | Rapid requests keep the core's stale semantics: four `TRANSITION_STALE`, one fulfilled, one notification |
| F | After unmount the engine holds no subscription and nothing re-renders; many components share one subscription |
| G | `setInterval` is never called |
| H | `getSnapshot()` returns the same object between commits, including after a failed transition |
| Catch-up | A commit that lands before the first subscriber attaches is visible once it does |

### `tests/presentation.test.tsx` — presentation and start-up (4 tests, jsdom)

| Test | Asserts |
|---|---|
| Motion as declared | Each motion definition is played with its own strategy and duration |
| Reduced-motion preference | Presentation becomes `css` at 140 ms or less; the engine's motion definition is unchanged |
| Component adaptation | Light resolves to base components, Midnight to a variant and a replacement, through the core resolver |
| Engine start | A failed first `init()` reports `failed`, and Retry reaches `ready` |

### `tests/react.test.tsx` — Studio integration (2 tests, jsdom)

| Test | Asserts |
|---|---|
| Provider and hook | `EngineBoundary` mounts, the hook returns the snapshot, the runtime reaches hydrated |
| Re-render and DOM | After a transition the component re-rendered, and the preview root has the new `data-experience-id`, `dir="rtl"`, `lang="ar-EG"`, Arabic copy and the Luxury `--xp-surface`; switching back restores `ltr` and the Light surface |

### `tests/ssr.test.tsx` — server rendering (4 tests, node)

Follows the same steps as the route: parse cookie, create an engine, `init()`, render with `renderToString`.

| Test | Asserts |
|---|---|
| Cookie A | HTML contains `dir="rtl"`, the Arabic id, Arabic brand copy and the Luxury surface variable, with no client code run |
| Cookie B | HTML contains `dir="ltr"` and English copy, and no Arabic copy |
| Different cookies | The two HTML strings differ |
| Invalid cookie | Source is `invalid`, the default experience is rendered |

### `tests/cookie.test.ts` — cookie parsing (14 tests, node)

A valid cookie, a serialize/parse round trip, a missing cookie, and eleven invalid values: unknown culture, theme and motion, too few and too many parts, prototype-style strings, script tags, a random word, and a wrong-case value. Every invalid value yields the default request with source `invalid`.

## SSR validation script

`scripts/validate-ssr.mjs` is separate from Vitest because it needs the built server. It is described in [Personalized SSR](./personalized-ssr.md#validation).

## Last recorded results

| Check | Result |
|---|---|
| `tsc --noEmit` | Clean |
| `vitest run` | 48 passed |
| `next build` | Succeeded; `/personalized` dynamic, all other routes static |
| `validate-ssr.mjs` against `next start` | 5 of 5 cases passed |
| Browser console on the pages visited | No errors and no hydration warnings |

## Browser verification (Pass 2)

Headless Microsoft Edge was driven through the DevTools protocol with real mouse and keyboard events. The scripts are not part of the repository; the results below are from the last run against the production build unless noted.

| Area | What was checked | Result |
|---|---|---|
| Routes, desktop 1440 px | All 7 routes, dark and light Studio interface: no horizontal scroll, no clipped text; screenshots inspected | Pass |
| Experiences | `ar-EG·luxury·smooth`, `en-US·midnight·instant`, `en-US·luxury·reduced`, `en-US·light·instant`: id, `dir`, `lang`, strategy, resolved components, chart direction | Pass |
| Studio interface vs. experience | Switching the Studio to light leaves the experience id and its CSS variables unchanged | Pass |
| RTL | Navigation and brand on the right, account on the left, first table column on the right, totals aligned to the end, chart and texture mirrored, Arabic-Indic digits, Arabic heading face, first focusable nav item at the top right | Pass |
| Keyboard | 26 tab stops in order, each with a visible focus ring; Shift+Tab; Enter and Space on presets; arrow keys in a radio group; arrow keys across inspector tabs; Tab into the tab panel; Space on the Research switch; focus stays on the activated control after a transition | Pass |
| Mobile 390 px | All 7 routes without horizontal overflow; controls sheet opens from the keyboard, traps focus for 24 tabs, closes on Escape, returns focus to the opener; inspector sheet fits | Pass |
| Tablet 768 px | Studio, Playground, Personalized without overflow | Pass |
| Reduced motion | With the preference emulated: experience still `ar-EG::luxury::smooth`, shown strategy `css`, zero view transitions started, Studio animations at near-zero duration; Research mode shows "view-transition · 480 ms" and "css · 140 ms (reduced-motion preference)" | Pass |
| No View Transitions API | With the API removed, the Smooth experience still commits and renders | Pass |
| Failure showcase | Translation, font, asset and code failures each: `RESOURCE_LOAD_FAILED`, current experience preserved on screen, retry commits | Pass |
| Rapid showcase | Four stale, one committed, committed experience equals the last request | Pass |
| Production console | No errors or warnings on any route, including hydration, with three different cookies | Pass |
| SSR isolation | 80 concurrent requests with 4 different cookies: 80 of 80 returned their own experience | Pass |
| Long tasks and layout shift | Around two transitions in the Studio: no long tasks reported, CLS 0 | Observation from one headless run, not a benchmark |

Contrast ratios were computed from the colour tokens with the WCAG formula. All text and status colours are at or above 4.5:1 on the solid surfaces they are used on, after three were darkened.

Not verified: screen readers, Firefox and Safari, real mobile devices, and how the view transition looks in motion.

## Writing new tests

- Use `createEngine(request)` for a fresh engine per test.
- Call `clearFaults()` in `afterEach` if a test uses `setFault`.
- Add `// @vitest-environment jsdom` at the top of any file that needs the DOM or the fault switches.
- For components, wrap in `EngineBoundary` and pass messages from `messageLoaders`.
- A commit re-renders React synchronously through the store, so wrap a direct `engine.setExperience()` call in `act`, or use `waitFor` when the request goes through the recorder.
