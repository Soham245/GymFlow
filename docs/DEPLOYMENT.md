# GymFlow — Deployment Guide

**Version:** 0.1.0
**Stack:** Vercel (frontend) + Render (backend) + Neon (database)
**Last updated:** 2026-06-07

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Vercel (CDN)  │────▶│  Render (API)   │────▶│  Neon (Postgres) │
│   Frontend SPA  │     │  Express + Node │     │  Serverless DB   │
│   React 19      │     │  Port 3000      │     │  Connection pool │
└─────────────────┘     └─────────────────┘     └──────────────────┘
```

| Layer | Service | Why |
|---|---|---|
| **Database** | Neon | Serverless Postgres, free tier, auto-scaling, branching |
| **Backend** | Render | Node.js hosting, auto-deploy from Git, env var management, free tier |
| **Frontend** | Vercel | Static SPA hosting, global CDN, instant deploys |

---

## 1. Neon Database Setup

### 1a. Create Project

1. Go to [neon.tech](https://neon.tech) and sign in
2. Create a new project: **gymflow-production**
3. Select region closest to your users (e.g., **ap-southeast-1** for India)
4. Copy the connection string:
   ```
   postgresql://neondb_owner:xxxx@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

### 1b. Run Migrations

From your local machine with the production DATABASE_URL set:

```bash
# Set the production database URL temporarily
export DATABASE_URL="postgresql://neondb_owner:xxxx@ep-xxx.aws.neon.tech/neondb?sslmode=require"

# Run migrations
pnpm db:migrate

# Seed with demo data (non-destructive — safe for production)
pnpm db:seed
```

> **WARNING:** Never run `pnpm db:reset` against a production database.
> `db:reset` truncates ALL tables before reseeding — it is for development only.
> Use `db:seed` for production — it is non-destructive and skips if data already exists.

### 1c. Neon Configuration

In the Neon dashboard:

- **Connection pooling**: Enabled (default). Use the pooled connection string for the API.
- **Auto-suspend**: Set to 5 minutes (free tier default). First request after idle takes ~1s cold start.
- **Compute size**: 0.25 CU is sufficient for early usage.
- **Branching**: Use for staging/testing — create a branch of production data without affecting live.

---

## 2. Render Backend Deployment

### 2a. Create Web Service

1. Go to [render.com](https://render.com) and sign in
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. Configure:

| Setting | Value |
|---|---|
| **Name** | `gymflow-api` |
| **Region** | Singapore (or closest to your users) |
| **Branch** | `frontend-development` (or your deploy branch) |
| **Root Directory** | (leave empty — monorepo root) |
| **Runtime** | Node |
| **Build Command** | `pnpm install --frozen-lockfile` |
| **Start Command** | `pnpm --filter @gymflow/api start` |
| **Plan** | Free (or Starter for always-on) |

### 2b. Environment Variables

Set these in Render's **Environment** tab:

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:...` | From Neon dashboard (pooled connection) |
| `JWT_ACCESS_SECRET` | (generate 64-char random string) | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | (generate 64-char random string) | `openssl rand -hex 32` — must differ from access secret |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Refresh token lifetime |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `3000` | Render maps this to its external URL |
| `CORS_ORIGIN` | `https://gymflow.vercel.app` | Your Vercel frontend URL (comma-separated for multiple) |

### 2c. Generate Secrets

```bash
# Generate JWT secrets (run locally, paste into Render)
openssl rand -hex 32
# → e.g. a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0

openssl rand -hex 32
# → e.g. 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2
```

### 2d. Health Check

In Render → Settings → Health Check:

| Setting | Value |
|---|---|
| **Health Check Path** | `/health` |

The `/health` and `/health/db` endpoints require no authentication.

### 2e. Custom Domain (Optional)

1. In Render → Settings → Custom Domains
2. Add custom domain: `api.yourgym.com`
3. Add the CNAME record to your DNS provider
4. Update `CORS_ORIGIN` to include both Vercel and custom domains

### 2f. Verify Deployment

```bash
# Health check (no auth required)
curl https://gymflow-api.onrender.com/health

# Expected response:
# {"status":"ok","version":"0.1.0","uptime":"...","environment":"production"}

# Database health
curl https://gymflow-api.onrender.com/health/db
```

> **Note:** Render free tier spins down after 15 minutes of inactivity. First request after idle takes ~30-60s to cold start. Upgrade to Starter ($7/mo) for always-on.

---

## 3. Vercel Frontend Deployment

### 3a. Create Project

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New** → **Project** → Import your GitHub repo
3. Configure:

| Setting | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `apps/web` |
| **Build Command** | `cd ../.. && pnpm install --frozen-lockfile && pnpm build:web` |
| **Output Directory** | `dist` |
| **Install Command** | (leave empty — handled in build command) |

### 3b. Environment Variables

| Variable | Value | Notes |
|---|---|---|
| `VITE_API_URL` | `https://gymflow-api.onrender.com/api/v1` | Render backend URL + `/api/v1` |

### 3c. SPA Routing

The `apps/web/vercel.json` is already configured:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures all routes (e.g., `/members/123`) serve `index.html` so React Router handles client-side routing.

### 3d. Verify Deployment

1. Open `https://gymflow.vercel.app` (or your Vercel URL)
2. Login screen should appear
3. Login with: `owner@ironparadise.in` / `Admin@123`
4. Dashboard should load with data from Neon

---

## 4. Environment Variables Reference

### Complete List

| Variable | Required | Default | Used By | Description |
|---|---|---|---|---|
| `DATABASE_URL` | Yes | — | API, DB | Neon PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | — | API | Min 32 chars, used to sign access tokens |
| `JWT_REFRESH_SECRET` | Yes | — | API | Min 32 chars, used to sign refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | API | Access token expiry (e.g., `15m`, `1h`) |
| `JWT_REFRESH_EXPIRES_IN` | No | `30d` | API | Refresh token expiry (e.g., `7d`, `30d`) |
| `PORT` | No | `3000` | API | HTTP server port |
| `NODE_ENV` | No | `development` | API | `production` or `development` |
| `CORS_ORIGIN` | No | `http://localhost:5173` | API | Allowed origins (comma-separated) |
| `VITE_API_URL` | No | `/api/v1` | Web | Backend API base URL |

### Security Checklist

- [ ] JWT secrets are unique, random, and at least 32 characters
- [ ] JWT access and refresh secrets are different from each other
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`)
- [ ] `CORS_ORIGIN` is set to your exact frontend domain(s)
- [ ] `NODE_ENV` is set to `production`
- [ ] No secrets are committed to the repository
- [ ] `.env` is in `.gitignore`

---

## 5. Post-Deployment Checklist

```bash
API_URL="https://gymflow-api.onrender.com"

# 1. Health check
curl $API_URL/health
curl $API_URL/health/db

# 2. Login
curl -X POST $API_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@ironparadise.in","password":"Admin@123"}'

# 3. Dashboard loads
TOKEN="<paste access token>"
curl $API_URL/api/v1/dashboard -H "Authorization: Bearer $TOKEN"

# 4. Members list
curl "$API_URL/api/v1/members?limit=5" -H "Authorization: Bearer $TOKEN"

# 5. Export works
curl -o test.csv "$API_URL/api/v1/exports/members.csv" -H "Authorization: Bearer $TOKEN"
```

### Frontend Checklist

- [ ] Login page loads at your Vercel URL
- [ ] Can log in with owner credentials
- [ ] Dashboard shows data
- [ ] Members list loads with pagination
- [ ] Can create a new member
- [ ] Can record a payment
- [ ] Reports load
- [ ] Exports download
- [ ] Mobile layout works (test on phone)
- [ ] Receptionist login works with restricted permissions

---

## 6. Rollback Procedure

### 6a. Frontend Rollback (Vercel)

Vercel keeps every deployment immutable.

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Find the last known-good deployment
3. Click the **...** menu → **Promote to Production**
4. The previous version is live within seconds

### 6b. Backend Rollback (Render)

Render keeps deployment history.

1. Go to **Render Dashboard** → Your Service → **Events**
2. Find the last known-good deploy
3. Click **Manual Deploy** → select the previous commit
4. Render rebuilds and deploys the previous version

### 6c. Database Rollback (Neon)

Neon supports **Point-in-Time Recovery (PITR)** on paid plans.

**Free tier recovery:**
1. If you have a recent backup or know the seed state is clean:
   ```bash
   # WARNING: This is destructive — development only!
   export DATABASE_URL="your-production-url"
   pnpm db:reset
   ```
   This truncates all tables and reseeds — **destructive, use only as absolute last resort**.

2. For data-preserving safety, use Neon branching:
   ```bash
   # Before any risky operation, create a branch
   neonctl branches create --name pre-migration-backup
   ```

**Paid tier recovery:**
1. Go to **Neon Dashboard** → Project → **Restore**
2. Select a point in time before the issue
3. Restore to a new branch, verify, then promote

### 6d. Full Rollback Sequence

If everything is broken:

1. **Frontend**: Promote previous Vercel deployment (instant)
2. **Backend**: Redeploy previous commit on Render (30-60s rebuild)
3. **Database**: Only if data is corrupted — restore from branch or reseed
4. **Verify**: Run post-deployment checklist

---

## 7. Monitoring

### Health Endpoints

| URL | Auth | What It Checks |
|---|---|---|
| `GET /health` | None | API server is running, uptime, version |
| `GET /health/db` | None | Database connectivity + latency |

### What to Monitor

- **Uptime**: Hit `/health` every 60s (use Render's built-in health checks or UptimeRobot)
- **DB latency**: `/health/db` returns `latencyMs` — alert if > 500ms consistently
- **Error rate**: Check Render logs for 500 errors
- **Login failures**: Rate limiter kicks in at 10 attempts / 15 min per IP

### Render Logs

View logs in the Render dashboard → Your Service → **Logs** tab.

---

## 8. Cost Estimate

| Service | Free Tier | Paid Tier |
|---|---|---|
| **Neon** | 0.5 GB storage, 190 compute hours/month | $19/mo (10 GB, unlimited compute) |
| **Render** | 750 hours/month (spins down after 15 min idle) | $7/mo Starter (always-on) |
| **Vercel** | 100 GB bandwidth, unlimited deploys | $20/mo (team features) |
| **Total** | Free to start | ~$30-50/mo |

For a single-gym operation with < 500 members, the free/starter tiers of all three services are sufficient.

---

## 9. Local Development Reference

```bash
# Clone and install
git clone <repo-url>
cd gym-console
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your Neon DATABASE_URL and JWT secrets

# Database
pnpm db:migrate    # Run migrations
pnpm db:seed       # Seed with demo data (non-destructive — safe to run anytime)
pnpm db:reset      # DEVELOPMENT ONLY — truncates all tables and reseeds

# Development servers
pnpm dev:api       # Backend at http://localhost:3000
pnpm dev:web       # Frontend at http://localhost:5173
```

> **Important:** `pnpm db:seed` is safe for production — it inserts seed data only if tables are empty.
> `pnpm db:reset` is destructive — it truncates ALL tables before reseeding. Never run against production.
