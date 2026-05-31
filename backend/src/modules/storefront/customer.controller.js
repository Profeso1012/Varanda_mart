/**
 * Customer Auth, Profile, and Address endpoints.
 * All scoped per store via req.tenantBusinessId (set by resolveTenant middleware).
 */
const crypto = require('crypto');
const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const { config } = require('../../config/env');
const emailConfig = require('../../config/email');

const {
  createCustomerOtp, findActiveCustomerOtp,
  incrementCustomerOtpAttempts, markCustomerOtpUsed,
  createCustomerSession, revokeCustomerSession,
} = require('../../db/queries/auth.queries');

const {
  findCustomerByEmail, createCustomer, updateCustomer, updateCustomerLastLogin,
  listCustomerAddresses, findCustomerAddressById,
  createCustomerAddress, updateCustomerAddress, deleteCustomerAddress,
} = require('../../db/queries/customers.queries');

const { listOrdersByCustomer, findOrderById } = require('../../db/queries/orders.queries');

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const SESSION_DAYS = 30;

const isDev = config.nodeEnv !== 'production';
const generateOtp = () => config.otpFixedValue || crypto.randomInt(100000, 999999).toString();
const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');
const generateSessionToken = () => crypto.randomBytes(32).toString('hex');

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * POST /storefront/auth/request-otp
 * Body: { email }
 * Sends a 6-digit OTP to the customer's email. Creates customer record if first time.
 * OTP is scoped to this store (business_id) — invalid on other stores.
 */
const requestOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError('Email is required.', 422, 'VALIDATION_ERROR');

  const businessId = req.tenantBusinessId;
  const business = req.tenantBusiness;

  // Find or note customer (don't create yet — wait for OTP verification)
  const customer = await findCustomerByEmail(email);

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  const codeHash = hashOtp(otp);

  await createCustomerOtp({ email: email.toLowerCase(), codeHash, businessId, expiresAt });

  if (isDev) console.log(`[customer:dev] OTP for ${email} on store ${business.name}: ${otp}`);

  emailConfig.sendCustomerOtp(
    email,
    customer?.first_name || 'there',
    otp,
    business.name
  ).catch(() => {});

  res.json({
    success: true,
    data: {
      message: `Verification code sent to ${email}`,
      isNewCustomer: !customer,
    },
  });
});

/**
 * POST /storefront/auth/verify-otp
 * Body: { email, code }
 * Verifies OTP, creates customer if new, returns session token.
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) throw new AppError('Email and code are required.', 422, 'VALIDATION_ERROR');

  const businessId = req.tenantBusinessId;

  const otpRecord = await findActiveCustomerOtp(email.toLowerCase(), businessId);
  if (!otpRecord) throw new AppError('Invalid or expired code.', 400, 'INVALID_CODE');

  if (new Date(otpRecord.expires_at) < new Date()) {
    throw new AppError('Code has expired.', 410, 'GONE');
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError('Too many attempts. Request a new code.', 422, 'MAX_ATTEMPTS');
  }

  if (otpRecord.code_hash !== hashOtp(code)) {
    await incrementCustomerOtpAttempts(otpRecord.id);
    const remaining = MAX_OTP_ATTEMPTS - (otpRecord.attempts + 1);
    throw new AppError(
      `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
      400,
      'INVALID_CODE'
    );
  }

  await markCustomerOtpUsed(otpRecord.id);

  // Find or create customer
  let customer = await findCustomerByEmail(email.toLowerCase());
  const isNew = !customer;
  if (!customer) {
    customer = await createCustomer({ email: email.toLowerCase() });
  }

  await updateCustomerLastLogin(customer.id);

  // Create session
  const sessionToken = generateSessionToken();
  const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await createCustomerSession({ customerId: customer.id, businessId, tokenHash, expiresAt });

  res.json({
    success: true,
    data: {
      token: sessionToken, // frontend stores this and sends as X-Customer-Token header
      expiresAt,
      isNewCustomer: isNew,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
      },
    },
  });
});

/**
 * POST /storefront/auth/logout
 * Revokes the current customer session.
 */
const logout = asyncHandler(async (req, res) => {
  if (req.customerSession) {
    await revokeCustomerSession(req.customerSession.id);
  }
  res.json({ success: true, data: { message: 'Logged out.' } });
});

// ─── Profile ──────────────────────────────────────────────────────────────────

/**
 * GET /storefront/customer/profile
 * Auth: X-Customer-Token required.
 */
const getProfile = asyncHandler(async (req, res) => {
  const customer = req.customer;
  res.json({
    success: true,
    data: {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
    },
  });
});

/**
 * PUT /storefront/customer/profile
 * Body: { firstName?, lastName?, phone? }
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  const fields = {};
  if (firstName !== undefined) fields.first_name = firstName;
  if (lastName !== undefined) fields.last_name = lastName;
  if (phone !== undefined) fields.phone = phone;

  const updated = await updateCustomer(req.customerId, fields);
  res.json({
    success: true,
    data: {
      id: updated.id,
      email: updated.email,
      firstName: updated.first_name,
      lastName: updated.last_name,
      phone: updated.phone,
    },
  });
});

// ─── Addresses ────────────────────────────────────────────────────────────────

const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await listCustomerAddresses(req.customerId);
  res.json({ success: true, data: addresses });
});

const createAddress = asyncHandler(async (req, res) => {
  const address = await createCustomerAddress(req.customerId, req.body);
  res.status(201).json({ success: true, data: address });
});

const updateAddress = asyncHandler(async (req, res) => {
  const address = await updateCustomerAddress(req.params.addressId, req.customerId, req.body);
  if (!address) throw new AppError('Address not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: address });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const existing = await findCustomerAddressById(req.params.addressId, req.customerId);
  if (!existing) throw new AppError('Address not found.', 404, 'NOT_FOUND');
  await deleteCustomerAddress(req.params.addressId, req.customerId);
  res.json({ success: true, data: { message: 'Address deleted.' } });
});

// ─── Customer orders ──────────────────────────────────────────────────────────

const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, perPage = 10 } = req.query;
  const { rows, total } = await listOrdersByCustomer(
    req.customerId,
    req.tenantBusinessId,
    { page: parseInt(page, 10), perPage: parseInt(perPage, 10) }
  );
  res.json({
    success: true,
    data: { orders: rows },
    meta: { page: parseInt(page, 10), perPage: parseInt(perPage, 10), total, totalPages: Math.ceil(total / parseInt(perPage, 10)) },
  });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await findOrderById(req.params.orderId, req.tenantBusinessId);
  if (!order || order.customer_id !== req.customerId) {
    throw new AppError('Order not found.', 404, 'NOT_FOUND');
  }
  res.json({ success: true, data: order });
});

module.exports = {
  requestOtp,
  verifyOtp,
  logout,
  getProfile,
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getOrders,
  getOrder,
};
