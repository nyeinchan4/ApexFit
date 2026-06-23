'use strict';
const membershipClient     = require('../services/membershipService.client');
const userServiceClient    = require('../services/userService.client');
const AuditModel           = require('../models/auditlog.model');
const logger               = require('../config/logger');

/**
 * Handles:
 *  - Listing & searching the payment queue  (admin-portal-cash-verification.html)
 *  - Verifying payments   → auto-activates subscription
 *  - Rejecting payments
 *  - Extending subscriptions (admin-portal-member.html "Manual Ext." button)
 */
const MemberController = {
  /** GET /api/v1/members/users — full user list from user-service with subscription data */
  async listUsers(req, res, next) {
    try {
      const token  = req.headers['authorization']?.split(' ')[1];
      const { page, limit, role } = req.query;
      
      // Fetch users from user-service
      const result = await userServiceClient.listMembers(token, { page, limit, role });
      
      // Fetch active subscriptions for all users
      if (result.success && result.data?.members) {
        const userIds = result.data.members.map(m => m.id);
        const subscriptions = {};
        
        // Fetch subscription for each user (in parallel batches to avoid overload)
        const batchSize = 10;
        for (let i = 0; i < userIds.length; i += batchSize) {
          const batch = userIds.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (userId) => {
              try {
                const subData = await membershipClient.getUserSubscription(userId, token);
                if (subData?.active) {
                  subscriptions[userId] = subData.active;
                }
              } catch (err) {
                // User has no subscription, that's okay
              }
            })
          );
        }
        
        // Merge subscription data with user data
        result.data.members = result.data.members.map(member => ({
          ...member,
          subscription: subscriptions[member.id] || null,
        }));
      }
      
      return res.json(result);
    } catch (err) { next(err); }
  },

  /** GET /api/v1/members/payments — pending queue with KPIs */
  async listPayments(req, res, next) {
    try {
      const token = req.headers['authorization']?.split(' ')[1];
      const { status, page, limit } = req.query;
      const result = await membershipClient.getAllPayments(token, { status, page, limit });
      return res.json(result);
    } catch (err) { next(err); }
  },

  /** POST /api/v1/members/payments/:id/verify */
  async verifyPayment(req, res, next) {
    try {
      const token = req.headers['authorization']?.split(' ')[1];
      const result = await membershipClient.verifyPayment(req.params.id, token);

      await AuditModel.log({
        actor_id:    req.user.sub,
        actor_email: req.user.email,
        action:      'PAYMENT_VERIFIED',
        entity_type: 'payment',
        entity_id:   req.params.id,
        metadata:    { result: result.data },
        ip_address:  req.ip,
      });
      logger.info(`[Admin] Payment ${req.params.id} VERIFIED by ${req.user.sub}`);
      return res.json(result);
    } catch (err) { next(err); }
  },

  /** POST /api/v1/members/payments/:id/reject */
  async rejectPayment(req, res, next) {
    try {
      const token = req.headers['authorization']?.split(' ')[1];
      const result = await membershipClient.rejectPayment(req.params.id, token);

      await AuditModel.log({
        actor_id:    req.user.sub,
        actor_email: req.user.email,
        action:      'PAYMENT_REJECTED',
        entity_type: 'payment',
        entity_id:   req.params.id,
        ip_address:  req.ip,
      });
      logger.info(`[Admin] Payment ${req.params.id} REJECTED by ${req.user.sub}`);
      return res.json(result);
    } catch (err) { next(err); }
  },

  /** PATCH /api/v1/members/subscriptions/:id/extend */
  async extendSubscription(req, res, next) {
    try {
      const token = req.headers['authorization']?.split(' ')[1];
      const { extra_days } = req.body;
      const result = await membershipClient.extendSubscription(req.params.id, extra_days, token);

      await AuditModel.log({
        actor_id:    req.user.sub,
        action:      'SUBSCRIPTION_EXTENDED',
        entity_type: 'subscription',
        entity_id:   req.params.id,
        metadata:    { extra_days },
        ip_address:  req.ip,
      });
      return res.json(result);
    } catch (err) { next(err); }
  },
};

module.exports = MemberController;
