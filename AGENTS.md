# AGENTS.md (v2)

## 1. Project Context

This repository implements the **Employee WFH Attendance & HRD Monitoring System**.

The system consists of:

- Employee WFH Web Application
- HRD Monitoring Admin Web Application
- NestJS microservices backend (3 services)
- Primary PostgreSQL database
- Separate PostgreSQL audit/logging database
- RabbitMQ message queue for asynchronous processing
- Socket.IO for real-time notifications

The Product Requirement Document (PRD) is the **primary source of truth for product requirements**.

Before implementing a feature, read the relevant section of the PRD.

Do not silently change or reinterpret business requirements.

---

## 2. Engineering Principles

### 2.1 Follow Existing Architecture

Before writing code:

1. Inspect the repository structure.
2. Identify existing architectural patterns.
3. Identify existing modules, services, repositories, DTOs, guards, interceptors, and utilities.
4. Reuse existing patterns whenever possible.
5. Avoid introducing a new architectural pattern unless there is a clear technical reason.

Do not rewrite unrelated code.

Prefer small, focused changes.

### 2.2 Requirement First

Every implementation must be traceable to:

- A PRD functional requirement
- A non-functional requirement
- An acceptance criterion
- Or a technical requirement necessary to support one of the above

When a requirement is ambiguous:

1. Identify the ambiguity.
2. Check the rest of the PRD for context.
3. Check existing implementation patterns.
4. If still ambiguous, ask for clarification rather than inventing business behavior.

Do not add speculative features.

---

## 3. Technology Constraints

### Backend

The backend MUST use:

- Node.js
- TypeScript
- NestJS
- REST API
- Microservices architecture

Required backend characteristics:

- Modular NestJS architecture
- DTO validation (class-validator + class-transformer)
- Authentication and authorization (JWT + Role Guards)
- Proper error handling (standardized error response format)
- Async message processing via RabbitMQ
- Real-time notifications via Socket.IO
- Unit and integration tests

### Frontend

The frontend MUST use:

- React.js
- Responsive web design (320px to 1920px)

CSS/UI framework: Choose **one** from:

- Tailwind CSS (recommended for flexibility)
- Ant Design (recommended for admin dashboards)

Do not mix multiple UI frameworks.

### Database

**Primary database: PostgreSQL**
**Audit database: PostgreSQL (separate instance)**

ORM: **TypeORM** (recommended) or **Prisma** (alternative).

The system must maintain a strict separation between:

#### Primary Database

Contains application data:

- Users (with roles, status, auth fields)
- Attendance records

#### Audit Database

Contains:

- Profile change audit logs
- Previous values
- New values
- Request metadata (IP, user agent)
- Timestamp

The audit database must not be treated as the primary application database.

### Message Queue

**RabbitMQ** via `@nestjs/microservices` with `amqplib`.

Use the message queue for asynchronous operations that must not block the main API request.

### Real-time Notifications

**Socket.IO** via `@nestjs/websockets` (server) and `socket.io-client` (frontend).

### Monorepo Tooling

**Nx** with **pnpm** workspaces.

### Containerization

**Docker** + **docker-compose** for local development.

Services in docker-compose:
- `auth-service` (NestJS)
- `attendance-service` (NestJS)
- `audit-service` (NestJS)
- `postgres-primary` (PostgreSQL 15)
- `postgres-audit` (PostgreSQL 15)
- `rabbitmq` (RabbitMQ 3-management)

---

## 4. Repository Structure

```text
apps/
  auth-service/          # Authentication, JWT, Profile APIs
  attendance-service/    # Clock In/Out, Attendance Summary
  audit-service/         # Audit logging + Socket.IO notifications

  employee-web/          # React app for employees
  admin-web/             # React app for HRD admins

libs/
  common/                # Shared DTOs, interfaces, constants, utils
  auth/                  # JWT strategies, guards, decorators
  database/              # TypeORM entities, migrations, connections
  messaging/             # RabbitMQ producers, consumers, event types
  notifications/         # Socket.IO gateway, event emitters

docs/
  architecture/          # Architecture Decision Records
  api/                   # API documentation

docker/
  docker-compose.yml
  docker-compose.dev.yml

AGENTS.md
README.md
nx.json
pnpm-workspace.yaml
```

Adapt this structure to the existing repository rather than forcing a rewrite.

If the repository already uses a different but coherent structure, preserve it.

---

## 5. Backend Architecture

### 5.1 Auth Service

Responsible for:

- Authentication (login, refresh token, logout)
- JWT token generation and validation
- Role-based authorization guards
- Employee profile APIs (GET, PUT)
- File upload handling (profile photos)
- Publishing `employee.profile.updated` events to RabbitMQ

Do not place attendance business logic inside the auth service.

### 5.2 Attendance Service

Responsible for:

- Clock-in
- Clock-out
- Attendance validation (business rules)
- Attendance summary with date filtering
- HRD admin attendance queries

Attendance business rules must be implemented in the service/domain layer rather than controllers.

### 5.3 Audit & Notification Service

Responsible for:

1. Consuming `employee.profile.updated` events from RabbitMQ
2. Writing audit logs to the separate audit database
3. Emitting real-time notifications to connected HRD admin clients via Socket.IO

The main profile update request must not wait for audit persistence or notification delivery.

---

## 6. API Rules

API endpoints must follow the PRD.

### Complete API Contract

```text
# Authentication
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

# Employee Profile
GET    /api/v1/profile
PUT    /api/v1/profile

# Attendance
POST   /api/v1/attendance/clock-in
POST   /api/v1/attendance/clock-out
GET    /api/v1/attendance/summary?from=YYYY-MM-DD&to=YYYY-MM-DD

# HRD Admin - Employee Management
GET    /api/v1/admin/employees?page=1&limit=10&search=
POST   /api/v1/admin/employees
PUT    /api/v1/admin/employees/:id
DELETE /api/v1/admin/employees/:id

# HRD Admin - Attendance Monitoring
GET    /api/v1/admin/attendances?userId=&from=&to=&status=
GET    /api/v1/admin/attendances/export?userId=&from=&to=

# HRD Admin - Audit Logs
GET    /api/v1/admin/audit-logs?userId=&from=&to=&page=1&limit=10

# Health Checks
GET    /health
```

Do not change existing API contracts without justification.

### Standard Response Format

**Success:**
```json
{
  "statusCode": 200,
  "data": { ... }
}
```

**Paginated:**
```json
{
  "statusCode": 200,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "totalPages": 15
  }
}
```

**Error:**
```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

### HTTP Status Code Conventions

| Status | Usage |
|:---|:---|
| 200 | Successful GET, PUT |
| 201 | Successful POST (resource created) |
| 400 | Validation error, bad request |
| 401 | Unauthenticated (missing/invalid/expired token) |
| 403 | Authenticated but insufficient role |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, duplicate clock-in) |
| 429 | Rate limited |
| 500 | Internal server error |

---

## 7. Authentication & Authorization

Authentication must use:

- JWT access token (1 hour expiration)
- Refresh token (7 days expiration, stored hashed in DB)
- Token rotation on refresh (new access + new refresh token)

Passwords must NEVER be stored in plaintext.

Use **bcrypt** with **10 salt rounds**.

All protected endpoints must enforce authentication via JWT Guard.

Role-based authorization must distinguish:

```text
EMPLOYEE
HRD
```

Employees must not access HRD administrative endpoints.

HRD administrative endpoints must require the HRD role via Role Guard.

### Account Lockout

- After 5 consecutive failed login attempts, account is locked for 15 minutes.
- `failed_login_attempts` counter resets on successful login.
- Locked accounts return 401 with message "Account locked. Try again after [time]."

---

## 8. Validation

All external input must be validated.

For NestJS:

- Use DTOs with `class-validator` and `class-transformer`
- Enable `ValidationPipe` globally with `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`

Validation must exist at API boundaries.

Never trust:

- Request body
- Query parameters
- Route parameters
- Uploaded files
- Headers
- Client-generated timestamps

### Validation Rules

| Field | Rule |
|:---|:---|
| Email | Valid email format, max 100 chars |
| Phone Number | Regex: `^[+]?[0-9]{10,15}$` |
| Password | Min 8 chars, 1 uppercase, 1 lowercase, 1 number |
| Name | Required, max 100 chars |
| Position | Required, max 100 chars |
| Profile Photo | JPG/PNG/WEBP only, max 2MB, validated by reading file headers |
| Date (from/to) | Valid ISO date format (YYYY-MM-DD), `from` <= `to` |
| Date Range | Max 90 days between `from` and `to` |

---

## 9. Employee Profile Rules

Employees may modify:

- Profile photo
- Phone number
- Password

Employees must not directly modify business-controlled fields:

- Name
- Corporate email
- Position
- Role

Password changes require:

1. Current password verification
2. New password validation (complexity rules)
3. Secure password hashing (bcrypt, 10 rounds)

Profile photo:

- Allowed formats: JPG, PNG, WEBP (validate by reading file headers, not just MIME type)
- Maximum size: 2 MB
- Storage: Local disk (`uploads/photos/`) for development, configurable for production
- URL format: Relative path (`/uploads/photos/{filename}`)

After a successful profile update:

```text
API Request
    |
    v
Update Primary DB
    |
    +----> Publish employee.profile.updated to RabbitMQ
    |
    v
Return API response (synchronous)

RabbitMQ Consumer (async)
    |
    v
Audit & Notification Service
    |
    +----> Write to Audit DB
    |
    +----> Emit Socket.IO event to HRD clients
```

Do not perform audit DB writes synchronously inside the profile update request.

---

## 10. Message Events

Use explicit event names.

Event: `employee.profile.updated`

Event payload structure:

```json
{
  "event": "employee.profile.updated",
  "userId": "uuid",
  "userName": "John Doe",
  "changedFields": {
    "phone_number": {
      "old": "+6281234567890",
      "new": "+6289876543210"
    }
  },
  "metadata": {
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 ..."
  },
  "timestamp": "2026-09-07T10:30:00Z"
}
```

Rules:

- Password and password hash MUST NEVER be included in event payloads.
- `changedFields` only includes fields that actually changed.
- For photo changes, include old and new URL paths (not binary data).
- Events must contain sufficient information for consumers to process independently.

---

## 11. Attendance Business Rules

Attendance behavior must follow the PRD.

### Business Timezone

**Canonical Timezone: `Asia/Jakarta` (WIB, UTC+7)**

- Store all timestamps in UTC in the database.
- Convert to Asia/Jakarta for all date comparisons and business rule evaluation.
- Display times in Asia/Jakarta on the frontend.

### Clock In

An employee:

- Can clock in for the current working date (Asia/Jakarta).
- Cannot clock in twice without first clocking out.
- Clock-in creates a new attendance record with `clock_in` timestamp.

### Clock Out

An employee:

- Can clock out only when a clock-in record exists for the current date.
- Cannot clock out without an existing clock-in.
- Clock-out updates the existing record with `clock_out` timestamp.

The server must determine:

- Current date (in Asia/Jakarta timezone)
- Current timestamp (UTC)

Do not rely on the browser to determine the authoritative attendance timestamp.

Attendance states:

```text
CLOCK_IN   (record has clock_in, no clock_out)
CLOCK_OUT  (record has both clock_in and clock_out)
```

---

## 12. Attendance Data Integrity

Attendance operations must be designed to prevent duplicate or inconsistent records.

### Required Safeguards

- **Database constraint:** `UNIQUE(user_id, date)` on `attendances` table
- **Transactions:** Use database transactions for clock-in/clock-out operations
- **Concurrent requests:** Handle race conditions via:
  - Database-level unique constraint (primary defense)
  - Application-level check-then-insert (secondary defense)
  - Proper error handling for constraint violations (return 409 Conflict)

Do not rely only on application-level checks:

```text
SELECT -> check -> INSERT
```

when concurrent requests could create duplicate records.

Database-level integrity MUST support the business rule.

---

## 13. Date & Time

Attendance is date-sensitive.

### Timezone Strategy

1. **Business timezone:** `Asia/Jakarta` (WIB, UTC+7)
2. **Storage:** All timestamps stored in UTC
3. **Business logic:** Convert UTC to Asia/Jakarta before date comparisons
4. **API responses:** Include both UTC timestamp and display-formatted time
5. **Frontend:** Display in Asia/Jakarta regardless of user's local timezone

### Date Filtering

```text
from <= attendance_date <= to
```

- `from` and `to` are inclusive
- Both dates are in Asia/Jakarta timezone
- Maximum range: 90 days
- Default range (employee summary): First day of current month to today

---

## 14. Audit Logging

Audit logs must capture:

- User ID
- User Name (denormalized for display)
- Changed fields (with old and new values)
- IP address
- User agent
- Timestamp

Sensitive values must not be logged.

In particular:

```text
password
password hash
refresh token
access token
```

must never appear in audit logs.

Audit logging must be asynchronous (via RabbitMQ consumer).

Failure to write an audit record must not cause the original profile update transaction to be rolled back.

---

## 15. Performance

The target is:

```text
95% of REST API requests < 200ms
```

under standard load.

When implementing APIs:

- Avoid unnecessary database queries.
- Avoid N+1 queries (use eager loading or joins).
- Select only required columns where appropriate.
- Add appropriate indexes (see database schema in PRD).
- Avoid synchronous external service calls when asynchronous processing is sufficient.
- Do not optimize prematurely without evidence.

Performance-sensitive code should be measurable.

---

## 16. Security

Always consider:

- Authentication (JWT + refresh tokens)
- Authorization (role-based guards)
- Input validation (DTOs with class-validator)
- SQL injection (use TypeORM parameterized queries, never raw SQL with string concatenation)
- XSS (React handles this by default, but sanitize any `dangerouslySetInnerHTML`)
- CORS (allow only frontend origins)
- Rate limiting (NestJS Throttler):
  - Login endpoint: 5 requests per minute per IP
  - General API: 100 requests per minute per IP
- Brute-force protection (account lockout after 5 failed attempts)
- Secure password hashing (bcrypt, 10 salt rounds)
- Sensitive data exposure (never return password hash, tokens in responses)
- File upload validation (read file headers, not just MIME type)
- Token handling (access token in Authorization header, refresh token stored securely)

Never expose:

- Passwords
- Password hashes
- Access tokens (in response body — use Authorization header)
- Refresh tokens (in response body — only on login/refresh)
- Internal secrets
- Database credentials

Secrets must come from environment variables via `@nestjs/config` and must not be committed.

Required environment variables (document in `.env.example`):

```text
# Database
PRIMARY_DB_HOST=
PRIMARY_DB_PORT=5432
PRIMARY_DB_USERNAME=
PRIMARY_DB_PASSWORD=
PRIMARY_DB_NAME=

AUDIT_DB_HOST=
AUDIT_DB_PORT=5432
AUDIT_DB_USERNAME=
AUDIT_DB_PASSWORD=
AUDIT_DB_NAME=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=7d

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=2097152

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## 17. File Uploads

Profile image uploads must enforce:

```text
Allowed:
- JPG (image/jpeg)
- PNG (image/png)
- WEBP (image/webp)

Maximum:
- 2 MB (2,097,152 bytes)
```

Validate both:

- File extension (`.jpg`, `.jpeg`, `.png`, `.webp`)
- Actual file content by reading magic bytes / file headers (not trusting Content-Type header alone)

Use `multer` with NestJS for file upload handling.

Storage strategy:

- **Development:** Local disk (`uploads/photos/` directory)
- **Production:** Configurable (local disk, S3, GCS) via environment variable
- **URL format:** Relative path (`/uploads/photos/{uuid}-{filename}.{ext}`)

Uploaded files must not allow arbitrary executable content.

Serve uploaded files via NestJS `ServeStaticModule` or reverse proxy.

---

## 18. Testing Requirements

Every feature must include appropriate tests.

At minimum:

### Unit Tests

Test:

- Business rules (attendance clock-in/out rules, password validation, etc.)
- Services (mocked dependencies)
- Validation (DTO validation edge cases)
- Error conditions (duplicate records, invalid input, unauthorized access)
- Edge cases (timezone boundaries, concurrent requests)

### Integration Tests

Test where applicable:

- Database interaction (actual DB queries, transactions)
- Repository behavior (CRUD operations, constraints)
- Message publishing (RabbitMQ event emission)
- Message consumption (audit log creation from event)

### End-to-End Tests

Critical flows should be covered:

```text
Employee updates profile
        |
        v
Primary DB updated
        |
        v
Message published to RabbitMQ
        |
        v
Audit service consumes event
        |
        +----> Audit DB record created
        |
        +----> Socket.IO notification emitted
```

---

## 19. Required Verification

Before declaring a task complete, run the repository's available checks.

At minimum, when applicable:

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

If the repository uses different commands, use the existing project commands.

Do not claim a task is complete if tests or builds are failing.

If a test cannot be executed, explicitly report why.

---

## 20. Definition of Done

A task is considered complete only when:

- [ ] Requirement implemented
- [ ] Existing architecture respected
- [ ] DTO validation implemented
- [ ] Authorization verified (correct guards applied)
- [ ] Error handling implemented (standardized error format)
- [ ] Database changes include TypeORM migrations
- [ ] Unit tests added/updated
- [ ] Integration/E2E tests added where appropriate
- [ ] Existing tests still pass
- [ ] Linter passes
- [ ] Type checking passes (`tsc --noEmit`)
- [ ] Build succeeds
- [ ] No secrets committed
- [ ] No unrelated files changed
- [ ] Documentation updated where necessary
- [ ] `.env.example` updated if new environment variables added

---

## 21. Git Rules

Do not commit automatically unless explicitly requested.

Before creating a commit:

1. Review changed files.
2. Check the diff.
3. Verify tests pass.
4. Verify lint/build pass.
5. Ensure no secrets or temporary files are included.
6. Ensure `.env` files are not committed (only `.env.example`).

Use Conventional Commits.

Examples:

```text
feat(auth): add login endpoint with JWT
feat(auth): add refresh token rotation
feat(profile): add profile update with event publishing
feat(attendance): add clock in endpoint with business rules
fix(attendance): prevent duplicate clock in via unique constraint
test(attendance): add clock out business rule tests
refactor(auth): simplify token validation
docs: update API contract in README
chore: add docker-compose for local development
```

---

## 22. Agent Workflow

For a new feature, follow this workflow:

```text
1. Understand (read PRD requirement)
      ↓
2. Inspect repository (existing patterns, modules)
      ↓
3. Identify affected modules and services
      ↓
4. Create implementation plan (for complex tasks)
      ↓
5. Implement (service → controller → DTO → migration)
      ↓
6. Test (unit → integration → e2e)
      ↓
7. Review (self-review against acceptance criteria)
      ↓
8. Fix issues
      ↓
9. Run full verification (lint, test, build)
      ↓
10. Report completion
```

For complex tasks, do not immediately start coding.

First produce a concise implementation plan.

---

## 23. Agent Delegation

Use specialized agents when available.

### Explore

Use for:

- Understanding unfamiliar code
- Finding existing implementations
- Finding related modules
- Repository discovery

### Librarian

Use for:

- Framework/library documentation (NestJS, TypeORM, Socket.IO)
- External API documentation
- Understanding third-party behavior

### Oracle

Use for:

- Architecture decisions
- Complex bugs
- Concurrency problems (race conditions in attendance)
- Difficult trade-offs
- Security-sensitive design

### Prometheus

Use for:

- Large feature planning
- Multi-module implementation planning
- Breaking down complex requirements

### Sisyphus / Main Implementation Agent

Use for:

- Implementation
- Refactoring
- Testing
- Iterative fixes

Do not delegate trivial tasks unnecessarily.

---

## 24. Working With the PRD

When implementing a feature, reference the PRD requirement ID.

Example:

```text
Implement FR-EMP-006.

Requirement:
Profile updates must publish an asynchronous event to RabbitMQ and trigger
an HRD real-time notification via Socket.IO.
```

The implementation should be traceable from:

```text
PRD
 ↓
Requirement ID (e.g., FR-EMP-006)
 ↓
Implementation (service, controller, DTO)
 ↓
Tests (unit, integration)
 ↓
Acceptance Criteria (from PRD)
```

When possible, test names should communicate the requirement being verified:

```text
describe('FR-EMP-008: Business Rules for Clocking', () => {
  it('should prevent duplicate clock-in on same date', () => { ... });
  it('should prevent clock-out without prior clock-in', () => { ... });
});
```

---

## 25. Important Restrictions

The agent MUST NOT:

- Rewrite the entire application unnecessarily.
- Replace the architecture without justification.
- Introduce unnecessary dependencies.
- Add speculative features.
- Change API contracts casually.
- Remove tests to make the build pass.
- Disable validation to bypass failures.
- Ignore failing tests.
- Commit secrets or `.env` files.
- Log passwords or tokens.
- Store plaintext passwords.
- Make audit logging synchronous when asynchronous processing is required.
- Declare success without verification.
- Use raw SQL with string concatenation (SQL injection risk).
- Trust client-provided MIME types for file uploads without header validation.
- Mix browser local time with server time without explicit timezone conversion.
- Include password or password hash in RabbitMQ event payloads.

---

## 26. When Requirements Conflict

Priority order:

```text
1. Explicit user instruction
2. PRD acceptance criteria
3. PRD functional requirements
4. PRD non-functional requirements
5. Existing architecture
6. Existing coding conventions
7. Agent preference
```

If a conflict cannot be safely resolved, stop and ask for clarification.

Do not silently choose behavior that changes business requirements.

---

## 27. Final Task Report

After completing a task, report:

### Implemented

- What changed
- Which modules/services changed
- Which PRD requirements were addressed (by ID)

### Tests

- Tests added (with requirement IDs in test names)
- Tests executed
- Test results

### Verification

- Lint: PASS/FAIL
- Type check: PASS/FAIL
- Build: PASS/FAIL
- E2E: PASS/FAIL

### Notes

- Known limitations
- Follow-up work
- Decisions requiring human review

Keep the final report concise and factual.

---

## 28. Environment & Configuration

### Configuration Management

Use `@nestjs/config` with environment variables.

- **Development:** `.env` file (gitignored)
- **Template:** `.env.example` (committed, no real values)
- **Production:** Environment variables from deployment platform

### Docker Setup

All services must be runnable via:

```bash
docker-compose up
```

This starts:
- All NestJS microservices
- PostgreSQL (primary)
- PostgreSQL (audit)
- RabbitMQ (with management UI at http://localhost:15672)

### Database Migrations

Use TypeORM migration CLI or Nx generators:

```bash
# Generate migration
pnpm nx run auth-service:typeorm:migration:generate -- -n CreateUsersTable

# Run migrations
pnpm nx run auth-service:typeorm:migration:run
```

Migrations must be:
- Idempotent (safe to run multiple times)
- Reversible (include `down` migration)
- Committed to version control

### Database Seeding

Seed script creates initial data for development:

```bash
pnpm seed
```

Creates:
- 1 HRD admin account (email: `admin@company.com`, password: `Admin123!`)
- 5 sample employee accounts
- Sample attendance records for testing

---

## 29. Health Checks & Observability

### Health Check Endpoints

Each service exposes:

```text
GET /health
```

Response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "rabbitmq": { "status": "up" }
  }
}
```

Use `@nestjs/terminus` with TypeORM and RabbitMQ health indicators.

### Application Logging

- Use NestJS built-in `Logger` or Winston
- Log format: JSON in production, human-readable in development
- Log levels: ERROR, WARN, INFO, DEBUG
- Include request ID in logs for tracing
- Never log sensitive data (passwords, tokens, PII)

---

## Changelog

### v2.0.0 (September 7, 2026)

**New sections:**
- §3: Added ORM (TypeORM), Socket.IO, Nx, Docker decisions
- §6: Added refresh, logout, delete, export endpoints; query params; response formats; status codes
- §7: Added account lockout policy
- §8: Added specific validation rules table
- §11: Added timezone specification (Asia/Jakarta)
- §13: Added timezone strategy (storage, conversion, display)
- §16: Added rate limiting specifics, environment variables list
- §17: Added storage strategy, URL format, multer guidance
- §28: Environment & Configuration (new section)
- §29: Health Checks & Observability (new section)

**Updated sections:**
- §1: Added Socket.IO, RabbitMQ specifics
- §4: Added docker/, nx.json, pnpm-workspace.yaml
- §5: Clarified service responsibilities
- §6: Complete API contract with all endpoints
- §9: Added storage strategy for photos
- §10: Added userName to event payload
- §12: Added specific safeguards (unique constraint, transactions)
- §20: Added .env.example to Definition of Done
- §25: Added new restrictions (raw SQL, MIME trust, timezone mixing, password in events)
