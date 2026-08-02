# Lessons

Patterns and corrections captured during the CentralHub build. Reviewed at session start.

## Project constraints (from spec)
- **Never invent** external platform URLs (use `https://example.com/...`), third-party credentials, API keys, or SSO capabilities.
- **Not Next.js** — separate React/Vite client + Express server.
- Admin authority is **Clerk org role only**, never the DB `role` field.
- New platforms are **hidden** for existing users (no preference row = not visible).

## Corrections
_(append as the user gives feedback: what happened, the rule to prevent recurrence)_
