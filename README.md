# CentralHub

A secure internal launchpad for the team at **The Fay San Jose** (managed by Flow / FOL Property Management). After signing in with a `@flow.life` email, employees see a personalized dashboard of the workplace platforms they use; selecting a platform opens its official URL in a new tab.

CentralHub **never** stores third-party credentials, does **no** SSO, and **never** embeds external platforms in iframes. It is a curated, per-user directory of links with favorites, recently-used, and admin-managed platform CRUD.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, React Router v6, Tailwind CSS, shadcn-style UI, Lucide icons |
| Backend | Node.js + Express (REST) |
| Database | PostgreSQL (Railway) via Prisma ORM |
| Auth | Clerk (React SDK + Express middleware), Clerk Organizations for access control |
| Validation | Zod (server-side) |
| Hosting | Vercel (frontend) · Railway (backend + Postgres) |

## Project Structure

```
centralhub/
├── client/   # React/Vite frontend (see client/.env.example)
├── server/   # Express + Prisma backend (see server/.env.example)
└── tasks/    # todo.md (phased plan) + lessons.md
```

## Authentication & Authorization

- One Clerk Organization, **"The Fay San Jose"**, gates access. Org membership = authorization.
- **Admin authority comes from the Clerk org role only** (`org:admin`). The DB `role` field is a non-authoritative cache synced on login; every `/api/admin/*` route checks the Clerk role server-side.
- First login creates the local user profile and seeds all active platforms as visible. Platforms created **later** are hidden for existing users until they add them via the directory or Customize drawer.

## Local Development

Prerequisites: Node 18+, a PostgreSQL database, and a Clerk application with Organizations enabled.

```bash
# Install
cd server && npm install
cd ../client && npm install

# Configure environment
cp server/.env.example server/.env   # fill in DATABASE_URL, Clerk keys, etc.
cp client/.env.example client/.env   # fill in VITE_CLERK_PUBLISHABLE_KEY

# Database
cd server
npx prisma migrate dev   # creates tables
npm run seed             # seeds 6 categories + 11 platforms (placeholder URLs)

# Run (two terminals)
cd server && npm run dev   # Express on http://localhost:3001
cd client && npm run dev   # Vite on http://localhost:5173
```

The Vite dev server proxies `/api` to `localhost:3001`, so leave `VITE_API_BASE_URL` blank in local dev.

## Environment Variables

**server/.env** — `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `FRONTEND_URL` (required); `ADMIN_CLERK_USER_ID`, `CLERK_ORG_ID`, `PORT` (optional). The server validates required vars on startup and exits with a clear message if any are missing.

**client/.env** — `VITE_CLERK_PUBLISHABLE_KEY` (required); `VITE_API_BASE_URL` (blank in dev, the Railway backend origin in production).

## Deployment

### Backend — Railway
1. Create a Railway project and add a **PostgreSQL** service; copy its connection string to `DATABASE_URL`.
2. Deploy the `server/` directory. Start command: `npm start`.
3. Set env vars: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `ADMIN_CLERK_USER_ID`, `CLERK_ORG_ID`, `FRONTEND_URL` (your Vercel origin).
4. On first deploy run: `npx prisma migrate deploy && npm run seed`.
5. Health check path: `/healthz`.

### Frontend — Vercel
1. Import the `client/` directory. Build command `npm run build`, output `dist`.
2. Set env vars: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_BASE_URL` (your Railway backend origin).
3. `vercel.json` already configures the SPA rewrite (all routes → `index.html`).

## Security Notes

- Clerk JWT verified on every API request; org membership + admin role enforced server-side.
- All platform URLs validated as `https://` on create/update (Zod). Other schemes are rejected.
- External links open with `target="_blank"` and `rel="noopener noreferrer"`.
- CORS restricted to `FRONTEND_URL`; rate limiting on auth-sync and admin routes.
- No third-party credentials are stored anywhere. Placeholder URLs ship in the seed — the admin updates real URLs after deployment.
