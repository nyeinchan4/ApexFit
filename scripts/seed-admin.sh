#!/bin/bash
# =============================================================
# ApexFit — Seed Default Admin User
# Creates: admin@apexfit.com / Admin@123  (role: admin)
# Usage: ./scripts/seed-admin.sh
# =============================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[seed]${NC} $1"; }
fail() { echo -e "${RED}[seed]${NC} $1"; exit 1; }

CONTAINER="apexfit-user-service"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  fail "Container '${CONTAINER}' is not running. Start with: docker compose up -d"
fi

log "Seeding default admin user into apexfit_users..."

docker exec "$CONTAINER" node -e "
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
(async () => {
  const email    = 'admin@apexfit.com';
  const username = 'admin';
  const password = 'Admin@123';
  const role     = 'admin';

  const { rows } = await pool.query('SELECT id FROM users WHERE email = \$1', [email]);
  if (rows.length > 0) {
    console.log('[seed] Admin user already exists (id: ' + rows[0].id + '). Skipping.');
    await pool.end();
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    'INSERT INTO users (email, username, password_hash, role, is_active) VALUES (\$1, \$2, \$3, \$4, TRUE) RETURNING id, email, role',
    [email, username, password_hash, role]
  );
  const user = result.rows[0];
  console.log('[seed] \u2705 Admin created — id: ' + user.id + ', email: ' + user.email + ', role: ' + user.role);
  await pool.end();
})().catch(err => { console.error('[seed] \u274c Failed:', err.message); process.exit(1); });
"

log "Done. Login with: admin@apexfit.com / Admin@123"
