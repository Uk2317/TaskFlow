<div align="center">

# TaskFlow

**A personal task manager where every account sees only its own tasks.**

Full-stack TypeScript: a NestJS + MongoDB REST API and a Next.js 15 dashboard, with JWT auth,
file attachments, email notifications and live weather on location-tagged tasks.

[**Live demo**](https://task-flow-github-d813.vercel.app) ·
[API health](https://task-flow-github-d813.vercel.app/api/health) ·
[Report a bug](https://github.com/Uk2317/TaskFlow/issues/new/choose)

[![CI](https://github.com/Uk2317/TaskFlow/actions/workflows/ci.yml/badge.svg)](https://github.com/Uk2317/TaskFlow/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Uk2317/TaskFlow/actions/workflows/codeql.yml/badge.svg)](https://github.com/Uk2317/TaskFlow/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-20.x-5FA04E?logo=node.js&logoColor=white)](./.nvmrc)

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

> **Note on the demo:** the API runs on a free Render instance and cold-starts after inactivity.
> The first request can take up to ~50 seconds — after that it is instant.

---

<!--
  SCREENSHOTS — drop three PNGs into docs/screenshots/ and uncomment this block.
  See docs/screenshots/README.md for exactly what to capture.

## Screenshots

|                   Dashboard                    |                  Create a task                  |
| :--------------------------------------------: | :---------------------------------------------: |
| ![Dashboard](docs/screenshots/dashboard.png)    | ![Task form](docs/screenshots/task-form.png)    |

<p align="center"><img src="docs/screenshots/login.png" alt="Login" width="600" /></p>
-->

## Features

- 🔐 **Account-scoped by design** — register/login with JWT; every task query is filtered by the
  user id inside the token, so one account can never read, edit or delete another's data.
- ✅ **Full task CRUD** — title, description, status (`PENDING` / `IN_PROGRESS` / `DONE`),
  priority (`LOW` / `MEDIUM` / `HIGH`), due date and location.
- 🔎 **Search, filter, sort, paginate** — text search across title/description/location,
  filters by status, priority and due-date range, five sort orders, server-side pagination.
- 📊 **Live counters** — pending / in-progress / done totals computed with a MongoDB aggregation.
- 📎 **Attachments** — one file per task uploaded straight to Cloudinary (8 MB cap, memory storage,
  nothing written to the server disk).
- ✉️ **Email notifications** — a Resend email when a task is created and when it is marked done.
- 🌤️ **Weather badges** — tasks with a location show current conditions from OpenWeatherMap,
  cached in memory for 10 minutes and resolved asynchronously so the list never blocks on it.
- 🧰 **Graceful degradation** — Resend, Cloudinary and OpenWeatherMap are all optional. Without
  their keys the app still runs: emails are logged, uploads are skipped, weather is `null`.
- 🛡️ **Consistent API contract** — `ValidationPipe` whitelists DTO fields, `HttpExceptionFilter`
  normalizes every error to `{ statusCode, message, path, timestamp }`.

## Tech stack

| Layer | Choice |
| --- | --- |
| API | NestJS 11, TypeScript, Express |
| Database | MongoDB + Mongoose 9 |
| Auth | Passport JWT, bcrypt password hashing |
| Web | Next.js 15 (App Router), React 19, TanStack Query 5, Tailwind CSS 4, Axios |
| Services | Resend (email), Cloudinary (files), OpenWeatherMap (weather) |
| Tooling | ESLint + Prettier, Jest, GitHub Actions, CodeQL, Dependabot |

## Quick start

**Prerequisites:** Node 20.x (`.nvmrc`) and either Docker or a MongoDB Atlas connection string.

```bash
git clone https://github.com/Uk2317/TaskFlow.git
cd TaskFlow

npm run setup     # install both workspaces + create .env files from the examples
npm run db:up     # start MongoDB on :27017 with Docker (skip if you use Atlas)
npm run dev       # API on http://localhost:5000, web on http://localhost:3000
```

Then open <http://localhost:3000> and register an account.

If you are not using Docker, set `MONGO_URI` in `backend/.env` to your Atlas string. The only
two values you must provide are `MONGO_URI` and `JWT_SECRET` — everything else is optional.

<details>
<summary>Prefer two terminals / no root scripts?</summary>

```bash
# terminal 1 — API
cd backend && cp .env.example .env && npm install && npm run start:dev

# terminal 2 — web
cd frontend && cp .env.example .env.local && npm install && npm run dev
```

</details>

In development the web app calls `/api/*` and `next.config.ts` rewrites those requests to the
Nest process (`API_PROXY_TARGET`, default `http://127.0.0.1:5000`), so there is no CORS setup.

## Root scripts

| Command | What it does |
| --- | --- |
| `npm run setup` | Install both workspaces and create `.env` files from the examples |
| `npm run dev` | Run API and web together with colour-tagged output |
| `npm run db:up` / `npm run db:down` | Start / stop the Dockerised MongoDB |
| `npm run lint` | ESLint (no autofix) across both workspaces |
| `npm run typecheck` | `tsc --noEmit` across both workspaces |
| `npm test` / `npm run test:e2e` | Backend unit tests / HTTP tests (no database needed) |
| `npm run build` | Production builds for both workspaces |
| `npm run verify` | Everything above — the same gate CI runs |

## Architecture

```
TaskFlow/
├── backend/                 NestJS REST API
│   └── src/
│       ├── auth/            register, login, JWT strategy + guard
│       ├── users/           Mongoose User model
│       ├── tasks/           CRUD, DTOs, pagination, filters, stats
│       ├── email/           Resend notifications
│       ├── weather/         OpenWeatherMap + in-memory cache
│       ├── cloudinary/      multipart uploads
│       └── common/filters/  centralized HTTP errors
├── frontend/                Next.js 15 App Router
│   └── src/
│       ├── app/             login, register, dashboard
│       ├── components/      task card, task form, weather badge
│       ├── context/         auth session
│       └── lib/api.ts       Axios + JWT
└── docker-compose.yml       local MongoDB
```

**How a request flows:** the browser sends the JWT on every call → `JwtStrategy` resolves it to a
user → the controller passes `req.user.userId` into the service → every Mongo query is scoped to
that ObjectId. A task belonging to someone else returns **404, not 403**, so the API never leaks
whether a record exists.

## API

Base URL: `/api`. All task routes require `Authorization: Bearer <token>`.

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/api/health` | public | Liveness probe |
| `POST` | `/api/auth/register` | public | `{ name, email, password }` → `{ user, token }` |
| `POST` | `/api/auth/login` | public | `{ email, password }` → `{ user, token }` |
| `GET` | `/api/auth/me` | JWT | Current user |
| `GET` | `/api/tasks` | JWT | `page, limit, status, priority, search, startDate, endDate, sort` |
| `POST` | `/api/tasks` | JWT | multipart: task fields + optional `file` |
| `GET` | `/api/tasks/:id` | JWT | |
| `PUT` | `/api/tasks/:id` | JWT | multipart, partial update |
| `DELETE` | `/api/tasks/:id` | JWT | |
| `GET` | `/api/tasks/weather/:city` | JWT | Cached current conditions |

Enums — status: `PENDING` \| `IN_PROGRESS` \| `DONE` · priority: `LOW` \| `MEDIUM` \| `HIGH`
Sort: `createdAt` \| `-createdAt` \| `dueDate` \| `-dueDate` \| `title`

<details>
<summary>Example: list tasks</summary>

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/tasks?status=PENDING&priority=HIGH&page=1&limit=9&sort=-createdAt"
```

```jsonc
{
  "data": [{ "_id": "…", "title": "Ship the audit", "status": "PENDING", "weather": null }],
  "meta": { "total": 12, "page": 1, "limit": 9, "lastPage": 2 },
  "stats": { "PENDING": 7, "IN_PROGRESS": 3, "DONE": 2, "total": 12 }
}
```

</details>

<details>
<summary>Error shape</summary>

```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "path": "/api/auth/login",
  "timestamp": "2026-08-21T10:15:00.000Z"
}
```

</details>

## Environment

Copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env.local`
(`npm run setup` does both).

| Variable | Where | Required | Purpose |
| --- | --- | :---: | --- |
| `MONGO_URI` | backend | ✅ | MongoDB connection string |
| `JWT_SECRET` | backend | ✅ | Token signing key — use a long random value |
| `JWT_EXPIRES_IN` | backend | | Token lifetime (default `7d`) |
| `PORT` | backend | | API port (default `5000`) |
| `CLIENT_URL` | backend | | Deployed web origin |
| `RESEND_API_KEY` | backend | | Emails on create / done — omit to log instead |
| `EMAIL_FROM` | backend | | Sender (`onboarding@resend.dev` in Resend test mode) |
| `OPENWEATHER_API_KEY` | backend | | Weather badges — omit to disable |
| `CLOUDINARY_URL` *or* `CLOUDINARY_CLOUD_NAME` + `_API_KEY` + `_API_SECRET` | backend | | Attachments — omit to skip uploads |
| `NEXT_PUBLIC_API_URL` | frontend | | `/api` locally, full API origin in production |
| `API_PROXY_TARGET` | frontend | | Dev-only rewrite target (default `http://127.0.0.1:5000`) |

Resend test mode only delivers to the account owner's inbox until a domain is verified.

## Deployment

**Backend → Render**

| Setting | Value |
| --- | --- |
| Root directory | `backend` |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Add the backend environment variables with real values, then set `CLIENT_URL` to your Vercel URL.

> Render sets `NODE_ENV=production`, and npm then skips `devDependencies` — so the Nest CLI and
> TypeScript are kept in `dependencies` to keep `npm run build` working out of the box. If you
> prefer them in `devDependencies`, change the build command to
> `npm ci --include=dev && npm run build` first.

**Frontend → Vercel**

| Setting | Value |
| --- | --- |
| Root directory | `frontend` |
| Framework | Next.js |
| Environment | `NEXT_PUBLIC_API_URL=https://YOUR-SERVICE.onrender.com/api` |

`NEXT_PUBLIC_*` values are inlined at build time — redeploy after changing them.

## Testing

```bash
npm test          # backend unit tests
npm run test:e2e  # HTTP-level tests, no database required
npm run verify    # the full CI gate
```

## Roadmap

- [ ] Ownership-isolation and auth test suites
- [ ] Rate limiting on auth endpoints + `helmet` + a strict CORS allowlist
- [ ] OpenAPI / Swagger at `/api/docs`
- [ ] Multiple attachments per task
- [ ] Refresh-token rotation and email verification
- [ ] Push weather updates over websockets instead of on-list refresh
- [ ] Playwright end-to-end coverage

Known trade-offs in the current build are documented in [SECURITY.md](./SECURITY.md#known-limitations-of-the-current-design)
and [REPO_AUDIT.md](./REPO_AUDIT.md).

## Contributing

Setup, conventions and the PR checklist live in [CONTRIBUTING.md](./CONTRIBUTING.md).
Participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md).
For security reports see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © Uk2317
