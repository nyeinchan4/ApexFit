# ApexFit Helm Chart — Configuration Guide

## Table of Contents
1. [Chart Overview](#1-chart-overview)
2. [Directory Structure](#2-directory-structure)
3. [Chart.yaml](#3-chartyaml)
4. [values.yaml — Section by Section](#4-valuesyaml--section-by-section)
   - [global](#41-global)
   - [namespace](#42-namespace)
   - [image (defaults)](#43-image-defaults)
   - [postgresql](#44-postgresql)
   - [secrets](#45-secrets)
   - [Backend Services](#46-backend-services-userservice-membershipservice-adminservice-apigateway)
   - [Frontend SPAs](#47-frontend-spas-adminportal-memberapp)
   - [ingress](#48-ingress)
5. [Templates Explained](#5-templates-explained)
6. [Helper Functions (_helpers.tpl)](#6-helper-functions-_helperstpl)
7. [values-dev.yaml](#7-values-devyaml)
8. [How Secrets Flow](#8-how-secrets-flow)
9. [Inter-Service Communication](#9-inter-service-communication)
10. [Common Override Recipes](#10-common-override-recipes)

---

## 1. Chart Overview

```
Chart name   : apexfit
Chart version: 0.1.0
App version  : 1.0.0
Type         : application
```

This chart deploys the full **ApexFit** microservices platform onto Kubernetes:

| Component | Kind | Port |
|---|---|---|
| `user-service` | Deployment + Service | 3001 |
| `membership-service` | Deployment + Service | 3002 |
| `admin-service` | Deployment + Service | 3003 |
| `api-gateway` | Deployment + Service | 3000 |
| `admin-portal` (React SPA) | Deployment + Service | 80 |
| `member-app` (React SPA) | Deployment + Service | 80 |
| `postgresql` | StatefulSet (Bitnami sub-chart) | 5432 |
| Ingress | Nginx Ingress | 80 / 443 |

---

## 2. Directory Structure

```
helm/apexfit/
├── Chart.yaml                        # Chart metadata & dependency declaration
├── Chart.lock                        # Locked dependency versions (auto-generated)
├── values.yaml                       # Default values for production
├── values-dev.yaml                   # Lightweight overrides for local dev
├── helm-explain.md                   # ← this file
├── charts/
│   └── postgresql-16.7.27.tgz        # Bitnami PostgreSQL sub-chart (fetched)
└── templates/
    ├── _helpers.tpl                  # Reusable template helper functions
    ├── NOTES.txt                     # Printed to terminal after install
    ├── namespace.yaml                # Kubernetes Namespace
    ├── secret.yaml                   # Shared Secret (JWT + DB credentials)
    ├── user-service-deployment.yaml
    ├── user-service-svc.yaml         # Service + HPA
    ├── membership-service-deployment.yaml
    ├── membership-service-svc.yaml
    ├── admin-service-deployment.yaml
    ├── admin-service-svc.yaml
    ├── api-gateway-deployment.yaml
    ├── api-gateway-svc.yaml
    ├── admin-portal.yaml             # Deployment + Service
    ├── member-app.yaml               # Deployment + Service
    └── ingress.yaml                  # Nginx Ingress (3 virtual hosts)
```

---

## 3. Chart.yaml

```yaml
apiVersion: v2           # Helm 3 chart format
name: apexfit
version: 0.1.0           # Chart version — bump when chart structure changes
appVersion: "1.0.0"      # Application version — informational only

dependencies:
  - name: postgresql
    version: "16.x.x"   # Bitnami PostgreSQL chart, any 16.x patch
    repository: oci://registry-1.docker.io/bitnamicharts
    condition: postgresql.enabled   # skip if postgresql.enabled=false
```

**Key point — `condition`**: Setting `postgresql.enabled: false` in values completely disables the sub-chart. Use this when you have an external managed database (e.g. AWS RDS).

**Fetching dependencies** (must be run once before install):
```bash
helm dependency update ./helm/apexfit
```

---

## 4. values.yaml — Section by Section

### 4.1 `global`

```yaml
global:
  imageRegistry: ""       # Prefix prepended to every image repository
  imagePullSecrets: []    # Names of K8s Secrets for private registries
  nodeEnv: production
```

- **`imageRegistry`**: Set to `ghcr.io/myorg` to pull images like `ghcr.io/myorg/apexfit/user-service:latest`. Leave empty for Docker Hub.
- **`imagePullSecrets`**: Reference secrets created with `kubectl create secret docker-registry`.

Example override for GitHub Container Registry:
```yaml
global:
  imageRegistry: ghcr.io/myorg
  imagePullSecrets:
    - name: ghcr-credentials
```

---

### 4.2 `namespace`

```yaml
namespace:
  create: true    # Create the namespace as part of this chart
  name: apexfit   # All resources land here
```

If you manage namespaces externally (e.g. via GitOps), set `create: false` and pre-create the namespace yourself.

---

### 4.3 `image` (defaults)

```yaml
image:
  pullPolicy: IfNotPresent  # Don't re-pull if image already exists on node
  tag: latest               # Fallback tag used when a service's .image.tag is empty
```

The `tag` here is the **global fallback**. Each service can override it:
```yaml
userService:
  image:
    tag: "v1.2.3"   # overrides global tag for this service only
```

---

### 4.4 `postgresql`

```yaml
postgresql:
  enabled: true               # false → use externalPostgresql instead
  auth:
    username: postgres        # DB superuser login
    password: "changeme"      # ⚠ CHANGE THIS
    database: apexfit_users   # Primary database created automatically
  primary:
    initdb:
      scripts:
        init-db.sql: |        # Runs once on first pod start
          SELECT 'CREATE DATABASE apexfit_memberships' ...
          SELECT 'CREATE DATABASE apexfit_admin' ...
    persistence:
      enabled: true
      size: 8Gi               # PersistentVolumeClaim size
    resources:
      requests: { memory: 256Mi, cpu: 250m }
      limits:   { memory: 512Mi, cpu: 500m }
```

**How databases are created**:
- `apexfit_users` → created automatically via `POSTGRES_DB` env var in the Bitnami chart.
- `apexfit_memberships` and `apexfit_admin` → created by the `init-db.sql` script embedded in `initdb.scripts`. This mirrors the `./scripts/init-db.sql` mount from docker-compose.

**Using an external database** (e.g. RDS):
```yaml
postgresql:
  enabled: false

# Add this top-level key (read by _helpers.tpl):
externalPostgresql:
  host: mydb.us-east-1.rds.amazonaws.com
  port: 5432
```

---

### 4.5 `secrets`

```yaml
secrets:
  jwtAccessSecret: "CHANGE_ME_access_secret"
  jwtRefreshSecret: "CHANGE_ME_refresh_secret"
```

These values are written into a Kubernetes `Secret` object (`secret.yaml`) alongside the DB credentials. The Secret is named `<release-name>-secrets`.

> **Never commit real secrets to Git.** Use `--set` flags or a secrets manager (Vault, Sealed Secrets, External Secrets Operator) in production.

```bash
# Safe production install
helm install apexfit ./helm/apexfit \
  --set secrets.jwtAccessSecret=$(openssl rand -hex 32) \
  --set secrets.jwtRefreshSecret=$(openssl rand -hex 32) \
  --set postgresql.auth.password=$(openssl rand -hex 16)
```

---

### 4.6 Backend Services (`userService`, `membershipService`, `adminService`, `apiGateway`)

All four backend services share the same configuration shape. Example using `userService`:

```yaml
userService:
  enabled: true             # Set false to skip deploying this service entirely
  name: user-service        # Used as the K8s resource name suffix
  image:
    repository: apexfit/user-service
    tag: ""                 # Empty → falls back to global image.tag
  replicaCount: 2           # Number of pod replicas
  port: 3001                # Container port (also used for Service)

  env:                      # Plain-text environment variables (non-sensitive)
    NODE_ENV: "production"
    PORT: "3001"
    DB_NAME: apexfit_users
    SERVICE_NAME: user-service
    JWT_ACCESS_EXPIRES_IN: "15m"
    JWT_REFRESH_EXPIRES_IN: "30d"

  resources:
    requests:               # Minimum resources Kubernetes reserves on the node
      memory: "128Mi"
      cpu: "100m"
    limits:                 # Hard cap — container is OOM-killed if exceeded
      memory: "256Mi"
      cpu: "250m"

  autoscaling:
    enabled: false          # true → creates a HorizontalPodAutoscaler
    minReplicas: 2
    maxReplicas: 5
    targetCPUUtilizationPercentage: 70

  service:
    type: ClusterIP         # Internal only. Use NodePort/LoadBalancer to expose directly

  livenessProbe:
    path: /health           # HTTP GET path — pod restarted if this fails
    initialDelaySeconds: 15 # Wait before first check (let the app boot)
    periodSeconds: 20       # How often to check

  readinessProbe:
    path: /health           # HTTP GET path — pod removed from Service endpoints if failing
    initialDelaySeconds: 10
    periodSeconds: 10
```

**Key differences per service**:

| Service | `port` | `DB_NAME` | Extra env vars |
|---|---|---|---|
| `userService` | 3001 | `apexfit_users` | `JWT_REFRESH_EXPIRES_IN` |
| `membershipService` | 3002 | `apexfit_memberships` | — |
| `adminService` | 3003 | `apexfit_admin` | auto-injects `USER_SERVICE_URL`, `MEMBERSHIP_SERVICE_URL` |
| `apiGateway` | 3000 | *(no DB)* | `ALLOWED_ORIGINS`, auto-injects all 3 service URLs |

**Auto-injected env vars** (added by the template, not from `env:` block):

| Variable | Injected into | Value |
|---|---|---|
| `DB_HOST` | all backend services | PostgreSQL K8s service hostname |
| `DB_PORT` | all backend services | `5432` |
| `DB_USER` | all backend services | from Secret |
| `DB_PASSWORD` | all backend services | from Secret |
| `JWT_ACCESS_SECRET` | all services | from Secret |
| `JWT_REFRESH_SECRET` | user-service only | from Secret |
| `USER_SERVICE_URL` | admin-service, api-gateway | K8s internal DNS |
| `MEMBERSHIP_SERVICE_URL` | admin-service, api-gateway | K8s internal DNS |
| `ADMIN_SERVICE_URL` | api-gateway | K8s internal DNS |

---

### 4.7 Frontend SPAs (`adminPortal`, `memberApp`)

```yaml
adminPortal:
  enabled: true
  name: admin-portal
  image:
    repository: apexfit/admin-portal
    tag: ""
  replicaCount: 1
  port: 80              # nginx serves the built React app on port 80
  resources:
    requests: { memory: 64Mi, cpu: 50m }
    limits:   { memory: 128Mi, cpu: 100m }
  service:
    type: ClusterIP
  livenessProbe:
    path: /             # Nginx root page
    initialDelaySeconds: 10
    periodSeconds: 20
  readinessProbe:
    path: /
    initialDelaySeconds: 5
    periodSeconds: 10
```

Frontend containers are simpler — they serve static files via Nginx, so:
- No DB connection needed
- No JWT secrets mounted
- Smaller resource requests/limits
- Probes hit `/` instead of `/health`

---

### 4.8 `ingress`

```yaml
ingress:
  enabled: true
  className: nginx          # Matches IngressClass name of your Nginx ingress controller
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
  tls:
    enabled: false          # true → enables HTTPS in the Ingress spec
    secretName: apexfit-tls # K8s TLS Secret name holding the cert/key
    certManager:
      enabled: false        # true → adds cert-manager annotation for auto-cert
      clusterIssuer: letsencrypt-prod
  hosts:
    api: api.apexfit.example.com      # → routes to api-gateway:3000
    admin: admin.apexfit.example.com  # → routes to admin-portal:80
    app: app.apexfit.example.com      # → routes to member-app:80
```

**Routing table produced**:

| Host | Path | Backend Service | Port |
|---|---|---|---|
| `api.apexfit.example.com` | `/` | `apexfit-api-gateway` | 3000 |
| `admin.apexfit.example.com` | `/` | `apexfit-admin-portal` | 80 |
| `app.apexfit.example.com` | `/` | `apexfit-member-app` | 80 |

**Enabling HTTPS with cert-manager**:
```yaml
ingress:
  tls:
    enabled: true
    secretName: apexfit-tls
    certManager:
      enabled: true
      clusterIssuer: letsencrypt-prod
```

---

## 5. Templates Explained

### `namespace.yaml`
Creates the `apexfit` Kubernetes namespace. Guarded by `namespace.create`.

### `secret.yaml`
Single `Opaque` Secret named `<release>-secrets` with four keys:
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `DB_USER`
- `DB_PASSWORD`

All Deployments consume these via `valueFrom.secretKeyRef`, so credentials never appear as plain text in Deployment specs.

### `*-deployment.yaml`
Each service has its own Deployment file. Common structure:
```
Deployment
 └── spec.template
      └── containers[0]
           ├── image          ← built by apexfit.image helper
           ├── env            ← plain values + secretKeyRef mounts
           ├── livenessProbe  ← HTTP GET /health
           ├── readinessProbe ← HTTP GET /health
           └── resources      ← requests + limits
```
All backend pods run with `runAsNonRoot: true` and `runAsUser: 1000` to match the non-root user created in the Dockerfiles.

### `*-svc.yaml`
Each file creates a `ClusterIP` Service and (optionally) a `HorizontalPodAutoscaler` when `autoscaling.enabled: true`.

### `ingress.yaml`
Creates a single `networking.k8s.io/v1` Ingress with three `rules`, one per hostname.

### `NOTES.txt`
Rendered and printed to the terminal after every `helm install` / `helm upgrade`. Shows port-forward commands and production security reminders.

---

## 6. Helper Functions (`_helpers.tpl`)

| Helper | Purpose |
|---|---|
| `apexfit.name` | Chart name, capped at 63 chars |
| `apexfit.fullname` | `<release>-<chart>` name |
| `apexfit.chart` | `<name>-<version>` string for `helm.sh/chart` label |
| `apexfit.labels` | Common labels added to every resource |
| `apexfit.selectorLabels` | `app.kubernetes.io/name` + `instance` for pod selectors |
| `apexfit.imageTag` | Resolves per-service tag falling back to global `image.tag` |
| `apexfit.image` | Builds full image string: `[registry/]repo:tag` |
| `apexfit.postgresHost` | Returns K8s service name of postgres (internal or external) |
| `apexfit.postgresPort` | Returns postgres port (internal `5432` or external override) |

---

## 7. `values-dev.yaml`

Override file for local Kubernetes development (e.g. minikube, kind):

```yaml
image:
  pullPolicy: Never   # Use locally built images — don't pull from registry

# 1 replica per service to save resources
userService:
  replicaCount: 1
  env:
    NODE_ENV: development

# Ingress disabled — use kubectl port-forward instead
ingress:
  enabled: false

# Smaller Postgres PVC
postgresql:
  primary:
    persistence:
      size: 1Gi

# Non-sensitive placeholder secrets (local only!)
secrets:
  jwtAccessSecret: "dev_access_secret_not_for_production"
  jwtRefreshSecret: "dev_refresh_secret_not_for_production"
```

Usage:
```bash
helm install apexfit ./helm/apexfit -f helm/apexfit/values-dev.yaml
```

---

## 8. How Secrets Flow

```
values.yaml
  secrets.jwtAccessSecret   ─────┐
  secrets.jwtRefreshSecret  ─────┤──► secret.yaml ──► K8s Secret: apexfit-secrets
  postgresql.auth.password  ─────┤         │
  postgresql.auth.username  ─────┘         │
                                           │ valueFrom.secretKeyRef
                              ┌────────────┼────────────────┐
                              ▼            ▼                ▼
                       user-service  membership-service  api-gateway
                       admin-service                     (etc.)
```

Each Deployment references the Secret by key name, not by value. This means:
- The secret value is **never** visible in `helm template` output
- Rotating a secret only requires `helm upgrade --set secrets.jwtAccessSecret=NEW`

---

## 9. Inter-Service Communication

All services communicate over Kubernetes internal DNS using the pattern:
```
http://<release-name>-<service-name>:<port>
```

With the default release name `apexfit`:

| Variable | Resolved value |
|---|---|
| `USER_SERVICE_URL` | `http://apexfit-user-service:3001` |
| `MEMBERSHIP_SERVICE_URL` | `http://apexfit-membership-service:3002` |
| `ADMIN_SERVICE_URL` | `http://apexfit-admin-service:3003` |

This is the Kubernetes equivalent of docker-compose's service name DNS (e.g. `http://user-service:3001`).

---

## 10. Common Override Recipes

### Deploy with a specific image tag for all services
```bash
helm upgrade apexfit ./helm/apexfit --set image.tag=v2.0.0
```

### Deploy only the backend (no frontends)
```bash
helm upgrade apexfit ./helm/apexfit \
  --set adminPortal.enabled=false \
  --set memberApp.enabled=false
```

### Enable Horizontal Pod Autoscaling on api-gateway
```yaml
# my-overrides.yaml
apiGateway:
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 10
    targetCPUUtilizationPercentage: 60
```

### Use an external PostgreSQL (e.g. AWS RDS)
```yaml
postgresql:
  enabled: false

externalPostgresql:
  host: mydb.us-east-1.rds.amazonaws.com
  port: 5432
```
> Update `secrets.DB_USER` and `secrets.DB_PASSWORD` to match.

### Enable HTTPS via cert-manager
```yaml
ingress:
  tls:
    enabled: true
    secretName: apexfit-tls
    certManager:
      enabled: true
      clusterIssuer: letsencrypt-prod
  hosts:
    api: api.mycompany.com
    admin: admin.mycompany.com
    app: app.mycompany.com
```

### Use a private container registry
```bash
# 1. Create the pull secret
kubectl create secret docker-registry ghcr-creds \
  --docker-server=ghcr.io \
  --docker-username=myuser \
  --docker-password=<PAT> \
  -n apexfit

# 2. Reference it in values
helm upgrade apexfit ./helm/apexfit \
  --set global.imageRegistry=ghcr.io/myorg \
  --set global.imagePullSecrets[0].name=ghcr-creds
```

### Dry-run to preview generated manifests
```bash
helm template apexfit ./helm/apexfit -f helm/apexfit/values-dev.yaml | less
```

### Diff before upgrading (requires helm-diff plugin)
```bash
helm diff upgrade apexfit ./helm/apexfit -f helm/apexfit/values.yaml
```
