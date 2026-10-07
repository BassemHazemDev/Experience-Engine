# Next.js SSR example

A Server Component creates an engine, awaits `init()`, and renders. The response is already right-to-left Arabic in the dark theme before any JavaScript runs. The client then starts its own engine from the same request and takes over switching.

```bash
# from the repository root
npm install
npm run dev -w example-next-ssr
```

View the page source to see `dir="rtl"` and the Arabic copy in the HTML.

| File | What to read |
|---|---|
| `app/experience.ts` | Definitions and `createEngine()`, imported by server and client |
| `app/page.tsx` | Server-side resolution |
| `app/client.tsx` | Hydration: `resolveExperience()` for the first render, then `init()` |

There is no separate Next.js package. This is the core on the server and the React adapter on the client.
