# TaskFlow

Personal task manager. Each account only sees its own tasks.

**Stack:** NestJS + MongoDB (Mongoose) · Next.js 15 (App Router) · JWT · Resend · Cloudinary · OpenWeatherMap

## Architecture

```
taskflow/
├── backend/                 NestJS REST API
│   └── src/
│       ├── auth/            register, login, JWT strategy + guard
│       ├── users/           Mongoose User model
│       ├── tasks/           CRUD, DTOs, pagination, filters
│       ├── email/           Resend notifications
│       ├── weather/         OpenWeatherMap + in-memory cache
│       ├── cloudinary/      multipart uploads
│       └── common/filters   centralized HTTP errors
└── frontend/                Next.js
    └── src/
        ├── app/             login, register, dashboard
        ├── components/      cards, form, weather badge
        ├── context/         auth session
        └── lib/api.ts       Axios + JWT
```

- Passwords hashed with bcrypt.
- JWT extracted from `Authorization`, `X-Access-Token`, or `access_token` query (preview proxies sometimes drop `Authorization`).
- Tasks always filtered by `user` ObjectId from the token. Another user cannot read or delete yours.
- `ValidationPipe` whitelists DTO fields. `HttpExceptionFilter` standardizes errors.

## Local setup

```bash
# API
cd backend
cp .env.example .env   # fill secrets
npm install
npm run start:dev      # http://localhost:5000/api/health

# UI
cd frontend
cp .env.example .env.local
# for local dev keep:
# NEXT_PUBLIC_API_URL=/api
npm install
npm run dev            # http://localhost:3000
```

Next.js rewrites `/api/*` to the Nest process during development.

## Environment

See `backend/.env.example` and `frontend/.env.example`.

| Variable | Where | Purpose |
| --- | --- | --- |
| `MONGO_URI` | backend | Atlas connection string |
| `JWT_SECRET` | backend | Token signing |
| `RESEND_API_KEY` | backend | Emails on create / done |
| `EMAIL_FROM` | backend | From address (`onboarding@resend.dev` in test mode) |
| `OPENWEATHER_API_KEY` | backend | Live city weather |
| `CLOUDINARY_*` | backend | Task attachments |
| `NEXT_PUBLIC_API_URL` | frontend | `https://<render>.onrender.com/api` in production |

Resend test mode only delivers to the account inbox until you verify a domain.

## API

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | JWT |
| GET | `/api/tasks` | JWT — `page, limit, status, priority, search, startDate, endDate, sort` |
| POST | `/api/tasks` | JWT — multipart: fields + `file` |
| GET/PUT/DELETE | `/api/tasks/:id` | JWT |
| GET | `/api/tasks/weather/:city` | JWT |

Task enums: `PENDING` \| `IN_PROGRESS` \| `DONE` · `LOW` \| `MEDIUM` \| `HIGH`

## Deploy

**Backend → Render**

- Root directory: `backend`
- Build: `npm install && npm run build`
- Start: `npm start` (`node dist/main`)
- Health: `/api/health`
- Add the backend env vars (real values, not placeholders)

**Frontend → Vercel**

- Root directory: `frontend`
- Framework: Next.js
- Env: `NEXT_PUBLIC_API_URL=https://YOUR-SERVICE.onrender.com/api`
- Redeploy after changing any `NEXT_PUBLIC_*` variable

Then set Render `CLIENT_URL` to the Vercel URL.

## Trade-offs / next with more time

- Weather is cached 10 minutes and attached asynchronously on list so the dashboard stays fast; a websocket or background job would keep badges fresher.
- Files are a single attachment per task; a subdocument array would support many files.
- Resend test sender cannot mail arbitrary users until a domain is verified.
- No refresh-token rotation or email verification yet.
- E2E tests (Playwright) and OpenAPI docs were skipped to ship the product surface first.

## License

MIT
