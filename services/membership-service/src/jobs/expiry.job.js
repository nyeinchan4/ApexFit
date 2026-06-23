'use strict';
const cron = require('node-cron');
const SubscriptionModel = require('../models/subscription.model');
const logger = require('../config/logger');

/**
 * Runs every hour — marks subscriptions as 'expired' when expires_at has passed.
 * This keeps the mobile dashboard gauge and member status accurate.
 */
const startExpiryJob = () => {
  // Run at the top of every hour
  cron.schedule('0 * * * *', async () => {
    try {
      const count = await SubscriptionModel.expireOverdue();
      if (count > 0) {
        logger.info(`[ExpiryJob] Marked ${count} subscription(s) as expired.`);
      }
    } catch (err) {
      logger.error('[ExpiryJob] Failed:', err.message);
    }
  });

  logger.info('[ExpiryJob] Scheduled — runs every hour.');
};

module.exports = { startExpiryJob };
