# Contributing to TaskFlow

Thanks for taking the time to contribute. This document covers everything you need to get
productive in a few minutes.

## Getting set up

```bash
git clone https://github.com/Uk2317/TaskFlow.git
cd TaskFlow
npm run setup        # installs backend + frontend, creates .env files from the examples
npm run db:up        # starts MongoDB on :27017 via Docker (skip if you use Atlas)
npm run dev          # API on :5000, web on :3000
```

Edit `backend/.env` and set at least `MONGO_URI` and `JWT_SECRET`. Resend, Cloudinary and
OpenWeatherMap keys are optional — the app degrades gracefully without them (emails are
logged, uploads are skipped, weather resolves to `null`), so you never need third-party
accounts to work on the core features.

Node 20.x is required (`.nvmrc`); run `nvm use` if you use nvm.

## Before you open a pull request

```bash
npm run verify       # lint + typecheck + unit + e2e + build, across both workspaces
```

CI runs the same commands, so a green `verify` means a green pipeline. Individual pieces:

| Command | Scope |
| --- | --- |
| `npm run lint` | ESLint (no autofix) in both workspaces |
| `npm run typecheck` | `tsc --noEmit` in both workspaces |
| `npm test` | Backend unit tests |
| `npm run test:e2e` | Backend HTTP tests (no database needed) |
| `npm run build` | Production builds |

To autofix formatting: `npm --prefix backend run lint` and `npm --prefix backend run format`.

## Branches and commits

- Branch off `main`: `feat/short-description`, `fix/short-description`, `docs/…`, `chore/…`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat(tasks): add bulk status update`, `fix(auth): reject expired tokens`, `docs: …`,
  `chore(ci): …`, `test(tasks): …`, `refactor: …`, `style: …`.
- Keep commits focused — one logical change each. A PR with five readable commits is easier
  to review than one squashed blob.

## Pull requests

- Fill in the PR template: what changed, why, and how you tested it.
- Link the issue it closes (`Closes #12`).
- Include a screenshot or short clip for any UI change.
- Keep PRs small. If a change touches both the API and the UI, say so in the description.

## Code conventions

**Backend (NestJS)**

- One feature per module (`controller` → `service` → `schema`), the way `tasks/` and `auth/` are laid out.
- All input goes through a DTO with `class-validator` decorators; the global `ValidationPipe`
  whitelists fields, so anything not on the DTO is stripped.
- Every query touching user data must be scoped by the `user` ObjectId from the JWT. Cross-user
  access returns 404, never 403 — do not leak existence.
- Throw Nest's built-in HTTP exceptions; `HttpExceptionFilter` normalizes the response shape.
- No `any` in new code — the ESLint `no-unsafe-*` rules are on and CI runs with `--max-warnings 0`.

**Frontend (Next.js)**

- App Router, Server Components by default; add `'use client'` only when you need state or effects.
- Server state goes through TanStack Query; local UI state through `useState`.
- All API calls go through `src/lib/api.ts` — don't call `axios` directly from a component.
- Tailwind utility classes; no separate CSS modules.

**Both**

- Prettier config is committed (`printWidth: 100`, single quotes, trailing commas). Don't fight it.
- 2-space indent, LF endings, final newline — enforced by `.editorconfig`.

## Tests

Tests are Jest + `@nestjs/testing` on the backend. New business logic should come with a test,
especially anything touching ownership or auth. Put unit tests next to the file as
`*.spec.ts`; HTTP-level tests go in `backend/test/`. Keep them database-free where possible —
the existing e2e suite boots the HTTP layer without MongoDB.

## Reporting bugs and requesting features

Use the [issue templates](https://github.com/Uk2317/TaskFlow/issues/new/choose). For security
issues, do **not** open a public issue — see [SECURITY.md](./SECURITY.md).

## Code of conduct

Participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md).
