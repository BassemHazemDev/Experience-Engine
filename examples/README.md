# Examples

Four small projects that use the real packages. Each one is an npm workspace member, so a single install at the repository root is enough.

| Example | Stack | Shows |
|---|---|---|
| [`basic-react`](./basic-react) | Vite, React | Creating an engine, the provider, switching culture, theme and motion, RTL |
| [`component-adaptation`](./component-adaptation) | Vite, React | Token, variant and replacement with `ComponentResolver` |
| [`next-ssr`](./next-ssr) | Next.js | Resolving an experience in a Server Component and hydrating it |
| [`personalized-ssr`](./personalized-ssr) | Next.js | A cookie selecting the server-rendered experience per request |

```bash
npm install                              # at the repository root; also builds the packages
npm run dev -w example-basic-react
npm run dev -w example-component-adaptation
npm run dev -w example-next-ssr
npm run dev -w example-personalized-ssr
```

For a full application built the same way, see the Studio in [`06-project`](../06-project).

Outside this repository, install the packages from npm instead (once they are published):

```bash
npm install @experience-engine/core @experience-engine/react
```
