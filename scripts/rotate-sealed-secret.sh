#!/bin/bash
# =============================================================
# ApexFit — Rotate Sealed Secret
# Re-generates the SealedSecret from .secrets.env and writes
# it into the Helm template, ready to commit and let ArgoCD deploy.
#
# Usage:
#   1. Update real values in .secrets.env
#   2. Run: ./scripts/rotate-sealed-secret.sh
#   3. git add + commit + push → ArgoCD picks it up automatically
#
# The .secrets.env file is gitignored — never commit it.
# =============================================================

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[sealed-secrets]${NC} $1"; }
warn() { echo -e "${YELLOW}[sealed-secrets]${NC} $1"; }
fail() { echo -e "${RED}[sealed-secrets]${NC} $1"; exit 1; }

SECRETS_FILE="${SECRETS_FILE:-.secrets.env}"
NAMESPACE="apexfit"
SEALED_SECRET_OUT="helm/apexfit-database/templates/sealed-secret.yaml"
KUBESEAL_BIN="${KUBESEAL_BIN:-$(which kubeseal 2>/dev/null || echo '/home/nyeinchan/.local/bin/kubeseal')}"

# ── Preflight checks ─────────────────────────────────────────
[[ ! -f "$SECRETS_FILE" ]] && fail "Missing $SECRETS_FILE — copy from .secrets.env.example and fill in real values."
[[ ! -x "$KUBESEAL_BIN" ]] && fail "kubeseal not found at $KUBESEAL_BIN — install it first."

# ── Load secrets ─────────────────────────────────────────────
# shellcheck disable=SC1090
source "$SECRETS_FILE"

for var in DB_PASSWORD JWT_ACCESS_SECRET JWT_REFRESH_SECRET; do
  [[ -z "${!var:-}" ]] && fail "Missing required variable: $var in $SECRETS_FILE"
  [[ "${!var}" == CHANGEME* ]] && fail "$var still has placeholder value — update $SECRETS_FILE first."
  [[ "${!var}" == UNUSED* ]]  && fail "$var still has placeholder value — update $SECRETS_FILE first."
done

# ── Wait for controller ───────────────────────────────────────
log "Waiting for sealed-secrets-controller to be ready..."
kubectl rollout status deployment/sealed-secrets-controller -n kube-system --timeout=60s

# ── Generate SealedSecret ─────────────────────────────────────
log "Generating SealedSecret from $SECRETS_FILE..."

kubectl create secret generic apexfit-database-secrets \
  --namespace="$NAMESPACE" \
  --from-literal=DB_HOST=apexfit-database-postgresql \
  --from-literal=DB_PORT=5432 \
  --from-literal=DB_USER=postgres \
  --from-literal=DB_PASSWORD="$DB_PASSWORD" \
  --from-literal=JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET" \
  --from-literal=JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" \
  --dry-run=client -o yaml \
| "$KUBESEAL_BIN" \
  --controller-name=sealed-secrets-controller \
  --controller-namespace=kube-system \
  --format yaml \
> "$SEALED_SECRET_OUT"

log "✅ Written to $SEALED_SECRET_OUT"
log ""
log "Next steps:"
log "  git add $SEALED_SECRET_OUT"
log "  git commit -m 'chore: rotate sealed secrets'"
log "  git push"
log "  → ArgoCD will sync and the controller will decrypt automatically."
log ""
warn "DO NOT commit .secrets.env — it is gitignored for a reason."
