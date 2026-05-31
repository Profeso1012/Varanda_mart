const { Router } = require('express');
const { stub } = require('../_stub');

const router = Router();

router.get('/profile', stub('Phase 7'));
router.put('/profile', stub('Phase 7'));
router.get('/bank-account', stub('Phase 7'));
router.post('/bank-account', stub('Phase 7'));
router.get('/webhooks', stub('Phase 7'));
router.post('/webhooks', stub('Phase 7'));
router.put('/webhooks/:webhookId', stub('Phase 7'));
router.delete('/webhooks/:webhookId', stub('Phase 7'));

module.exports = router;
