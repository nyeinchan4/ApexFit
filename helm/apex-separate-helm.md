# ApexFit — Separate Helm Charts Reference

Three independent Helm charts, each responsible for one layer of the stack.
Deploy them in order: **database → backend → frontend**.

---

## Table of Contents

1. [apexfit-database](#1-apexfit-database)
2. [apexfit-backend](#2-apexfit-backend)
3. [apexfit-frontend](#3-apexfit-frontend)
4. [Install Order & Commands](#4-install-order--commands)
5. [values.yaml vs values-dev.yaml Diff](#5-valuesyaml-vs-values-devyaml-diff)
6. [Naming Rules — How Release Names Affect Everything](#6-naming-rules--how-release-names-affect-everything)

---

## 1. `apexfit-database`

**Path**: `helm/apexfit-database/`

**Owns**:
- Bitnami PostgreSQL StatefulSet (3 databases)
- One shared K8s `Secret` consumed by all backend services

### Files

```
apexfit-database/
├── Chart.yaml          # wraps bitnami/postgresql as a dependency
├── values.yaml         # production defaults
├── values-dev.yaml     # dev overrides (smaller PVC, lighter resources)
├── charts/
│   └── postgresql-16.x.tgz
└── templates/
    ├── _helpers.tpl
    └── secret.yaml     # ← THE most important file in this chart
```

### Chart.yaml

```yaml
apiVersion: v2
name: apexfit-database
version: 0.1.0
appVersion: "16.x"

dependencies:
  - name: postgresql
    version: "16.x.x"
    repository: oci://registry-1.docker.io/bitnamicharts
    condition: postgresql.enabled   # set false → uses externalPostgresql instead
```

### values.yaml (production defaults)

```yaml
namespace:
  name: apexfit

# JWT secrets written into the shared K8s Secret
secrets:
  jwtAccessSecret: "CHANGE_ME_access_secret"    # ⚠ override in production
  jwtRefreshSecret: "CHANGE_ME_refresh_secret"  # ⚠ override in production

postgresql:
  enabled: true
  auth:
    username: postgres
    password: "changeme"           # ⚠ override in production
    database: apexfit_users        # primary DB (created automatically by Bitnami)
  primary:
    initdb:
      scripts:
        init-db.sql: |             # runs once on first pod start
          SELECT 'CREATE DATABASE apexfit_memberships'
          WHERE NOT EXISTS (
              SELECT FROM pg_database WHERE datname = 'apexfit_memberships'
          )\gexec

          SELECT 'CREATE DATABASE apexfit_admin'
          WHERE NOT EXISTS (
              SELECT FROM pg_database WHERE datname = 'apexfit_admin'
          )\gexec
    persistence:
      enabled: true
      size: 8Gi
    resources:
      requests: { memory: "256Mi", cpu: "250m" }
      limits:   { memory: "512Mi", cpu: "500m" }

# Only used when postgresql.enabled: false
externalPostgresql:
  host: ""
  port: 5432
```

### values-dev.yaml (dev overrides only)

```yaml
secrets:
  jwtAccessSecret: "dev_access_secret_not_for_production"
  jwtRefreshSecret: "dev_refresh_secret_not_for_production"

postgresql:
  image:
    tag: latest           # Bitnami free-tier; use specific tag in production
  auth:
    password: "changeme"
  primary:
    persistence:
      size: 1Gi           # ← smaller PVC for local dev
    resources:
      requests: { memory: "128Mi", cpu: "100m" }
      limits:   { memory: "256Mi", cpu: "250m" }
```

### secret.yaml — what gets created

```yaml
# Name: <release-name>-secrets
# e.g. release "apexfit-database" → secret "apexfit-database-secrets"
apiVersion: v1
kind: Secret
type: Opaque
stringData:
  JWT_ACCESS_SECRET:  <secrets.jwtAccessSecret>
  JWT_REFRESH_SECRET: <secrets.jwtRefreshSecret>
  DB_USER:            <postgresql.auth.username>
  DB_PASSWORD:        <postgresql.auth.password>
  DB_HOST:            <release-name>-postgresql          # internal K8s service name
  DB_PORT:            "5432"
```

> **Rule**: Secret name = `<release-name>-secrets`. If you install as `apexfit-database`,
> secret = `apexfit-database-secrets`. The backend chart's `sharedSecretName` must match.

### Databases created

| Database | How |
|---|---|
| `apexfit_users` | Bitnami `POSTGRES_DB` env var (automatic) |
| `apexfit_memberships` | `initdb.scripts` SQL script (runs once on first start) |
| `apexfit_admin` | `initdb.scripts` SQL script (runs once on first start) |

---

## 2. `apexfit-backend`

**Path**: `helm/apexfit-backend/`

**Owns**:
- `api-gateway` (port 3000) — entry point, routes to downstream services
- `user-service` (port 3001) — auth, user profile
- `membership-service` (port 3002) — plans, subscriptions, payments
- `admin-service` (port 3003) — dashboard, members, staff, audit

Each service gets a `Deployment` + `ClusterIP` `Service`.

### Files

```
apexfit-backend/
├── Chart.yaml
├── values.yaml         # production defaults (apexfit/ image repos, 2 replicas)
├── values-dev.yaml     # dev overrides (nyeinchan468/ repos, 1 replica, Always pull)
└── templates/
    ├── _helpers.tpl
    ├── api-gateway.yaml        # Deployment + Service
    ├── user-service.yaml       # Deployment + Service
    ├── membership-service.yaml # Deployment + Service
    └── admin-service.yaml      # Deployment + Service
```

### values.yaml (production defaults)

```yaml
namespace:
  name: apexfit

global:
  imageRegistry: ""
  imagePullSecrets: []

image:
  pullPolicy: IfNotPresent
  tag: latest

# ⚠ Must match: <database-release-name>-secrets
sharedSecretName: "apexfit-secrets"

# ⚠ Must match: <database-release-name>-postgresql
database:
  host: "apexfit-postgresql"
  port: "5432"

apiGateway:
  enabled: true
  name: api-gateway
  image:
    repository: apexfit/api-gateway
    tag: ""                 # empty = falls back to global image.tag
  replicaCount: 2
  port: 3000
  env:
    NODE_ENV: "production"
    PORT: "3000"
    SERVICE_NAME: api-gateway
    ALLOWED_ORIGINS: "https://admin.apexfit.example.com,https://app.apexfit.example.com"
  resources:
    requests: { memory: "128Mi", cpu: "100m" }
    limits:   { memory: "256Mi", cpu: "250m" }
  autoscaling:
    enabled: false
    minReplicas: 2
    maxReplicas: 8
    targetCPUUtilizationPercentage: 60
  service:
    type: ClusterIP
  livenessProbe:
    path: /health
    initialDelaySeconds: 15
    periodSeconds: 20
    timeoutSeconds: 15
    failureThreshold: 5
  readinessProbe:
    path: /health
    initialDelaySeconds: 10
    periodSeconds: 10
    timeoutSeconds: 15
    failureThreshold: 5

# userService, membershipService follow the same shape.
# adminService has two extra env vars (see below).
```

### values-dev.yaml (dev overrides only)

```yaml
image:
  pullPolicy: Always     # always pull latest tag in dev

sharedSecretName: "apexfit-database-secrets"     # matches actual release name
database:
  host: "apexfit-database-postgresql"             # matches actual release name

apiGateway:
  image:
    repository: nyeinchan468/apexfit-api-gateway  # Docker Hub real image
    tag: "latest"
  replicaCount: 1
  env:
    NODE_ENV: "development"
    ALLOWED_ORIGINS: "http://localhost:8899,http://localhost:8900,http://localhost:3000"
  livenessProbe:
    initialDelaySeconds: 30   # longer delay — dev images are slower to start

userService:
  image:
    repository: nyeinchan468/apexfit-user-service
  replicaCount: 1
  env:
    NODE_ENV: "development"

membershipService:
  image:
    repository: nyeinchan468/apexfit-membership-service
  replicaCount: 1
  env:
    NODE_ENV: "development"

adminService:
  image:
    repository: nyeinchan468/apexfit-admin-service
  replicaCount: 1
  env:
    NODE_ENV: "development"
    # ⚠ Required: admin-service /health calls these to check downstream health.
    # Without them, /health always returns 503 → readiness fails → CrashLoopBackOff.
    USER_SERVICE_URL: "http://apexfit-backend-user-service:3001"
    MEMBERSHIP_SERVICE_URL: "http://apexfit-backend-membership-service:3002"
```

### How secrets are mounted per service

Each Deployment template mounts credentials from `sharedSecretName`:

```yaml
# Injected automatically by the templates (NOT in env: block)
- name: DB_USER
  valueFrom:
    secretKeyRef:
      name: apexfit-database-secrets   # = sharedSecretName
      key: DB_USER
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: apexfit-database-secrets
      key: DB_PASSWORD
- name: JWT_ACCESS_SECRET
  valueFrom:
    secretKeyRef:
      name: apexfit-database-secrets
      key: JWT_ACCESS_SECRET
- name: JWT_REFRESH_SECRET
  valueFrom:
    secretKeyRef:
      name: apexfit-database-secrets
      key: JWT_REFRESH_SECRET
```

### Per-service differences

| Key | `api-gateway` | `user-service` | `membership-service` | `admin-service` |
|---|---|---|---|---|
| Port | 3000 | 3001 | 3002 | 3003 |
| `DB_NAME` | *(none)* | `apexfit_users` | `apexfit_memberships` | `apexfit_admin` |
| `JWT_REFRESH_SECRET` | ✗ | ✓ | ✓ | ✓ |
| `USER_SERVICE_URL` | auto-injected | ✗ | ✗ | must set in `env:` |
| `MEMBERSHIP_SERVICE_URL` | auto-injected | ✗ | ✗ | must set in `env:` |
| `ADMIN_SERVICE_URL` | auto-injected | ✗ | ✗ | ✗ |
| prod replicas | 2 | 2 | 2 | 1 |
| dev replicas | 1 | 1 | 1 | 1 |

> **`admin-service` `/health` is an aggregate check** — it calls `user-service` and
> `membership-service` to report their health. If `USER_SERVICE_URL` or
> `MEMBERSHIP_SERVICE_URL` are missing from the env, health always returns 503.
> This cascades: api-gateway also returns 503 → both pods fail readiness → loop.

---

## 3. `apexfit-frontend`

**Path**: `helm/apexfit-frontend/`

**Owns**:
- `admin-portal` — staff dashboard React SPA (served by Nginx, port 80)
- `member-app` — member app React SPA (served by Nginx, port 80)

No database connections. No JWT secrets. Nginx proxies API calls to the api-gateway.

### Files

```
apexfit-frontend/
├── Chart.yaml
├── values.yaml         # production defaults (apexfit/ image repos)
├── values-dev.yaml     # dev overrides (nyeinchan468/ repos, Always pull)
└── templates/
    ├── _helpers.tpl
    ├── admin-portal.yaml   # Deployment + Service
    └── member-app.yaml     # Deployment + Service
```

### values.yaml (production defaults)

```yaml
namespace:
  name: apexfit

global:
  imageRegistry: ""
  imagePullSecrets: []

image:
  pullPolicy: IfNotPresent
  tag: latest

adminPortal:
  enabled: true
  name: admin-portal
  image:
    repository: apexfit/admin-portal
    tag: ""
  replicaCount: 1
  port: 80
  env:
    API_GATEWAY_HOST: ""     # set to <backend-release-name>-api-gateway
  resources:
    requests: { memory: "64Mi", cpu: "50m" }
    limits:   { memory: "128Mi", cpu: "100m" }
  service:
    type: ClusterIP
  livenessProbe:
    path: /
    initialDelaySeconds: 10
    periodSeconds: 20
  readinessProbe:
    path: /
    initialDelaySeconds: 5
    periodSeconds: 10

memberApp:
  # identical shape to adminPortal
  image:
    repository: apexfit/member-app
```

### values-dev.yaml (dev overrides only)

```yaml
image:
  pullPolicy: Always

adminPortal:
  image:
    repository: nyeinchan468/apexfit-admin-portal
    tag: "latest"
  env:
    # Must match actual backend release: <release>-api-gateway
    API_GATEWAY_HOST: "apexfit-backend-api-gateway"

memberApp:
  image:
    repository: nyeinchan468/apexfit-member-app
    tag: "latest"
  env:
    API_GATEWAY_HOST: "apexfit-backend-api-gateway"
```

### How `API_GATEWAY_HOST` works

The nginx config template inside the Docker image uses `envsubst` to substitute `${API_GATEWAY_HOST}` at container startup:

```nginx
# nginx config template inside Docker image
upstream api_backend {
    server ${API_GATEWAY_HOST}:3000;
}
```

At startup, the entrypoint runs:
```bash
envsubst '${API_GATEWAY_HOST}' < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf
nginx -g 'daemon off;'
```

So `API_GATEWAY_HOST=apexfit-backend-api-gateway` in the pod env resolves to the
real api-gateway K8s Service DNS name at runtime.

> **If the Docker image was NOT built with `envsubst` template** (hostname baked in as
> a literal string), the env var has no effect. The DNS name must exist in-cluster
> exactly as it was hardcoded at build time.

---

## 4. Install Order & Commands

Always install in this order — the backend needs the Secret from the database to start.

### Step 1 — Database

```bash
# Fetch Bitnami PostgreSQL dependency
helm dependency update ./helm/apexfit-database

# Install
helm install apexfit-database ./helm/apexfit-database \
  -f helm/apexfit-database/values-dev.yaml \
  -n apexfit --create-namespace

# Verify
kubectl get pods -n apexfit
# apexfit-database-postgresql-0   1/1   Running   ✓

kubectl get secret apexfit-database-secrets -n apexfit
# Opaque   6 keys   ✓
```

### Step 2 — Backend

```bash
helm install apexfit-backend ./helm/apexfit-backend \
  -f helm/apexfit-backend/values-dev.yaml \
  -n apexfit

# Verify
kubectl get pods -n apexfit
# apexfit-backend-api-gateway-xxx        1/1   Running   ✓
# apexfit-backend-user-service-xxx       1/1   Running   ✓
# apexfit-backend-membership-service-xxx 1/1   Running   ✓
# apexfit-backend-admin-service-xxx      1/1   Running   ✓
```

### Step 3 — Frontend

```bash
helm install apexfit-frontend ./helm/apexfit-frontend \
  -f helm/apexfit-frontend/values-dev.yaml \
  -n apexfit

# Verify
kubectl get pods -n apexfit
# apexfit-frontend-admin-portal-xxx 1/1   Running   ✓
# apexfit-frontend-member-app-xxx   1/1   Running   ✓
```

### Upgrade (after code changes)

```bash
helm upgrade apexfit-backend ./helm/apexfit-backend \
  -f helm/apexfit-backend/values-dev.yaml -n apexfit

helm upgrade apexfit-frontend ./helm/apexfit-frontend \
  -f helm/apexfit-frontend/values-dev.yaml -n apexfit
```

### Uninstall

```bash
helm uninstall apexfit-frontend -n apexfit
helm uninstall apexfit-backend  -n apexfit
helm uninstall apexfit-database -n apexfit
```

### Dry-run (preview rendered manifests)

```bash
helm template apexfit-database ./helm/apexfit-database \
  -f helm/apexfit-database/values-dev.yaml | grep "^# Source:"

helm template apexfit-backend ./helm/apexfit-backend \
  -f helm/apexfit-backend/values-dev.yaml | grep "^# Source:"

helm template apexfit-frontend ./helm/apexfit-frontend \
  -f helm/apexfit-frontend/values-dev.yaml | grep "^# Source:"
```

---

## 5. `values.yaml` vs `values-dev.yaml` Diff

| Setting | `values.yaml` (prod) | `values-dev.yaml` (dev) |
|---|---|---|
| **image.pullPolicy** | `IfNotPresent` | `Always` |
| **image repos** | `apexfit/*` (placeholder) | `nyeinchan468/apexfit-*` (real Docker Hub) |
| **replicaCount** | `2` (backend) | `1` |
| **secrets** | `CHANGE_ME_*` | `dev_*_not_for_production` |
| **postgresql PVC** | `8Gi` | `1Gi` |
| **postgresql resources** | 256Mi / 500m | 128Mi / 250m |
| **sharedSecretName** | `apexfit-secrets` | `apexfit-database-secrets` |
| **database.host** | `apexfit-postgresql` | `apexfit-database-postgresql` |
| **ALLOWED_ORIGINS** | production domains | `localhost:*` ports |
| **initialDelaySeconds** | 15s | 30s (slower dev images) |
| **NODE_ENV** | `production` | `development` |

---

## 6. Naming Rules — How Release Names Affect Everything

The Helm **release name** is the string you pass as the first argument to `helm install`.
It becomes a prefix in every K8s resource name, and those names become DNS hostnames.

```
helm install  apexfit-database  ./helm/apexfit-database
               ↑ release name

Creates K8s resources:
  Secret:      apexfit-database-secrets        ← consumed by backend
  Service:     apexfit-database-postgresql     ← consumed by backend (DB host)
  StatefulSet: apexfit-database-postgresql
```

```
helm install  apexfit-backend  ./helm/apexfit-backend
               ↑ release name

Creates K8s resources:
  Service: apexfit-backend-api-gateway         ← consumed by frontend (API_GATEWAY_HOST)
  Service: apexfit-backend-user-service
  Service: apexfit-backend-membership-service
  Service: apexfit-backend-admin-service
```

### Cross-chart wiring summary

```
apexfit-database release name
    │
    ├─► Secret name:          apexfit-database-secrets
    │       consumed by ────► backend.sharedSecretName in values-dev.yaml
    │
    └─► PostgreSQL svc name:  apexfit-database-postgresql
            consumed by ────► backend.database.host in values-dev.yaml

apexfit-backend release name
    │
    └─► api-gateway svc name: apexfit-backend-api-gateway
            consumed by ────► frontend.adminPortal.env.API_GATEWAY_HOST
                              frontend.memberApp.env.API_GATEWAY_HOST
```

> If you change any release name, you must update the corresponding value in the
> chart that consumes it.

*Last updated: 2026-06-28*
