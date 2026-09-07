# Employee WFH Attendance & HRD Monitoring System

Dual-application ecosystem for managing remote work attendance and providing HR
administrators with complete oversight.

## Architecture

| Layer | Technology |
|:---|:---|
| Backend | Node.js + TypeScript + NestJS (microservices, REST) |
| Frontend | React.js (responsive) |
| Primary DB | PostgreSQL |
| Audit DB | PostgreSQL (separate instance) |
| ORM | TypeORM |
| Message Queue | RabbitMQ |
| Real-time | Socket.IO |
| Monorepo | Nx + pnpm workspaces |
| Containerization | Docker + docker-compose |

## Services

- `apps/auth-service` — Authentication (login/refresh/logout), JWT, employee profile APIs
- `apps/attendance-service` — Clock-in/out, attendance summary
- `apps/audit-service` — Audit logging + Socket.IO notifications

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Docker + docker-compose

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env template
cp .env.example .env

# 3. Start infrastructure (PostgreSQL x2 + RabbitMQ)
docker compose -f docker/docker-compose.yml up -d

# 4. Run database migrations
pnpm migration:run:primary
pnpm migration:run:audit

# 5. Seed development data (1 HRD admin + 5 employees)
pnpm seed

# 6. Start services
pnpm start:auth        # http://localhost:3000
pnpm start:attendance  # http://localhost:3001
pnpm start:audit       # http://localhost:3002
```

## Scripts

| Command | Description |
|:---|:---|
| `pnpm build` | Build all apps and libraries |
| `pnpm lint` | Lint all projects |
| `pnpm test` | Run all tests |
| `pnpm typecheck` | Type-check all projects |
| `pnpm seed` | Seed development data |
| `pnpm migration:run:primary` | Run primary DB migrations |
| `pnpm migration:run:audit` | Run audit DB migrations |

## Seed Accounts

| Role | Email | Password |
|:---|:---|:---|
| HRD Admin | `admin@company.com` | `Admin123!` |
| Employee | `employee1@company.com` .. `employee5@company.com` | `Employee123!` |

## Documentation

- Product requirements: [`PRD.md`](./PRD.md)
- Agent engineering guide: [`AGENTS.md`](./AGENTS.md)
