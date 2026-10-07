# Deployment

The Studio is a standard Next.js App Router application. It has not been deployed publicly yet: everything below about hosting is preparation, and only the local steps have been run.

## Local development

```bash
# at the repository root
npm install
npm run dev          # http://localhost:3000
```

`npm install` installs the whole workspace and builds the two engine packages the Studio imports. After changing a package, run `npm run build:packages`.

## Production build

```bash
npm run build        # packages, Studio and examples
npm run start        # Studio at http://localhost:3000
npm run test:ssr     # in another terminal: raw-HTTP checks of /personalized
```

To build only the Studio: `npm run build -w experience-engine-studio`.

The build output lists `/personalized` as dynamic and every other route as static.

## What the app needs from a host

| Requirement | Why |
|---|---|
| Node.js 20 or newer | Next.js 16 |
| A Node.js server runtime | `/personalized` reads a cookie and renders per request. A static export cannot serve it |
| Install at the workspace root | Dependencies and the engine packages are installed there |
| Network access during the build | Typefaces are downloaded from Google Fonts by `next/font` |

Everything except `/personalized` can be served as static files.

## Environment variables

None. The app has no secrets, no database and no external services.

The only variable in the repository is `BASE_URL`, read by `scripts/validate-ssr.mjs` to locate the server under test.

## Vercel

Not tested. The settings that follow from the repository layout:

| Setting | Value |
|---|---|
| Root Directory | `06-project` |
| Framework preset | Next.js |
| Include files outside the Root Directory | Enabled, so the engine packages and the root lockfile are available |
| Install command | default (`npm install`). Run inside a workspace member, npm installs the whole workspace and runs the root `prepare` script, which builds the engine packages |
| Build command | default (`next build`) |
| Node.js version | 20 or newer |

If the build cannot find `@experience-engine/core`, the packages were not built. Set the build command to:

```bash
npm run build:packages --prefix .. && next build
```

No `vercel.json` is included; none is needed for these settings.

## Other hosts

Any host that can run `next start` works the same way: install at the repository root, run `npm run build -w experience-engine-studio`, then `npm run start -w experience-engine-studio`.

A container image needs the repository root as its build context, because the app depends on `../01-runtime/packages`.

## Cookies and caching

`/personalized` uses one cookie:

```text
experience=<culture>.<theme>.<motion>      e.g. experience=ar-EG.luxury.smooth
```

- It is written by the page's own script when a visitor saves a preference: `Path=/`, `Max-Age` of one year, `SameSite=Lax`. It is not `HttpOnly`, because the browser writes it. It holds a display preference and nothing sensitive.
- The server compares each part with the registered ids and falls back to the default experience for anything else.
- The route is marked `force-dynamic`, so Next.js does not cache it.

If a CDN or reverse proxy sits in front of the app, it must not cache `/personalized` by URL alone. Either bypass the cache for that route or vary on the `experience` cookie. Otherwise one visitor's language and theme can be served to another.

A banner or consent notice may be required for this cookie depending on where you operate; it is a preference cookie set at the visitor's request.

## What has and has not been verified

| | |
|---|---|
| Local production build and `next start` | Verified |
| Per-request rendering with five cookie cases on the local server | Verified (`npm run test:ssr`) |
| 80 concurrent local requests with four cookies, no cross-request leakage | Verified once during development |
| Deployment to Vercel or any other host | Not done |
| Behaviour behind a CDN, edge runtime or shared cache | Not tested |

## After deploying

- Open `/personalized`, save a preference, reload, and view the page source: the HTML should already be in the chosen language and direction.
- Run the validation script against the deployment: `BASE_URL=https://your-domain npm run test:ssr`.
- Add the URL to the root `README.md` and to the `homepage` field of the two packages.
