'use strict';
require('dotenv').config();
const pool = require('../config/db');
const logger = require('../config/logger');

const SQL = `
DROP TABLE IF EXISTS payments     CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS plans        CASCADE;
DROP FUNCTION IF EXISTS mship_update_updated_at CASCADE;
`;

(async () => {
  const client = await pool.connect();
  try {
    logger.warn('[Rollback] Dropping all membership tables — DATA WILL BE LOST!');
    await client.query(SQL);
    logger.info('[Rollback] ✅ Done.');
  } catch (err) {
    logger.error('[Rollback] ❌ Failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
