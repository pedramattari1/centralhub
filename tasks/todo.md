# CentralHub — Implementation Todo

Workflow per `CLAUDE.md`: plan first, verify before done, capture lessons in `tasks/lessons.md`.

## Locked decisions
- Admin authority = **Clerk org role only** (DB `role` is a non-authoritative cache).
- New platforms are **hidden** for existing users (missing preference row = not visible). First login seeds all-visible.
- Build **everything in full**: category management UI, user role-change UI, and AdminAuditLog all included.
- Placeholder URLs (`https://example.com/...`) in seed. Never invent real URLs/keys/SSO.

---

## Phase 1 — Foundation
- [ ] Scaffold `client/` (Vite + React 18) and `server/` (Express) directories
- [ ] Client: Tailwind CSS + React Router v6 + Clerk React SDK
- [ ] Server: Express + Prisma + Clerk Express SDK + Zod + express-rate-limit + CORS
- [ ] Prisma schema (User, Platform, Category, UserPlatformPreference, RecentlyUsedPlatform, AdminAuditLog)
- [ ] Auth middleware chain: clerkAuth → requireAuth → requireAdmin → validateRequest
- [ ] `.env.example` in both dirs; fail-fast env validation on server startup
- [ ] `GET /healthz` endpoint
- [ ] **Verify:** server starts, client starts, Clerk sign-in renders

## Phase 2 — Data Layer
- [ ] Seed script: 6 categories, 11 platforms (placeholder URLs), optional admin from `ADMIN_CLERK_USER_ID`
- [ ] Routes: `GET /api/me`, `GET /api/platforms`, `GET /api/categories`
- [ ] `POST /api/auth/sync` — create user + seed all-visible preferences on first login
- [ ] **Verify:** seed loads, API returns platforms, first login creates user + prefs

## Phase 3 — Admin
- [ ] Platform CRUD routes w/ Zod (https-only URL), soft-delete (`isActive: false`)
- [ ] User routes: list, deactivate, change role
- [ ] Category CRUD routes
- [ ] AdminAuditLog helper written on all mutations
- [ ] Admin UI: platform list, create/edit form, user list (role toggle + deactivate), category management
- [ ] **Verify:** admin CRUD works; non-admin API call → 403; bad `http://` URL rejected

## Phase 4 — Dashboard
- [ ] Layout: sidebar, greeting, search bar
- [ ] `PlatformCard`: icon, name, description, favorite star, Open CTA, whole-card click
- [ ] Open action: fire recently-used + open URL in new tab (`rel="noopener noreferrer"`)
- [ ] Favorites row (only if favorites exist)
- [ ] Recently-used row (max 5, only if history exists)
- [ ] Client-side search across name/description/keywords
- [ ] **Verify:** cards open correct URLs; favorites + recently-used persist across reload

## Phase 5 — Customize Drawer
- [ ] Right slide-over drawer, category-grouped toggle list
- [ ] Per-toggle auto-save (`PUT /api/preferences/:platformId`) + toast
- [ ] Drawer search
- [ ] Reset to Defaults (`POST /api/preferences/reset`)
- [ ] A11y: focus trap, Esc to close, role="dialog", aria-modal
- [ ] **Verify:** toggles persist; dashboard updates live

## Phase 6 — Platform Directory
- [ ] `/platforms` page: all active platforms
- [ ] Category filter + search
- [ ] "Add to Dashboard" quick action
- [ ] **Verify:** adding from directory flips preference

## Phase 7 — Polish
- [ ] Empty states (favorites, recently-used, all-hidden, no search results, admin empties)
- [ ] Loading skeletons; error states + error boundary
- [ ] Responsive at 1024 / 768 / 375
- [ ] A11y audit: keyboard nav, focus rings, ARIA, skip-to-content link
- [ ] `/unauthorized` page
- [ ] Settings page (profile display + sign-out)
- [ ] Sidebar navigation active states
- [ ] **Verify:** all states render, keyboard-navigable, responsive

## Phase 8 — Deploy & Document
- [ ] `vercel.json` SPA rewrite
- [ ] Test production build locally
- [ ] README (setup + deployment)
- [ ] Final verification of all user flows
- [ ] **Verify:** client + server build cleanly

---

## Review

### Completed (code) — 2026-08-01
All eight phases are implemented in code and verified as far as is possible without live Clerk + Postgres credentials:

- **Server** (`server/`): Express app with the full middleware chain (`clerkAuth` → `requireAuth` → `requireAdmin` → `validateRequest`), all routes (auth/sync, me, platforms, categories, preferences, recently-used, admin CRUD for platforms/users/categories), Zod schemas with https-only URL enforcement, AdminAuditLog helper on all mutations, rate limiting, CORS, fail-fast env validation, `/healthz`. Prisma schema + seed (6 categories, 11 platforms, placeholder URLs, optional admin).
  - **Verified:** `npx prisma validate` passes, `npm run lint` clean (0 errors), server boots, `/healthz` returns `{status:"ok"}`, fail-fast env check fires, unauthenticated API returns 401 with real keys.
- **Client** (`client/`): Vite/React/Tailwind/Router, Clerk provider, protected + admin route guards, AppShell (sidebar, mobile nav, skip link), central `useAppData` provider, dashboard (greeting/search/favorites/recently-used/grid), PlatformCard, Customize drawer (Radix Dialog — focus trap/Esc/ARIA), directory, settings, unauthorized page, all three admin pages, toast system, skeletons, error boundary, empty states.
  - **Verified:** `npm run lint` clean (0 errors, 2 benign fast-refresh warnings), `npm run build` succeeds.

### Still requires live credentials (blocked on user setup)
- [ ] Run initial migration: `npx prisma migrate dev` (needs `DATABASE_URL`)
- [ ] Run seed against the real DB
- [ ] End-to-end manual flows: sign-in → dashboard, open card → new tab + recently-used, drawer toggles persist, admin CRUD, non-admin → 403, non-member → `/unauthorized`
- [ ] Responsive spot-check at 1024/768/375
- [ ] Deploy to Railway + Vercel and set production env vars

### Notes
- Admin role-change UI updates the DB cache only; authoritative admin status is the Clerk org role (change real roles in the Clerk dashboard). Documented in `server/src/routes/admin.js`.
- Placeholder URLs (`https://example.com/<slug>`) ship in the seed per spec; admin updates real URLs post-deploy.
