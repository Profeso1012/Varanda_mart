const { Router } = require('express');
const c = require('./marketplace.controller');
const { validate } = require('../../middleware/validate.middleware');
const { importSchema } = require('./marketplace.schema');

const router = Router();

router.get('/categories', c.listCategories);
router.get('/products', c.listProducts);
router.get('/products/:productId', c.getProduct);
router.get('/suppliers', c.listSuppliers);
router.get('/suppliers/:supplierId', c.getSupplier);
router.post('/import', validate(importSchema), c.importProduct);
router.get('/imports', c.listImports);
router.put('/imports/:importId', c.updateImport);
router.delete('/imports/:importId', c.deleteImport);
router.post('/products/:productId/reviews', c.createReview);

module.exports = router;
