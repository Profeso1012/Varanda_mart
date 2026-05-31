const { Router } = require('express');
const {
  listDropshipOrders, getDropshipOrder, confirmDropshipOrder, disputeDropshipOrder,
} = require('./sellerDropship.controller');

const router = Router();

router.get('/', listDropshipOrders);
router.get('/:dropshipOrderId', getDropshipOrder);
router.put('/:dropshipOrderId/confirm', confirmDropshipOrder);
router.put('/:dropshipOrderId/dispute', disputeDropshipOrder);

module.exports = router;
