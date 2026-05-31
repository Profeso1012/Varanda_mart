const { sql } = require('../../config/database');

// ─── Seller / Admin OTP ───────────────────────────────────────────────────────

const createOtpCode = async ({ userId, email, purpose, codeHash, expiresAt }) => {
  const [otp] = await sql`
    INSERT INTO otp_codes (user_id, email, purpose, code_hash, expires_at)
    VALUES (${userId || null}, ${email.toLowerCase()}, ${purpose}, ${codeHash}, ${expiresAt})
    RETURNING *
  `;
  return otp;
};

const findActiveOtp = async (email, purpose) => {
  const [otp] = await sql`
    SELECT * FROM otp_codes
    WHERE email = ${email.toLowerCase()} AND purpose = ${purpose} AND used_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return otp || null;
};

const incrementOtpAttempts = async (id) => {
  const [otp] = await sql`
    UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ${id} RETURNING attempts
  `;
  return otp.attempts;
};

const markOtpUsed = async (id) => {
  await sql`UPDATE otp_codes SET used_at = NOW() WHERE id = ${id}`;
};

const invalidateOtpsByEmail = async (email, purpose) => {
  await sql`
    UPDATE otp_codes SET used_at = NOW()
    WHERE email = ${email.toLowerCase()} AND purpose = ${purpose} AND used_at IS NULL
  `;
};

// ─── Refresh tokens ───────────────────────────────────────────────────────────

const createRefreshToken = async ({ userId, tokenHash, deviceHint, expiresAt }) => {
  const [token] = await sql`
    INSERT INTO refresh_tokens (user_id, token_hash, device_hint, expires_at)
    VALUES (${userId}, ${tokenHash}, ${deviceHint || null}, ${expiresAt})
    RETURNING *
  `;
  return token;
};

const findRefreshToken = async (tokenHash) => {
  const [token] = await sql`
    SELECT * FROM refresh_tokens WHERE token_hash = ${tokenHash}
  `;
  return token || null;
};

const revokeRefreshToken = async (id) => {
  await sql`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ${id}`;
};

const revokeAllUserRefreshTokens = async (userId) => {
  await sql`
    UPDATE refresh_tokens SET revoked_at = NOW()
    WHERE user_id = ${userId} AND revoked_at IS NULL
  `;
};

// ─── Customer OTP ─────────────────────────────────────────────────────────────

const createCustomerOtp = async ({ email, codeHash, businessId, expiresAt }) => {
  const [otp] = await sql`
    INSERT INTO customer_otps (email, code_hash, business_id, expires_at)
    VALUES (${email.toLowerCase()}, ${codeHash}, ${businessId || null}, ${expiresAt})
    RETURNING *
  `;
  return otp;
};

const findActiveCustomerOtp = async (email, businessId) => {
  const [otp] = await sql`
    SELECT * FROM customer_otps
    WHERE email = ${email.toLowerCase()}
      AND business_id = ${businessId}
      AND used_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return otp || null;
};

const incrementCustomerOtpAttempts = async (id) => {
  const [otp] = await sql`
    UPDATE customer_otps SET attempts = attempts + 1 WHERE id = ${id} RETURNING attempts
  `;
  return otp.attempts;
};

const markCustomerOtpUsed = async (id) => {
  await sql`UPDATE customer_otps SET used_at = NOW() WHERE id = ${id}`;
};

// ─── Customer sessions ────────────────────────────────────────────────────────

const createCustomerSession = async ({ customerId, businessId, tokenHash, expiresAt }) => {
  const [session] = await sql`
    INSERT INTO customer_sessions (customer_id, business_id, token_hash, expires_at)
    VALUES (${customerId}, ${businessId}, ${tokenHash}, ${expiresAt})
    RETURNING *
  `;
  return session;
};

const findCustomerSession = async (tokenHash) => {
  const [session] = await sql`
    SELECT cs.*, c.email AS customer_email, c.first_name, c.last_name, c.phone
    FROM customer_sessions cs
    JOIN customers c ON c.id = cs.customer_id
    WHERE cs.token_hash = ${tokenHash}
  `;
  if (!session) return null;
  return {
    ...session,
    customer: {
      id: session.customer_id,
      email: session.customer_email,
      firstName: session.first_name,
      lastName: session.last_name,
      phone: session.phone,
    },
  };
};

const revokeCustomerSession = async (id) => {
  await sql`UPDATE customer_sessions SET revoked_at = NOW() WHERE id = ${id}`;
};

module.exports = {
  createOtpCode,
  findActiveOtp,
  incrementOtpAttempts,
  markOtpUsed,
  invalidateOtpsByEmail,
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  createCustomerOtp,
  findActiveCustomerOtp,
  incrementCustomerOtpAttempts,
  markCustomerOtpUsed,
  createCustomerSession,
  findCustomerSession,
  revokeCustomerSession,
};
