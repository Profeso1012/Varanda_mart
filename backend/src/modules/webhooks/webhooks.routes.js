const { Router } = require('express');
const { handlePaystackWebhook } = require('./paystack.webhook');
const { handleFlutterwaveWebhook } = require('./flutterwave.webhook');

const router = Router();

router.post('/paystack', handlePaystackWebhook);
router.post('/flutterwave', handleFlutterwaveWebhook);

module.exports = router;
