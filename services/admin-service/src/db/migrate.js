'use strict';
require('dotenv').config();
const pool = require('../config/db');
const logger = require('../config/logger');

const SQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Staff accounts managed by admin service
CREATE TABLE IF NOT EXISTS staff (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID UNIQUE NOT NULL,       -- references user-service user
  email        VARCHAR(255) UNIQUE NOT NULL,
  full_name    VARCHAR(200) NOT NULL,
  role         VARCHAR(20) NOT NULL DEFAULT 'staff'
                 CHECK (role IN ('staff', 'admin')),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log — every mutating admin action is recorded
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id     UUID NOT NULL,          -- staff user_id who performed the action
  actor_email  VARCHAR(255),
  action       VARCHAR(100) NOT NULL,  -- e.g. 'PAYMENT_VERIFIED', 'MEMBER_EXTENDED'
  entity_type  VARCHAR(50),            -- e.g. 'payment', 'subscription', 'plan'
  entity_id    VARCHAR(100),
  metadata     JSONB DEFAULT '{}',     -- extra context (old/new values, etc.)
  ip_address   VARCHAR(45),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_actor    ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action   ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created  ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_user_id  ON staff(user_id);

-- Auto-update trigger for staff
CREATE OR REPLACE FUNCTION admin_update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_staff_updated_at ON staff;
CREATE TRIGGER set_staff_updated_at BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION admin_update_updated_at();
`;

(async () => {
  const client = await pool.connect();
  try {
    logger.info('[Migrate] Running admin schema migration...');
    await client.query(SQL);
    logger.info('[Migrate] ✅ Complete.');
  } catch (err) {
    logger.error('[Migrate] ❌ Failed:', err.message);
    process.exit(1);
  } finally { client.release(); await pool.end(); }
})();
