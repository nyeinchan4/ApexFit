'use strict';
require('dotenv').config();
const app    = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`[${process.env.SERVICE_NAME || 'api-gateway'}] Listening on port ${PORT} — ${process.env.NODE_ENV} mode`);
});

const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gateway...`);
  server.close(() => { logger.info('Gateway closed.'); process.exit(0); });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
