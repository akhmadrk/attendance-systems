# Employee WFH Attendance & HRD Monitoring System

Dual-application ecosystem for managing remote work attendance and providing HR
administrators with complete oversight.

## Architecture

| Layer | Technology |
|:---|:---|
| Backend | Node.js + TypeScript + NestJS (3 microservices) |
| Frontend | React 19 + Vite + Tailwind CSS (2 apps) |
| Primary DB | PostgreSQL 15 |
| Audit DB | PostgreSQL 15 (separate instance) |
| ORM | TypeORM |
| Message Queue | RabbitMQ |
| Real-time | Socket.IO |
| Monorepo | Nx + pnpm workspaces |
| Containerization | Docker + docker-compose |

## Services

| Service | Port | Responsibility |
|:---|:---|:---|
| `apps/auth-service` | 3000 | Auth (login/refresh/logout), employee profile, photo upload, event publishing |
| `apps/attendance-service` | 3001 | Clock-in/out, summary, HRD admin (employees + attendance) |
| `apps/audit-service` | 3002 | Consumes events → audit DB, Socket.IO notifications |

## Frontends

| App | Port | Purpose |
|:---|:---|:---|
| `apps/employee-web` | 3100 | Employee: login, profile, attendance, summary |
| `apps/admin-web` | 3101 | HRD: employee CRUD, attendance monitor, audit logs, real-time alerts |

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker + docker-compose

## Quick Start

```bash
# 1. Install
pnpm install

# 2. Env
cp .env.example .env          # fill in JWT_SECRET + JWT_REFRESH_SECRET

# 3. Infrastructure (PostgreSQL x2 + RabbitMQ)
docker compose -f docker/docker-compose.yml up -d

# 4. Migrations
pnpm migration:run:primary
pnpm migration:run:audit

# 5. Seed (1 HRD admin + 5 employees)
pnpm seed

# 6. Backend services (separate terminals)
pnpm start:auth
pnpm start:attendance
pnpm start:audit

# 7. Frontends (separate terminals)
pnpm start:employee-web   # http://localhost:3100
pnpm start:admin-web      # http://localhost:3101
```

## Seed Accounts

| Role | Email | Password |
|:---|:---|:---|
| HRD Admin | `admin@company.com` | `Admin123!` |
| Employees | `employee1..5@company.com` | `Employee123!` |

## Scripts

| Command | Description |
|:---|:---|
| `pnpm build` | Build all backend apps + libs |
| `pnpm lint` / `pnpm test` / `pnpm typecheck` | Backend quality gates |
| `pnpm build:employee-web` / `pnpm build:admin-web` | Build frontends |
| `pnpm seed` | Seed development data |
| `pnpm migration:run:primary` / `:audit` | Run DB migrations |
| `bash scripts/e2e-smoke.sh` | End-to-end smoke test (requires running stack) |

## Documentation

- Product requirements: [`PRD.md`](./PRD.md)
- Agent engineering guide: [`AGENTS.md`](./AGENTS.md)
- API reference: [`docs/api/README.md`](./docs/api/README.md)
- Architecture decisions: [`docs/architecture/decisions.md`](./docs/architecture/decisions.md)

## Key business rules

- **Timezone:** all attendance dates/times in `Asia/Jakarta` (WIB, UTC+7); stored UTC.
- **Clock in/out:** one record per day (`UNIQUE(user_id, date)`); no double clock-in; no clock-out without clock-in.
- **Account lockout:** 5 failed logins → 15-minute lock.
- **Profile events:** profile updates publish `employee.profile.updated` to RabbitMQ → audit DB + HRD Socket.IO alert (async, non-blocking).
- **Password security:** bcrypt (10 rounds); password/hash never logged, never in events.
