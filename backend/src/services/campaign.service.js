/**
 * Campaign Service — Full implementation in Phase 9.
 * Dispatches email/SMS campaigns in batches of 100.
 */

const emailConfig = require('../config/email');
const smsConfig = require('../config/sms');

const dispatchCampaign = async (campaign, recipients) => {
  const batchSize = 100;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map((recipient) => {
        if (campaign.channel === 'EMAIL') {
          return emailConfig.sendCampaignEmail(recipient.email, campaign.subject, campaign.body);
        } else if (campaign.channel === 'SMS') {
          return smsConfig.sendSms(recipient.phone, campaign.body);
        }
      })
    );
  }
};

module.exports = { dispatchCampaign };
