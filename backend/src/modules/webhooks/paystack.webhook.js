const asyncHandler = require('../../middleware/asyncHandler');
const paystackConfig = require('../../config/paystack');
const checkoutService = require('../../services/checkout.service');

/**
 * POST /api/v1/webhooks/paystack
 * No auth — signature verified via HMAC-SHA512 of raw body.
 * Handles charge.success with split settlement logic (Phase 6).
 */
const handlePaystackWebhook = asyncHandler(async (req, res) => {
  // Verify signature
  const signature = req.headers['x-paystack-signature'];
  const rawBody = req.rawBody; // set by express.json verify callback in app.js

  if (signature && rawBody) {
    const valid = paystackConfig.verifyWebhookSignature(rawBody, signature);
    if (!valid) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature.' } });
    }
  }

  const event = req.body;

  // Always respond 200 immediately — process async
  res.status(200).send();

  // Process the event
  setImmediate(async () => {
    try {
      await checkoutService.handlePaystackWebhook(event);
    } catch (err) {
      console.error('[webhook:paystack] Processing error:', err.message);
    }
  });
});

module.exports = { handlePaystackWebhook };
