# Contributing

Thanks for looking at Experience Engine. It is an early-stage project, so small, focused contributions are the easiest to review.

## Setup

Requires Node 20 or newer and npm 10 or newer.

```bash
git clone https://github.com/BassemHazemDev/Experience-Engine.git
cd Experience-Engine
npm install        # installs all workspaces and builds the two packages
npm run dev        # Studio at http://localhost:3000
```

The repository is an npm workspace:

| Path | What |
|---|---|
| `01-runtime/packages/core` | `@experience-engine/core` |
| `01-runtime/packages/react` | `@experience-engine/react` |
| `06-project` | Studio (Next.js) |
| `examples/*` | Example projects |

The Studio and the examples consume the packages from their built `dist/`. After changing a package, run `npm run build:packages`.

## Checks

Run these before opening a pull request. CI runs the same ones.

```bash
npm run typecheck
npm test
npm run build
```

- Core behaviour is covered by `01-runtime/tests/core-contract.test.ts` and `06-project/tests/engine.test.ts`.
- The React adapter is covered by `06-project/tests/adapter.test.tsx`.
- Add or update a test with any change in behaviour.

## Pull requests

- Branch from `main`. One change per pull request.
- Say what changes and why. If the public API changes, update `docs/api.md` and `CHANGELOG.md`.
- Keep the core free of dependencies and of browser or framework APIs.
- Keep culture, theme and motion independent. Do not add code that reads one dimension's id to decide another's behaviour.
- Match the style of the surrounding code. TypeScript is in strict mode.

## The research archive

`02-paper`, `03-submission`, `04-evidence`, `05-audit` and the phase notes in `01-runtime` are a historical record.

- Do not edit `01-runtime/manifest.json`.
- Do not change stored results or evidence files.
- A change to resolution, the typed delta, dependency closure, preparation, the stale guard or commit behaviour alters what the research evaluation describes. Raise it in an issue first.

Documentation should not claim more than the evidence supports. In particular: not production-ready, not faster in general, not the first of its kind.

## Reporting issues

Use the issue templates. For bugs, a minimal set of definitions and calls that reproduces the problem helps most. For security problems, see [SECURITY.md](./SECURITY.md).

## Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).

## License

By contributing you agree that your contribution is licensed under the [MIT License](./LICENSE).
