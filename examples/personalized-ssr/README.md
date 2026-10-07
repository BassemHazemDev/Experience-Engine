# Personalized SSR example

One URL, a different first response per visitor. The server reads the `experience` cookie, checks it against the registered ids, resolves that experience with a new engine, and renders.

```bash
# from the repository root
npm install
npm run dev -w example-personalized-ssr
```

Switch to Arabic and dark, press **Save as my preference and reload**, then view the page source: the HTML is right-to-left before hydration. Or without a browser:

```bash
curl -s -H "Cookie: experience=ar-EG.dark.smooth" http://localhost:3000 | grep -o 'data-server-experience-id="[^"]*"'
curl -s -H "Cookie: experience=en-US.light.instant" http://localhost:3000 | grep -o 'data-server-experience-id="[^"]*"'
```

| File | What to read |
|---|---|
| `app/cookie.ts` | Whitelist parsing with a safe default |
| `app/page.tsx` | `cookies()`, a per-request engine, `force-dynamic` |
| `app/client.tsx` | Hydration and saving the preference |

If you put a cache or CDN in front of a page like this, it must vary on the cookie or not cache the page.
