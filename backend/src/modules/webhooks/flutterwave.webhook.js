const asyncHandler = require('../../middleware/asyncHandler');
const flutterwaveConfig = require('../../config/flutterwave');
const subscriptionService = require('../../services/subscription.service');
const checkoutService = require('../../services/checkout.service');

/**
 * POST /api/v1/webhooks/flutterwave
 * No auth — verified by verif-hash header.
 * Handles both subscription lifecycle events AND order payment events.
 * 
 * Event types:
 * - charge.completed: Order payment successful
 * - subscription.* : Subscription lifecycle events
 * - transfer.completed: Payout successful
 * - transfer.failed: Payout failed
 */
const handleFlutterwaveWebhook = asyncHandler(async (req, res) => {
  const hash = req.headers['verif-hash'];
  if (!flutterwaveConfig.verifyWebhookSignature(hash)) {
    return res.status(400).json({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature.' } });
  }

  const event = req.body;
  const eventType = event.event || event.type;

  console.log('[webhook:flutterwave] Received event:', eventType);

  // Always respond 200 immediately
  res.status(200).send();

  setImmediate(async () => {
    try {
      // Route to appropriate handler based on event type
      if (eventType === 'charge.completed') {
        // Order payment completed
        await checkoutService.handleFlutterwaveWebhook(event);
      } else if (eventType && eventType.startsWith('subscription.')) {
        // Subscription lifecycle events
        await subscriptionService.handleFlutterwaveWebhook(event);
      } else if (eventType === 'transfer.completed') {
        console.log('[webhook:flutterwave] Transfer completed:', event.data?.reference);
        // Handle successful payout (if needed)
      } else if (eventType === 'transfer.failed') {
        console.error('[webhook:flutterwave] Transfer failed:', event.data?.reference, event.data?.complete_message);
        // Handle failed payout (if needed)
      } else {
        console.log('[webhook:flutterwave] Unhandled event type:', eventType);
      }
    } catch (err) {
      console.error('[webhook:flutterwave] Processing error:', err.message);
    }
  });
});

module.exports = { handleFlutterwaveWebhook };
