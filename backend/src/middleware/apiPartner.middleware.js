const crypto = require('crypto');
const AppError = require('../utils/AppError');
const asyncHandler = require('./asyncHandler');
const { findCredentialsByPublicKey } = require('../db/queries/developerProfiles.queries');
const { sql } = require('../config/database');

const requireApiPartnerAuth = asyncHandler(async (req, res, next) => {
  const publicKey = req.headers['x-varanda-public-key'];
  const secretKey = req.headers['x-varanda-secret-key'];

  if (!publicKey) throw new AppError('API public key required.', 401, 'UNAUTHORIZED');

  const credential = await findCredentialsByPublicKey(publicKey);
  if (!credential) throw new AppError('Invalid API credentials.', 401, 'UNAUTHORIZED');
  if (!credential.is_active) throw new AppError('API credentials are inactive.', 401, 'UNAUTHORIZED');

  if (secretKey) {
    const secretHash = crypto.createHash('sha256').update(secretKey).digest('hex');
    if (secretHash !== credential.secret_key_hash) {
      throw new AppError('Invalid API credentials.', 401, 'UNAUTHORIZED');
    }
  }

  if (credential.developer_status !== 'ACTIVE') {
    throw new AppError('Developer account is not active.', 403, 'API_PARTNER_SUSPENDED');
  }

  req.apiPartner = credential.developer;
  req.developerCredential = credential;

  // Update last_used_at asynchronously — don't block the request
  setImmediate(() => {
    sql`UPDATE developer_credentials SET last_used_at = NOW() WHERE id = ${credential.id}`.catch(() => {});
  });

  next();
});

module.exports = { requireApiPartnerAuth };
