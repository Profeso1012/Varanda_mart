const { Router } = require('express');
const { stub } = require('../_stub');

const router = Router();

router.get('/customers', stub('Phase 9'));
router.get('/customers/export', stub('Phase 9'));
router.get('/customers/:id', stub('Phase 9'));
router.post('/customers/:id/notes', stub('Phase 9'));
router.put('/customers/:id/notes/:noteId', stub('Phase 9'));
router.delete('/customers/:id/notes/:noteId', stub('Phase 9'));
router.get('/customer-tags', stub('Phase 9'));
router.post('/customer-tags', stub('Phase 9'));
router.delete('/customer-tags/:tagId', stub('Phase 9'));
router.post('/customers/:id/tags', stub('Phase 9'));
router.delete('/customers/:id/tags/:tagId', stub('Phase 9'));

module.exports = router;
