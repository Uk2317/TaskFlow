# Security Policy

## Supported versions

TaskFlow is a single actively developed line. Only the latest commit on `main` receives
security fixes.

| Version | Supported |
| --- | --- |
| `main` (latest) | ✅ |
| Older tags / forks | ❌ |

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Report it privately through GitHub:
[**Report a vulnerability**](https://github.com/Uk2317/TaskFlow/security/advisories/new)
(Security → Advisories → Report a vulnerability). That opens a private thread visible only to
the maintainers.

Please include:

- what the issue is and which component is affected (API, web, deployment config),
- reproduction steps or a proof of concept,
- the impact you think it has,
- any suggested fix.

**Response targets:** acknowledgement within 72 hours, an initial assessment within 7 days,
and a fix or mitigation plan communicated before any public disclosure. Please give us a
reasonable window to patch before disclosing publicly. Credit is given in the release notes
unless you prefer to stay anonymous.

## Scope

In scope: authentication and session handling, task ownership isolation, file upload handling,
injection issues, dependency vulnerabilities that are reachable from this code, and secrets
exposure in the repository or build output.

Out of scope: findings that only apply to a misconfigured self-hosted deployment, missing
hardening headers on the demo instance, rate-limit findings on free-tier hosting, social
engineering, and automated scanner output without a demonstrated impact.

## Known limitations of the current design

These are documented trade-offs rather than undisclosed bugs. They are tracked for hardening
work and listed here so nobody has to re-discover them:

- The JWT can be passed as an `access_token` query parameter (a workaround for preview proxies
  that strip `Authorization`); query strings can end up in server and proxy logs.
- The token is kept in browser storage, so it is readable by any successful XSS.
- CORS currently reflects the request origin rather than using a strict allowlist.
- There is no rate limiting on the authentication endpoints yet.
- There is no email verification or refresh-token rotation.

## Handling secrets

Never commit real credentials. `backend/.env` and `frontend/.env.local` are git-ignored;
only the `.env.example` files belong in the repository. If you believe a key was committed,
rotate it first, then report it.
