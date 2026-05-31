const { Router } = require('express');
const { stub } = require('../_stub');

const router = Router();

router.get('/', stub('Phase 9'));
router.post('/:id/respond', stub('Phase 9'));
router.put('/:id/respond', stub('Phase 9'));
router.post('/:id/flag', stub('Phase 9'));

module.exports = router;
