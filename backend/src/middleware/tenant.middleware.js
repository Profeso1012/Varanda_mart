const AppError = require('../utils/AppError');
const asyncHandler = require('./asyncHandler');
const { findBusinessByDomain } = require('../db/queries/businesses.queries');
const { config } = require('../config/env');

/**
 * Routes that should work even when the store is not published.
 * Cart, checkout, customer auth, and customer profile must remain accessible
 * regardless of publish state — a customer may have an active session or
 * items in their cart from before the store was unpublished.
 */
const UNPUBLISHED_ALLOWED = new Set([
  '/cart',
  '/cart/merge',
  '/auth/request-otp',
  '/auth/verify-otp',
  '/auth/logout',
  '/customer/profile',
  '/customer/addresses',
  '/customer/orders',
  '/checkout/initiate',
  '/checkout/verify',
  '/shipping/rates',
  '/discounts/validate',
]);

const isUnpublishedAllowed = (path) => {
  // Strip the /api/v1/storefront prefix if present
  const stripped = path.replace(/^\/api\/v1\/storefront/, '');
  if (UNPUBLISHED_ALLOWED.has(stripped)) return true;
  for (const allowed of UNPUBLISHED_ALLOWED) {
    if (stripped.startsWith(allowed + '/')) return true;
  }
  return false;
};

const resolveTenant = asyncHandler(async (req, res, next) => {
  // Priority order for domain resolution:
  // 1. X-Tenant-Domain header (dev/testing override — any environment)
  // 2. Host header (production — set by the browser/proxy automatically)
  const rawHost = req.headers['x-tenant-domain'] || req.headers.host || '';
  const domain = rawHost.split(':')[0].toLowerCase().trim();

  // Always log what domain we resolved so debugging is possible
  console.log(`[tenant] domain="${domain}" path="${req.path}" x-tenant-domain="${req.headers['x-tenant-domain'] || ''}" host="${req.headers.host || ''}"`);

  if (!domain) {
    throw new AppError(
      'Store not found. Send X-Tenant-Domain: mystore.varanda.com header.',
      404, 'NOT_FOUND'
    );
  }

  const business = await findBusinessByDomain(domain);

  if (!business) {
    console.warn(`[tenant] MISS — domain="${domain}" not found in domains table (status=ACTIVE required)`);
    throw new AppError('Store not found.', 404, 'NOT_FOUND');
  }

  // Allow unpublished stores for cart/checkout/auth routes
  if (!business.is_published && !isUnpublishedAllowed(req.path)) {
    console.warn(`[tenant] UNPUBLISHED — domain="${domain}" blocking path="${req.path}"`);
    throw new AppError('This store is not published yet.', 404, 'STORE_NOT_PUBLISHED');
  }

  req.tenantBusinessId = business.id;
  req.tenantBusiness = business;
  next();
});

module.exports = { resolveTenant };
