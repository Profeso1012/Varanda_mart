const { Router } = require('express');
const { getPlans } = require('./subscriptions.controller');

const router = Router();

router.get('/', getPlans);

module.exports = router;
