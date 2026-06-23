# Admin Service

Staff portal backend for ApexFit — aggregates from User Service and Membership Service, maintains audit logs.

## Endpoints

### Dashboard
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/dashboard` | 🔐 staff/admin | KPI cards + recent activity (Command Center) |

### Member Management
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/members/payments` | 🔐 staff/admin | Payment queue with KPIs |
| `POST` | `/api/v1/members/payments/:id/verify` | 🔐 staff/admin | Verify payment → activates subscription |
| `POST` | `/api/v1/members/payments/:id/reject` | 🔐 staff/admin | Reject payment |
| `PATCH` | `/api/v1/members/subscriptions/:id/extend` | 🔐 staff/admin | Manual subscription extension |

### Staff Management
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/staff` | 🔐 admin | List all staff |
| `POST` | `/api/v1/staff` | 🔐 admin | Register new staff |
| `PATCH` | `/api/v1/staff/:id` | 🔐 admin | Update staff role/status |

### Audit Log
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/audit` | 🔐 staff/admin | Paginated audit trail |

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | ❌ | Own DB + downstream service status |

## Architecture

```
Admin Service (port 3003)
  ├── Own DB: staff, audit_logs
  ├── → HTTP → User Service (port 3001)
  └── → HTTP → Membership Service (port 3002)
```

Every mutating staff action is **automatically recorded** to `audit_logs` via middleware.

## Quick Start

```bash
npm install
cp .env.example .env
npm run migrate
npm run dev
```

## Docker

```bash
docker build -t apexfit/admin-service:latest .
docker run -p 3003:3003 --env-file .env apexfit/admin-service:latest
```
