# Architecture Decision Records

## ADR-001: Microservices split (auth / attendance / audit)

**Status:** Accepted

**Context:** The system must keep profile/authentication logic separate from
attendance business rules, and both separate from asynchronous audit logging.

**Decision:** Three NestJS services under a single Nx + pnpm monorepo:

| Service | Port | Responsibility |
|:---|:---|:---|
| `auth-service` | 3000 | Authentication (login/refresh/logout), employee profile APIs, file upload, publishes `employee.profile.updated` |
| `attendance-service` | 3001 | Clock-in/out, attendance summary, HRD admin employee CRUD + attendance monitoring |
| `audit-service` | 3002 | Consumes `employee.profile.updated`, writes audit DB, emits Socket.IO notifications |

**Consequences:** Cross-service calls avoided; communication via RabbitMQ
(events) and HTTP (where an initiating client needs a synchronous response).

---

## ADR-002: Audit logging is asynchronous (RabbitMQ)

**Status:** Accepted

**Context:** Profile updates must return to the client promptly (95% < 200ms);
audit persistence must not block the main request.

**Decision:** Auth service publishes `employee.profile.updated` to RabbitMQ
after the primary DB update, then returns immediately. The audit service
consumes the event and writes to the separate audit database.

**Consequences:** Audit write failures never roll back the profile update
(fire-and-forget with durable queue). Slight eventual-consistency window
between update and audit-log visibility.

---

## ADR-003: Primary DB and Audit DB are separate PostgreSQL instances

**Status:** Accepted

**Context:** Audit data has different retention/access characteristics and
must not bloat or couple to the primary application schema.

**Decision:** Two PostgreSQL 15 instances (`postgres-primary:5432`,
`postgres-audit:5433`), each with its own TypeORM data source and migrations.

**Consequences:** No cross-DB foreign keys; audit consumer resolves user
details from the event payload (denormalized `user_name`).

---

## ADR-004: Socket.IO over Firebase Cloud Messaging

**Status:** Accepted

**Context:** The PRD allows FCM or WebSockets for HRD real-time alerts.

**Decision:** Socket.IO (`@nestjs/websockets` + `socket.io-client`). The audit
service hosts the gateway and joins every HRD client to a `hrd` room.

**Consequences:** No external service dependency or Firebase cost. Requires a
persistent WebSocket connection from the HRD browser (handled transparently by
Socket.IO with polling fallback).

---

## ADR-005: Business timezone is Asia/Jakarta (WIB, UTC+7)

**Status:** Accepted

**Context:** Attendance dates are business-meaningful and must not drift with
the server or client timezone.

**Decision:** Store all timestamps in UTC; convert to `Asia/Jakarta` for date
comparisons and display. API returns both raw UTC (`clockIn`) and formatted
Jakarta time (`clockInDisplay`).

**Consequences:** `date` column on attendance is the Asia/Jakarta calendar day,
enforced server-side via `getJakartaDateString()`.

---

## ADR-006: Custom JWT guard (no passport)

**Status:** Accepted

**Context:** The system only needs JWT bearer-token auth plus a role check;
passport adds dependency surface for little gain.

**Decision:** A custom `JwtAuthGuard` built directly on `@nestjs/jwt`, plus a
`RolesGuard` reading `@Roles()` metadata. `@Public()` opts out of auth.

**Consequences:** Fewer dependencies, simpler traceability, but no passport
strategy ecosystem (not needed here).

---

## ADR-007: bcrypt (10 rounds) for password + refresh-token hashing

**Status:** Accepted

**Context:** Passwords and refresh tokens must be stored hashed, never plaintext.

**Decision:** `bcrypt` with 10 salt rounds for both user passwords and the
stored (rotated) refresh token.

**Consequences:** Refresh tokens are single-hash-verified on rotation; logout
clears the stored hash.
