# Personalized SSR

`/personalized` has one URL and renders a different first response per visitor, decided by a cookie on the request.

```text
User preference
      ↓
Cookie                     experience=ar-EG.luxury.smooth
      ↓
Next.js request            dynamic Server Component
      ↓
ExperienceEngine           new instance for this request
      ↓
Personalized HTML          dir, lang, copy, tokens already applied
      ↓
Hydration                  client engine commits the same experience
      ↓
Runtime switching          setExperience() in the browser
```

## Cookie format

```text
experience=<culture>.<theme>.<motion>
```

Examples: `experience=ar-EG.luxury.smooth`, `experience=en-US.light.instant`, `experience=ar-EG.midnight.reduced`.

## Parsing and safety

`engine/experience-cookie.ts`

```ts
parseExperienceCookie(value) → { request, source }
```

| `source` | When | Result |
|---|---|---|
| `cookie` | All three parts match registered ids exactly | That request |
| `missing` | No cookie | Default request |
| `invalid` | Wrong number of parts, or any part not registered | Default request |

Rules:

- The value is split on `.` and each part is compared against the fixed lists `CULTURES`, `THEMES`, `MOTIONS`. Matching is case-sensitive.
- The value is never evaluated, never used as an object key, and never interpolated into markup. When the page displays the received cookie it is rendered as text by React and truncated to 80 characters.
- The default is `en-US`, `light`, `instant`.

## Server flow

`app/personalized/page.tsx`

```ts
export const dynamic = "force-dynamic";

const raw = (await cookies()).get("experience")?.value;
const parsed = parseExperienceCookie(raw);

const engine = createEngine(parsed.request);   // new engine for this request
const experience = await engine.init();
const initialMessages = await messageLoaders[request.culture]();
```

- `createEngine` always returns a new `ExperienceEngine`. There is no module-level engine on the server.
- The resource instrumentation (activity, fault switches, latency) is browser-only, so no per-request state is written to shared server memory.
- The message catalog on the server holds static copy keyed by locale. It contains no visitor data.

The page renders `<main>` with these attributes, which the validation script reads from the raw HTML:

```html
<main id="server-personalized-experience"
      data-render-source="dynamic-server-component"
      data-server-experience-id="ar-EG::luxury::smooth"
      data-server-culture="ar-EG"
      data-server-theme="luxury"
      data-server-motion="smooth"
      data-server-direction="rtl"
      data-server-cookie-source="cookie">
```

The marker names match the ones the Phase 94 harness used, plus `data-server-cookie-source`.

## Hydration without a loading swap

The server wraps the page in `EngineBoundary` with the resolved request and the copy for that culture. The preview is then server-rendered as part of the response.

On the client, the boundary's first render does not wait for `engine.init()`. It calls the core's synchronous `resolveExperience()` for the same request and registers the server-provided copy, so the first client render produces the same markup as the server. `init()` then runs in an effect and the page reports "Hydrated".

Formatted numbers and dates carry `suppressHydrationWarning`, because Node and the browser can differ slightly in `Intl` output for the same locale.

When the cookie selects Midnight, the replaced orders component is a lazy chunk inside a `Suspense` boundary. React streams it on the server and hydrates it on the client.

## What the page shows

| Step | Content |
|---|---|
| Request | `GET /personalized` and the cookie that was received |
| Server resolution | How the request was derived (cookie, missing or invalid) and the resolved id, culture, theme, motion and direction |
| HTML | A note that the application alongside is part of the response |
| Hydration | Hydrated or not, and whether the runtime experience still matches the server's |
| Switch at runtime | Preset buttons that call the hydrated engine; no server request |
| Change the preference | Three selects, the resulting cookie string, and Save, Send an invalid cookie, Clear cookie |
| Check the raw response | Fetches the URL again and reads the `data-server-*` markers from the HTML text |

Saving writes the cookie with `Path=/`, a one-year `Max-Age` and `SameSite=Lax`, then reloads so the server renders the new experience.

## Validation

With the production server running:

```bash
npm run build && npm start
npm run test:ssr                 # or BASE_URL=http://localhost:3200 npm run test:ssr
```

`scripts/validate-ssr.mjs` requests `/personalized` five times and asserts on the response text only:

| Case | Cookie | Expected id | Direction | Source |
|---|---|---|---|---|
| A | `ar-EG.luxury.smooth` | `ar-EG::luxury::smooth` | rtl | cookie |
| B | `en-US.light.instant` | `en-US::light::instant` | ltr | cookie |
| C | `ar-EG.midnight.reduced` | `ar-EG::midnight::reduced` | rtl | cookie |
| Invalid | `fr-FR.neon.fast` | `en-US::light::instant` | ltr | invalid |
| None | — | `en-US::light::instant` | ltr | missing |

For each case it checks HTTP 200, the `<main>` markers, the `dir` and `data-experience-id` on the preview root, and that the expected brand copy is present in the HTML. It also checks that the three valid cookies gave three different ids. It prints JSON and exits non-zero on failure.

Result of the last run against the local production build: all five cases passed.

## Scope

This was checked against a local Next.js production server. It does not establish behaviour behind a CDN, a shared cache, or other deployment topologies. A cache in front of this route must vary on the `experience` cookie or not cache the route at all.
