'use strict';
require('dotenv').config();
const pool = require('../config/db');
const logger = require('../config/logger');

const SQL = `
-- Remove first_name and last_name columns as we now use username
ALTER TABLE users 
DROP COLUMN IF EXISTS first_name,
DROP COLUMN IF EXISTS last_name;
`;

(async () => {
  const client = await pool.connect();
  try {
    logger.info('[Migration] Removing first_name and last_name columns from users table...');
    await client.query(SQL);
    logger.info('[Migration] ✅ Columns removed successfully!');
    process.exit(0);
  } catch (err) {
    logger.error('[Migration] ❌ Failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
})();
