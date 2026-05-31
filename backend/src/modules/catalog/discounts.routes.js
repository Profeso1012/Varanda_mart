const { Router } = require('express');
const c = require('./discounts.controller');
const { validate } = require('../../middleware/validate.middleware');
const { createDiscountSchema, updateDiscountSchema } = require('./catalog.schema');

const router = Router();

router.get('/', c.listDiscountsHandler);
router.post('/', validate(createDiscountSchema), c.createDiscountHandler);
router.put('/:discountId', validate(updateDiscountSchema), c.updateDiscountHandler);
router.delete('/:discountId', c.deleteDiscountHandler);
router.get('/:discountId/usages', c.getDiscountUsagesHandler);

module.exports = router;
