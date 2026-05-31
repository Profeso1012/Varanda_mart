const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { config } = require('../config/env');
const AppError = require('../utils/AppError');
const { slugify } = require('../utils/slugify');
const {
  createUser, findUserByEmail, findUserById,
  setUserRole, markEmailVerified, updateOnboardingStep,
  setHasSellerProfile, setHasSupplierProfile, setHasDeveloperProfile, updateUser,
} = require('../db/queries/users.queries');
const {
  createOtpCode, findActiveOtp, incrementOtpAttempts, markOtpUsed,
  invalidateOtpsByEmail, createRefreshToken, findRefreshToken,
  revokeRefreshToken, revokeAllUserRefreshTokens,
} = require('../db/queries/auth.queries');
const { createBusiness, findBusinessByOwnerId, findBusinessBySlug } = require('../db/queries/businesses.queries');
const { createSupplierProfile, findSupplierByUserId } = require('../db/queries/supplierProfiles.queries');
const { createDeveloperProfile, findDeveloperByUserId } = require('../db/queries/developerProfiles.queries');
const { getSubscriptionByBusinessId } = require('../db/queries/subscriptions.queries');
const emailConfig = require('../config/email');

const MAX_OTP_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 10;

const isDev = config.nodeEnv !== 'production';
const devLog = (...args) => { if (isDev) console.log('[auth:dev]', ...args); };

// ─── Crypto helpers ───────────────────────────────────────────────────────────

const hashPassword = (password) => bcrypt.hash(password, 12);

const comparePassword = (plain, hash) => bcrypt.compare(plain, hash);

// In development, set OTP_FIXED_VALUE=654321 in .env for easy Postman testing.
// In production, leave OTP_FIXED_VALUE empty — uses cryptographically random codes.
const generateOtp = () => config.otpFixedValue || crypto.randomInt(100000, 999999).toString();

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const generateAccessToken = ({ userId, businessId, role, hasSupplierProfile, hasDeveloperProfile }) =>
  jwt.sign(
    { userId, businessId: businessId || null, role, hasSupplierProfile, hasDeveloperProfile },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

const generateRefreshTokenValue = () => crypto.randomBytes(32).toString('hex');

// ─── Register ─────────────────────────────────────────────────────────────────

const registerUser = async ({ email, password, firstName, lastName, phone }) => {
  const existing = await findUserByEmail(email);
  if (existing) throw new AppError('Email already registered.', 409, 'CONFLICT');

  const passwordHash = await hashPassword(password);
  const user = await createUser({ email: email.toLowerCase(), passwordHash, firstName, lastName, phone });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await invalidateOtpsByEmail(email, 'EMAIL_VERIFY');
  await createOtpCode({ userId: user.id, email: email.toLowerCase(), purpose: 'EMAIL_VERIFY', codeHash: hashOtp(otp), expiresAt });

  devLog(`REGISTER → user=${user.id} email=${email} OTP=${otp} expires=${expiresAt.toISOString()}`);

  emailConfig.sendVerificationOtp(email, firstName || 'there', otp).catch(() => {});

  return { user };
};

// ─── Verify email ─────────────────────────────────────────────────────────────

const verifyEmail = async (email, code) => {
  const otpRecord = await findActiveOtp(email.toLowerCase(), 'EMAIL_VERIFY');
  if (!otpRecord) throw new AppError('Invalid or expired code.', 400, 'INVALID_CODE');

  if (new Date(otpRecord.expires_at) < new Date()) {
    throw new AppError('Code has expired.', 410, 'GONE');
  }

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError('Too many attempts. Request a new code.', 422, 'MAX_ATTEMPTS');
  }

  if (otpRecord.code_hash !== hashOtp(code)) {
    await incrementOtpAttempts(otpRecord.id);
    const remaining = MAX_OTP_ATTEMPTS - (otpRecord.attempts + 1);
    throw new AppError(`Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`, 400, 'INVALID_CODE');
  }

  await markOtpUsed(otpRecord.id);
  const user = await markEmailVerified(otpRecord.user_id);
  devLog(`VERIFY EMAIL → user=${user.id} email=${email}`);

  const accessToken = generateAccessToken({
    userId: user.id,
    businessId: null,
    role: user.role,
    hasSupplierProfile: user.has_supplier_profile,
    hasDeveloperProfile: user.has_developer_profile,
  });

  const refreshTokenValue = generateRefreshTokenValue();
  const refreshExpiresAt = new Date(Date.now() + config.refreshTokenExpiresDays * 24 * 60 * 60 * 1000);
  await createRefreshToken({
    userId: user.id,
    tokenHash: crypto.createHash('sha256').update(refreshTokenValue).digest('hex'),
    expiresAt: refreshExpiresAt,
  });

  return { user, accessToken, refreshToken: refreshTokenValue };
};

// ─── Role selection ───────────────────────────────────────────────────────────

const selectRole = async (userId, role) => {
  const user = await findUserById(userId);
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');

  // Prevent re-selection
  if (user.role !== 'SELLER' || user.has_seller_profile || user.has_supplier_profile || user.has_developer_profile) {
    // Allow if still at ROLE_SELECTION step (first time)
    if (user.onboarding_step !== 'ROLE_SELECTION') {
      throw new AppError('Role already selected.', 409, 'CONFLICT');
    }
  }

  let business = null;
  let supplierProfile = null;
  let developerProfile = null;
  let onboardingStep = 'BUSINESS_SETUP';

  if (role === 'SELLER') {
    // Generate unique slug from name
    const baseName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'my-store';
    let slug = slugify(baseName);
    // Ensure uniqueness
    let existing = await findBusinessBySlug(slug);
    let counter = 1;
    while (existing) {
      slug = `${slugify(baseName)}-${counter++}`;
      existing = await findBusinessBySlug(slug);
    }

    business = await createBusiness({
      ownerId: userId,
      name: baseName,
      slug,
      sector: 'GENERAL_MERCHANDISE',
    });

    await setUserRole(userId, 'SELLER');
    await setHasSellerProfile(userId, true);
    onboardingStep = 'PLAN_SELECTION';
    await updateOnboardingStep(userId, onboardingStep);

  } else if (role === 'SUPPLIER') {
    const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'My Supplier Store';
    supplierProfile = await createSupplierProfile({
      userId,
      displayName,
      processingTimeDays: 3,
      shipsTo: [],
    });

    await setUserRole(userId, 'SUPPLIER');
    await setHasSupplierProfile(userId, true);
    onboardingStep = 'BUSINESS_SETUP';
    await updateOnboardingStep(userId, onboardingStep);

  } else if (role === 'DEVELOPER') {
    const contactName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Developer';
    developerProfile = await createDeveloperProfile({
      userId,
      businessName: contactName,
      contactName,
    });

    await setUserRole(userId, 'DEVELOPER');
    await setHasDeveloperProfile(userId, true);
    onboardingStep = 'COMPLETE';
    await updateOnboardingStep(userId, onboardingStep);

    emailConfig.sendWelcomeDeveloper(user.email, user.first_name || 'there').catch(() => {});
  } else {
    throw new AppError('Invalid role. Must be SELLER, SUPPLIER, or DEVELOPER.', 422, 'VALIDATION_ERROR');
  }

  return {
    role,
    onboardingStep,
    business: business ? { id: business.id, slug: business.slug, status: business.status } : null,
    supplierProfile: supplierProfile ? { id: supplierProfile.id } : null,
    developerProfile: developerProfile ? { id: developerProfile.id, status: developerProfile.status } : null,
  };
};

// ─── Add role (hybrid) ────────────────────────────────────────────────────────

const addRole = async (userId, addRoleValue) => {
  const user = await findUserById(userId);
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');

  if (user.role === 'DEVELOPER') {
    throw new AppError('Developer accounts cannot add seller or supplier roles.', 400, 'INVALID_ADDITION');
  }

  let onboardingStep = user.onboarding_step;
  let nextAction = '';

  if (addRoleValue === 'SUPPLIER') {
    if (user.has_supplier_profile) throw new AppError('Already has supplier role.', 409, 'CONFLICT');

    const business = await findBusinessByOwnerId(userId);
    const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'My Supplier Store';
    await createSupplierProfile({
      userId,
      businessId: business?.id || null,
      displayName,
      processingTimeDays: 3,
      shipsTo: [],
    });

    await setHasSupplierProfile(userId, true);
    await setUserRole(userId, 'HYBRID');
    nextAction = 'Visit /supplier to complete supplier setup';

  } else if (addRoleValue === 'SELLER') {
    if (user.has_seller_profile) throw new AppError('Already has seller role.', 409, 'CONFLICT');

    const baseName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'my-store';
    let slug = slugify(baseName);
    let existing = await findBusinessBySlug(slug);
    let counter = 1;
    while (existing) {
      slug = `${slugify(baseName)}-${counter++}`;
      existing = await findBusinessBySlug(slug);
    }

    const business = await createBusiness({
      ownerId: userId,
      name: baseName,
      slug,
      sector: 'GENERAL_MERCHANDISE',
    });

    // Link supplier profile to business if exists
    const supplierProfile = await findSupplierByUserId(userId);
    if (supplierProfile) {
      const { sql } = require('../config/database');
      await sql`UPDATE supplier_profiles SET business_id = ${business.id} WHERE id = ${supplierProfile.id}`;
    }

    await setHasSellerProfile(userId, true);
    await setUserRole(userId, 'HYBRID');
    onboardingStep = 'PLAN_SELECTION';
    await updateOnboardingStep(userId, onboardingStep);
    nextAction = 'Visit /pricing to select a plan';

  } else {
    throw new AppError('addRole must be SELLER or SUPPLIER.', 422, 'VALIDATION_ERROR');
  }

  return {
    role: 'HYBRID',
    addedRole: addRoleValue,
    onboardingStep,
    nextAction,
  };
};

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async (email, password) => {
  const user = await findUserByEmail(email.toLowerCase());
  if (!user) throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');

  if (!user.is_email_verified) {
    // Resend a fresh OTP rather than leaving the user with no path forward
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await invalidateOtpsByEmail(user.email, 'EMAIL_VERIFY');
    await createOtpCode({
      userId: user.id,
      email: user.email,
      purpose: 'EMAIL_VERIFY',
      codeHash: hashOtp(otp),
      expiresAt,
    });
    emailConfig.sendVerificationOtp(user.email, user.first_name || 'there', otp).catch(() => {});
    devLog(`LOGIN (unverified) → resent OTP to ${user.email} OTP=${otp}`);
    throw new AppError(
      'Email not verified. A new verification code has been sent to your email.',
      403,
      'EMAIL_NOT_VERIFIED'
    );
  }
  if (!user.is_active) throw new AppError('Account suspended.', 403, 'ACCOUNT_SUSPENDED');

  // Load profiles
  let business = null;
  let supplierProfile = null;
  let developerProfile = null;
  let subscription = null;

  if (user.has_seller_profile || user.role === 'SELLER' || user.role === 'HYBRID') {
    business = await findBusinessByOwnerId(user.id);
    if (business) {
      subscription = await getSubscriptionByBusinessId(business.id);
    }
  }
  if (user.has_supplier_profile) {
    supplierProfile = await findSupplierByUserId(user.id);
  }
  if (user.has_developer_profile) {
    developerProfile = await findDeveloperByUserId(user.id);
  }

  devLog(`LOGIN → user=${user.id} email=${email} role=${user.role} step=${user.onboarding_step}`);
  await updateUser(user.id, { last_login_at: new Date() });

  const accessToken = generateAccessToken({
    userId: user.id,
    businessId: business?.id || null,
    role: user.role,
    hasSupplierProfile: user.has_supplier_profile,
    hasDeveloperProfile: user.has_developer_profile,
  });

  const refreshTokenValue = generateRefreshTokenValue();
  const refreshExpiresAt = new Date(Date.now() + config.refreshTokenExpiresDays * 24 * 60 * 60 * 1000);
  await createRefreshToken({
    userId: user.id,
    tokenHash: crypto.createHash('sha256').update(refreshTokenValue).digest('hex'),
    expiresAt: refreshExpiresAt,
  });

  return { user, business, supplierProfile, developerProfile, subscription, accessToken, refreshToken: refreshTokenValue };
};

// ─── Refresh token ────────────────────────────────────────────────────────────

const refreshAccessToken = async (refreshTokenValue) => {
  if (!refreshTokenValue) throw new AppError('Refresh token required.', 401, 'UNAUTHORIZED');

  const tokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');
  const tokenRecord = await findRefreshToken(tokenHash);

  if (!tokenRecord) throw new AppError('Invalid refresh token.', 401, 'UNAUTHORIZED');
  if (tokenRecord.revoked_at) throw new AppError('Token revoked.', 401, 'UNAUTHORIZED');
  if (new Date(tokenRecord.expires_at) < new Date()) throw new AppError('Token expired.', 401, 'TOKEN_EXPIRED');

  const user = await findUserById(tokenRecord.user_id);
  if (!user || !user.is_active) throw new AppError('User not found or suspended.', 401, 'UNAUTHORIZED');

  const business = user.has_seller_profile ? await findBusinessByOwnerId(user.id) : null;

  const accessToken = generateAccessToken({
    userId: user.id,
    businessId: business?.id || null,
    role: user.role,
    hasSupplierProfile: user.has_supplier_profile,
    hasDeveloperProfile: user.has_developer_profile,
  });

  return { accessToken };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

const logout = async (refreshTokenValue) => {
  if (!refreshTokenValue) return;
  const tokenHash = crypto.createHash('sha256').update(refreshTokenValue).digest('hex');
  const tokenRecord = await findRefreshToken(tokenHash);
  if (tokenRecord) await revokeRefreshToken(tokenRecord.id);
};

// ─── Password reset ───────────────────────────────────────────────────────────

const initiatePasswordReset = async (email) => {
  const user = await findUserByEmail(email.toLowerCase());
  if (!user) return; // Silent — no enumeration

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await invalidateOtpsByEmail(email, 'PASSWORD_RESET');
  await createOtpCode({
    userId: user.id,
    email: email.toLowerCase(),
    purpose: 'PASSWORD_RESET',
    codeHash: hashOtp(otp),
    expiresAt,
  });

  devLog(`PASSWORD RESET OTP → email=${email} OTP=${otp} expires=${expiresAt.toISOString()}`);
  emailConfig.sendPasswordResetOtp(email, user.first_name || 'there', otp).catch(() => {});
};

const resetPassword = async (email, code, newPassword) => {
  const otpRecord = await findActiveOtp(email.toLowerCase(), 'PASSWORD_RESET');
  if (!otpRecord) throw new AppError('Invalid or expired code.', 400, 'INVALID_CODE');

  if (new Date(otpRecord.expires_at) < new Date()) throw new AppError('Code has expired.', 410, 'GONE');

  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError('Too many attempts. Request a new code.', 422, 'MAX_ATTEMPTS');
  }

  if (otpRecord.code_hash !== hashOtp(code)) {
    await incrementOtpAttempts(otpRecord.id);
    throw new AppError('Invalid code.', 400, 'INVALID_CODE');
  }

  await markOtpUsed(otpRecord.id);
  const passwordHash = await hashPassword(newPassword);
  await updateUser(otpRecord.user_id, { password_hash: passwordHash });
  await revokeAllUserRefreshTokens(otpRecord.user_id);
};

// ─── Get me ───────────────────────────────────────────────────────────────────

const getMe = async (userId) => {
  const user = await findUserById(userId);
  if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');

  let business = null;
  let supplierProfile = null;
  let developerProfile = null;
  let subscription = null;

  if (user.has_seller_profile || user.role === 'SELLER' || user.role === 'HYBRID') {
    const biz = await findBusinessByOwnerId(user.id);
    if (biz) {
      business = { id: biz.id, name: biz.name, slug: biz.slug, status: biz.status, currency: biz.currency, logoUrl: biz.logo_url };
      const sub = await getSubscriptionByBusinessId(biz.id);
      if (sub) {
        const trialEndsAt = sub.trial_ends_at;
        const daysLeftInTrial = trialEndsAt
          ? Math.max(0, Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))
          : null;
        subscription = {
          tier: sub.tier,
          status: sub.status,
          trialEndsAt,
          daysLeftInTrial,
          features: sub.features,
          limits: {
            maxProducts: sub.max_products,
            maxStaffSeats: sub.max_staff_seats,
            maxDropshipImports: sub.max_dropship_imports,
          },
        };
      }
    }
  }

  if (user.has_supplier_profile) {
    const sp = await findSupplierByUserId(user.id);
    if (sp) supplierProfile = { id: sp.id, displayName: sp.display_name, isVerified: sp.is_verified, isActive: sp.is_active };
  }

  if (user.has_developer_profile) {
    const dp = await findDeveloperByUserId(user.id);
    if (dp) developerProfile = { id: dp.id, businessName: dp.business_name, status: dp.status };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      onboardingStep: user.onboarding_step,
      hasSellerProfile: user.has_seller_profile,
      hasSupplierProfile: user.has_supplier_profile,
      hasDeveloperProfile: user.has_developer_profile,
    },
    business,
    supplierProfile,
    developerProfile,
    subscription,
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateOtp,
  hashOtp,
  generateAccessToken,
  generateRefreshTokenValue,
  registerUser,
  verifyEmail,
  selectRole,
  addRole,
  login,
  refreshAccessToken,
  logout,
  initiatePasswordReset,
  resetPassword,
  getMe,
};
