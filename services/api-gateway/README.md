# API Gateway

Single entry point for all ApexFit services. Routes, authenticates, and rate-limits every request.

## Routing Table

| Prefix | Target Service | Auth | Roles |
|--------|---------------|------|-------|
| `/api/v1/auth` | user-service :3001 | ❌ public | — |
| `/api/v1/profile` | user-service :3001 | ✅ JWT | any |
| `/api/v1/plans` | membership-service :3002 | ❌ public | — |
| `/api/v1/subscriptions` | membership-service :3002 | ✅ JWT | any |
| `/api/v1/payments` | membership-service :3002 | ✅ JWT | any |
| `/api/v1/dashboard` | admin-service :3003 | ✅ JWT | staff, admin |
| `/api/v1/members` | admin-service :3003 | ✅ JWT | staff, admin |
| `/api/v1/staff` | admin-service :3003 | ✅ JWT | admin |
| `/api/v1/audit` | admin-service :3003 | ✅ JWT | staff, admin |
| `/health` | gateway (local) | ❌ | — |

## Features

- 🔀 **HTTP Proxy** — forwards requests via `http-proxy-middleware`
- 🔐 **JWT Pre-validation** — validates tokens before proxying; forwards `X-User-ID` and `X-User-Role` headers
- 🪪 **Correlation IDs** — every request gets a `X-Correlation-ID` for distributed tracing
- 🚦 **Per-route Rate Limits** — stricter limits on auth routes, relaxed on read-heavy routes
- 🏥 **Aggregated Health** — `/health` polls all downstream services

## Architecture

```
Client (browser / mobile)
        │
        ▼
  API Gateway :3000
  ├── /api/v1/auth/*         → User Service :3001
  ├── /api/v1/profile/*      → User Service :3001
  ├── /api/v1/plans/*        → Membership Service :3002
  ├── /api/v1/subscriptions/*→ Membership Service :3002
  ├── /api/v1/payments/*     → Membership Service :3002
  ├── /api/v1/dashboard/*    → Admin Service :3003
  ├── /api/v1/members/*      → Admin Service :3003
  ├── /api/v1/staff/*        → Admin Service :3003
  └── /api/v1/audit/*        → Admin Service :3003
```

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev       # Start on port 3000
```

## Docker

```bash
docker build -t apexfit/api-gateway:latest .
docker run -p 3000:3000 --env-file .env apexfit/api-gateway:latest
```
