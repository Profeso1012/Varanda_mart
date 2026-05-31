const { Router } = require('express');
const {
  getStats, listOrders, getOrder, updateStatus, cancelOrder, shipOrder, getShipment,
} = require('./orders.controller');

const router = Router();

router.get('/stats', getStats);
router.get('/', listOrders);
router.get('/:orderId', getOrder);
router.put('/:orderId/status', updateStatus);
router.post('/:orderId/cancel', cancelOrder);
router.post('/:orderId/ship', shipOrder);
router.get('/:orderId/shipment', getShipment);

module.exports = router;
