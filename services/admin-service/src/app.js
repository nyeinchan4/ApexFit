'use strict';
const express   = require('express');
const helmet    = require('helmet');
const cors      = require('cors');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const dashboardRoutes = require('./routes/dashboard.routes');
const memberRoutes    = require('./routes/member.routes');
const staffRoutes     = require('./routes/staff.routes');
const auditRoutes     = require('./routes/audit.routes');
const healthRoutes    = require('./routes/health.routes');
const { errorHandler }   = require('./middleware/error.middleware');
const { auditLogger }    = require('./middleware/audit.middleware');
const logger = require('./config/logger');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (m) => logger.info(m.trim()) } }));

// Health route — registered BEFORE rate limiter so kube probes are never throttled
app.use('/health',            healthRoutes);

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { success: false, error: 'Too many requests.' } }));

// Audit middleware — logs every mutating request made by staff/admin
app.use(auditLogger);
app.use('/api/v1/dashboard',  dashboardRoutes);
app.use('/api/v1/members',    memberRoutes);
app.use('/api/v1/staff',      staffRoutes);
app.use('/api/v1/audit',      auditRoutes);

app.use((req, res) => res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found.` }));
app.use(errorHandler);

module.exports = app;
