'use strict';
require('dotenv').config();
const pool = require('../config/db');
const logger = require('../config/logger');

// Seed the three default plans visible in admin-portal-planconfigure.html
const PLANS = [
  {
    name: 'Basic',
    description: 'Essential gym access for everyday fitness.',
    price_mmk: 45000,
    duration_days: 30,
    features: JSON.stringify([
      'Access to gym equipment',
      'Locker room access',
    ]),
  },
  {
    name: 'Premium',
    description: 'Full access including group classes and sauna.',
    price_mmk: 85000,
    duration_days: 30,
    features: JSON.stringify([
      'Access to gym equipment',
      'Locker room & Sauna access',
      'Unlimited group classes',
    ]),
  },
  {
    name: 'Elite',
    description: 'The complete ApexFit experience with personal training.',
    price_mmk: 150000,
    duration_days: 30,
    features: JSON.stringify([
      'All Premium benefits',
      '4 Personal training sessions',
      'Free guest pass (2/month)',
      'Priority support',
    ]),
  },
];

(async () => {
  const client = await pool.connect();
  try {
    logger.info('[Seed] Seeding default membership plans...');
    for (const plan of PLANS) {
      await client.query(
        `INSERT INTO plans (name, description, price_mmk, duration_days, features)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO UPDATE
           SET description  = EXCLUDED.description,
               price_mmk    = EXCLUDED.price_mmk,
               duration_days= EXCLUDED.duration_days,
               features     = EXCLUDED.features,
               updated_at   = NOW()`,
        [plan.name, plan.description, plan.price_mmk, plan.duration_days, plan.features]
      );
      logger.info(`[Seed]   ✓ ${plan.name} — ${plan.price_mmk.toLocaleString()} MMK`);
    }
    logger.info('[Seed] ✅ Seeding complete.');
  } catch (err) {
    logger.error('[Seed] ❌ Failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
