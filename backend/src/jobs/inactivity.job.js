const { sql, withTransaction } = require('../config/database');
const emailConfig = require('../config/email');
const { config } = require('../config/env');

/**
 * Purge store data for free-tier (Starter) businesses with no sale in 90 days.
 * Retains the business record and user account — only deletes storefront data.
 * Runs daily at 1am.
 */
const purgeInactiveFreeTierData = async () => {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const businesses = await sql`
    SELECT b.id, b.name, b.owner_id
    FROM businesses b
    LEFT JOIN business_subscriptions bs ON bs.business_id = b.id
    WHERE (
      bs.id IS NULL
      OR bs.status IN ('EXPIRED', 'CANCELLED')
    )
    AND (b.last_sale_at IS NULL OR b.last_sale_at < ${cutoff})
  `;

  for (const business of businesses) {
    try {
      await withTransaction(async (tx) => {
        await tx`DELETE FROM store_pages WHERE business_id = ${business.id}`;
        await tx`DELETE FROM store_themes WHERE business_id = ${business.id}`;
        await tx`DELETE FROM products WHERE business_id = ${business.id}`;
        await tx`DELETE FROM categories WHERE business_id = ${business.id}`;
        await tx`DELETE FROM orders WHERE business_id = ${business.id}`;
        await tx`DELETE FROM brand_settings WHERE business_id = ${business.id}`;
        await tx`UPDATE domains SET status = 'SUSPENDED', updated_at = NOW() WHERE business_id = ${business.id}`;
      });
      console.log(`[inactivity.job] Purged data for business ${business.id} (${business.name})`);
    } catch (err) {
      console.error(`[inactivity.job] Failed to purge business ${business.id}:`, err.message);
    }
  }

  if (businesses.length > 0) {
    console.log(`[inactivity.job] Purged ${businesses.length} inactive free-tier store(s)`);
  }
};

/**
 * Warn businesses approaching the 90-day inactivity limit (at 75 days).
 * Runs daily at 8am.
 */
const sendInactivityWarnings = async () => {
  const warnCutoff = new Date(Date.now() - 75 * 24 * 60 * 60 * 1000);
  const purgeCutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const businesses = await sql`
    SELECT b.id, b.name, b.last_sale_at, u.email, u.first_name
    FROM businesses b
    JOIN users u ON u.id = b.owner_id
    LEFT JOIN business_subscriptions bs ON bs.business_id = b.id
    WHERE (bs.id IS NULL OR bs.status IN ('EXPIRED', 'CANCELLED'))
      AND b.last_sale_at < ${warnCutoff}
      AND b.last_sale_at > ${purgeCutoff}
  `;

  for (const business of businesses) {
    const daysLeft = Math.ceil(
      (new Date(business.last_sale_at).getTime() + 90 * 24 * 60 * 60 * 1000 - Date.now()) /
        (1000 * 60 * 60 * 24)
    );
    await emailConfig
      .sendEmail(
        business.email,
        'Your Varanda store data will be deleted soon',
        `Hi ${business.first_name || 'there'}, your store "${business.name}" has had no sales for over 75 days. Store data will be deleted in approximately ${daysLeft} day(s) unless you make a sale or upgrade your plan.`
      )
      .catch(() => {});
  }

  if (businesses.length > 0) {
    console.log(`[inactivity.job] Sent ${businesses.length} inactivity warning(s)`);
  }
};

module.exports = { purgeInactiveFreeTierData, sendInactivityWarnings };
