const { Router } = require('express');
const controller = require('./subscriptions.controller');
const { validate } = require('../../middleware/validate.middleware');
const { requireHybridSellerRole } = require('../../middleware/auth.middleware');
const { selectPlanSchema, upgradePlanSchema } = require('./subscriptions.schema');

const router = Router();

// GET /api/v1/plans — public (mounted separately in app.js)
router.get('/current', controller.getCurrent);
router.post('/select-plan', validate(selectPlanSchema), controller.selectPlan);
router.post('/initiate-paid', validate(upgradePlanSchema), controller.initiatePaid);
router.post('/upgrade', validate(upgradePlanSchema), controller.upgrade);
router.post('/cancel', controller.cancel);

module.exports = router;
