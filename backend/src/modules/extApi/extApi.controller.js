const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { findUserByEmail, createUser, setUserRole, setHasDeveloperProfile, updateOnboardingStep } =
  require('../../db/queries/users.queries');
const { createDeveloperProfile, findDeveloperByUserId, createApiCredentials, deactivateCredentials } =
  require('../../db/queries/developerProfiles.queries');
const { invalidateOtpsByEmail } = require('../../db/queries/auth.queries');
const emailConfig = require('../../config/email');

// POST /api/v1/ext-api/register
// Creates user with role DEVELOPER + developer_profile with status PENDING.
const register = asyncHandler(async (req, res) => {
  const { email, password, businessName, contactName, websiteUrl, description } = req.body;

  const existing = await findUserByEmail(email.toLowerCase());
  if (existing) throw new AppError('Email already registered.', 409, 'CONFLICT');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({
    email: email.toLowerCase(),
    passwordHash,
    firstName: contactName.split(' ')[0] || contactName,
    lastName: contactName.split(' ').slice(1).join(' ') || '',
  });

  const profile = await createDeveloperProfile({ userId: user.id, businessName, contactName, websiteUrl, description });

  await setUserRole(user.id, 'DEVELOPER');
  await setHasDeveloperProfile(user.id, true);
  await updateOnboardingStep(user.id, 'COMPLETE');

  emailConfig.sendWelcomeDeveloper(email, contactName).catch(() => {});

  res.status(201).json({
    success: true,
    data: {
      profile: { id: profile.id, status: profile.status },
      message: 'Application submitted. You\'ll be notified on approval.',
    },
  });
});

// POST /api/v1/ext-api/credentials
// Developer must be logged in (Bearer) and approved.
const generateCredentials = asyncHandler(async (req, res) => {
  const profile = await findDeveloperByUserId(req.userId);
  if (!profile) throw new AppError('Developer profile not found.', 404, 'NOT_FOUND');
  if (profile.status !== 'ACTIVE') {
    throw new AppError('Developer account not yet approved.', 403, 'FORBIDDEN');
  }

  // Deactivate existing credentials
  await deactivateCredentials(profile.id);

  // Generate new key pair
  const publicKey = `vrd_pub_live_${crypto.randomBytes(16).toString('hex')}`;
  const secretKeyPlain = `vrd_sec_live_${crypto.randomBytes(24).toString('hex')}`;
  const secretKeyHash = crypto.createHash('sha256').update(secretKeyPlain).digest('hex');

  await createApiCredentials(profile.id, publicKey, secretKeyHash);

  res.status(201).json({
    success: true,
    data: {
      publicKey,
      secretKey: secretKeyPlain,
      warning: 'Copy your secret key now. It cannot be retrieved again.',
      environment: 'live',
    },
  });
});

// POST /api/v1/ext-api/credentials/rotate
const rotateCredentials = asyncHandler(async (req, res) => {
  const profile = await findDeveloperByUserId(req.userId);
  if (!profile) throw new AppError('Developer profile not found.', 404, 'NOT_FOUND');
  if (profile.status !== 'ACTIVE') throw new AppError('Developer account not active.', 403, 'FORBIDDEN');

  await deactivateCredentials(profile.id);

  const publicKey = `vrd_pub_live_${crypto.randomBytes(16).toString('hex')}`;
  const secretKeyPlain = `vrd_sec_live_${crypto.randomBytes(24).toString('hex')}`;
  const secretKeyHash = crypto.createHash('sha256').update(secretKeyPlain).digest('hex');

  await createApiCredentials(profile.id, publicKey, secretKeyHash);

  res.status(201).json({
    success: true,
    data: {
      publicKey,
      secretKey: secretKeyPlain,
      warning: 'Old credentials have been deactivated. Copy your new secret key now.',
      environment: 'live',
    },
  });
});

module.exports = { register, generateCredentials, rotateCredentials };
