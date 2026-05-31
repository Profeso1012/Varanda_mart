const { Router } = require('express');
const { stub } = require('../_stub');
const {
  connectShipbubble, getShipbubbleStatus, disconnectShipbubble, updateOriginAddress,
} = require('./integrations.controller');

const router = Router();

// Shipbubble logistics integration
router.post('/shipbubble/connect', connectShipbubble);
router.get('/shipbubble/status', getShipbubbleStatus);
router.delete('/shipbubble/disconnect', disconnectShipbubble);
router.put('/shipbubble/origin-address', updateOriginAddress);

// Third-party dropship integrations (Phase 8)
router.get('/dropship-providers', stub('Phase 8'));
router.post('/third-party/:provider/connect', stub('Phase 8'));
router.delete('/third-party/:provider/disconnect', stub('Phase 8'));
router.post('/third-party/:provider/sync', stub('Phase 8'));
router.get('/third-party/:provider/products', stub('Phase 8'));
router.post('/third-party/:provider/import', stub('Phase 8'));

module.exports = router;
