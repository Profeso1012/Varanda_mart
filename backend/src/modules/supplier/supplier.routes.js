const { Router } = require('express');
const c = require('./supplier.controller');
const { validate } = require('../../middleware/validate.middleware');
const { uploadMultiple } = require('../../middleware/upload.middleware');
const s = require('./supplier.schema');

const router = Router();

// Profile
router.get('/profile', c.getProfile);
router.put('/profile', validate(s.updateProfileSchema), c.updateProfile);
router.post('/profile/bank-account/verify-account', validate(s.verifyAccountSchema), c.verifyBankAccount);
router.post('/profile/bank-account', validate(s.bankAccountSchema), c.createBankAccount);

// Products — Phase 4
router.get('/products', c.listProducts);
router.post('/products', validate(s.createProductSchema), c.createProduct);
router.get('/products/:productId', c.getProduct);
router.put('/products/:productId', c.updateProduct);
router.delete('/products/:productId', c.deleteProduct);
router.post('/products/:productId/images', uploadMultiple('images', 10), c.uploadImages);
router.put('/products/:productId/images/reorder', c.reorderImages);
router.delete('/products/:productId/images/:imageId', c.deleteImage);
router.post('/products/:productId/variants', validate(s.createVariantSchema), c.createVariant);
router.put('/products/:productId/variants/:variantId', c.updateVariant);
router.delete('/products/:productId/variants/:variantId', c.deleteVariant);
router.post('/products/:productId/submit', c.submitForReview);
router.post('/products/:productId/pause', c.pauseProduct);
router.post('/products/:productId/reactivate', c.reactivateProduct);

// Orders — Phase 4
router.get('/orders', c.listOrders);
router.put('/orders/:dropshipOrderId/confirm', c.confirmOrder);
router.put('/orders/:dropshipOrderId/ship', validate(s.shipOrderSchema), c.shipOrder);

// Revenue — Phase 4
router.get('/revenue', c.getRevenue);
router.post('/withdrawals', validate(s.withdrawalSchema), c.requestWithdrawal);

module.exports = router;
