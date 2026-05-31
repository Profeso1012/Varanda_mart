const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('./asyncHandler');
const { findUserById } = require('../db/queries/users.queries');
const { findSupplierByUserId } = require('../db/queries/supplierProfiles.queries');
const { findBusinessByOwnerId } = require('../db/queries/businesses.queries');
const { findCustomerSession } = require('../db/queries/auth.queries');
const crypto = require('crypto');

const extractBearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7);
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
};

/**
 * Resolve businessId for a seller.
 * JWT payload may have a stale null businessId if the token was issued before
 * role/select ran (e.g. the token from verify-email). Fall back to a DB lookup.
 */
const resolveBusinessId = async (payload) => {
  if (payload.businessId) return payload.businessId;
  // Token predates business creation — look it up
  const business = await findBusinessByOwnerId(payload.userId);
  return business?.id || null;
};

// ─── Seller / Admin / Hybrid auth ────────────────────────────────────────────

const requireSellerAuth = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');

  const payload = verifyAccessToken(token);
  if (!payload) throw new AppError('Invalid or expired token.', 401, 'UNAUTHORIZED');

  const user = await findUserById(payload.userId);
  if (!user) throw new AppError('User not found.', 401, 'UNAUTHORIZED');
  if (!user.is_active) throw new AppError('Account suspended.', 403, 'ACCOUNT_SUSPENDED');
  if (!user.is_email_verified) throw new AppError('Email not verified.', 403, 'EMAIL_NOT_VERIFIED');

  req.user = user;
  req.userId = user.id;
  req.businessId = await resolveBusinessId(payload);
  next();
});

const optionalSellerAuth = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) { req.user = null; return next(); }

  const payload = verifyAccessToken(token);
  if (!payload) { req.user = null; return next(); }

  const user = await findUserById(payload.userId);
  req.user = user || null;
  req.userId = user?.id || null;
  req.businessId = payload.businessId || null;
  next();
});

const requireHybridSellerRole = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');

  const payload = verifyAccessToken(token);
  if (!payload) throw new AppError('Invalid or expired token.', 401, 'UNAUTHORIZED');

  const user = await findUserById(payload.userId);
  if (!user) throw new AppError('User not found.', 401, 'UNAUTHORIZED');
  if (!user.is_active) throw new AppError('Account suspended.', 403, 'ACCOUNT_SUSPENDED');
  if (!user.is_email_verified) throw new AppError('Email not verified.', 403, 'EMAIL_NOT_VERIFIED');

  const role = user.role;
  if (role !== 'SELLER' && role !== 'HYBRID' && role !== 'ADMIN') {
    throw new AppError('Seller role required.', 403, 'ROLE_REQUIRED');
  }

  req.user = user;
  req.userId = user.id;
  req.businessId = await resolveBusinessId(payload);
  next();
});

const requireHybridSupplierRole = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');

  const payload = verifyAccessToken(token);
  if (!payload) throw new AppError('Invalid or expired token.', 401, 'UNAUTHORIZED');

  const user = await findUserById(payload.userId);
  if (!user) throw new AppError('User not found.', 401, 'UNAUTHORIZED');
  if (!user.is_active) throw new AppError('Account suspended.', 403, 'ACCOUNT_SUSPENDED');
  if (!user.is_email_verified) throw new AppError('Email not verified.', 403, 'EMAIL_NOT_VERIFIED');

  if (!user.has_supplier_profile) {
    throw new AppError('Supplier role required.', 403, 'ROLE_REQUIRED');
  }

  const supplierProfile = await findSupplierByUserId(user.id);
  if (!supplierProfile) throw new AppError('Supplier profile not found.', 403, 'ROLE_REQUIRED');

  req.user = user;
  req.userId = user.id;
  req.businessId = await resolveBusinessId(payload);
  req.supplierProfile = supplierProfile;
  next();
});

const requireAdminAuth = asyncHandler(async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');

  const payload = verifyAccessToken(token);
  if (!payload) throw new AppError('Invalid or expired token.', 401, 'UNAUTHORIZED');

  const user = await findUserById(payload.userId);
  if (!user) throw new AppError('User not found.', 401, 'UNAUTHORIZED');
  if (!user.is_active) throw new AppError('Account suspended.', 403, 'ACCOUNT_SUSPENDED');

  if (user.role !== 'ADMIN') {
    throw new AppError('Admin access required.', 403, 'FORBIDDEN');
  }

  req.user = user;
  req.userId = user.id;
  req.businessId = await resolveBusinessId(payload);
  next();
});

// ─── Customer (storefront) auth ───────────────────────────────────────────────

const requireCustomerAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers['x-customer-token'];
  if (!header) throw new AppError('Customer authentication required.', 401, 'UNAUTHORIZED');

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const session = await findCustomerSession(tokenHash);
  if (!session) throw new AppError('Invalid or expired session.', 401, 'UNAUTHORIZED');
  if (new Date(session.expires_at) < new Date()) throw new AppError('Session expired.', 401, 'UNAUTHORIZED');
  if (session.revoked_at) throw new AppError('Session revoked.', 401, 'UNAUTHORIZED');

  req.customer = session.customer;
  req.customerId = session.customer_id;
  req.customerSession = session;
  next();
});

const optionalCustomerAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers['x-customer-token'];
  if (!header) { req.customer = null; return next(); }

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    const session = await findCustomerSession(tokenHash);
    if (session && new Date(session.expires_at) >= new Date() && !session.revoked_at) {
      req.customer = session.customer;
      req.customerId = session.customer_id;
      req.customerSession = session;
    } else {
      req.customer = null;
    }
  } catch {
    req.customer = null;
  }
  next();
});

module.exports = {
  requireSellerAuth,
  optionalSellerAuth,
  requireHybridSellerRole,
  requireHybridSupplierRole,
  requireAdminAuth,
  requireCustomerAuth,
  optionalCustomerAuth,
};
