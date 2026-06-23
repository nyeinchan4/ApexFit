# Membership Service

Manages **plans, subscriptions, and cash payment verification** for ApexFit.

## Endpoints

### Plans
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/plans` | ❌ | List all active plans |
| `GET` | `/api/v1/plans/:id` | ❌ | Get plan details |
| `POST` | `/api/v1/plans` | 🔐 admin | Create a new plan |
| `PATCH` | `/api/v1/plans/:id` | 🔐 admin | Update a plan |
| `DELETE` | `/api/v1/plans/:id` | 🔐 admin | Delete a plan |

### Subscriptions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/subscriptions/me` | ✅ member | Get own subscription + days remaining (gauge) |
| `POST` | `/api/v1/subscriptions` | ✅ member | Subscribe to a plan |
| `GET` | `/api/v1/subscriptions` | 🔐 staff/admin | List all subscriptions |
| `PATCH` | `/api/v1/subscriptions/:id/extend` | 🔐 staff/admin | Manual extension |

### Payments
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/payments/me` | ✅ member | Member's own payment history |
| `POST` | `/api/v1/payments` | ✅ member | Submit cash payment |
| `GET` | `/api/v1/payments` | 🔐 staff/admin | Pending queue + KPI totals |
| `POST` | `/api/v1/payments/:id/verify` | 🔐 staff/admin | Verify → auto-activates subscription |
| `POST` | `/api/v1/payments/:id/reject` | 🔐 staff/admin | Reject payment |

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | ❌ | Service + DB status |

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env

# 3. Migrate schema
npm run migrate

# 4. Seed default plans (Basic / Premium / Elite)
npm run seed

# 5. Start dev server
npm run dev
```

## Background Jobs
- **Expiry Job** *(hourly)*: automatically marks expired subscriptions as `expired`

## Docker

```bash
docker build -t apexfit/membership-service:latest .
docker run -p 3002:3002 --env-file .env apexfit/membership-service:latest
```
