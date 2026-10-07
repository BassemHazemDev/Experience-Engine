# Server-side rendering

The core has no browser dependency, so a server can resolve an experience and render HTML that is already in the right language, direction and theme. The examples use the Next.js App Router; nothing in the core is specific to it.

There is no separate Next.js package. The pattern is: **the core on the server, the React adapter on the client.**

## Server-side resolution

Create an engine, await `init()`, render from the result.

```tsx
// app/page.tsx — a Server Component
import { createEngine } from "./experience";
import ClientExperience from "./client";

export default async function Page() {
  const engine = createEngine({ culture: "ar-EG", theme: "dark", motion: "smooth" });
  const experience = await engine.init();

  return (
    <div data-server-experience-id={experience.id}>
      <ClientExperience initialRequest={experience.request} />
    </div>
  );
}
```

`createEngine` is your own function that returns `new ExperienceEngine({...})`. Put the definitions in a module that both the server and the client import.

Full example: [`examples/next-ssr`](../examples/next-ssr).

## Per-request experience

To personalize per visitor, derive the request from something in the HTTP request, such as a cookie.

```tsx
import { cookies } from "next/headers";

export const dynamic = "force-dynamic"; // render for every request

export default async function Page() {
  const request = parseCookie((await cookies()).get("experience")?.value);
  const engine = createEngine(request);
  const experience = await engine.init();
  …
}
```

The same URL then returns different HTML for different cookies.

Full example: [`examples/personalized-ssr`](../examples/personalized-ssr). The Studio's `/personalized` route is a larger version.

## Cookies

The examples and the Studio use one cookie:

```text
experience=<culture>.<theme>.<motion>      e.g. experience=ar-EG.luxury.smooth
```

Treat it as untrusted input:

```ts
export function parseCookie(value: string | undefined): Request {
  const [culture, theme, motion, ...rest] = (value ?? "").split(".");
  const valid =
    rest.length === 0 &&
    CULTURES.includes(culture) &&
    THEMES.includes(theme) &&
    MOTIONS.includes(motion);
  return valid ? { culture, theme, motion } : DEFAULT_REQUEST;
}
```

- Compare each part with your registered ids. Fall back to a default for anything else.
- Never evaluate the value, use it as an object key, or put it into markup unescaped.
- The cookie holds a display preference, not a secret. It does not need to be `HttpOnly` if client code writes it; use `SameSite=Lax` and `Path=/`.

If you skip the whitelist, an unknown id makes `init()` reject with `UNKNOWN_CULTURE`, `UNKNOWN_THEME` or `UNKNOWN_MOTION`, and the page fails to render instead of falling back.

## Isolation

**Create a new engine for every request.** An engine holds one committed experience. A module-level engine on the server would be shared by every visitor, and one visitor's experience could be rendered for another.

```ts
// Wrong on a server: shared by all requests
export const engine = new ExperienceEngine({ … });

// Right: one per request
export function createEngine(initial) {
  return new ExperienceEngine({ …, initial });
}
```

Definitions are static data and are safe to share. Module-level caches that your resource loaders fill are also shared; keep only non-personal data in them, such as translation bundles keyed by locale.

## Hydration

The client needs its own engine, started from the request the server resolved. `init()` is asynchronous, so the first client render cannot wait for it. Use the synchronous resolver for that first render; it produces the same snapshot the server rendered from.

```tsx
"use client";
import { useEffect, useState } from "react";
import { resolveExperience } from "@experience-engine/core";
import { ExperienceProvider, useExperience } from "@experience-engine/react";

function View({ fallback }) {
  const { experience } = useExperience();
  const current = experience ?? fallback; // identical to the server render until init() commits
  return <main dir={current.direction}>…</main>;
}

export default function ClientExperience({ initialRequest }) {
  const [engine] = useState(() => createEngine(initialRequest));
  const [fallback] = useState(() => resolveExperience(initialRequest, engine));

  useEffect(() => {
    void engine.init().catch(() => undefined);
  }, [engine]);

  return (
    <ExperienceProvider engine={engine}>
      <View fallback={fallback} />
    </ExperienceProvider>
  );
}
```

Things to watch:

- **Copy.** `resolveExperience` does not load resources. If your first render needs translations, pass them from the server as props, as the Studio does.
- **`Intl` output.** Node and the browser can format the same locale slightly differently. Mark formatted values with `suppressHydrationWarning`.
- **Lazy components.** A replacement loaded with `React.lazy` needs a `Suspense` boundary.

## Caching and deployment

A page whose HTML depends on a cookie must not be served from a shared cache keyed only by URL. Either vary the cache on the cookie or do not cache the route.

This pattern has been validated against a local Next.js production server. It has not been tested behind a CDN, an edge runtime or a shared cache.
