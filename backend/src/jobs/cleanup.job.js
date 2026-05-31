const { sql } = require('../config/database');

/**
 * Delete expired OTP codes — runs every 30 minutes.
 */
const cleanExpiredOtps = async () => {
  const result = await sql`DELETE FROM otp_codes WHERE expires_at < NOW()`;
  const result2 = await sql`DELETE FROM customer_otps WHERE expires_at < NOW()`;
  const total = (result.count || 0) + (result2.count || 0);
  if (total > 0) console.log(`[cleanup.job] Deleted ${total} expired OTP(s)`);
};

/**
 * Delete guest carts older than 7 days — runs every 30 minutes.
 */
const cleanExpiredGuestCarts = async () => {
  const result = await sql`
    DELETE FROM carts
    WHERE customer_id IS NULL AND updated_at < NOW() - INTERVAL '7 days'
  `;
  if (result.count > 0) console.log(`[cleanup.job] Deleted ${result.count} expired guest cart(s)`);
};

/**
 * Revoke expired refresh tokens — runs every 30 minutes.
 */
const cleanExpiredRefreshTokens = async () => {
  await sql`DELETE FROM refresh_tokens WHERE expires_at < NOW() - INTERVAL '1 day'`;
};

module.exports = { cleanExpiredOtps, cleanExpiredGuestCarts, cleanExpiredRefreshTokens };
