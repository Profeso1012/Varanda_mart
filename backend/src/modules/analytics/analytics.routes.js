const { Router } = require('express');
const { stub } = require('../_stub');

const router = Router();

router.get('/summary', stub('Phase 9'));
router.get('/chart', stub('Phase 9'));
router.get('/products', stub('Phase 9'));
router.get('/referrers', stub('Phase 9'));

module.exports = router;
