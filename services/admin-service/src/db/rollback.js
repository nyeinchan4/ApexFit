'use strict';
require('dotenv').config();
const pool = require('../config/db');
const logger = require('../config/logger');

(async () => {
  const client = await pool.connect();
  try {
    logger.warn('[Rollback] Dropping admin tables — DATA WILL BE LOST!');
    await client.query(`
      DROP TABLE IF EXISTS audit_logs CASCADE;
      DROP TABLE IF EXISTS staff      CASCADE;
      DROP FUNCTION IF EXISTS admin_update_updated_at CASCADE;
    `);
    logger.info('[Rollback] ✅ Done.');
  } catch (err) {
    logger.error('[Rollback] ❌ Failed:', err.message);
    process.exit(1);
  } finally { client.release(); await pool.end(); }
})();
