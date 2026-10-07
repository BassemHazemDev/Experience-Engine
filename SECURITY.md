# Security policy

## Supported versions

Experience Engine is at version 0.1.0 and experimental. Only the latest release and the `main` branch receive fixes.

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately through GitHub: on the repository page, open **Security → Report a vulnerability**. This creates a private advisory visible only to the maintainer.

Include what you found, how to reproduce it, and the affected package and version. You can expect an acknowledgement within a week. Once a fix is available it will be released and the advisory published, with credit if you would like it.

## Scope notes

- The packages do not make network requests, store credentials, or evaluate input as code.
- Resource loaders are supplied by the application and run with the application's privileges.
- If you derive an experience request from untrusted input such as a cookie or query parameter, validate it against your registered ids first. See `docs/ssr.md`.
