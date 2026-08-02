# CentralHub — Claude Code Implementation Prompt

> **Follow the CLAUDE.md workflow orchestration file in the repository root for all planning, task management, subagent strategy, verification, and self-improvement patterns.**

---

## 1. What You Are Building

CentralHub is a secure internal web application for the team at The Fay San Jose, a 336-unit luxury high-rise residential property managed by FOL Property Management LLC (Flow). The property recently transitioned to Flow and now uses many separate platforms. Employees must track numerous websites, URLs, and login processes across unfamiliar systems. CentralHub becomes their single starting point.

After signing in, an employee sees a personalized dashboard of the workplace platforms they use. Selecting a platform opens the official external URL in a new browser tab. CentralHub never stores third-party credentials, never embeds external platforms in iframes, and never pretends to provide single sign-on.

This is an internal operational tool, but it should feel like a thoughtfully designed product appropriate for a luxury property team.

---

## 2. Before You Start

**Inspect the existing repository.** Check for any existing files, folder structure, dependencies, or configuration before scaffolding. Do not overwrite existing work without understanding it.

**Read the CLAUDE.md** file in the repository root. Follow its workflow orchestration, task management, plan-first approach, subagent strategy, verification requirements, and core principles throughout the entire build.

**Create `tasks/todo.md`** with the phased implementation plan from Section 18 of this prompt, broken into checkable items. Check in before starting implementation.

**Do not invent:**
- External platform URLs (use placeholder `https://example.com/platform-name` values in seed data)
- Third-party credentials or API keys
- SSO capabilities that do not exist
- Features not specified in this prompt

---

## 3. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React 18+ with Vite | SPA, client-side routing |
| Routing | React Router v6 | |
| Styling | Tailwind CSS | |
| UI Components | shadcn/ui (manually copied components, not npm) | Accessible, keyboard-navigable |
| Icons | Lucide React | Supplement with custom SVG for platform logos where appropriate |
| Backend | Node.js with Express | REST API |
| Database | PostgreSQL | Hosted on Railway |
| ORM | Prisma | |
| Authentication | Clerk (React SDK + Express middleware) | Clerk Organizations for access control |
| Validation | Zod | Server-side input validation on all API routes |
| Frontend Hosting | Vercel | |
| Backend Hosting | Railway | |

**Do not use Next.js.** This project uses a separate React/Vite frontend and Express backend, consistent with the team's existing tooling.

---

## 4. Project Structure

```
centralhub/
├── client/                    # React/Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── layout/        # Sidebar, TopBar, Shell
│   │   │   ├── dashboard/     # PlatformCard, PlatformGrid, RecentlyUsed
│   │   │   ├── platforms/     # PlatformDirectory, CustomizeDrawer
│   │   │   ├── admin/         # PlatformForm, UserManagement
│   │   │   └── auth/          # ProtectedRoute, AdminRoute, UnauthorizedPage
│   │   ├── hooks/             # useAuth, usePlatforms, usePreferences
│   │   ├── lib/               # API client, utils, constants
│   │   ├── pages/             # Route-level page components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── server/                    # Express backend
│   ├── src/
│   │   ├── routes/            # auth, platforms, preferences, admin, users
│   │   ├── middleware/        # clerkAuth, requireAdmin, validateRequest
│   │   ├── services/          # Business logic layer
│   │   ├── lib/               # Prisma client, utils, seed helpers
│   │   └── index.js           # Express app entry
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   └── package.json
├── tasks/
│   ├── todo.md
│   └── lessons.md
├── CLAUDE.md
├── .env.example
└── README.md
```

---

## 5. Authentication & Authorization

### Clerk Organizations

- Create one Clerk Organization: **"The Fay San Jose"**
- Only @flow.life email addresses may be invited
- Organization membership = authorization to use CentralHub
- Admin role is assigned through Clerk's org role system
- Single admin: the project owner (Pedram)

### Auth Flow

1. User visits CentralHub → Clerk sign-in page
2. User signs in with @flow.life email
3. Clerk verifies the email
4. Express middleware checks Clerk org membership via `clerkClient.organizations`
5. If not a member → redirect to `/unauthorized` page
6. If member → check if CentralHub user profile exists in DB
7. If first login → create user profile, seed all platforms as visible (all toggled on), redirect to dashboard
8. If returning → load dashboard with saved preferences

### Middleware Requirements

```
clerkAuth          → Verifies Clerk JWT on every API request
requireAuth        → Rejects if not authenticated or not org member
requireAdmin       → Rejects if Clerk org role is not "admin"
validateRequest    → Zod schema validation on request body
```

**Server-side enforcement is mandatory.** Hiding admin UI elements is not sufficient security. Every admin API route must check the role server-side.

### Edge Cases to Handle

- Valid @flow.life email but not invited to org → Unauthorized page with "Contact your administrator" message
- Personal email (gmail, etc.) → Clerk sign-in rejects or Unauthorized page
- Admin removes user from org → User loses access on next request; existing sessions should be invalidated
- Duplicate Clerk accounts → Clerk handles this; CentralHub links to clerkUserId
- User's role changes → Reflected immediately via Clerk org role check

### Unauthorized Page (`/unauthorized`)

Clean page explaining:
- "You don't have access to CentralHub"
- "Contact your administrator to request access"
- Sign-out button
- No details about who the admin is or how the system works internally

---

## 6. Database Schema (Prisma)

```prisma
model User {
  id                  String    @id @default(cuid())
  clerkUserId         String    @unique
  email               String    @unique
  displayName         String?
  role                Role      @default(MEMBER)
  isActive            Boolean   @default(true)
  onboardingComplete  Boolean   @default(true)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  preferences         UserPlatformPreference[]
  recentlyUsed        RecentlyUsedPlatform[]
}

model Platform {
  id              String    @id @default(cuid())
  name            String
  slug            String    @unique
  description     String
  url             String
  iconName        String    // Lucide icon name or custom identifier
  categoryId      String
  category        Category  @relation(fields: [categoryId], references: [id])
  displayOrder    Int       @default(0)
  isActive        Boolean   @default(true)
  isFeatured      Boolean   @default(false)
  searchKeywords  String[]  // Array of additional search terms
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  preferences     UserPlatformPreference[]
  recentlyUsed    RecentlyUsedPlatform[]
}

model Category {
  id           String     @id @default(cuid())
  name         String     @unique
  slug         String     @unique
  displayOrder Int        @default(0)
  platforms    Platform[]
}

model UserPlatformPreference {
  id          String   @id @default(cuid())
  userId      String
  platformId  String
  isVisible   Boolean  @default(true)
  isFavorite  Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  platform    Platform @relation(fields: [platformId], references: [id], onDelete: Cascade)

  @@unique([userId, platformId])
}

model RecentlyUsedPlatform {
  id          String   @id @default(cuid())
  userId      String
  platformId  String
  usedAt      DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  platform    Platform @relation(fields: [platformId], references: [id], onDelete: Cascade)

  @@unique([userId, platformId])
  @@index([userId, usedAt(sort: Desc)])
}

model AdminAuditLog {
  id           String   @id @default(cuid())
  adminUserId  String
  action       String   // e.g., "PLATFORM_CREATED", "USER_REMOVED", "PLATFORM_UPDATED"
  targetType   String   // e.g., "Platform", "User"
  targetId     String?
  metadata     Json?    // Additional context
  createdAt    DateTime @default(now())
}

enum Role {
  ADMIN
  MEMBER
}
```

### Data Rules

- `User.clerkUserId` is the foreign key to Clerk. Do not duplicate Clerk-managed fields unnecessarily.
- `User.email` is stored for display/search convenience but Clerk is the source of truth.
- `UserPlatformPreference` is a single join table handling both visibility and favorites.
- `RecentlyUsedPlatform` stores the last access timestamp per user-platform pair. Upsert on each platform open. Query the 5 most recent.
- `AdminAuditLog` is append-only. No UI for this in MVP — it's for backend traceability.
- When a new user is created, seed `UserPlatformPreference` entries for ALL active platforms with `isVisible: true` and `isFavorite: false`.
- When admin deactivates a platform, it disappears from dashboards but preferences are preserved (in case it's reactivated).

---

## 7. API Routes

### Public
```
POST   /api/auth/sync              # Called on first login to create/sync user profile
```

### Authenticated (requireAuth)
```
GET    /api/me                     # Current user profile
GET    /api/platforms              # All active platforms (for directory/browse)
GET    /api/preferences            # User's platform preferences
PUT    /api/preferences/:platformId  # Toggle visibility or favorite for one platform
POST   /api/preferences/reset      # Reset to all-visible defaults
GET    /api/recently-used          # User's 5 most recently opened platforms
POST   /api/recently-used/:platformId  # Record a platform open
GET    /api/categories             # All categories
```

### Admin (requireAdmin)
```
GET    /api/admin/platforms        # All platforms including inactive
POST   /api/admin/platforms        # Create platform
PUT    /api/admin/platforms/:id    # Update platform
DELETE /api/admin/platforms/:id    # Soft-delete (set isActive: false)
GET    /api/admin/users            # All CentralHub users
PUT    /api/admin/users/:id/role   # Change user role
DELETE /api/admin/users/:id        # Deactivate user
POST   /api/admin/categories       # Create category
PUT    /api/admin/categories/:id   # Update category
```

### Validation Rules (Zod)

- Platform URL: must be valid `https://` URL. Reject `http://`, `javascript:`, `data:`, `ftp://`, and any non-https scheme.
- Platform name: 1–100 characters, trimmed
- Platform slug: auto-generated from name, lowercase alphanumeric with hyphens
- Description: 1–500 characters
- Search keywords: array of strings, max 20 items, each max 50 characters
- Category name: 1–50 characters
- All IDs validated as non-empty strings

---

## 8. Pages & Routes

```
/sign-in             → Clerk sign-in (ClerkSignIn component)
/unauthorized        → Access denied page
/                    → Dashboard ("My Platforms") — protected
/platforms           → Browse all approved platforms — protected
/settings            → Profile & preferences — protected
/admin/platforms     → Platform management — admin only
/admin/platforms/new → Create platform — admin only
/admin/platforms/:id → Edit platform — admin only
/admin/users         → User management — admin only
```

### Protected Route Behavior

- Not authenticated → redirect to `/sign-in`
- Authenticated but not org member → redirect to `/unauthorized`
- Authenticated member accessing `/admin/*` without admin role → redirect to `/`
- All redirects happen client-side via React Router with server-side enforcement on API calls

---

## 9. User Flows

### Flow 1: First Login
1. Employee receives Clerk org invitation email
2. Employee clicks invitation link, creates Clerk account with @flow.life email
3. Employee lands on CentralHub → frontend calls `POST /api/auth/sync`
4. Backend creates User record + seeds UserPlatformPreference for all active platforms (all visible)
5. Employee sees dashboard with all platforms displayed
6. Employee can immediately customize, favorite, or open platforms

### Flow 2: Returning User Dashboard
1. Employee signs in → lands on `/`
2. Dashboard loads: favorites section (if any), recently used section (up to 5), then main platform grid
3. Main grid shows only platforms where `isVisible: true` in preferences
4. Employee clicks a platform card → `POST /api/recently-used/:platformId` fires → new tab opens with platform URL
5. Dashboard state persists across devices via database

### Flow 3: Customize Dashboard
1. Employee clicks "Customize Dashboard" button
2. Right-side drawer slides open
3. Drawer shows all active platforms grouped by category
4. Search field at top filters platforms in real-time
5. Each platform has a toggle switch (on = visible on dashboard)
6. Each change auto-saves via `PUT /api/preferences/:platformId`
7. Subtle toast confirms save
8. Dashboard updates behind the drawer in real-time
9. "Reset to Defaults" link at bottom restores all platforms to visible

### Flow 4: Admin Creates Platform
1. Admin navigates to `/admin/platforms` → clicks "Add Platform"
2. Form: name, description, URL (https only), icon selection, category, display order, search keywords
3. Submit → `POST /api/admin/platforms` with Zod validation
4. Platform appears in directory for all users
5. New platform is NOT auto-added to existing users' dashboards (they discover it via "Customize Dashboard" or the directory)
6. Audit log entry created

### Flow 5: Admin Manages Users
1. Admin navigates to `/admin/users`
2. Sees list of all CentralHub users with email, role, status, join date
3. Admin can deactivate a user (sets `isActive: false`)
4. Admin can change role (but only one admin exists for MVP, so this is future-proofing)
5. Actual invitation/removal from the Clerk org happens in Clerk dashboard — CentralHub reflects the state

---

## 10. Seed Data

Create a seed script (`server/prisma/seed.js`) that populates the database with the following platforms. **Use placeholder URLs** (`https://example.com/platform-name`). The admin will update URLs after deployment.

### Categories
| Category | Slug | Order |
|---|---|---|
| Property Management | property-management | 1 |
| Leasing | leasing | 2 |
| Communication | communication | 3 |
| Resident Services | resident-services | 4 |
| Operations | operations | 5 |
| HR & Payroll | hr-payroll | 6 |

### Platforms

| Name | Category | Icon (Lucide) | Description | Search Keywords | CTA |
|---|---|---|---|---|---|
| Waves | Property Management | `Building2` | Property management system for unit tracking, work orders, and resident accounts | property management, units, work orders, maintenance, residents, PMS | Open Waves |
| Lease Flow | Leasing | `FileText` | Leasing platform for applications, lease agreements, and prospect management | leasing, applications, lease, prospects, renewals, move-in | Open Lease Flow |
| Leasing Messages | Leasing | `MessageSquare` | Messaging platform for leasing prospect communication | messages, prospects, leads, inquiries, leasing communication, texts | Open Messages |
| Zendesk | Communication | `Headphones` | Support ticket system for resident requests and issue tracking | support, tickets, help desk, resident requests, issues, service | Open Zendesk |
| HubSpot | Leasing | `Target` | CRM for lead tracking, marketing, and prospect engagement | CRM, leads, marketing, prospects, pipeline, outreach, campaigns | Open HubSpot |
| Parking Log | Operations | `Car` | Parking spot management and vehicle registration tracking | parking, vehicles, spots, garage, registration, towing | Open Parking Log |
| ButterflyMX | Resident Services | `DoorOpen` | Access control for building entry, visitor management, and garage access | access, entry, doors, visitors, garage, guest, buzzer, intercom | Open ButterflyMX |
| Gmail | Communication | `Mail` | Flow team email for internal and external communication | email, mail, inbox, messages, correspondence | Open Gmail |
| Slack | Communication | `Hash` | Team messaging and collaboration workspace | chat, messaging, channels, team, collaboration, instant message | Open Slack |
| Foxen | Operations | `Shield` | Insurance compliance and renter's insurance verification | insurance, compliance, renter's insurance, verification, coverage | Open Foxen |
| Rippling | HR & Payroll | `Users` | HR, payroll, benefits, and employee management platform | HR, payroll, benefits, time off, PTO, onboarding, employee, pay | Open Rippling |

### Seed Admin User

The seed script should also check for the admin user. If the admin's Clerk user ID is provided via environment variable (`ADMIN_CLERK_USER_ID`), create the User record with `role: ADMIN`.

---

## 11. UI & Design Direction

### Visual Identity

- **Modern, clean, calm, premium.** This is for a luxury property team — not a generic admin template.
- Neutral color palette: soft whites, light grays, one accent color (consider a refined blue or teal)
- Minimal shadows, clean borders, generous whitespace
- Inter or similar clean sans-serif font via Google Fonts
- CentralHub wordmark in the sidebar — clean text treatment, no complex logo needed

### Layout

- **Compact sidebar** (collapsible on smaller screens): CentralHub wordmark, navigation links (My Platforms, All Platforms, Settings, Admin section if admin), user profile/sign-out at bottom
- **Main content area**: personalized greeting ("Good morning, Pedram"), search bar, Favorites row (horizontal scroll if needed), Recently Used row (up to 5, horizontal), main platform grid
- **Responsive**: sidebar collapses to hamburger on tablet/mobile; platform grid reflows to fewer columns

### Platform Card Design

```
┌──────────────────────────┐
│  [Icon]  Platform Name   │
│                          │
│  Brief description text  │
│  that fits in two lines  │
│                          │
│  ★ Favorite    [Open →]  │
└──────────────────────────┘
```

- Clean card with subtle border or shadow
- Platform icon (Lucide) at top-left with platform name
- 1-2 line description
- Favorite toggle (star) at bottom-left
- Primary CTA button at bottom-right (e.g., "Open Waves")
- Clicking the CTA: fires recently-used tracking, opens URL in new tab with `rel="noopener noreferrer"`
- Clicking the card itself (outside the CTA) should also open the platform — the whole card is the primary interaction
- Hover state: subtle elevation or border color change

### Dashboard Sections (top to bottom)

1. **Greeting + Search**: "Good morning, [Name]" with a search bar to the right
2. **Favorites**: Horizontal row of favorited platform cards (compact variant — icon + name + open). Only shows if user has favorites.
3. **Recently Used**: Horizontal row of up to 5 recently opened platforms (compact variant). Only shows if user has history.
4. **My Platforms**: Main grid of all visible platforms, sorted by category then display order. 3 columns on desktop, 2 on tablet, 1 on mobile.
5. **Customize Dashboard**: Persistent button/link at bottom of the grid or in a fixed position

### Customize Dashboard Drawer

- Slides in from the right, ~400px wide on desktop
- Header: "Customize Dashboard" with close button
- Search input at top
- Platforms grouped by category with category headers
- Each platform: icon, name, short description, toggle switch
- Toggle on = visible on dashboard. Toggle off = hidden.
- Auto-save each toggle change with subtle toast
- "Reset to Defaults" link at bottom (restores all to visible)
- Drawer has backdrop overlay; clicking outside closes it
- Accessible: focus trap, Escape to close, proper ARIA attributes

### Empty States

- **No favorites yet**: "Star your most-used platforms for quick access" (in the favorites row area)
- **No recently used**: Don't show the section at all
- **All platforms hidden**: "Your dashboard is empty. Click 'Customize Dashboard' to add platforms."
- **Search no results**: "No platforms match your search."
- **Admin: no platforms**: "No platforms yet. Add your first platform."
- **Admin: no users**: Should not happen (admin is a user), but handle gracefully

### Loading States

- Skeleton cards while dashboard loads
- Skeleton list while drawer loads
- Button loading spinner for admin form submissions

### Error States

- API error on dashboard: "Something went wrong loading your platforms. Try refreshing."
- API error on preference save: Toast error "Couldn't save your change. Try again."
- API error on admin action: Inline error message on the form

---

## 12. Accessibility Requirements

- All interactive elements keyboard-navigable
- Visible focus rings (use Tailwind's `focus-visible:ring-2`)
- Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI elements)
- Drawer: focus trap when open, Escape to close, `role="dialog"`, `aria-modal="true"`
- Toggle switches: proper `role="switch"`, `aria-checked` state
- Cards: `role="link"` or wrapped in `<a>` with descriptive `aria-label`
- Icons: decorative icons get `aria-hidden="true"`, functional icons get `aria-label`
- Form inputs: associated `<label>` elements
- Toast notifications: `role="status"`, `aria-live="polite"`
- Skip-to-content link

---

## 13. Security Requirements

### Authentication & Authorization
- Clerk JWT verification on every Express API route via Clerk Express middleware
- Org membership check on every authenticated route
- Admin role check on every `/api/admin/*` route — server-side, not client-only
- `isActive: false` users are rejected even with valid Clerk session

### Input Validation
- Zod validation on all POST/PUT request bodies
- Platform URLs must be `https://` — reject all other schemes
- Sanitize all user-provided strings (names, descriptions, keywords)
- Validate all route parameter IDs

### External Links
- All external platform links open with `target="_blank"` and `rel="noopener noreferrer"`
- Platform URLs stored in DB are validated on write (admin creation/update)

### Secrets & Configuration
- No secrets in source control
- `.env.example` with all required variable names (no values)
- Environment variables: `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `ADMIN_CLERK_USER_ID`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`
- Validate that required env vars are present on server startup; fail fast with clear error if missing

### Other
- CORS configured to allow only the Vercel frontend origin
- Rate limiting on auth sync and admin mutation routes (express-rate-limit)
- No storage of third-party passwords or credentials — ever
- Clerk webhook secret validation if webhooks are used (optional for MVP)

---

## 14. Responsive Behavior

| Breakpoint | Sidebar | Platform Grid | Card Size |
|---|---|---|---|
| Desktop (≥1024px) | Visible, 240px | 3 columns | Standard |
| Tablet (768–1023px) | Collapsed, hamburger | 2 columns | Standard |
| Mobile (<768px) | Collapsed, hamburger | 1 column | Full-width |

- Customize Drawer: full-width overlay on mobile, 400px slide-over on desktop
- Favorites/Recently Used rows: horizontal scroll on all sizes
- Admin tables: horizontal scroll on mobile, responsive cards if feasible
- Touch targets: minimum 44px on mobile

---

## 15. Testing Strategy

### Required Before MVP Completion

- **Auth flow**: Sign in → org member → dashboard loads. Non-member → unauthorized.
- **Admin routes**: Authenticated non-admin → 403. Admin → success.
- **Platform CRUD**: Create, update, deactivate. Verify Zod validation rejects bad URLs.
- **Preferences**: Toggle visibility, toggle favorite, verify persistence across reload.
- **Recently used**: Open platform, verify it appears in recently used, verify max 5.
- **New user seeding**: First login creates user + all platforms visible.
- **Responsive**: Check dashboard at 1024px, 768px, 375px widths.

### Verification Commands (add to tasks/todo.md)

```bash
# Backend
cd server && npm run lint
cd server && npx prisma validate
cd server && npx prisma db push --dry-run
cd server && npm test  # if tests written

# Frontend
cd client && npm run lint
cd client && npm run build  # verify production build succeeds
cd client && npm run preview  # verify build runs

# Full stack
# Start both server and client, verify:
# - Sign in flow works
# - Dashboard loads with seed data
# - Platform cards open correct URLs in new tab
# - Customize drawer toggles work
# - Admin can access /admin routes
# - Non-admin cannot access /admin API routes
```

---

## 16. Deployment

### Frontend (Vercel)

- Connect the `client/` directory to Vercel
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`
- Vercel rewrites: all routes → `index.html` (SPA behavior — configure in `vercel.json`)

### Backend (Railway)

- Connect the `server/` directory to Railway
- Start command: `npm start`
- Add PostgreSQL service on Railway
- Environment variables: `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `ADMIN_CLERK_USER_ID`, `FRONTEND_URL` (for CORS)
- Run `npx prisma migrate deploy` and `npx prisma db seed` on first deploy

### Local Development

Provide a clear README with:
```bash
# Clone and install
git clone <repo>
cd centralhub/server && npm install
cd ../client && npm install

# Set up environment
cp server/.env.example server/.env
cp client/.env.example client/.env
# Fill in Clerk keys, DATABASE_URL, etc.

# Database
cd server && npx prisma migrate dev
cd server && npx prisma db seed

# Run
cd server && npm run dev   # Express on port 3001
cd client && npm run dev   # Vite on port 5173
```

---

## 17. Documentation Requirements

- `README.md` in root: project overview, tech stack, setup instructions, deployment guide
- `.env.example` in both `server/` and `client/` with every required variable listed and described
- `server/prisma/seed.js` well-commented
- Inline comments on non-obvious logic (auth middleware chain, preference seeding on first login)

---

## 18. Phased Implementation Plan

### Phase 1: Foundation
- [ ] Scaffold project structure (client + server directories)
- [ ] Initialize Vite + React + Tailwind + React Router in client
- [ ] Initialize Express + Prisma in server
- [ ] Configure Clerk in both client and server
- [ ] Create Prisma schema and run initial migration
- [ ] Build auth middleware chain (clerkAuth → requireAuth → requireAdmin)
- [ ] Create `.env.example` files
- [ ] Verify: server starts, client starts, Clerk sign-in works

### Phase 2: Data Layer
- [ ] Write seed script with all 11 platforms, 6 categories
- [ ] Build API routes: `/api/me`, `/api/platforms`, `/api/categories`
- [ ] Build first-login sync: `POST /api/auth/sync` creates user + seeds preferences
- [ ] Verify: seed data loads, API returns platforms, new user created on first login

### Phase 3: Admin
- [ ] Build admin platform CRUD routes with Zod validation
- [ ] Build admin user list route
- [ ] Build admin UI pages: platform list, create/edit form, user list
- [ ] Add AdminAuditLog entries on mutations
- [ ] Verify: admin can create/edit/deactivate platforms, non-admin gets 403

### Phase 4: Dashboard
- [ ] Build dashboard page layout: greeting, search, favorites, recently used, platform grid
- [ ] Build PlatformCard component with icon, name, description, favorite toggle, CTA
- [ ] Wire up platform open: tracking recently used + new tab
- [ ] Build favorites row (shows only if user has favorites)
- [ ] Build recently used row (shows only if user has history)
- [ ] Build search filtering (client-side filter across name, description, keywords)
- [ ] Verify: dashboard loads, cards work, favorites persist, recently used updates

### Phase 5: Customize Dashboard
- [ ] Build right-side drawer component
- [ ] Build platform toggle list grouped by category
- [ ] Wire auto-save on toggle with toast confirmation
- [ ] Build drawer search
- [ ] Build "Reset to Defaults" action
- [ ] Verify: drawer opens/closes, toggles persist, dashboard updates in real-time

### Phase 6: Platform Directory
- [ ] Build `/platforms` page showing all active platforms
- [ ] Category filtering and search
- [ ] "Add to Dashboard" quick action from directory
- [ ] Verify: directory shows all platforms, search works, adding from directory updates preferences

### Phase 7: Polish
- [ ] Empty states for all sections
- [ ] Loading skeletons
- [ ] Error states and error boundaries
- [ ] Responsive behavior at all breakpoints
- [ ] Accessibility audit: keyboard nav, focus states, ARIA
- [ ] Unauthorized page
- [ ] Settings page (basic profile display, sign-out)
- [ ] Sidebar navigation with active states
- [ ] Verify: all states render correctly, keyboard-navigable, responsive

### Phase 8: Deploy & Document
- [ ] Create `vercel.json` with SPA rewrite
- [ ] Test production build locally
- [ ] Write README with setup and deployment instructions
- [ ] Final verification of all user flows
- [ ] Verify: both client and server build cleanly

---

## 19. Acceptance Criteria

The MVP is complete when:

1. ✅ An invited @flow.life employee can sign in and see their personalized dashboard
2. ✅ A non-invited user or non-@flow.life email is blocked with a clean unauthorized page
3. ✅ The dashboard shows all 11 seed platforms on first login
4. ✅ Users can favorite platforms and see them in a dedicated favorites section
5. ✅ Opening a platform records it in "recently used" (up to 5 shown)
6. ✅ Clicking a platform card opens the correct URL in a new tab with safe link attributes
7. ✅ The Customize Dashboard drawer lets users toggle platform visibility with auto-save
8. ✅ The platform directory page shows all active platforms with search and category filtering
9. ✅ Preferences persist across devices and browsers (database-backed)
10. ✅ The admin can create, edit, and deactivate platforms via admin pages
11. ✅ The admin can view users via admin pages
12. ✅ Admin API routes reject non-admin users with 403
13. ✅ All platform URLs are validated as https:// on creation and edit
14. ✅ The interface is responsive (desktop, tablet, mobile)
15. ✅ Keyboard navigation works throughout
16. ✅ All empty, loading, and error states are handled
17. ✅ No third-party credentials are stored anywhere
18. ✅ Environment variables are documented in `.env.example`
19. ✅ The project builds without errors
20. ✅ README contains setup, development, and deployment instructions

---

## 20. What NOT to Build

- ❌ Single sign-on with any external platform
- ❌ Password storage or autofill for external platforms
- ❌ Iframe embedding of external platforms
- ❌ Account creation in external platforms
- ❌ AI assistant or AI-powered search
- ❌ Notifications or announcements
- ❌ Multi-property support (architecture should not block it, but don't build it)
- ❌ Drag-and-drop platform ordering
- ❌ Browser extensions
- ❌ Native mobile apps
- ❌ Usage analytics dashboard
- ❌ Onboarding walkthrough or tour
- ❌ User-submitted custom platforms
- ❌ Complex workflow automation
