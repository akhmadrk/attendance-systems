# Frontend Architecture & Flow

> Employee WFH Attendance & HRD Monitoring System — Frontend Layer

This document explains the architecture, conventions, and runtime flow of the two
frontend applications in this repository. It describes what exists in the code as
written (not an aspirational target).

---

## 1. Overview

The frontend is composed of **two independent React single-page applications (SPAs)**
that share the same design conventions but are fully decoupled from each other.

| App | Path | Port | Audience | Purpose |
|:---|:---|:---|:---|:---|
| `apps/employee-web` | `apps/employee-web` | `3100` | Employees | Login, profile, clock in/out, attendance summary |
| `apps/admin-web` | `apps/admin-web` | `3101` | HRD admins | Employee CRUD, attendance monitoring, audit logs, real-time alerts |

Both apps are **plain Vite projects** living inside the pnpm/Nx monorepo. They are
*not* Nx-managed apps — they are run via pnpm workspace filter scripts
(`pnpm --filter <app> dev`), not `nx serve`.

The two apps share:

- The same **technology stack** (React + Vite + Tailwind + axios).
- The same **folder structure** and layering conventions (`api/`, `auth/`,
  `components/`, `pages/`).
- The same **authentication model** (JWT access + refresh tokens in `localStorage`).

They differ in:

- **Token storage keys** (separate `localStorage` keys, so sessions don't collide).
- **Backend endpoints** they target (employee vs. HRD admin APIs).
- **Real-time capability** (only `admin-web` uses Socket.IO).

---

## 2. Technology Stack

| Concern | Technology | Notes |
|:---|:---|:---|
| UI framework | React 19 | Function components + hooks only, no class components |
| Language | TypeScript | `vite` + `@vitejs/plugin-react` (esbuild transpile, no `tsc` in build) |
| Build tool | Vite | `dev`, `build`, `preview` scripts only |
| Styling | Tailwind CSS 3.4 | `postcss` + `autoprefixer`, no CSS framework mixed in |
| Routing | `react-router-dom` 7 | Uses the classic `BrowserRouter`/`Routes`/`Route` API |
| HTTP | `axios` 1.x | Single shared instance with interceptors |
| Real-time | `socket.io-client` | `admin-web` only |
| State management | React Context + hooks | No Redux/Zustand/React Query |

Dependencies are hoisted to the root `package.json` (the frontend `package.json`
files contain only `name`/`scripts`). Notable frontend deps: `react@^19`,
`react-dom@^19`, `react-router-dom@^7`, `axios`, `vite@^8`, `tailwindcss@^3.4`,
`socket.io-client`.

---

## 3. Directory Structure

Both apps follow the same layout. The structure below is for `employee-web`;
`admin-web` is identical except for the extra `notifications/` folder and
different page names.

```
apps/<app>/
├── index.html                 # Vite entry HTML (mounts #root, loads /src/main.tsx)
├── vite.config.ts             # Port + dev-server proxy to backend services
├── tailwind.config.js         # Tailwind content globs + theme (empty extend)
├── postcss.config.js          # tailwindcss + autoprefixer
├── tsconfig.json
└── src/
    ├── main.tsx               # React root: mounts provider stack + <App/>
    ├── App.tsx                # Route table (public + protected routes)
    ├── index.css              # Tailwind directives
    ├── api/
    │   ├── client.ts          # axios instance + token interceptors (auth core)
    │   ├── types.ts           # Shared TS interfaces for API/DTO shapes
    │   └── <domain>-api.ts    # Typed API functions (one file per domain)
    ├── auth/
    │   ├── AuthContext.tsx    # isAuthenticated state provider
    │   └── ProtectedRoute.tsx # Route guard (redirects to /login)
    ├── components/
    │   └── Layout.tsx         # App shell (header + nav + <Outlet/>)
    ├── notifications/         # admin-web ONLY
    │   └── NotificationContext.tsx  # Socket.IO connection + notification state
    └── pages/                 # One file per route
        ├── LoginPage.tsx
        └── <Feature>Page.tsx
```

---

## 4. Layering & Responsibilities

The code follows a strict **unidirectional layering**, from UI down to network:

```text
pages/  ──▶  api/<domain>-api.ts  ──▶  api/client.ts  ──▶  backend
  │                                        │
  │ (read/write)                           │ (attaches Bearer token,
  ▼                                        ▼  retries on 401 via refresh)
auth/AuthContext.tsx                    axios instance + interceptors
components/                             
notifications/ (admin)                  
```

### 4.1 `api/client.ts` — the network core

This is the single source of truth for HTTP and token handling. It contains:

- **Token storage helpers** (`getAccessToken`, `getRefreshToken`, `setTokens`,
  `clearTokens`) backed by `localStorage`.
- **`api` axios instance** with `baseURL: '/api/v1'` (relative — relies on the
  Vite dev proxy, see §7).
- **Request interceptor**: reads the access token from `localStorage` and sets
  `Authorization: Bearer <token>` on every request.
- **Response interceptor**: handles `401` responses by attempting a **refresh-token
  rotation**, then replaying the original request once (`_retry` flag).

```text
Request  ──▶ request interceptor (add Bearer) ──▶ backend
                                                    │
                                    401 response?   │
                                        │  yes      │
                                        ▼           │
                              POST /auth/refresh ───┘
                                        │
                              set new tokens ──▶ replay original request
```

### 4.2 `api/<domain>-api.ts` — typed API functions

Each domain file exports plain async functions that call the shared `api` instance
and cast the response to a typed interface. Responses are unwrapped from the
standard envelope (`response.data.data`). Examples:

- `employee-web`: `attendance-api.ts` → `login`, `logout`, `fetchProfile`,
  `updateProfile`, `uploadPhoto`, `clockIn`, `clockOut`, `fetchSummary`.
- `admin-web`: `admin-api.ts` → `login`, `listEmployees`, `createEmployee`,
  `updateEmployee`, `deactivateEmployee`, `listAttendances`, `exportAttendances`,
  `listAuditLogs`.

### 4.3 `api/types.ts` — shared shapes

Plain interfaces mirroring backend DTO/response shapes (e.g. `UserProfile`,
`AttendanceRecord`, `Paginated<T>`, `Employee`, `AdminAttendanceRow`,
`AuditLog`, `LoginResponse`). No runtime validation (no zod/class-validator on
the frontend).

### 4.4 `auth/` — authentication state

- **`AuthContext.tsx`**: a minimal context exposing `isAuthenticated` and
  `setIsAuthenticated`. `isAuthenticated` is initialized from the presence of an
  access token in `localStorage`. It does **not** store the user object — only a
  boolean flag.
- **`ProtectedRoute.tsx`**: wraps protected routes. If `isAuthenticated` is false,
  it renders `<Navigate to="/login" state={{ from: location }} replace />`.

### 4.5 `components/Layout.tsx` — app shell

The persistent chrome for authenticated pages: header (app title + logout),
horizontal nav (`NavLink` with active-state styling), and a `<main>` with
`<Outlet/>` that renders the active page. Logout clears tokens and navigates to
`/login`.

### 4.6 `pages/` — feature screens

Each page is a self-contained component that owns its own data fetching, loading,
error, and form state via `useState`/`useEffect`. There is **no shared data-fetching
abstraction** (no React Query) and **no shared form library** — forms are controlled
inputs.

---

## 5. Employee Web (`apps/employee-web`)

### 5.1 Provider & Routing setup

`main.tsx` mounts the following provider tree:

```text
<StrictMode>
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
</StrictMode>
```

`App.tsx` defines the route table:

| Path | Element | Access |
|:---|:---|:---|
| `/login` | `LoginPage` | Public |
| `/profile` | `ProfilePage` (in `Layout`) | Protected |
| `/attendance` | `AttendancePage` (in `Layout`) | Protected |
| `/summary` | `SummaryPage` (in `Layout`) | Protected |
| `*` | `<Navigate to="/attendance" replace />` | Fallback |

### 5.2 Token keys

- Access token: `attendance_access_token`
- Refresh token: `attendance_refresh_token`

### 5.3 Pages

- **LoginPage** — email/password form → `login()` → stores tokens → navigates to
  `/attendance`. Displays `response.data.message` on error.
- **AttendancePage** — loads today's record (via `fetchSummary(today, today)`,
  taking `records[0]`), then shows **Clock In** (enabled when no record) and
  **Clock Out** (enabled when a record exists with no `clockOut`). Uses
  `clockInDisplay`/`clockOutDisplay` from the backend for display.
- **SummaryPage** — date-range form (`from`/`to`, default: first day of month →
  today) calling `fetchSummary(from, to)`, rendered as a simple list.
- **ProfilePage** — displays profile, allows **photo upload** (`multipart/form-data`
  via `PUT /profile`), **phone number** and **password** change (requires
  `currentPassword` + `newPassword`). Only sends fields that actually changed.

---

## 6. Admin Web (`apps/admin-web`)

### 6.1 Provider & Routing setup

`main.tsx` mounts an **extra** provider for real-time notifications:

```text
<StrictMode>
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
</StrictMode>
```

`App.tsx` route table:

| Path | Element | Access |
|:---|:---|:---|
| `/login` | `LoginPage` | Public |
| `/employees` | `EmployeesPage` (in `Layout`) | Protected |
| `/attendances` | `AttendancesPage` (in `Layout`) | Protected |
| `/audit-logs` | `AuditLogsPage` (in `Layout`) | Protected |
| `*` | `<Navigate to="/employees" replace />` | Fallback |

### 6.2 Token keys

- Access token: `attendance_admin_access_token`
- Refresh token: `attendance_admin_refresh_token`

(Separate keys from `employee-web`, so admin and employee sessions are isolated
even on the same browser.)

### 6.3 Pages

- **EmployeesPage** — paginated + searchable employee table, inline create/edit
  form, and soft-delete ("Deactivate"). Re-fetches on `page`/`search` change.
- **AttendancesPage** — filterable (date range + status) attendance table with
  CSV export (client-side blob download from `GET /admin/attendances/export`).
- **AuditLogsPage** — paginated audit-log table showing per-field old → new values,
  IP address, and timestamp.

### 6.4 Real-time notifications (`notifications/NotificationContext.tsx`)

The only real-time feature in the frontend. `NotificationProvider`:

1. Opens a Socket.IO connection: `io('/', { path: '/socket.io' })` (proxied to the
   audit service, see §7).
2. Listens for the `profile.updated` event.
3. Prepends each event to a notification list (capped at 50) and increments
   `unreadCount`.

`components/NotificationBell.tsx` consumes this context and renders the bell + badge
+ dropdown in the header; clicking marks all read.

```text
Employee updates profile
        │
        ▼
Backend: auth-service publishes "employee.profile.updated" ──▶ RabbitMQ
                                                                │
                                                                ▼
                                              audit-service consumes event
                                                                │
                                   ┌────────────────────────────┴───────────────┐
                                   ▼                                            ▼
                          writes audit log (audit DB)             emits "profile.updated"
                                                                   via Socket.IO
                                                                            │
                                                                            ▼
                                            admin-web NotificationProvider receives event
                                                                            │
                                                                            ▼
                                            NotificationBell badge + dropdown update
```

---

## 7. Backend Integration (Dev Proxy)

Both apps use `baseURL: '/api/v1'` and rely on the Vite dev server to proxy
requests to the correct microservice. This is why the frontend never hardcodes
backend hostnames.

### `employee-web` (`vite.config.ts`)

| Frontend path | Backend target | Service |
|:---|:---|:---|
| `/api/v1/auth` | `http://localhost:3000` | auth-service |
| `/api/v1/profile` | `http://localhost:3000` | auth-service |
| `/api/v1/attendance` | `http://localhost:3001` | attendance-service |
| `/uploads` | `http://localhost:3000` | auth-service (static photos) |

### `admin-web` (`vite.config.ts`)

| Frontend path | Backend target | Service |
|:---|:---|:---|
| `/api/v1/auth` | `http://localhost:3000` | auth-service |
| `/api/v1/admin/employees` | `http://localhost:3001` | attendance-service |
| `/api/v1/admin/attendances` | `http://localhost:3001` | attendance-service |
| `/api/v1/admin/audit-logs` | `http://localhost:3002` | audit-service |
| `/socket.io` (ws) | `http://localhost:3002` | audit-service (Socket.IO) |
| `/uploads` | `http://localhost:3000` | auth-service (static photos) |

---

## 8. End-to-End Flows

### 8.1 Authentication (login → refresh)

```text
1. User submits credentials on LoginPage.
2. login() → POST /api/v1/auth/login (no Authorization header yet).
3. Backend returns { accessToken, refreshToken, user }.
4. setTokens() stores both tokens in localStorage.
5. setIsAuthenticated(true) → ProtectedRoute now allows protected routes.
6. navigate() to the app home route.

Later, on a 401:
7. Response interceptor detects 401 on a non-/auth/ request.
8. POST /api/v1/auth/refresh { refreshToken }.
9. setTokens() replaces both tokens; original request is replayed with the new
   access token.
10. If refresh fails → clearTokens() → hard redirect to /login.
```

**Note (implementation difference):** `employee-web`'s client has a module-level
`isRefreshing` flag to avoid issuing parallel refresh calls during token rotation;
`admin-web`'s client does **not** have this guard (it refreshes per failed request).

### 8.2 Clock In / Clock Out

```text
1. AttendancePage mounts → fetchSummary(today, today) → records[0].
2. UI derives button state:
   - canClockIn  = no record for today
   - canClockOut = record exists && !clockOut
3. clockIn()  → POST /api/v1/attendance/clock-in
   clockOut() → POST /api/v1/attendance/clock-out
4. On success, re-fetch today's record to refresh display.
5. Display uses backend-provided clockInDisplay / clockOutDisplay (Asia/Jakarta).
```

### 8.3 Profile update → audit → real-time notification

```text
1. Employee submits profile change (phone / password / photo) on ProfilePage.
2. updateProfile() / uploadPhoto() → PUT /api/v1/profile.
3. Backend updates primary DB, then publishes "employee.profile.updated" (async).
4. Response returns immediately (non-blocking).
5. audit-service consumes the event → writes audit log → emits "profile.updated"
   via Socket.IO.
6. admin-web NotificationProvider receives the event → NotificationBell updates
   badge + dropdown.
7. HRD admin can also see the same change later via AuditLogsPage
   (GET /api/v1/admin/audit-logs).
```

---

## 9. Conventions & Observations

**Shared conventions (consistent across both apps):**

- Function components + hooks; no class components.
- Controlled form inputs; no form library.
- Error handling: a small local `extractMessage(err)` helper in each page that reads
  `err.response.data.message`, then falls back to `details[0].message`, then a
  generic string.
- Tailwind utility classes for all styling; emerald accent for employee, blue for
  admin.
- Token keys namespaced per app to avoid session collisions.
- Standard API envelope unwrapped at the `api/<domain>-api.ts` boundary
  (`data.data`).

**Notable characteristics / potential follow-ups:**

- **No shared frontend code** between the two apps — `client.ts`, `AuthContext`,
  `ProtectedRoute`, and `Layout` are duplicated (near-identical copies). There is
  no `libs/` package consumed by the frontends.
- **No Nx project config** for the frontends — they run through pnpm filter scripts
  rather than `nx serve`/`nx build`.
- **No frontend tests** — the `dist/` folders suggest builds were produced, but no
  test files exist under `apps/*/src`.
- **No runtime validation** of API responses on the frontend (TypeScript interfaces
  only, via type assertion `as`).
- **No central state store** — each page manages its own data/loading/error state;
  only auth and (admin) notifications use Context.
- **`isAuthenticated` is token-presence based** — it does not verify token expiry
  up front; expired tokens are handled lazily via the 401 → refresh interceptor.
- **AuthContext initialization differs slightly**: `employee-web` re-checks the
  token in a `useEffect` on mount; `admin-web` relies only on the lazy initializer.
- **`ProtectedRoute` in `employee-web` logs to the console** on every render
  (debug `console.log`), while `admin-web`'s does not.

---

## 10. Run / Build

From the repo root:

```bash
# Run frontends (dev)
pnpm start:employee-web   # http://localhost:3100
pnpm start:admin-web      # http://localhost:3101

# Build frontends
pnpm build:employee-web
pnpm build:admin-web
```

The frontends require the backend services (and dev proxy targets) to be running:
`auth-service` (3000), `attendance-service` (3001), `audit-service` (3002).
