# TaskFlow — Repository Audit

**Repo:** `Uk2317/TaskFlow` (public) · **Audited:** 2026-08-21 · **Branch:** `arena/01a023c1-taskflow`
**Stack:** NestJS 11 + Mongoose · Next.js 15 (App Router) + Tailwind 4 · JWT · Resend · Cloudinary · OpenWeatherMap

> **Status — updated 2026-08-21:** Batches **A**, **B** and **C** are complete (see §8).
> Everything in §1–§3 and §6 is resolved except the Google Fonts build dependency (§1.5),
> the GitHub description/topics (needs repo-owner permissions) and screenshots (needs a
> running app). Batch **D** (tests + security hardening) is still open.

Verdict: **the product code is solid and well organised** — clean module boundaries, DTO validation, ownership checks on every task query, a real exception filter. What is holding the repo back is almost entirely **presentation, hygiene and trust signals**: leftover framework boilerplate, missing license/CI/env files, a broken lint gate, and zero repo metadata. For a portfolio/hiring repo, those are the first things a reviewer sees.

Scoring at a glance:

| Area | Score | Note |
| --- | --- | --- |
| Code architecture | 8.5 / 10 | Clean, idiomatic Nest + Next |
| Documentation | 6 / 10 | Good root README, but boilerplate sub-READMEs, no screenshots |
| Repo hygiene / metadata | 3 / 10 | No LICENSE file, no description, no topics, 1 commit total |
| Automation (CI/CD, hooks) | 0 / 10 | Nothing runs on push or PR |
| Tests | 2 / 10 | 1 trivial unit test, broken e2e test |
| Security posture | 5 / 10 | Works, but several avoidable weaknesses |

---

## 1. Broken / must fix

### 1.1 `npm run lint` fails in the backend — 47 problems
`npx eslint "{src,test}/**/*.ts"` reports **47 errors / 2 warnings**. 36 are Prettier formatting (auto-fixable); after `--fix` **11 errors + 2 warnings remain** and are genuine:

- `src/weather/weather.service.ts` — the Axios response is untyped `any`; 9 `no-unsafe-*` errors. Fix by typing the OpenWeather response (`axios.get<OpenWeatherResponse>`).
- `src/cloudinary/cloudinary.service.ts:52` — `reject(error || ...)` rejects with a non-Error (`prefer-promise-reject-errors`).
- `src/main.ts:41` — floating promise: `bootstrap();` should be `void bootstrap();`.

This means the repo cannot have a green lint gate today. Fix these before adding CI, or CI is red on day one.

### 1.2 The e2e test is dead create-nest-app boilerplate
`backend/test/app.e2e-spec.ts` asserts `GET /` returns `"Hello World!"`. That route doesn't exist (global prefix is `api`, and only `GET /api/health` is defined), and booting `AppModule` requires a live `MONGO_URI`. `npm run test:e2e` therefore fails. Either delete it or rewrite it against `/api/health` with an in-memory Mongo (`mongodb-memory-server`).

### 1.3 `frontend/.env.example` is referenced but does not exist
The root README tells people to run `cp .env.example .env.local` in `frontend/`, but there is no such file — and `frontend/.gitignore` has `.env*`, which would ignore it even if you created one. Fix: add `!.env.example` to `frontend/.gitignore` and commit the file with `NEXT_PUBLIC_API_URL=/api`.

### 1.4 Dead boilerplate left in the source tree
- `backend/src/app.service.ts` — `getHello()` is never used (`AppController` doesn't inject it).
- `backend/README.md` — still the full **NestJS starter README** (Nest logo, Open Collective badges, "Donate PayPal", Twitter follow). This is the single most obvious "generated from a template" tell in the repo.
- `frontend/README.md` — still the **create-next-app README** ("bootstrapped with create-next-app… deploy on Vercel").
- `frontend/public/next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg` — unused starter assets.
- `.gitignore` references `backend/uploads/` — uploads go to Cloudinary; there is no `uploads/` directory. Stale rule.

### 1.5 Frontend build depends on the network at build time
`next build` failed here with `Failed to fetch 'Plus Jakarta Sans' from Google Fonts` (ECONNRESET). Vercel has network so it passes there, but the build is non-hermetic — it will break in any offline/firewalled CI. Fix by self-hosting the font (`next/font/local`) or accepting the risk consciously.

---

## 2. Repo hygiene & metadata (highest ROI, non-code)

| Missing | Why it matters | Effort |
| --- | --- | --- |
| **`LICENSE` file** | README says "MIT" but GitHub shows **no license** (`licenseInfo: null`). Legally the repo is "all rights reserved". | 1 min |
| **GitHub description** | Currently empty. It's the one line shown in search results and on your profile. | 1 min |
| **GitHub topics** | None set. Suggest: `nestjs`, `nextjs`, `typescript`, `mongodb`, `jwt-authentication`, `tailwindcss`, `fullstack`, `task-manager`. Topics drive nearly all organic discovery. | 2 min |
| **Screenshots / GIF in README** | A task app is visual. No reviewer will spin up Mongo + 4 API keys to see it. One dashboard screenshot + one login screenshot beats three paragraphs. | 15 min |
| **Live demo link in README** | The Vercel URL (`task-flow-github-d813.vercel.app`) is set as the repo homepage but is **not linked in the README** — plus it needs a note that the free Render API cold-starts ~50 s, and ideally seeded demo credentials. | 5 min |
| **Badges** | Nothing at the top of the README (CI status, license, Node version, stack). Cheap credibility. | 5 min |
| **`CONTRIBUTING.md`** | Setup, branch naming, commit convention, how to run lint/tests. | 20 min |
| **`SECURITY.md`** | `isSecurityPolicyEnabled: false`. How to report a vuln privately. | 10 min |
| **`CODE_OF_CONDUCT.md`** | Standard Contributor Covenant; GitHub shows a community-health checkmark for it. | 2 min |
| **Issue / PR templates** (`.github/`) | Signals a maintained project. | 15 min |
| **`.editorconfig`, `.nvmrc`** | Backend pins `engines.node: 20.x`, frontend pins nothing → contributor drift. | 5 min |
| **Frontend Prettier config** | Backend has `.prettierrc`, frontend has none → two different formatting styles in one repo. | 2 min |
| **`CHANGELOG.md`** | Optional, but pairs well with tagged releases. | — |

### Git history
`git rev-list --count HEAD` = **1**. The whole project is a single commit ("Remove render.yaml"). For a portfolio repo this is a real negative: reviewers look at commit history to judge how you work. Nothing to do retroactively, but from now on: small, conventional, scoped commits (`feat(tasks): …`, `fix(auth): …`), and use PRs into `main` even when solo.

---

## 3. Automation — nothing exists

There is **no `.github/workflows/`**. Recommended minimum:

1. **`ci.yml`** — on push/PR: matrix over `backend` and `frontend` → `npm ci` → `lint` → `tsc --noEmit` → `test` → `build`.
2. **Dependabot** (`.github/dependabot.yml`) — weekly npm updates for both workspaces + GitHub Actions.
3. **CodeQL** — free static security scanning for public repos, one workflow file.
4. Optional: `concurrency` cancel-in-progress, and branch protection on `main` requiring CI green.

Also note the backend `lint` script is `eslint … --fix`, which **mutates files instead of failing**. CI needs a non-mutating variant (`lint:ci` without `--fix`).

---

## 4. Testing

Current state: one unit test (`app.controller.spec.ts` asserting `health().ok === true`) and one broken e2e test. Coverage is effectively 0% of business logic.

Highest-value tests to add, in order:
1. `AuthService` — register duplicate email → 409; login wrong password → 401; password is hashed, never returned.
2. `TasksService` — **ownership isolation**: user B cannot read/update/delete user A's task. This is your core security claim; it deserves a test.
3. `TasksService.findAll` — pagination meta, status/priority filters, search regex, `stats` aggregation.
4. `WeatherService` — cache hit inside TTL, graceful `null` when the API key is absent or the call throws.
5. Frontend: 2–3 React Testing Library tests on `TaskForm` validation, or a single Playwright happy-path (register → create task → mark done).

---

## 5. Security & correctness observations

Not blockers, but each is a legitimate review comment:

- **JWT in the query string.** `withToken()` appends `?access_token=…` to *every* request and `JwtStrategy` accepts it. Query strings land in server logs, proxy logs, and `Referer` headers. The README explains it as a preview-proxy workaround — make it opt-in via an env flag, or drop it now that `Authorization` works.
- **Token stored in `localStorage` + `sessionStorage` + a `window.__TASKFLOW_TOKEN__` global.** Three copies, all XSS-readable. Pick one, and document the trade-off vs. httpOnly cookies.
- **`CORS origin: true` with `credentials: true`** reflects *any* origin. Should be an allowlist from `CLIENT_URL`.
- **`JWT_SECRET` falls back to `'dev-secret'`** in `jwt.strategy.ts`. In production this should throw at boot instead of silently using a known secret.
- **HTML injection in emails.** `EmailService` interpolates `name`, `task.title`, `task.description` straight into HTML. A task titled `<img src=x onerror=…>` is rendered in the recipient's inbox. Escape them.
- **No rate limiting** on `/auth/login` or `/auth/register` → free credential stuffing. `@nestjs/throttler` is ~10 lines.
- **No `helmet`**, no request-size limit beyond Multer's 8 MB.
- **No file-type validation** on upload — Cloudinary `resource_type: 'auto'` will accept anything.
- **Unbounded weather cache.** `Map` in `WeatherService` never evicts expired keys; slow memory growth over a long-lived process.
- **`@nestjs/cli` and `typescript` are in `dependencies`**, not `devDependencies` — inflates the production install on Render.
- **No `/api/health` DB check.** Health returns `ok: true` even when Mongo is down; Render's health check can't detect a broken deploy.

---

## 6. Documentation improvements (root README)

The root README is genuinely good — architecture tree, env table, API table, honest trade-offs section. To make it excellent:

1. **Hero block at the top**: one-line pitch, badges, live demo link, screenshot. Right now it opens with a bare `# TaskFlow` and two lines of text.
2. **Features list** with emojis/bullets before the architecture dump — readers want *what it does* before *how it's laid out*.
3. **Quickstart that actually works offline**: add a `docker-compose.yml` for Mongo, and state clearly that Resend / Cloudinary / OpenWeather are **optional** (the code already degrades gracefully — that's a selling point you don't mention).
4. **Screenshots section** (dashboard, task form, login).
5. **Fix the `frontend/.env.example` reference** (see 1.3).
6. Add a **root `package.json`** with `npm-run-all`/workspaces so `npm run dev` starts both apps — currently contributors need two terminals and no doc says so explicitly.
7. **API docs**: the README says OpenAPI was skipped. `@nestjs/swagger` is ~15 lines for a live `/api/docs` and would replace the hand-maintained endpoint table.

---

## 7. Suggested execution plan

**Batch A — quick wins (~30 min, zero risk)**
LICENSE file · GitHub description + topics · replace both boilerplate sub-READMEs · delete unused starter SVGs and `app.service.ts` · clean stale `.gitignore` rules · add `frontend/.env.example` + `.gitignore` negation · `.nvmrc` + `.editorconfig` + frontend `.prettierrc`.

**Batch B — make the repo green (~1 h)**
Run Prettier across the backend · fix the 11 real ESLint errors (type the OpenWeather response, `void bootstrap()`, reject with `Error`) · add `lint:ci` scripts · delete or rewrite the e2e test · add `.github/workflows/ci.yml` + Dependabot + CodeQL.

**Batch C — README glow-up (~1 h)**
Hero + badges + demo link + features · screenshots · docker-compose for Mongo · root package.json with combined `dev` script · CONTRIBUTING / SECURITY / CODE_OF_CONDUCT / issue templates.

**Batch D — substance (~2–4 h)**
Ownership-isolation and auth unit tests · `@nestjs/throttler` + helmet + CORS allowlist · escape email HTML · fail fast on missing `JWT_SECRET` · Swagger at `/api/docs` · DB-aware health check.

---

*Generated by an automated audit — findings verified by running `npm ci`, `npm run build`, `jest`, `eslint`, and `tsc --noEmit` in both workspaces.*

---

## 8. Completed work log (Batches A + B)

| # | Item | Commit |
| --- | --- | --- |
| 1.1 | Backend lint went 47 problems → **0 errors, 0 warnings** (Prettier pass + typed OpenWeather response, `Error` rejection in Cloudinary, `void bootstrap()`) | `7bc3f14`, `c63f2fe` |
| 1.2 | Boilerplate e2e replaced with a DB-free health suite (3 passing tests: health payload, `/api` prefix, error-filter shape) | `78ddf80` |
| 1.3 | `frontend/.env.example` added + `!.env.example` negation in `frontend/.gitignore` | `fbc4d63` |
| 1.4 | Deleted `AppService` and the 5 unused starter SVGs; rewrote both boilerplate sub-READMEs; cleaned stale `backend/uploads` ignore rules | `c38883e`, `44c1e10`, `fbc4d63` |
| 2 | `LICENSE` (MIT), `.nvmrc` (20), `.editorconfig`, frontend `.prettierrc`/`.prettierignore`, README badges + live-demo link | `fbc4d63`, `44c1e10` |
| 3 | `ci.yml` (lint · typecheck · test · build × 2 workspaces), `codeql.yml`, `dependabot.yml`; non-mutating `lint:ci` + `typecheck` scripts; `@nestjs/cli`/`typescript` moved to devDependencies; lockfile resynced | `224660e`, `e3b03f5` |
| — | Nine focused conventional commits instead of one squashed blob | all |

Verification after the changes (clean `npm ci` in both workspaces):

```
backend   lint ✓  typecheck ✓  unit ✓ (1)  e2e ✓ (3)  build ✓
frontend  lint ✓  typecheck ✓
```

### Still outstanding from Batches A + B

- **GitHub description and topics** — `gh repo edit` returned `HTTP 403: Resource not
  accessible by integration`. Must be set by the repo owner (Settings, or the ⚙ next to
  *About*). Suggested values are in §2.
- **Workflow files are parked in `.github/workflows-pending/`** — GitHub refuses pushes that
  write `.github/workflows/` from an app without the `workflows` permission. One `git mv`
  activates them; see the README in that folder.
- **§1.5 Google Fonts build dependency** — left as-is. It only bites in offline builds, and
  self-hosting the font requires downloading the woff2, which this sandbox cannot reach.


---

## 9. Completed work log (Batch C)

| # | Item | Commit |
| --- | --- | --- |
| 6.1–6.2 | README rewritten: hero block, demo link, stack badges, feature list, request-flow explanation, collapsible API examples, roadmap | `5b86582` |
| 6.3 | `docker-compose.yml` (MongoDB 7 + optional mongo-express) and an explicit required-vs-optional env table — the graceful-degradation behaviour is now documented, not hidden | `7f59e3a` |
| 6.6 | Root `package.json`: `setup`, `db:up`, `dev` (both apps, one command), `lint`, `typecheck`, `test`, `build`, `verify`. Uses `--prefix` rather than npm workspaces so the Render/Vercel root directories keep working | `7f59e3a` |
| 6.4 | `docs/screenshots/` with capture instructions; the README block stays commented out rather than shipping broken image links | `5b86582` |
| 2 | `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1), issue forms, PR template, contact links | `710c894`, `1bed0ba` |

### Not done, and why

- **Screenshots** — the sandbox has no MongoDB binary, no Docker and no outbound access to
  Google Fonts, so the app cannot be run to capture genuine images. Generating fake UI
  screenshots would misrepresent the product. Instructions are in `docs/screenshots/README.md`.
- **GitHub description/topics** — still blocked on `403: Resource not accessible by integration`.

## 10. Remaining: Batch D

Unchanged from §4 and §5 — ownership-isolation tests, auth tests, `@nestjs/throttler`,
`helmet`, a strict CORS allowlist, escaping interpolated values in the email HTML, failing
fast on a missing `JWT_SECRET`, Swagger at `/api/docs`, and a DB-aware health check.
