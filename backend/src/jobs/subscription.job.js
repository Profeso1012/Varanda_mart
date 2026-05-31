const { sql } = require('../config/database');
const emailConfig = require('../config/email');
const { config } = require('../config/env');

/**
 * Expire stale trials — finds TRIAL subscriptions past their trial_ends_at and marks EXPIRED.
 * PRO/GROWTH trials are handled by Flutterwave webhooks; this catches edge cases.
 */
const expireStaleTrials = async () => {
  const expired = await sql`
    UPDATE business_subscriptions
    SET status = 'EXPIRED', updated_at = NOW()
    WHERE status = 'TRIAL' AND trial_ends_at < NOW()
    RETURNING business_id
  `;
  if (expired.length > 0) {
    console.log(`[subscription.job] Expired ${expired.length} stale trial(s)`);
  }
};

/**
 * Send trial expiry warning emails to sellers whose trial ends in 7 days.
 * Uses a simple check — sends once per business (no last_warning_sent_at column in MVP).
 */
const sendTrialWarnings = async () => {
  const nearing = await sql`
    SELECT bs.id, bs.business_id, bs.trial_ends_at, u.email, u.first_name
    FROM business_subscriptions bs
    JOIN businesses b ON b.id = bs.business_id
    JOIN users u ON u.id = b.owner_id
    WHERE bs.status = 'TRIAL'
      AND bs.trial_ends_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  `;

  for (const sub of nearing) {
    const daysLeft = Math.ceil((new Date(sub.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24));
    await emailConfig
      .sendTrialExpiryWarning(sub.email, daysLeft, `${config.sellerDashboardUrl}/billing`)
      .catch(() => {});
  }

  if (nearing.length > 0) {
    console.log(`[subscription.job] Sent ${nearing.length} trial warning email(s)`);
  }
};

module.exports = { expireStaleTrials, sendTrialWarnings };
