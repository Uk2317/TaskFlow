# TaskFlow Web

Next.js 15 (App Router) client for TaskFlow — login/register, the task dashboard,
filtering and pagination, file attachments and weather badges. Styled with Tailwind CSS 4,
server state handled by TanStack Query.

> Full project overview, architecture and deployment notes live in the [root README](../README.md).

## Requirements

- Node.js 20.x (see `.nvmrc`)
- The [TaskFlow API](../backend) running locally, or a deployed API URL

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev               # http://localhost:3000
```

With the default `NEXT_PUBLIC_API_URL=/api`, `next.config.ts` rewrites `/api/*` to the Nest
process (`API_PROXY_TARGET`, default `http://127.0.0.1:5000`) — so no CORS setup is needed in
development. In production set `NEXT_PUBLIC_API_URL` to the deployed API origin, e.g.
`https://your-service.onrender.com/api`, and redeploy (`NEXT_PUBLIC_*` values are inlined at build time).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server with Turbopack on `0.0.0.0:3000` |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (`eslint-config-next`) |
| `npm run typecheck` | `tsc --noEmit` |

## Layout

```
src/
├── app/
│   ├── layout.tsx      root layout, fonts, providers
│   ├── page.tsx        redirects to /dashboard or /login
│   ├── login/          sign in
│   ├── register/       sign up
│   └── dashboard/      task list, filters, stats, pagination
├── components/         task-card, task-form, weather-badge, protected, providers
├── context/            auth-context — session state and bootstrap
└── lib/api.ts          Axios instance, JWT handling, typed endpoints
```

## Notes

- Routes under `/dashboard` are wrapped by `<Protected>`, which redirects unauthenticated users to `/login`.
- The JWT is read from storage by an Axios request interceptor in `lib/api.ts`.
- Cloudinary is the only allowed remote image host (`next.config.ts` → `images.remotePatterns`).

## License

MIT — see [LICENSE](../LICENSE).
