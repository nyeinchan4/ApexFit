#!/bin/bash
# =============================================================
# ApexFit — Database Migration Script
# Runs all service migrations inside their Docker containers.
# Usage: ./scripts/db-migration-script.sh
# =============================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[migrate]${NC} $1"; }
warn() { echo -e "${YELLOW}[migrate]${NC} $1"; }
fail() { echo -e "${RED}[migrate]${NC} $1"; exit 1; }

# ─────────────────────────────────────────────
# Check containers are running
# ─────────────────────────────────────────────
for container in apexfit-user-service apexfit-membership-service apexfit-admin-service; do
  if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
    fail "Container '${container}' is not running. Start with: docker compose up -d"
  fi
done

log "All service containers are up. Running migrations..."
echo ""

# ─────────────────────────────────────────────
# User Service
# ─────────────────────────────────────────────
log "Running migration: user-service (apexfit_users)..."
if docker exec apexfit-user-service node src/db/migrate.js; then
  log "✅ user-service migration done."
else
  fail "❌ user-service migration failed."
fi
echo ""

# ─────────────────────────────────────────────
# Membership Service
# ─────────────────────────────────────────────
log "Running migration: membership-service (apexfit_memberships)..."
if docker exec apexfit-membership-service node src/db/migrate.js; then
  log "✅ membership-service migration done."
else
  fail "❌ membership-service migration failed."
fi
echo ""

# ─────────────────────────────────────────────
# Admin Service
# ─────────────────────────────────────────────
log "Running migration: admin-service (apexfit_admin)..."
if docker exec apexfit-admin-service node src/db/migrate.js; then
  log "✅ admin-service migration done."
else
  fail "❌ admin-service migration failed."
fi
echo ""

log "🎉 All migrations completed successfully."
