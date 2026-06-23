'use strict';
const membershipClient = require('../services/membershipService.client');
const userClient       = require('../services/userService.client');

/**
 * GET /api/v1/dashboard
 * Powers admin-portal-dashboard.html — Command Center KPI cards + recent activity
 */
const DashboardController = {
  async getSummary(req, res, next) {
    try {
      const token = req.headers['authorization']?.split(' ')[1];

      // Fetch KPIs from downstream services in parallel
      const [membershipKpis, userHealth, membershipHealth] = await Promise.all([
        membershipClient.getDashboardKpis(token),
        userClient.healthCheck(),
        membershipClient.healthCheck(),
      ]);

      // Pending payments queue (first page for recent activity table)
      const pendingPayments = await membershipClient.getPendingPayments(token, { limit: 5 });

      return res.json({
        success: true,
        data: {
          kpis: {
            // Matches the 3 KPI bento cards in admin-portal-dashboard.html
            pending_cash_payments: membershipKpis.pending_payments,
            pending_total_mmk:     membershipKpis.pending_total_mmk,
            total_payments:        membershipKpis.total_payments,
          },
          recent_activity: pendingPayments.data?.payments || [],
          services: {
            user_service:       userHealth.db       || 'unknown',
            membership_service: membershipHealth.db || 'unknown',
          },
        },
      });
    } catch (err) { next(err); }
  },
};

module.exports = DashboardController;
