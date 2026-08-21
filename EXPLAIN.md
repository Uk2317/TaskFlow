# How to explain TaskFlow

Use this as a speaking guide. Understand the ideas, then say them in your own words.

---

## 30-second pitch

TaskFlow is a personal task manager. You create an account, log in, and only you can see your tasks. Each task can have a city so we show live weather, a file attachment stored on Cloudinary, and emails when a task is created or marked done. The backend is NestJS with MongoDB Atlas and JWT. The frontend is Next.js. The API is on Render and the UI is on Vercel.

---

## 2-minute pitch

I built TaskFlow as a full-stack assignment: private tasks per user, plus three integrations.

On the backend I used NestJS because I wanted modules, DTO validation, and guards instead of a single Express file. Users register and log in. Passwords are hashed with bcrypt. The server returns a JWT. Every task route uses a JWT guard, then queries MongoDB with that user’s id, so one account cannot read another account’s tasks.

A task has title, description, status (pending / in progress / done), priority, due date, location, and an optional file. GET /tasks supports pagination, search, and filters. When you create a task we upload the file to Cloudinary and send a Resend email. When status becomes DONE we send another email. Location is sent to OpenWeatherMap and shown on the card.

The frontend is Next.js: login, register, and a protected dashboard with React Query for server data and Context for the logged-in user. Loading, empty, and error states are handled. In production the browser talks to the Render API using NEXT_PUBLIC_API_URL.

---

## 5-minute walkthrough (for a demo or viva)

1. **Problem** — People need a private to-do list with extra context: weather for field work, a file, and email reminders.
2. **Users** — Register / login. Session is a JWT, not cookies. Frontend stores the token and sends it on every API call.
3. **Dashboard** — Stats, search, status/priority/date filters, pagination. Cards show weather and attachment.
4. **Create** — Form validates title. Multipart request: fields + file. Nest saves the task linked to `req.user`, uploads to Cloudinary, emails the user, fetches weather.
5. **Update / done** — Status chips call PUT. If status changes to DONE, email fires.
6. **Delete** — Confirm modal, then DELETE scoped by user + task id.
7. **Isolation** — Second account sees an empty list.
8. **Deploy** — GitHub → Render builds Nest (`nest build`, `node dist/main`) → Vercel builds Next with the Render `/api` URL.

---

## What the system looks like

```
User browser
   │
   │  HTTPS
   ▼
Next.js on Vercel
   login / register / dashboard
   Axios + JWT
   │
   │  HTTPS  NEXT_PUBLIC_API_URL
   ▼
NestJS on Render   prefix: /api
   AuthGuard on /tasks
   │
   ├── MongoDB Atlas     users, tasks
   ├── Resend            emails
   ├── Cloudinary        files
   └── OpenWeatherMap    weather
```

The browser never holds Mongo, Cloudinary secret, or Resend key. Only the API does.

---

## Backend, module by module

### Auth

- `POST /api/auth/register` — name, email, password (min 6). Duplicate email → 409.
- `POST /api/auth/login` — email + password. Wrong credentials → 401.
- `GET /api/auth/me` — current user from JWT.
- Password hashed with bcrypt before save. Login uses `bcrypt.compare`.
- JWT payload is `{ sub: userId }`. Signed with `JWT_SECRET`, expiry `JWT_EXPIRES_IN` (7 days).
- `JwtAuthGuard` protects task routes.
- Token is read from `Authorization: Bearer`, `X-Access-Token`, or `access_token` query. That last option exists because some proxies drop the Authorization header.

**If asked “why JWT not sessions?”**  
The API is stateless. Render can restart or scale. No server-side session store.

### Users

Mongoose schema: name, unique email, password with `select: false` so it is not returned by default. Login explicitly selects `+password` to compare.

### Tasks

Linked with `user: ObjectId ref User`. Indexed on `{ user, createdAt }`.

List builds a filter:

- always `user = current user`
- optional status, priority
- optional regex search on title, description, location
- optional due date range
- skip/limit pagination + sort
- aggregation for dashboard counts

Create/update accept multipart (`file` field). Delete uses findOneAndDelete with both ObjectId and string user match, because mixed types in the DB caused “delete does nothing”.

### Email (Resend)

Fired **after** the DB write, asynchronously (`void this.email.send...`) so a slow mailbox does not block the HTTP response. Create email and Done email. If Resend is unset, we log and skip. Test mode only delivers to the Resend account email until a domain is verified.

### Files (Cloudinary)

Multer keeps the file in memory. Cloudinary upload_stream stores it in folder `taskflow`. We save `fileUrl` and `fileName` on the task. If Cloudinary is not configured, the task still saves.

### Weather (OpenWeatherMap)

`GET .../weather?q=city&units=metric`. Result cached ~10 minutes in memory. List endpoint uses cache first so the dashboard is not blocked on 9 weather HTTP calls. Cards can fetch `/api/tasks/weather/:city` if cache is cold. Failures return null; the rest of the task still works.

### Cross-cutting

- Global `ValidationPipe` — whitelist DTO fields, transform types.
- `HttpExceptionFilter` — one JSON error shape: statusCode, message, path, timestamp.
- CORS enabled for the Vercel origin.
- `PORT` from the host (Render). Listen on `0.0.0.0`.

---

## Frontend, piece by piece

| Piece | Role |
| --- | --- |
| `app/login`, `app/register` | Forms, basic validation, call auth API, save session, go to dashboard |
| `app/dashboard` | Protected. React Query list. Filters in query key so cache stays correct |
| `Protected` | If no user/token → `/login` |
| Auth context | user, login, register, logout |
| `lib/api.ts` | Axios instance, attach JWT, optional `access_token` query |
| Task form | title required, location, file, status, priority, due date |
| Task card | pills, weather badge, attachment, status shortcuts, edit/delete |

**Why React Query?**  
Tasks are server state. Query handles loading, error, refetch after mutate. Context is only for “who is logged in”.

**Local vs production**

- Local: `NEXT_PUBLIC_API_URL=/api` and Next rewrites to Nest on port 5000.
- Vercel: `NEXT_PUBLIC_API_URL=https://taskflow-1-kd6f.onrender.com/api` (must end with `/api`).

`NEXT_PUBLIC_` vars are baked in at **build** time. Change them → Redeploy.

---

## Request lifecycle (create task)

1. User submits the form as `FormData`.
2. Axios adds JWT.
3. Nest `JwtAuthGuard` verifies JWT → `userId`.
4. `ValidationPipe` checks DTO.
5. File goes to Cloudinary; URL comes back.
6. Task document inserted with `user: ObjectId(userId)`.
7. Resend email queued (not awaited for success of the request).
8. Weather fetched for the city.
9. JSON returned to the client.
10. React Query invalidates `['tasks']` and the list refreshes.

---

## Security story (say this if they ask “is it secure?”)

- Passwords hashed; never stored plain.
- JWT required on all task routes.
- Every query includes the user id from the token, not from the client body.
- DTOs drop unknown fields.
- Secrets live in Render/Vercel env, not in Git.
- File size limited (8 MB).
- CORS is configured; production `CLIENT_URL` should be the Vercel origin.

Honest limits: no email verification, no refresh-token rotation, JWT also sent as query param for proxy compatibility (slightly more exposure in logs/history).

---

## Deployment story

1. Push to GitHub (`backend/` + `frontend/`). `.env` gitignored.
2. Render: root `backend`, Node 20, build must install Nest CLI (`--include=dev` or CLI in dependencies), start `node dist/main`. Env: Mongo, JWT, Resend, Cloudinary, OpenWeather.
3. Atlas Network Access `0.0.0.0/0` so Render’s IPs can connect.
4. Vercel: root `frontend`, Next.js, `NEXT_PUBLIC_API_URL` = Render URL + `/api`.
5. Set Render `CLIENT_URL` to the Vercel URL.

Free Render sleeps; first request after idle can take ~1 minute.

---

## Design decisions

| Choice | Alternative I rejected | Why |
| --- | --- | --- |
| NestJS | Plain Express | Guards, DTOs, modules match a production API |
| MongoDB | PostgreSQL | Flexible task documents; Atlas already in use |
| JWT | Cookie sessions | Simple for a split frontend/backend on two hosts |
| React Query | Redux | Server cache, less boilerplate |
| One file per task | File array | Enough for the assignment; simpler schema |
| Cache weather | Fetch every list | List latency |

---

## What I would improve with more time

- Multiple attachments per task
- Refresh tokens + httpOnly cookies
- Email verification and password reset
- Playwright e2e tests
- OpenAPI / Swagger
- Verified Resend domain so any user gets mail
- Queues (Bull) for email/upload instead of fire-and-forget
- Rate limiting on login

---

## How to open the code in a viva

1. `backend/src/auth/jwt.strategy.ts` — how the token is read and validated  
2. `backend/src/tasks/tasks.service.ts` — `user` filter on find/create/delete  
3. `backend/src/tasks/dto/` — validation  
4. `frontend/src/lib/api.ts` — attaching the token  
5. `frontend/src/app/dashboard/page.tsx` — Query + mutations  

---

## Short Q&A

**What is this project?**  
A private task manager with JWT auth and three integrations: email, file upload, weather.

**Who is it for?**  
A single user managing their own work, not a team board.

**How is data isolated?**  
JWT → user id → every Mongo query includes that id.

**Where is data stored?**  
MongoDB Atlas. Files on Cloudinary. We store only the URL.

**What happens on create?**  
Validate → upload file → insert task → email → weather → respond.

**What if weather API fails?**  
Task still saves. Badge omitted.

**Why NestJS?**  
Structure: modules, DI, guards, pipes.

**Why Next.js?**  
App Router, easy Vercel deploy, rewrites for local API.

**How do you paginate?**  
`page` and `limit` → `skip = (page-1)*limit` + `countDocuments` for last page.

**How do you filter?**  
Query params mapped into a Mongo filter object.

**Is the API REST?**  
Yes. Nouns `/tasks`, HTTP verbs, JSON, JWT in headers.

**Env vars?**  
Backend: `MONGO_URI`, `JWT_SECRET`, `RESEND_API_KEY`, `OPENWEATHER_API_KEY`, `CLOUDINARY_*`.  
Frontend: `NEXT_PUBLIC_API_URL`.

**Git hygiene?**  
`.env` not committed, `.env.example` committed, README with setup and architecture.

---

## Phrases to use / avoid

**Use:** “scoped to the authenticated user”, “DTO validation”, “stateless JWT”, “fire-and-forget email”, “secrets in environment variables”.

**Avoid:** “I just used a template”, “AI wrote it”, “I don’t know why Nest is there”, “the password is stored in the database” (say **hashed**).

---

## Closing sentence

“The core of the project is not the UI — it is that every task is owned by a user, the API enforces that with JWT + Mongo filters, and weather, files, and email are attached without blocking the main create/update path.”
