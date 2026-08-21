# Pending workflows

These two workflows are ready to run but are parked here because the automation
account that committed them does not hold GitHub's `workflows` permission —
GitHub rejects any push that writes to `.github/workflows/` without it.

**Enable them with one command:**

```bash
mkdir -p .github/workflows
git mv .github/workflows-pending/ci.yml .github/workflows/ci.yml
git mv .github/workflows-pending/codeql.yml .github/workflows/codeql.yml
git rm .github/workflows-pending/README.md
git commit -m "ci: enable CI and CodeQL workflows"
git push
```

(You can also create the two files through the GitHub web UI, which is always
allowed for the repository owner.)

| File | What it does |
| --- | --- |
| `ci.yml` | On every push to `main` and every PR: `npm ci` → lint → typecheck → test → build, for `backend` and `frontend` in parallel jobs. |
| `codeql.yml` | GitHub CodeQL security + quality scanning on PRs and weekly. |

Both are already validated as well-formed YAML, and every command they run
passes locally today. The CI/CodeQL badges at the top of the root README will
start resolving once the files are moved into `.github/workflows/`.

`.github/dependabot.yml` is **not** affected — it is already active.
