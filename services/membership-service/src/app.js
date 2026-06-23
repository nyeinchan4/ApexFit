'use strict';
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');

const planRoutes         = require('./routes/plan.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const paymentRoutes      = require('./routes/payment.routes');
const healthRoutes       = require('./routes/health.routes');
const { errorHandler }   = require('./middleware/error.middleware');
const logger             = require('./config/logger');

const app = express();

app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: 'Too many requests.' },
}));

// ── Parsing ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan('combined', { stream: { write: (m) => logger.info(m.trim()) } }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/health',              healthRoutes);
app.use('/api/v1/plans',        planRoutes);
app.use('/api/v1/subscriptions',subscriptionRoutes);
app.use('/api/v1/payments',     paymentRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found.` }));

// ── Global Error ──────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
