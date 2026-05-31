const { Router } = require('express');
const c = require('./cloudinary.controller');
const { requireSellerAuth } = require('../../middleware/auth.middleware');

const router = Router();

/**
 * GET /api/v1/cloudinary/sign
 * Auth: Bearer (any authenticated user — seller, supplier, developer).
 * Returns signed upload params for client-side direct upload to Cloudinary.
 *
 * Query params:
 *   type: 'logo' | 'favicon' | 'product' | 'supplier_product' | 'document' | 'avatar'
 *   context: optional extra path segment (e.g. productId)
 */
router.get('/sign', requireSellerAuth, c.getUploadSignature);

module.exports = router;
