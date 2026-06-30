#!/bin/bash
# =============================================================
# ApexFit — Apply Secrets to Kubernetes
# Manages the apexfit-database-secrets and postgresql Secrets
# directly via kubectl (bypassing Helm values-dev.yaml).
#
# Usage:
#   1. Copy .secrets.env.example → .secrets.env
#   2. Fill in real values in .secrets.env
#   3. Run: ./scripts/apply-secrets.sh
#
# The .secrets.env file is gitignored — never commit it.
# =============================================================

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[secrets]${NC} $1"; }
warn() { echo -e "${YELLOW}[secrets]${NC} $1"; }
fail() { echo -e "${RED}[secrets]${NC} $1"; exit 1; }

SECRETS_FILE="${SECRETS_FILE:-.secrets.env}"
NAMESPACE="apexfit"

# ── Load secrets from .secrets.env ───────────────────────────
[[ ! -f "$SECRETS_FILE" ]] && fail "Missing $SECRETS_FILE — copy from .secrets.env.example and fill in values."

# shellcheck disable=SC1090
source "$SECRETS_FILE"

# ── Validate required vars ────────────────────────────────────
for var in DB_PASSWORD JWT_ACCESS_SECRET JWT_REFRESH_SECRET; do
  [[ -z "${!var:-}" ]] && fail "Missing required variable: $var in $SECRETS_FILE"
  [[ "${!var}" == CHANGEME* ]] && fail "$var still has placeholder value — update $SECRETS_FILE first."
done

log "Applying apexfit-database-secrets to namespace '$NAMESPACE'..."

kubectl create secret generic apexfit-database-secrets \
  --namespace="$NAMESPACE" \
  --from-literal=DB_HOST=apexfit-database-postgresql \
  --from-literal=DB_PORT=5432 \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_PASSWORD="$DB_PASSWORD" \
  --from-literal=JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET" \
  --from-literal=JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
  --dry-run=client -o yaml | kubectl apply -f -

log "Patching apexfit-database-postgresql secret..."

kubectl patch secret apexfit-database-postgresql \
  --namespace="$NAMESPACE" \
  --type=json \
  -p="[{\"op\":\"replace\",\"path\":\"/data/postgres-password\",\"value\":\"$(echo -n "$DB_PASSWORD" | base64 -w0)\"}]"

log "✅ Secrets applied. Rolling restart of backend pods..."

kubectl rollout restart deployment \
  apexfit-backend-user-service \
  apexfit-backend-membership-service \
  apexfit-backend-admin-service \
  apexfit-backend-api-gateway \
  -n "$NAMESPACE"

log "✅ Done. Monitor with: kubectl get pods -n $NAMESPACE -w"
