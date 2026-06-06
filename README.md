# GymFlow

Production-grade Gym Business Operating System built for real gym owners in India.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 20+ |
| **Language** | TypeScript 5.7 |
| **Framework** | Express 5 |
| **Database** | PostgreSQL (Neon Serverless) |
| **ORM** | Drizzle ORM |
| **Validation** | Zod |
| **Auth** | JWT (access + refresh tokens) |
| **Monorepo** | pnpm workspaces |

## Project Structure

```
gymflow/
  apps/
    api/              # Express REST API (62 endpoints)
  packages/
    db/               # Drizzle schema, migrations, seeds
    shared/           # Zod schemas, types, constants
  docs/
    API-CONTRACT.md   # Complete API reference
    MESSAGING-DESIGN.md  # Messaging system architecture
    api-reference.yaml   # OpenAPI spec
```

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- PostgreSQL database (Neon recommended)

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Soham245/GymFlow.git
cd GymFlow
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | Min 32 chars, random string |
| `JWT_REFRESH_SECRET` | Yes | Min 32 chars, random string |
| `JWT_ACCESS_EXPIRES_IN` | No | Default: `15m` |
| `JWT_REFRESH_EXPIRES_IN` | No | Default: `30d` |
| `PORT` | No | Default: `3000` |
| `NODE_ENV` | No | Default: `development` |
| `CORS_ORIGIN` | No | Default: `http://localhost:5173` |

### 3. Run migrations

```bash
pnpm db:migrate
```

### 4. Seed demo data

```bash
pnpm db:seed
```

This creates:
- 1 gym (Iron Paradise Gym)
- 1 owner user (`owner@ironparadise.in` / `Admin@123`)
- 1 receptionist, 2 trainers
- 3 membership plans
- 10 members with memberships and payments
- Expense categories and sample expenses

### 5. Start development server

```bash
pnpm dev:api
```

API runs at `http://localhost:3000/api/v1`

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev:api` | Start API in development (hot reload) |
| `pnpm build:api` | Compile TypeScript to JavaScript |
| `pnpm db:generate` | Generate new migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:seed` | Seed database with demo data |
| `pnpm db:studio` | Open Drizzle Studio (DB browser) |
| `pnpm typecheck` | Run TypeScript type checking |

## API Overview

All endpoints are prefixed with `/api/v1`. Authentication uses Bearer JWT tokens.

### Modules (62 endpoints)

| Module | Endpoints | Description |
|--------|-----------|-------------|
| Auth | 5 | Login, refresh, logout, change password, profile |
| Members | 8 | CRUD, search, status management |
| Membership Plans | 5 | CRUD with soft-delete |
| Memberships | 11 | Assign, renew, freeze, cancel, transfer |
| Payments | 8 | Record, void, receipts (PDF) |
| Expenses | 5 | CRUD with category filtering |
| Expense Categories | 4 | CRUD |
| Dashboard | 2 | Today's summary + KPI stats |
| Reports | 4 | Revenue, members, memberships, expenses |
| Automation | 3 | Expiring/expired lookups, daily summary |
| Exports | 7 | CSV/Excel exports for all modules |

### Quick Test

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@ironparadise.in","password":"Admin@123"}'

# Use the returned accessToken for authenticated requests
curl http://localhost:3000/api/v1/dashboard/summary \
  -H "Authorization: Bearer <accessToken>"
```

## API Documentation

- **API Contract**: [docs/API-CONTRACT.md](docs/API-CONTRACT.md) -- full endpoint reference with examples
- **OpenAPI Spec**: [docs/api-reference.yaml](docs/api-reference.yaml) -- import into Postman/Swagger
- **Messaging Design**: [docs/MESSAGING-DESIGN.md](docs/MESSAGING-DESIGN.md) -- future messaging system architecture

## Database

### Schema (13 core tables + 3 messaging tables)

**Core**: gyms, users, refresh_tokens, members, membership_plans, memberships, membership_freezes, payments, expense_categories, expenses, notifications_log, automation_config, audit_log

**Messaging** (schema only, controllers not yet implemented): message_templates, scheduled_messages, message_log

### Migrations

Migrations live in `packages/db/src/migrations/` and are managed by Drizzle:

| Migration | Description |
|-----------|-------------|
| `0000_spicy_micromax.sql` | Core schema (13 tables, 11 enums) |
| `0001_faulty_kang.sql` | Messaging tables (3 tables, 2 enums) |

## Deployment

### Production build

```bash
pnpm build:api
NODE_ENV=production node apps/api/dist/server.js
```

### Environment checklist

- [ ] Set strong random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Set `CORS_ORIGIN` to your frontend domain
- [ ] Ensure `DATABASE_URL` uses connection pooling
- [ ] Do NOT run `db:seed` in production

## License

Private -- All rights reserved.
