const axios = require('axios');
const crypto = require('crypto');
const { getActiveWebhooksForEvent, incrementWebhookFailures, disableWebhook, resetWebhookFailures } =
  require('../db/queries/developerProfiles.queries');

const MAX_FAILURES = 10;

/**
 * Sign a payload with HMAC-SHA256.
 * Returns 'sha256=<hex>'
 */
const signPayload = (secret, payload) => {
  const body = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return `sha256=${hmac}`;
};

/**
 * Dispatch a webhook event to all active webhooks for a developer that subscribe to this event.
 * Signs each request. Tracks failures and disables webhooks after MAX_FAILURES consecutive failures.
 */
const dispatchWebhookEvent = async (developerId, eventType, payload) => {
  let webhooks;
  try {
    webhooks = await getActiveWebhooksForEvent(developerId, eventType);
  } catch (err) {
    console.error('[webhook] Failed to load webhooks:', err.message);
    return;
  }

  for (const webhook of webhooks) {
    const signature = signPayload(webhook.secret_hash, payload);
    try {
      await axios.post(webhook.url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Varanda-Signature': signature,
          'X-Varanda-Event': eventType,
        },
        timeout: 10000,
      });
      // Success — reset failure count
      await resetWebhookFailures(webhook.id).catch(() => {});
    } catch (err) {
      console.error(`[webhook] Delivery failed to ${webhook.url}:`, err.message);
      const failures = await incrementWebhookFailures(webhook.id).catch(() => MAX_FAILURES);
      if (failures >= MAX_FAILURES) {
        await disableWebhook(webhook.id).catch(() => {});
        console.warn(`[webhook] Disabled webhook ${webhook.id} after ${MAX_FAILURES} consecutive failures`);
      }
    }
  }
};

module.exports = { dispatchWebhookEvent, signPayload };
