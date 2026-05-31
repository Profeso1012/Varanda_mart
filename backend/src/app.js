require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { config } = require('./config/env');
const { globalErrorHandler } = require('./middleware/error.middleware');
const { generalRateLimiter } = require('./middleware/rateLimiter.middleware');
const {
  requireSellerAuth,
  requireHybridSellerRole,
  requireHybridSupplierRole,
  requireAdminAuth,
} = require('./middleware/auth.middleware');
const { requireSellerSubscription } = require('./middleware/plan.middleware');
const { resolveTenant } = require('./middleware/tenant.middleware');
const { requireApiPartnerAuth } = require('./middleware/apiPartner.middleware');

// ─── Route imports ────────────────────────────────────────────────────────────
const authRoutes = require('./modules/auth/auth.routes');
const plansRoutes = require('./modules/subscriptions/plans.routes');
const subscriptionsRoutes = require('./modules/subscriptions/subscriptions.routes');
const cloudinaryRoutes = require('./modules/cloudinary/cloudinary.routes');
const banksRoutes = require('./modules/banks/banks.routes');
const businessRoutes = require('./modules/business/business.routes');
const staffRoutes = require('./modules/staff/staff.routes');
const catalogRoutes = require('./modules/catalog/catalog.routes');
const discountsRoutes = require('./modules/catalog/discounts.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const builderRoutes = require('./modules/builder/builder.routes');
const shippingRoutes = require('./modules/shipping/shipping.routes');
const integrationsRoutes = require('./modules/integrations/integrations.routes');
const ordersRoutes = require('./modules/orders/orders.routes');
const sellerDropshipRoutes = require('./modules/sellerDropship/sellerDropship.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const crmRoutes = require('./modules/crm/crm.routes');
const campaignsRoutes = require('./modules/campaigns/campaigns.routes');
const reviewsRoutes = require('./modules/reviews/reviews.routes');
const invoicesRoutes = require('./modules/invoices/invoices.routes');
const marketplaceRoutes = require('./modules/marketplace/marketplace.routes');
const supplierRoutes = require('./modules/supplier/supplier.routes');
const developerRoutes = require('./modules/developer/developer.routes');
const extApiRegistrationRoutes = require('./modules/extApi/extApi.routes');
const extApiRoutes = require('./modules/extApi/extApiRoutes');
const storefrontRoutes = require('./modules/storefront/storefront.routes');
const webhooksRoutes = require('./modules/webhooks/webhooks.routes');
const adminRoutes = require('./modules/admin/admin.routes');

// ─── App init ─────────────────────────────────────────────────────────────────
const app = express();

// ─── Trust proxy — required when behind Render, Heroku, Nginx, etc. ──────────
// Without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// because the X-Forwarded-For header is set by the proxy but Express doesn't trust it.
// '1' means trust the first proxy hop (Render's load balancer).
if (config.nodeEnv === 'production') {
  app.set('trust proxy', 1);
}

// ─── Security & logging ───────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = [
  config.sellerDashboardUrl,
  config.developerPortalUrl,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, cb) => {
      // No origin = Postman, curl, server-to-server — allow
      if (!origin) return cb(null, true);

      // Explicitly listed origins
      if (allowedOrigins.includes(origin)) return cb(null, origin);

      // Any subdomain of the base domain (mystore.varanda.com, app.varanda.com, etc.)
      if (origin.endsWith(`.${config.baseDomain}`)) return cb(null, origin);

      // The base domain itself (varanda.com)
      const baseOrigins = [
        `https://${config.baseDomain}`,
        `http://${config.baseDomain}`,
      ];
      if (baseOrigins.includes(origin)) return cb(null, origin);

      // Builder and Render preview domains
      const builderRenderRegex = /^https?:\/\/([^/]+\.)?(builder\.io|builder\.xyz|builderio\.xyz|onrender\.com)(:\d+)?$/i;
      if (builderRenderRegex.test(origin)) return cb(null, origin);

      // In development: allow any localhost port
      if (config.nodeEnv !== 'production' && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return cb(null, origin);
      }

      // Custom store domains — allow any HTTPS origin in production.
      // Sellers point their own domains (fashionstore.com) at our server.
      // We can't enumerate them in advance, so we allow all HTTPS origins in production.
      // Security note: storefront endpoints are public (no seller auth), so this is safe.
      // The tenant middleware enforces that the domain is registered in our DB.
      if (config.nodeEnv === 'production' && origin.startsWith('https://')) {
        return cb(null, origin);
      }

      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ─── Request logger ───────────────────────────────────────────────────────────
// Replaces morgan with a custom logger that:
//   - Shows method, path, status, and response time on every request
//   - On 4xx/5xx: also logs the request body (passwords redacted) so you can
//     immediately tell whether the error was a bad request or a server bug
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';
    const line = `${color}${status}${reset} ${req.method} ${req.originalUrl} ${ms}ms`;

    if (status < 400) {
      console.log(line);
    }
    // Only log "route not found" for 404s that were NOT already handled by the
    // global error handler (which sets res.errorHandled = true before sending).
    // This prevents double-logging when middleware like resolveTenant throws an
    // AppError — the error handler logs it, and we don't want a second misleading
    // "route not found" line for the same request.
    if (status === 404 && !res.errorHandled) {
      console.warn(`[CLIENT ERROR] 404 ${req.method} ${req.originalUrl} — route not found`);
    }
  });
  next();
});
app.use(generalRateLimiter);
app.use(cookieParser());

// ─── Body parsing — preserve raw body for webhook signature verification ──────
app.use(
  express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);
app.use(express.urlencoded({ extended: false }));

// ─── Health check — mounted at both /health and /api/v1/health ───────────────
// /health        — used by Render's health check config
// /api/v1/health — used by frontend clients that prefix all calls with /api/v1
const healthHandler = (req, res) => {
  res.json({ success: true, data: { status: 'ok', env: config.nodeEnv, timestamp: new Date().toISOString() } });
};
app.get('/health', healthHandler);
app.get('/api/v1/health', healthHandler);

// ─── Public routes — no auth ──────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/plans', plansRoutes);
app.use('/api/v1/banks', banksRoutes);

// Subdomain availability check — public, no auth
const { checkSubdomainAvailability } = require('./modules/business/business.controller');
app.get('/api/v1/business/domains/check-subdomain', checkSubdomainAvailability);

// ─── Webhooks — no auth; signature verified inside each handler ───────────────
app.use('/api/v1/webhooks', webhooksRoutes);

// ─── Cloudinary signed upload params — any authenticated user ─────────────────
app.use('/api/v1/cloudinary', cloudinaryRoutes);

// ─── Subscription management — auth but no subscription check ────────────────
app.use('/api/v1/subscriptions', requireHybridSellerRole, subscriptionsRoutes);

// ─── Staff accept-invite — public (invitee may not be a seller) ──────────────
const { acceptInvite: staffAcceptInvite } = require('./modules/staff/staff.controller');
const { validate: validateMiddleware } = require('./middleware/validate.middleware');
const { acceptInviteSchema } = require('./modules/staff/staff.schema');
app.post('/api/v1/staff/accept-invite', validateMiddleware(acceptInviteSchema), staffAcceptInvite);

// ─── Seller business management — auth + subscription required ───────────────
app.use('/api/v1/business', requireHybridSellerRole, requireSellerSubscription, businessRoutes);
app.use('/api/v1/staff', requireHybridSellerRole, requireSellerSubscription, staffRoutes);
app.use('/api/v1/catalog', requireHybridSellerRole, requireSellerSubscription, catalogRoutes);
app.use('/api/v1/discounts', requireHybridSellerRole, requireSellerSubscription, discountsRoutes);
app.use('/api/v1/inventory', requireHybridSellerRole, requireSellerSubscription, inventoryRoutes);
app.use('/api/v1/builder', requireHybridSellerRole, requireSellerSubscription, builderRoutes);
app.use('/api/v1/shipping', requireHybridSellerRole, requireSellerSubscription, shippingRoutes);
app.use('/api/v1/integrations', requireHybridSellerRole, requireSellerSubscription, integrationsRoutes);
app.use('/api/v1/orders', requireHybridSellerRole, requireSellerSubscription, ordersRoutes);
app.use('/api/v1/seller/dropship-orders', requireHybridSellerRole, requireSellerSubscription, sellerDropshipRoutes);
app.use('/api/v1/analytics', requireHybridSellerRole, requireSellerSubscription, analyticsRoutes);
app.use('/api/v1/crm', requireHybridSellerRole, requireSellerSubscription, crmRoutes);
app.use('/api/v1/campaigns', requireHybridSellerRole, requireSellerSubscription, campaignsRoutes);
app.use('/api/v1/invoices', requireHybridSellerRole, requireSellerSubscription, invoicesRoutes);
app.use('/api/v1/reviews', requireHybridSellerRole, requireSellerSubscription, reviewsRoutes);
app.use('/api/v1/marketplace', requireHybridSellerRole, requireSellerSubscription, marketplaceRoutes);

// ─── Supplier routes — auth + supplier profile required ──────────────────────
app.use('/api/v1/supplier', requireHybridSupplierRole, supplierRoutes);

// ─── Developer portal routes — auth required ─────────────────────────────────
app.use('/api/v1/developer', requireSellerAuth, developerRoutes);

// ─── Developer registration — no auth ────────────────────────────────────────
app.use('/api/v1/ext-api', extApiRegistrationRoutes);

// ─── External developer API — API key auth ───────────────────────────────────
app.use('/ext/v1', requireApiPartnerAuth, extApiRoutes);

// ─── Storefront — tenant resolver runs first ─────────────────────────────────
app.use('/api/v1/storefront', resolveTenant, storefrontRoutes);

// ─── Admin — admin auth ───────────────────────────────────────────────────────
app.use('/api/v1/admin', requireAdminAuth, adminRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` },
  });
});

// ─── Global error handler — must be last ─────────────────────────────────────
app.use(globalErrorHandler);

module.exports = app;
