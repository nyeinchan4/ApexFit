'use strict';
require('dotenv').config();
const pool = require('../config/db');
const logger = require('../config/logger');

const SQL = `
-- ─────────────────────────────────────────────────────
-- ApexFit: Membership Service — Initial Schema
-- ─────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Membership Plans (Basic / Premium / Elite — mirrors UIUX plan configurator)
CREATE TABLE IF NOT EXISTS plans (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(100) UNIQUE NOT NULL,
  description  TEXT,
  price_mmk    NUMERIC(12, 2) NOT NULL,
  duration_days INT NOT NULL DEFAULT 30,
  features     JSONB NOT NULL DEFAULT '[]',
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Member Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL,
  plan_id         UUID NOT NULL REFERENCES plans(id),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('active', 'expired', 'pending', 'cancelled')),
  starts_at       TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment Records (cash payments needing admin verification)
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),
  plan_id         UUID NOT NULL REFERENCES plans(id),
  amount_mmk      NUMERIC(12, 2) NOT NULL,
  method          VARCHAR(30) NOT NULL DEFAULT 'cash'
                    CHECK (method IN ('cash', 'bank_transfer', 'mobile_payment')),
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'verified', 'rejected')),
  reference_id    VARCHAR(100) UNIQUE,
  notes           TEXT,
  verified_by     UUID,
  verified_at     TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subs_user_id    ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_status     ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subs_expires_at ON subscriptions(expires_at);
CREATE INDEX IF NOT EXISTS idx_pay_user_id     ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_pay_status      ON payments(status);
CREATE INDEX IF NOT EXISTS idx_pay_ref_id      ON payments(reference_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION mship_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_plans_updated_at ON plans;
CREATE TRIGGER set_plans_updated_at BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION mship_update_updated_at();

DROP TRIGGER IF EXISTS set_subs_updated_at ON subscriptions;
CREATE TRIGGER set_subs_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION mship_update_updated_at();

DROP TRIGGER IF EXISTS set_pay_updated_at ON payments;
CREATE TRIGGER set_pay_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION mship_update_updated_at();
`;

(async () => {
  const client = await pool.connect();
  try {
    logger.info('[Migrate] Running membership schema migration...');
    await client.query(SQL);
    logger.info('[Migrate] ✅ Migration completed successfully.');
  } catch (err) {
    logger.error('[Migrate] ❌ Failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
