/**
 * External Developer API routes — /ext/v1/
 * Auth: requireApiPartnerAuth (X-Varanda-Public-Key + X-Varanda-Secret-Key)
 * Full implementation in Phase 7.
 */
const { Router } = require('express');
const extProducts = require('./extProducts.controller');
const extOrders = require('./extOrders.controller');
const extWebhooks = require('./extWebhooks.controller');

const router = Router();

// Products
router.get('/products', extProducts.listProducts);
router.get('/products/:productId', extProducts.getProduct);
router.get('/products/:productId/variants', extProducts.getProductVariants);
router.get('/categories', extProducts.listCategories);

// Orders
router.post('/orders', extOrders.createOrder);
router.get('/orders', extOrders.listOrders);
router.get('/orders/:orderId', extOrders.getOrder);
router.post('/orders/:orderId/confirm', extOrders.confirmOrder);
router.post('/orders/:orderId/dispute', extOrders.disputeOrder);

// Webhooks
router.get('/webhooks', extWebhooks.listWebhooks);
router.post('/webhooks', extWebhooks.createWebhook);
router.put('/webhooks/:webhookId', extWebhooks.updateWebhook);
router.delete('/webhooks/:webhookId', extWebhooks.deleteWebhook);
router.post('/webhooks/:webhookId/test', extWebhooks.testWebhook);

module.exports = router;
