# User Service

Handles **authentication** and **member profile** management for ApexFit.

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/v1/auth/register` | ❌ | Register a new member |
| `POST` | `/api/v1/auth/login` | ❌ | Login and receive tokens |
| `POST` | `/api/v1/auth/refresh` | 🍪 cookie | Rotate access token |
| `POST` | `/api/v1/auth/logout` | ✅ Bearer | Logout and revoke token |
| `POST` | `/api/v1/auth/change-password` | ✅ Bearer | Change password |
| `GET` | `/api/v1/profile/me` | ✅ Bearer | Get own profile |
| `PATCH` | `/api/v1/profile/me` | ✅ Bearer | Update own profile |
| `GET` | `/health` | ❌ | Health + DB status |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    → edit .env with your DB credentials and JWT secrets

# 3. Run DB migration
npm run migrate

# 4. Start in development mode
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `3001` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `apexfit_users` |
| `DB_USER` | DB username | `postgres` |
| `DB_PASSWORD` | DB password | — |
| `JWT_ACCESS_SECRET` | Access token signing key | — |
| `JWT_REFRESH_SECRET` | Refresh token signing key | — |
| `JWT_ACCESS_EXPIRES_IN` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `7d` |

## Run Tests

```bash
npm test
npm run test:coverage
```

## Docker

```bash
docker build -t apexfit/user-service:latest .
docker run -p 3001:3001 --env-file .env apexfit/user-service:latest
```
