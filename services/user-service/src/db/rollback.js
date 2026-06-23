'use strict';
require('dotenv').config();
const pool = require('../config/db');
const logger = require('../config/logger');

const SQL = `
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
`;

(async () => {
  const client = await pool.connect();
  try {
    logger.warn('[Rollback] Rolling back schema — all user data will be DELETED!');
    await client.query(SQL);
    logger.info('[Rollback] ✅ Rollback complete.');
  } catch (err) {
    logger.error('[Rollback] ❌ Rollback failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
