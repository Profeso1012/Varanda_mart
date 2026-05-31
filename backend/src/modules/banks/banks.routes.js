const { Router } = require('express');
const asyncHandler = require('../../middleware/asyncHandler');
const paystackConfig = require('../../config/paystack');

const router = Router();

/**
 * GET /api/v1/banks
 * No auth — public endpoint.
 * Returns list of Nigerian banks from Paystack (cached 24h).
 * Used by the frontend to populate bank code dropdowns.
 */
router.get('/', asyncHandler(async (req, res) => {
  const banks = await paystackConfig.getBanks();
  res.json({
    success: true,
    data: {
      banks: banks.map((b) => ({ name: b.name, code: b.code, slug: b.slug })),
    },
  });
}));

module.exports = router;
