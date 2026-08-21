# Screenshots

The root README has a screenshots block that is **commented out** until these files exist.
Once you add them, uncomment the `## Screenshots` section near the top of `README.md`.

## What to capture

| File | Screen | What should be visible |
| --- | --- | --- |
| `dashboard.png` | `/dashboard` with 5–8 tasks | The stat counters, a mix of statuses and priorities, at least one task with a location so a weather badge shows, and the search/filter bar |
| `task-form.png` | The create/edit task dialog | Filled-in title, description, priority, due date, location and an attached file |
| `login.png` | `/login` | The sign-in form (use a demo account, never a real password) |

## How to capture them

```bash
npm run db:up
npm run dev
# seed a few realistic tasks through the UI first — empty states make weak screenshots
```

- Use a **1440×900** browser window and capture just the viewport (not the whole desktop).
- Zoom to 100%, hide bookmark bars and browser extensions.
- Use a light background; the app is designed light-mode first.
- Keep each file **under ~400 KB** — resize to 1440px wide and save as PNG, or use WebP if you
  prefer (update the README paths to match).
- **Redact anything real**: use a demo account like `demo@taskflow.app`, never show a real
  email address, token, or Cloudinary URL containing your cloud name.

## Optional: an animated demo

A short GIF or MP4 of creating a task and marking it done is the single highest-impact asset
for a project like this. Keep it under 10 seconds and under 5 MB, save it as `demo.gif`, and
put it directly under the title in the README.
