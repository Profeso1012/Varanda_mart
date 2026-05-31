const { Router } = require('express');
const c = require('./inventory.controller');
const { validate } = require('../../middleware/validate.middleware');
const { adjustStockSchema } = require('../catalog/catalog.schema');

const router = Router();

router.get('/movements', c.listMovementsHandler);
router.post('/adjust', validate(adjustStockSchema), c.adjustStockHandler);
router.get('/low-stock', c.getLowStockHandler);

module.exports = router;
