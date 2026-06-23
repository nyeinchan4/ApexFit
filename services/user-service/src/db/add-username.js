'use strict';
require('dotenv').config();
const pool = require('../config/db');
const logger = require('../config/logger');

const SQL = `
-- Add username column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- For existing users without username, generate from email
UPDATE users 
SET username = SPLIT_PART(email, '@', 1) 
WHERE username IS NULL;

-- Make username NOT NULL after populating existing rows
ALTER TABLE users 
ALTER COLUMN username SET NOT NULL;
`;

(async () => {
  const client = await pool.connect();
  try {
    logger.info('[Migration] Adding username column to users table...');
    await client.query(SQL);
    logger.info('[Migration] ✅ Username column added successfully!');
    process.exit(0);
  } catch (err) {
    logger.error('[Migration] ❌ Failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
})();
