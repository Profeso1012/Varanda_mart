const cron = require('node-cron');
const { cleanExpiredOtps, cleanExpiredGuestCarts, cleanExpiredRefreshTokens } = require('./cleanup.job');
const { processScheduledCampaigns } = require('./campaign.job');
const { buildDailySnapshot } = require('./analytics.job');
const { computeSupplierMetrics } = require('./supplier.job');
const { purgeInactiveFreeTierData, sendInactivityWarnings } = require('./inactivity.job');
const { expireStaleTrials, sendTrialWarnings } = require('./subscription.job');

const safe = (name, fn) => async () => {
  try {
    await fn();
  } catch (err) {
    console.error(`[cron:${name}] Error:`, err.message);
  }
};

const initializeJobs = () => {
  // Every 30 minutes — cleanup expired OTPs and guest carts
  cron.schedule('*/30 * * * *', safe('cleanup-otps', cleanExpiredOtps));
  cron.schedule('*/30 * * * *', safe('cleanup-carts', cleanExpiredGuestCarts));
  cron.schedule('*/30 * * * *', safe('cleanup-tokens', cleanExpiredRefreshTokens));

  // Every 5 minutes — process scheduled campaigns
  cron.schedule('*/5 * * * *', safe('campaigns', processScheduledCampaigns));

  // Nightly at 2am — analytics daily snapshot
  cron.schedule('0 2 * * *', safe('analytics-snapshot', buildDailySnapshot));

  // Nightly at 3am — supplier metrics
  cron.schedule('0 3 * * *', safe('supplier-metrics', computeSupplierMetrics));

  // Daily at 8am — inactivity warnings
  cron.schedule('0 8 * * *', safe('inactivity-warnings', sendInactivityWarnings));

  // Daily at 1am — inactivity purge
  cron.schedule('0 1 * * *', safe('inactivity-purge', purgeInactiveFreeTierData));

  // Daily at midnight — expire stale trials
  cron.schedule('0 0 * * *', safe('trial-expiry', expireStaleTrials));

  // Daily at 9am — trial expiry warnings
  cron.schedule('0 9 * * *', safe('trial-warnings', sendTrialWarnings));

  console.log('[cron] All jobs scheduled');
};

module.exports = { initializeJobs };
