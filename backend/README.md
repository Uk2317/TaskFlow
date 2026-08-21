# TaskFlow API

NestJS 11 REST API for TaskFlow — JWT auth, per-user task CRUD, Cloudinary attachments,
Resend email notifications and cached OpenWeatherMap lookups on MongoDB (Mongoose).

> Full project overview, architecture and deployment notes live in the [root README](../README.md).

## Requirements

- Node.js 20.x (see `.nvmrc`)
- A MongoDB connection string (Atlas or local `mongodb://127.0.0.1:27017/taskflow`)

## Setup

```bash
cp .env.example .env      # fill in at least MONGO_URI and JWT_SECRET
npm install
npm run start:dev         # http://localhost:5000/api/health
```

Only `MONGO_URI` and `JWT_SECRET` are required. Resend, Cloudinary and OpenWeatherMap
are optional — each service degrades gracefully when its key is absent (emails are
logged instead of sent, uploads are skipped, weather resolves to `null`).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run start:dev` | Watch mode |
| `npm run build` | Compile to `dist/` |
| `npm start` | Run the compiled build (`node dist/main`) |
| `npm run lint` | ESLint + Prettier, autofixing |
| `npm run lint:ci` | ESLint with `--max-warnings 0`, no autofix (used by CI) |
| `npm run format` | Prettier write |
| `npm test` | Jest unit tests |
| `npm run test:cov` | Unit tests with coverage |

## Layout

```
src/
├── auth/              register, login, JWT strategy + guard
├── users/             Mongoose User model and lookups
├── tasks/             CRUD, DTOs, pagination, filters, stats
├── email/             Resend notifications
├── weather/           OpenWeatherMap client + 10-minute in-memory cache
├── cloudinary/        multipart upload handling
├── common/filters/    centralized HTTP exception filter
├── app.controller.ts  GET /api/health
└── main.ts            bootstrap, global prefix, CORS, ValidationPipe
```

## Conventions

- Global prefix `api`, so every route is served under `/api/*`.
- `ValidationPipe` runs with `whitelist` and `transform` enabled — unknown body fields are stripped.
- Every task query is scoped to the `user` ObjectId taken from the JWT; cross-user access returns 404.
- Errors are normalized by `HttpExceptionFilter` to `{ statusCode, message, path, timestamp }`.

## Environment

See [`.env.example`](./.env.example) for the full list: `PORT`, `NODE_ENV`, `MONGO_URI`,
`JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `RESEND_API_KEY`, `EMAIL_FROM`,
`OPENWEATHER_API_KEY`, `CLOUDINARY_*`.

## License

MIT — see [LICENSE](../LICENSE).
