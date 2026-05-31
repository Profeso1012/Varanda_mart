const { Router } = require('express');
const { stub } = require('../_stub');

const router = Router();

router.get('/', stub('Phase 9'));
router.post('/from-order/:orderId', stub('Phase 9'));
router.post('/', stub('Phase 9'));
router.get('/:id/pdf', stub('Phase 9'));
router.post('/:id/send', stub('Phase 9'));

module.exports = router;
