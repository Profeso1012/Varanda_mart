const { sql } = require('../config/database');
const { dispatchCampaign } = require('../services/campaign.service');

/**
 * Process scheduled campaigns — runs every 5 minutes.
 * Finds DRAFT campaigns with scheduled_at <= NOW() and dispatches them.
 */
const processScheduledCampaigns = async () => {
  const campaigns = await sql`
    SELECT * FROM campaigns
    WHERE status = 'DRAFT' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW()
  `;

  for (const campaign of campaigns) {
    try {
      await sql`UPDATE campaigns SET status = 'SENDING', updated_at = NOW() WHERE id = ${campaign.id}`;

      const recipients = await sql`
        SELECT * FROM campaign_recipients WHERE campaign_id = ${campaign.id} AND status = 'PENDING'
      `;

      await dispatchCampaign(campaign, recipients);

      await sql`
        UPDATE campaigns
        SET status = 'SENT', sent_at = NOW(), recipient_count = ${recipients.length}, updated_at = NOW()
        WHERE id = ${campaign.id}
      `;
    } catch (err) {
      console.error(`[campaign.job] Failed to dispatch campaign ${campaign.id}:`, err.message);
      await sql`UPDATE campaigns SET status = 'FAILED', updated_at = NOW() WHERE id = ${campaign.id}`;
    }
  }

  if (campaigns.length > 0) {
    console.log(`[campaign.job] Processed ${campaigns.length} scheduled campaign(s)`);
  }
};

module.exports = { processScheduledCampaigns };
