# Public release checklist

State of the repository after release preparation. Nothing has been pushed, published, deployed or posted; every step under "Manual steps" is still to do.

## Summary

| Area | State |
|---|---|
| GitHub | Ready. CI has not run yet, because nothing has been pushed |
| npm | Ready to publish. The `@experience-engine` scope must exist on npm first |
| Studio | Ready to deploy. Not deployed; no remote test |
| Documentation | Written and link-checked |
| Security | No secrets, credentials or local paths found |
| License | MIT, added |

## GitHub readiness

- [x] `README.md` rewritten as the engineering entry point
- [x] `RESEARCH.md` guides to the research archive and preserves the previous README
- [x] `LICENSE` (MIT)
- [x] `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`
- [x] `.github/workflows/ci.yml`: install, typecheck, test, build, SSR validation, package contents
- [x] Issue templates and pull request template
- [x] `.gitignore` at the root
- [x] Research directories kept: `01-runtime`, `02-paper`, `03-submission`, `04-evidence`, `05-audit`, `06-project`
- [ ] CI green on GitHub (runs on the first push)
- [ ] Private vulnerability reporting enabled in the repository settings (`SECURITY.md` relies on it)
- [ ] Repository description, topics and social preview set

## npm readiness

| Package | Version | Files in tarball | Size |
|---|---|---|---|
| `@experience-engine/core` | 0.1.0 | 9 | 34.7 kB packed, 167.6 kB unpacked |
| `@experience-engine/react` | 0.1.0 | 9 | 5.9 kB packed, 28.3 kB unpacked |

- [x] Build step added (`tsup`): ESM, CommonJS, type declarations for both, source maps
- [x] `main`, `module`, `types`, `exports`, `files`, `license`, `repository`, `homepage`, `bugs`, `keywords`, `publishConfig.access`
- [x] `@experience-engine/react` depends on `@experience-engine/core@^0.1.0`; `react >= 18` is a peer dependency
- [x] Each package has its own `README.md` and `LICENSE`
- [x] There is no `@experience-engine/next` package, and none was created. Next.js is supported through the core and the React adapter

### Dry run

- [x] `npm pack --dry-run` for both packages
- [x] Each tarball contains exactly: `LICENSE`, `README.md`, `package.json`, `dist/index.js`, `dist/index.cjs`, `dist/index.d.ts`, `dist/index.d.cts` and two source maps
- [x] No `node_modules`, `.next`, tests, configuration files, research files or local paths in the tarballs
- [x] Both tarballs installed into an empty project outside the repository: ESM import works, `require()` works, types resolve under `moduleResolution` `bundler` and `node16`, and an unknown theme id is a compile error
- [ ] `@experience-engine` scope created on npm and owned by the publishing account. `npm view @experience-engine/core` currently returns 404, so the names are unused; whether the scope itself is available was not checked

## Studio readiness

- [x] Landing page states what the project is and runs a real transition; the readout lists what changed
- [x] Culture, theme and motion independently selectable in the Studio
- [x] RTL, component adaptation, resources, transition pipeline, failure recovery, rapid switching, personalized SSR
- [x] Case study page at `/case-study`, with a transition run by the engine at build time
- [x] Navigation puts the developer pages first; research pages remain available
- [x] GitHub link points to the repository
- [x] `06-project/docs/deployment.md`
- [ ] Deployed. No hosting configuration has been exercised
- [ ] Live URL added to `README.md` and package `homepage` fields

## Documentation readiness

- [x] `docs/`: getting started, architecture, protocol, cultures and themes, component adaptation, SSR, resources and motion, API reference, troubleshooting
- [x] Every code sample uses the actual API. There is no `createExperienceEngine`; the engine is constructed with `new ExperienceEngine(...)`
- [x] `examples/`: `basic-react`, `component-adaptation`, `next-ssr`, `personalized-ssr`. All four build, and all four were run and exercised in a browser
- [x] 76 relative links across 32 Markdown files checked; none broken
- [x] `06-project/docs/linkedin-launch.md` draft, not posted

## Security check

- [x] 207 text files scanned for API keys, tokens, passwords, private keys and common credential formats: none found
- [x] No `.env` files
- [x] No local machine paths or user names in tracked files or in the package tarballs
- [x] No email addresses in the repository's text files
- [x] The only cookie in the code base is the Studio's display-preference cookie, which holds no sensitive data

Not scanned: the contents of the PDFs and of the six archived ZIP files under `04-evidence` and `05-audit`. The named-author paper PDF is in `02-paper` and is public by intent.

## License check

- [x] No license existed. MIT added at the root and in both packages: "Copyright (c) 2026 Bassem Hazem", the author named in the repository's own paper

## CI

- [x] Workflow file parses as YAML
- [x] Every command in it was run locally and passes
- [ ] First run on GitHub

## Checks run locally

| Check | Command | Result |
|---|---|---|
| Typecheck: packages, Studio, examples, runtime | `npm run typecheck` | Pass |
| Core contract test | `npm run test:contract` | Pass |
| Studio tests | `npm test` | 48 of 48 |
| Build: packages, Studio, four examples | `npm run build` | Pass |
| Studio SSR validation | `npm run start` then `npm run test:ssr` | 5 of 5 cookie cases |
| Package contents | `npm run pack:check` | Pass |
| Manifest | `npm run verify:manifest` | Pass |

## Things that changed and are worth knowing

- **Workspace.** The repository root is now an npm workspace. One `npm install` at the root replaces installing inside `06-project`. `06-project/package-lock.json` was removed; the lockfile is at the root.
- **Packages are built.** They used to export TypeScript source directly. They now export compiled output from `dist/`, which is what npm consumers get. The Studio uses the same output.
- **Core source untouched.** No file under `01-runtime/packages/*/src` was changed.
- **`01-runtime/manifest.json` untouched.**
- **`01-runtime/manifest-pass2.json` regenerated.** Several files it lists were edited (Studio README and docs, the site header), and many files were added. A small script, `01-runtime/scripts/update-manifest-pass2.mjs`, now does the regeneration, and the verifier learned to accept a recorded file removal. The manifest describes one state of the repository; see `RESEARCH.md`.

## Before going public: one thing to decide

`03-submission` and the paper describe a submission under double-blind review. Making this repository public, with the author's name on the license and on the named PDF, links the author to the paper's title. The venue's call says public archives are not discouraged but that promotion can make anonymization difficult. If the paper is still to be submitted or is under review, decide whether to publish now or after the review.

## Manual steps

In order:

1. Review the changes and commit.
2. Decide the anonymity question above.
3. `git push`. Check that CI passes.
4. In the GitHub repository settings: make it public if it is not, enable private vulnerability reporting, add a description and topics.
5. Create the `@experience-engine` organization on npm, or confirm you own it.
6. Publish, core first:
   ```bash
   npm login
   npm run build:packages
   npm publish -w @experience-engine/core
   npm publish -w @experience-engine/react
   ```
7. Deploy the Studio following `06-project/docs/deployment.md`. Run `BASE_URL=<url> npm run test:ssr` against it.
8. Add the live URL and the npm badges to `README.md`; set the date for 0.1.0 in `CHANGELOG.md`; tag `v0.1.0`.
9. Post the launch note from `06-project/docs/linkedin-launch.md` after filling in the placeholders.
