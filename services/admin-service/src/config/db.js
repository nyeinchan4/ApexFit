'use strict';
const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({
  host: process.env.DB_HOST, port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => logger.error('PostgreSQL pool error:', err));
pool.connect()
  .then(c => { logger.info(`[DB] Connected: ${process.env.DB_NAME}@${process.env.DB_HOST}`); c.release(); })
  .catch(err => logger.error('[DB] Connection failed:', err.message));

module.exports = pool;
