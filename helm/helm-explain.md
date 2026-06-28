# ApexFit Helm Charts — Configuration Guide

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Directory Structure](#2-directory-structure)
3. [Sub-chart: apexfit-database](#3-sub-chart-apexfit-database)
4. [Sub-chart: apexfit-backend](#4-sub-chart-apexfit-backend)
5. [Sub-chart: apexfit-frontend](#5-sub-chart-apexfit-frontend)
6. [Umbrella Chart: apexfit](#6-umbrella-chart-apexfit)
7. [Helper Functions (_helpers.tpl)](#7-helper-functions-_helperstpl)
8. [How Secrets Flow](#8-how-secrets-flow)
9. [Inter-Service Communication](#9-inter-service-communication)
10. [ArgoCD Integration](#10-argocd-integration)
11. [Common Override Recipes](#11-common-override-recipes)
12. [Lessons Learned & Gotchas](#12-lessons-learned--gotchas)

---

## 1. Architecture Overview

The ApexFit Helm setup is split into **three independent sub-charts** composed by a thin **umbrella chart**.

```
helm/
├── apexfit/              ← Umbrella chart (Namespace + Ingress only)
├── apexfit-database/     ← PostgreSQL + shared K8s Secret
├── apexfit-backend/      ← api-gateway, user-service, membership-service, admin-service
└── apexfit-frontend/     ← admin-portal, member-app (Nginx SPAs)
```

### Why separate?

| Reason | Detail |
|---|---|
| Independent lifecycle | Database can be upgraded without touching app code |
| ArgoCD per-layer sync | Each layer can have its own sync wave, health checks, rollback |
| Smaller blast radius | A broken frontend deploy cannot affect the backend |
| Cleaner values files | Each chart only owns its own configuration |

### Component map

| Sub-chart | Component | Kind | Port |
|---|---|---|---|
| `apexfit-database` | PostgreSQL (Bitnami) | StatefulSet | 5432 |
| `apexfit-database` | Shared credentials | K8s Secret | — |
| `apexfit-backend` | api-gateway | Deployment + Service | 3000 |
| `apexfit-backend` | user-service | Deployment + Service | 3001 |
| `apexfit-backend` | membership-service | Deployment + Service | 3002 |
| `apexfit-backend` | admin-service | Deployment + Service | 3003 |
| `apexfit-frontend` | admin-portal (React/Nginx) | Deployment + Service | 80 |
| `apexfit-frontend` | member-app (React/Nginx) | Deployment + Service | 80 |
| `apexfit` (umbrella) | Namespace | Namespace | — |
| `apexfit` (umbrella) | Ingress | Nginx Ingress | 80/443 |

---

## 2. Directory Structure

```
helm/
├── helm-explain.md                       ← this file
│
├── apexfit/                              ← Umbrella chart
│   ├── Chart.yaml                        # version: 0.2.0 — references 3 sub-charts
│   ├── Chart.lock                        # locked dependency versions
│   ├── values.yaml                       # nested under database.*, backend.*, frontend.*
│   ├── values-dev.yaml                   # dev overrides (same nesting)
│   └── templates/
│       ├── _helpers.tpl                  # simplified — no per-service helpers
│       ├── namespace.yaml                # K8s Namespace
│       ├── ingress.yaml                  # Nginx Ingress (3 virtual hosts)
│       └── NOTES.txt
│
├── apexfit-database/                     ← Database sub-chart
│   ├── Chart.yaml                        # depends on bitnami/postgresql
│   ├── Chart.lock
│   ├── values.yaml
│   ├── values-dev.yaml
│   ├── charts/
│   │   └── postgresql-16.7.27.tgz
│   └── templates/
│       ├── _helpers.tpl
│       └── secret.yaml                   # JWT + DB credentials Secret
│
├── apexfit-backend/                      ← Backend sub-chart
│   ├── Chart.yaml
│   ├── values.yaml
│   ├── values-dev.yaml
│   └── templates/
│       ├── _helpers.tpl
│       ├── api-gateway.yaml              # Deployment + Service
│       ├── user-service.yaml             # Deployment + Service
│       ├── membership-service.yaml       # Deployment + Service
│       └── admin-service.yaml            # Deployment + Service
│
└── apexfit-frontend/                     ← Frontend sub-chart
    ├── Chart.yaml
    ├── values.yaml
    ├── values-dev.yaml
    └── templates/
        ├── _helpers.tpl
        ├── admin-portal.yaml             # Deployment + Service
        └── member-app.yaml               # Deployment + Service
```

---

## 3. Sub-chart: `apexfit-database`

### What it does

- Deploys **Bitnami PostgreSQL** as a StatefulSet with persistent storage
- Runs an `initdb` SQL script to create the three application databases
- Creates **one shared K8s Secret** (`<release-name>-secrets`) containing all credentials consumed by the backend

### Chart.yaml dependency

```yaml
dependencies:
  - name: postgresql
    version: "16.x.x"
    repository: oci://registry-1.docker.io/bitnamicharts
    condition: postgresql.enabled   # set false to use an external DB
```

### values.yaml — key sections

```yaml
# Namespace all resources land in (must match other sub-charts)
namespace:
  name: apexfit

# JWT secrets stored in the shared K8s Secret
secrets:
  jwtAccessSecret: "CHANGE_ME_access_secret"
  jwtRefreshSecret: "CHANGE_ME_refresh_secret"

# Bitnami PostgreSQL sub-chart values
postgresql:
  enabled: true
  auth:
    username: postgres
    password: "changeme"          # ⚠ CHANGE in production
    database: apexfit_users       # primary DB created automatically
  primary:
    initdb:
      scripts:
        init-db.sql: |            # runs once on first pod start
          SELECT 'CREATE DATABASE apexfit_memberships' ...
          SELECT 'CREATE DATABASE apexfit_admin' ...
    persistence:
      enabled: true
      size: 8Gi                   # 1Gi in values-dev.yaml
    resources:
      requests: { memory: 256Mi, cpu: 250m }
      limits:   { memory: 512Mi, cpu: 500m }

# External DB (when postgresql.enabled: false)
externalPostgresql:
  host: ""
  port: 5432
```

### secret.yaml — what gets created

```yaml
# Secret name: <release-name>-secrets
# e.g. if installed as "apexfit-database" → "apexfit-database-secrets"
stringData:
  JWT_ACCESS_SECRET:  <from values.secrets.jwtAccessSecret>
  JWT_REFRESH_SECRET: <from values.secrets.jwtRefreshSecret>
  DB_USER:            <from postgresql.auth.username>
  DB_PASSWORD:        <from postgresql.auth.password>
  DB_HOST:            <release-name>-postgresql   # or externalPostgresql.host
  DB_PORT:            5432
```

> **Critical**: The secret name is `<release-name>-secrets`. Whatever release name you use when installing this chart, the backend's `sharedSecretName` value must match exactly.

### Install (standalone)

```bash
# Update dependencies first (fetches Bitnami PostgreSQL .tgz)
helm dependency update ./helm/apexfit-database

# Install
helm install apexfit-database ./helm/apexfit-database \
  -f helm/apexfit-database/values-dev.yaml \
  -n apexfit --create-namespace
```

---

## 4. Sub-chart: `apexfit-backend`

### What it does

Deploys all four Node.js backend services. Each gets:
- A `Deployment` with env vars, health probes, resource limits
- A `ClusterIP` Service for in-cluster DNS access
- Credentials mounted from the database sub-chart's shared Secret

### values.yaml — key sections

```yaml
namespace:
  name: apexfit

global:
  imageRegistry: ""        # prefix for all images (e.g. ghcr.io/myorg)
  imagePullSecrets: []

image:
  pullPolicy: IfNotPresent
  tag: latest              # global fallback tag

# Name of the K8s Secret created by apexfit-database
# Format: <database-release-name>-secrets
sharedSecretName: "apexfit-secrets"

# PostgreSQL hostname
# Format: <database-release-name>-postgresql
database:
  host: "apexfit-postgresql"
  port: "5432"
```

### Service configuration shape (same for all 4 services)

```yaml
userService:               # or membershipService / adminService / apiGateway
  enabled: true
  name: user-service       # used as K8s resource name suffix
  image:
    repository: apexfit/user-service
    tag: ""                # empty → falls back to global image.tag
  replicaCount: 2
  port: 3001

  env:                     # plain-text env vars (non-sensitive)
    NODE_ENV: "production"
    PORT: "3001"
    DB_NAME: apexfit_users
    SERVICE_NAME: user-service
    JWT_ACCESS_EXPIRES_IN: "15m"

  resources:
    requests: { memory: 128Mi, cpu: 100m }
    limits:   { memory: 256Mi, cpu: 250m }

  autoscaling:
    enabled: false
    minReplicas: 2
    maxReplicas: 5
    targetCPUUtilizationPercentage: 70

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
```

### Key differences per service

| Service | Port | `DB_NAME` | Extra env vars |
|---|---|---|---|
| `userService` | 3001 | `apexfit_users` | `JWT_REFRESH_EXPIRES_IN` |
| `membershipService` | 3002 | `apexfit_memberships` | — |
| `adminService` | 3003 | `apexfit_admin` | `USER_SERVICE_URL`, `MEMBERSHIP_SERVICE_URL` |
| `apiGateway` | 3000 | *(no DB)* | `ALLOWED_ORIGINS`, auto-injects all 3 service URLs |

### Auto-injected env vars (added by templates, not `env:` block)

| Variable | Injected into | Source |
|---|---|---|
| `DB_HOST` | user, membership, admin | `database.host` value |
| `DB_PORT` | user, membership, admin | `database.port` value |
| `DB_USER` | user, membership, admin | `sharedSecretName` → `DB_USER` key |
| `DB_PASSWORD` | user, membership, admin | `sharedSecretName` → `DB_PASSWORD` key |
| `JWT_ACCESS_SECRET` | all 4 services | `sharedSecretName` → `JWT_ACCESS_SECRET` key |
| `JWT_REFRESH_SECRET` | user, membership, admin | `sharedSecretName` → `JWT_REFRESH_SECRET` key |
| `USER_SERVICE_URL` | api-gateway | `http://<release>-user-service:3001` |
| `MEMBERSHIP_SERVICE_URL` | api-gateway | `http://<release>-membership-service:3002` |
| `ADMIN_SERVICE_URL` | api-gateway | `http://<release>-admin-service:3003` |

> **Important for `adminService`**: its `/health` endpoint makes HTTP calls to `USER_SERVICE_URL` and `MEMBERSHIP_SERVICE_URL` to report downstream health. These must be set in the `env:` block in `values-dev.yaml` or the health check will always return 503.

### Install (standalone)

```bash
# Install database first, then:
helm install apexfit-backend ./helm/apexfit-backend \
  -f helm/apexfit-backend/values-dev.yaml \
  -n apexfit
```

---

## 5. Sub-chart: `apexfit-frontend`

### What it does

Deploys two React SPAs (served by Nginx inside the Docker image):
- `admin-portal` — staff-facing dashboard
- `member-app` — member-facing fitness app

Each gets a `Deployment` + `ClusterIP` Service. No DB connection, no JWT secrets.

### values.yaml — key sections

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
    API_GATEWAY_HOST: ""   # hostname nginx proxies API calls to
  resources:
    requests: { memory: 64Mi, cpu: 50m }
    limits:   { memory: 128Mi, cpu: 100m }
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
```

### ⚠ Nginx upstream hostname gotcha

The frontend Docker images were built when the Helm release was named `release-1`. Nginx's `default.conf` has the api-gateway hostname **baked in at build time**:

```nginx
# hardcoded inside the Docker image — cannot be changed via env var
upstream api_backend {
    server release-1-api-gateway:3000;
}
```

Nginx resolves this at **startup**. If `release-1-api-gateway` doesn't exist in cluster DNS → nginx exits → CrashLoopBackOff.

**The fix applied**: `API_GATEWAY_HOST` env var is still set (for future image rebuilds that use `envsubst`), but the real solution is that the nginx config inside the image must be rebuilt to use `${API_GATEWAY_HOST}`. Until then, the cluster DNS must have a service matching the hardcoded name.

> If you rebuild the frontend images with a proper nginx template using `envsubst ${API_GATEWAY_HOST}`, the `API_GATEWAY_HOST` env var in `values-dev.yaml` will take effect and no workaround is needed.

### Install (standalone)

```bash
helm install apexfit-frontend ./helm/apexfit-frontend \
  -f helm/apexfit-frontend/values-dev.yaml \
  -n apexfit
```

---

## 6. Umbrella Chart: `apexfit`

### What it does

Thin orchestration layer that:
1. Creates the shared **Namespace**
2. Creates the **Ingress** (routes traffic to backend + frontend)
3. Pulls in all three sub-charts as `file://` dependencies

### Chart.yaml

```yaml
apiVersion: v2
name: apexfit
version: 0.2.0

dependencies:
  - name: apexfit-database
    version: "0.1.0"
    repository: "file://../apexfit-database"
    alias: database          # values nested under "database:"

  - name: apexfit-backend
    version: "0.1.0"
    repository: "file://../apexfit-backend"
    alias: backend           # values nested under "backend:"

  - name: apexfit-frontend
    version: "0.1.0"
    repository: "file://../apexfit-frontend"
    alias: frontend          # values nested under "frontend:"
```

### values.yaml structure (alias nesting)

```yaml
# Umbrella-level
namespace:
  create: true
  name: apexfit

ingress:
  enabled: true
  ...

# Passed to apexfit-database sub-chart
database:
  secrets:
    jwtAccessSecret: "..."
  postgresql:
    auth:
      password: "changeme"

# Passed to apexfit-backend sub-chart
backend:
  sharedSecretName: "apexfit-database-secrets"
  database:
    host: "apexfit-database-postgresql"
  apiGateway:
    image:
      repository: apexfit/api-gateway

# Passed to apexfit-frontend sub-chart
frontend:
  adminPortal:
    image:
      repository: apexfit/admin-portal
```

### Install (umbrella — all-in-one)

```bash
# 1. Update sub-chart dependencies
helm dependency update ./helm/apexfit-database
helm dependency update ./helm/apexfit

# 2. Install all layers at once
helm install apexfit ./helm/apexfit \
  -f helm/apexfit/values-dev.yaml \
  -n apexfit --create-namespace
```

---

## 7. Helper Functions (`_helpers.tpl`)

Each sub-chart has its own `_helpers.tpl` with chart-scoped helpers. They follow the same pattern:

| Helper (pattern) | Purpose |
|---|---|
| `<chart>.name` | Chart name, capped at 63 chars |
| `<chart>.labels` | Common labels: `helm.sh/chart`, `app.kubernetes.io/managed-by`, `instance`, `part-of: apexfit` |
| `<chart>.selectorLabels` | `app.kubernetes.io/name` + `instance` — used for pod selectors |
| `<chart>.image` | Builds full image string: `[registry/]repo:tag` |

**Database sub-chart extras**:

| Helper | Purpose |
|---|---|
| `apexfit-database.postgresHost` | Returns `<release>-postgresql` (embedded) or `externalPostgresql.host` |
| `apexfit-database.postgresPort` | Returns `5432` (embedded) or `externalPostgresql.port` |

---

## 8. How Secrets Flow

```
apexfit-database/values-dev.yaml
  secrets.jwtAccessSecret   ──────┐
  secrets.jwtRefreshSecret  ──────┤──► secret.yaml ──► K8s Secret: apexfit-database-secrets
  postgresql.auth.username  ──────┤                         │
  postgresql.auth.password  ──────┘                         │
  database.host (helper)    ──────────────────────────────► │
  database.port (helper)    ──────────────────────────────► │
                                                            │
                                          ┌─────────────────┼──────────────┐
                           sharedSecretName value           │              │
                                          ▼                 ▼              ▼
                                    user-service   membership-service   api-gateway
                                    admin-service
```

Each backend Deployment references the Secret via `secretKeyRef`:
```yaml
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: apexfit-database-secrets    # = sharedSecretName value
      key: DB_PASSWORD
```

> **Secret name must match the database release name.** If you install the database as `apexfit-db`, the secret is `apexfit-db-secrets`. Update `backend.sharedSecretName` in `values-dev.yaml` accordingly.

---

## 9. Inter-Service Communication

All services communicate over Kubernetes internal DNS. The pattern is:

```
http://<release-name>-<service-name>:<port>
```

With release name `apexfit-backend`:

| Variable | Resolved URL |
|---|---|
| `USER_SERVICE_URL` | `http://apexfit-backend-user-service:3001` |
| `MEMBERSHIP_SERVICE_URL` | `http://apexfit-backend-membership-service:3002` |
| `ADMIN_SERVICE_URL` | `http://apexfit-backend-admin-service:3003` |

These are injected into the api-gateway Deployment template automatically. For admin-service, they must be added to `env:` in `values-dev.yaml` since admin-service's `/health` endpoint calls them:

```yaml
adminService:
  env:
    USER_SERVICE_URL: "http://apexfit-backend-user-service:3001"
    MEMBERSHIP_SERVICE_URL: "http://apexfit-backend-membership-service:3002"
```

**admin-service `/health` cascade**: If `USER_SERVICE_URL` or `MEMBERSHIP_SERVICE_URL` are missing or unreachable, admin-service returns `503`. The api-gateway then also returns `503` on its aggregate `/health` → both pods fail readiness → CrashLoopBackOff.

---

## 10. ArgoCD Integration

The three sub-charts map directly to three ArgoCD Applications, each watching its own path in the Git repo:

```
ArgoCD Application: apexfit-database
  source.path:       helm/apexfit-database
  source.helm.valueFiles: [values-dev.yaml]
  destination.namespace: apexfit

ArgoCD Application: apexfit-backend
  source.path:       helm/apexfit-backend
  source.helm.valueFiles: [values-dev.yaml]
  destination.namespace: apexfit

ArgoCD Application: apexfit-frontend
  source.path:       helm/apexfit-frontend
  source.helm.valueFiles: [values-dev.yaml]
  destination.namespace: apexfit
```

### ⚠ valueFiles must be set on ALL apps

If an ArgoCD Application is created without setting `helm.valueFiles`, it defaults to only `values.yaml` (production). This causes `ImagePullBackOff` because `values.yaml` uses placeholder image names like `apexfit/admin-portal` instead of `nyeinchan468/apexfit-admin-portal`.

Patch via kubectl:
```bash
kubectl patch application apexfit-frontend -n argocd --type='merge' -p '{
  "spec": {"source": {"helm": {"valueFiles": ["values-dev.yaml"]}}}
}'
```

### Sync order matters

The database must be `Healthy` before the backend can start (backend pods need the Secret to exist). Enforce this with ArgoCD sync waves in the Application manifests or by manually syncing in order:

```
1. Sync apexfit-database  →  wait until Healthy
2. Sync apexfit-backend   →  wait until Healthy
3. Sync apexfit-frontend  →  wait until Healthy
```

---

## 11. Common Override Recipes

### Deploy with a specific image tag

```bash
# Umbrella
helm upgrade apexfit ./helm/apexfit --set backend.image.tag=v2.0.0

# Standalone backend
helm upgrade apexfit-backend ./helm/apexfit-backend --set image.tag=v2.0.0
```

### Disable a service entirely

```bash
helm upgrade apexfit-backend ./helm/apexfit-backend \
  --set adminService.enabled=false
```

### Enable Horizontal Pod Autoscaling

```yaml
# in values-dev.yaml or via --set
apiGateway:
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 60
```

### Use an external PostgreSQL (e.g. AWS RDS)

```yaml
# in apexfit-database/values.yaml
postgresql:
  enabled: false

externalPostgresql:
  host: mydb.us-east-1.rds.amazonaws.com
  port: 5432
```

### Use a private container registry

```bash
# 1. Create pull secret
kubectl create secret docker-registry ghcr-creds \
  --docker-server=ghcr.io \
  --docker-username=myuser \
  --docker-password=<PAT> \
  -n apexfit

# 2. Reference in values
helm upgrade apexfit-backend ./helm/apexfit-backend \
  --set global.imageRegistry=ghcr.io/myorg \
  --set global.imagePullSecrets[0].name=ghcr-creds
```

### Dry-run to preview generated manifests

```bash
# Per sub-chart
helm template apexfit-backend ./helm/apexfit-backend \
  -f helm/apexfit-backend/values-dev.yaml

# Full umbrella
helm template apexfit ./helm/apexfit \
  -f helm/apexfit/values-dev.yaml | grep "^# Source:"
```

### Rotate JWT secrets without downtime

```bash
helm upgrade apexfit-database ./helm/apexfit-database \
  --set secrets.jwtAccessSecret=$(openssl rand -hex 32) \
  --set secrets.jwtRefreshSecret=$(openssl rand -hex 32)
# Then rolling-restart backend pods to pick up new secret values
kubectl rollout restart deployment -n apexfit \
  apexfit-backend-user-service \
  apexfit-backend-membership-service \
  apexfit-backend-admin-service \
  apexfit-backend-api-gateway
```

---

## 12. Lessons Learned & Gotchas

### Release name drives DNS and Secret names

The Helm release name is embedded in every K8s resource name:
- `<release>-postgresql` → PostgreSQL Service hostname
- `<release>-secrets` → Secret name
- `<release>-api-gateway` → api-gateway Service hostname

If you install the database as `apexfit-database`, the secret is `apexfit-database-secrets`. The backend's `sharedSecretName` and `database.host` must match exactly. A mismatch causes `CreateContainerConfigError` on all backend pods.

### `admin-service /health` is an aggregate check

`admin-service` calls `user-service` and `membership-service` as part of its health response. If those URLs are missing from the env (not configured in `values-dev.yaml`), health always returns `503` → readiness fails → the pod never becomes Ready → api-gateway (which also calls admin-service health) also fails readiness. Always set:

```yaml
adminService:
  env:
    USER_SERVICE_URL: "http://<backend-release>-user-service:3001"
    MEMBERSHIP_SERVICE_URL: "http://<backend-release>-membership-service:3002"
```

### Nginx upstream hostname is baked into frontend Docker images

The frontend images have the api-gateway hostname hardcoded in nginx `default.conf` at **build time**. Setting `API_GATEWAY_HOST` as a pod env var only works if the nginx config uses `envsubst` with `${API_GATEWAY_HOST}`. If the hostname is a literal string in the config, it cannot be overridden at runtime — the DNS name must actually exist in the cluster.

**Solution**: Rebuild the frontend images with a proper nginx template:
```nginx
# default.conf.template
upstream api_backend {
    server ${API_GATEWAY_HOST}:3000;
}
```
With `envsubst`, the `API_GATEWAY_HOST` env var set in `values-dev.yaml` will be substituted at container startup.

### ArgoCD Application must explicitly declare valueFiles

ArgoCD does not automatically pick up `values-dev.yaml`. An Application created without `helm.valueFiles` uses only `values.yaml`, causing `ImagePullBackOff` on placeholder image names.

*Last updated: 2026-06-28*
