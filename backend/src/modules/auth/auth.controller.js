const authService = require('../../services/auth.service');
const asyncHandler = require('../../middleware/asyncHandler');
const { config } = require('../../config/env');

// When both apps share a custom root domain (e.g. app.varanda.com + api.varanda.com),
// set BASE_DOMAIN=varanda.com and the cookie will be scoped to .varanda.com so both subdomains share it.
// When deployed on platform URLs (vercel.app, onrender.com), leave BASE_DOMAIN empty — omitting the
// domain attribute lets the browser scope the cookie to the API host automatically, which is always valid.
const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
  ...(config.nodeEnv === 'production' && config.baseDomain && { domain: `.${config.baseDomain}` }),
  maxAge: config.refreshTokenExpiresDays * 24 * 60 * 60 * 1000,
  path: '/',
});

// POST /auth/register
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, phone } = req.body;
  await authService.registerUser({ email, password, firstName, lastName, phone });
  res.status(201).json({
    success: true,
    data: { message: 'Verification email sent', email },
  });
});

// POST /auth/verify-email
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, code } = req.body;
  const { user, accessToken, refreshToken } = await authService.verifyEmail(email, code);

  res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

  res.status(200).json({
    success: true,
    data: {
      accessToken,
      expiresIn: 900,
      // In development, also return the refresh token in the body so the frontend
      // can store it and send it back via Authorization header or request body,
      // since cross-origin HTTP blocks SameSite=Lax cookies from being stored.
      ...(config.nodeEnv !== 'production' && { refreshToken }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        role: null,
        onboardingStep: user.onboarding_step,
      },
    },
  });
});

// POST /auth/role/select
const selectRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const result = await authService.selectRole(req.userId, role);
  res.status(200).json({ success: true, data: result });
});

// POST /auth/role/add
const addRole = asyncHandler(async (req, res) => {
  const { addRole: addRoleValue } = req.body;
  const result = await authService.addRole(req.userId, addRoleValue);
  res.status(200).json({ success: true, data: result });
});

// POST /auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, business, supplierProfile, developerProfile, subscription, accessToken, refreshToken } =
    await authService.login(email, password);

  res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

  const trialEndsAt = subscription?.trial_ends_at || null;
  const daysLeftInTrial = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  res.status(200).json({
    success: true,
    data: {
      accessToken,
      expiresIn: 900,
      // In development, also return the refresh token in the body so the frontend
      // can store it and send it back via Authorization header or request body,
      // since cross-origin HTTP blocks SameSite=Lax cookies from being stored.
      ...(config.nodeEnv !== 'production' && { refreshToken }),
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
      business: business
        ? { id: business.id, name: business.name, slug: business.slug, status: business.status }
        : null,
      supplierProfile: supplierProfile
        ? { id: supplierProfile.id, displayName: supplierProfile.display_name }
        : null,
      developerProfile: developerProfile
        ? { id: developerProfile.id, businessName: developerProfile.business_name, status: developerProfile.status }
        : null,
      subscription: subscription
        ? {
            tier: subscription.tier,
            status: subscription.status,
            trialEndsAt,
            daysLeftInTrial,
          }
        : null,
    },
  });
});

// POST /auth/refresh
// Accepts the refresh token from:
//   1. HttpOnly cookie (production — set automatically by browser)
//   2. Request body { "refreshToken": "..." } (development — cross-origin HTTP doesn't send cookies)
//   3. Authorization: Bearer <refreshToken> header (alternative for dev/mobile)
const refresh = asyncHandler(async (req, res) => {
  const refreshTokenValue =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

  const { accessToken } = await authService.refreshAccessToken(refreshTokenValue);

  res.status(200).json({ success: true, data: { accessToken, expiresIn: 900 } });
});

// POST /auth/logout
const logout = asyncHandler(async (req, res) => {
  const refreshTokenValue =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

  await authService.logout(refreshTokenValue);
  res.clearCookie('refreshToken', { path: '/', ...(config.nodeEnv === 'production' && config.baseDomain && { domain: `.${config.baseDomain}` }) });
  res.status(200).json({ success: true, data: { message: 'Logged out' } });
});

// POST /auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.initiatePasswordReset(email);
  // Always 200 — no enumeration
  res.status(200).json({ success: true, data: { message: 'If that email exists, a reset code has been sent.' } });
});

// POST /auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, newPassword } = req.body;
  await authService.resetPassword(email, code, newPassword);
  res.status(200).json({ success: true, data: { message: 'Password updated successfully.' } });
});

// GET /auth/me
const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getMe(req.userId);
  res.status(200).json({ success: true, data: result });
});

module.exports = { register, verifyEmail, selectRole, addRole, login, refresh, logout, forgotPassword, resetPassword, getMe };
