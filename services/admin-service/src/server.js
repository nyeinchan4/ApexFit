'use strict';
require('dotenv').config();
const app = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3003;

const server = app.listen(PORT, () => {
  logger.info(`[${process.env.SERVICE_NAME}] Running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down...`);
  server.close(() => { logger.info('Server closed.'); process.exit(0); });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
