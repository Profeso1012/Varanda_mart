const { Router } = require('express');
const c = require('./catalog.controller');
const { validate } = require('../../middleware/validate.middleware');
const s = require('./catalog.schema');

const router = Router();

// ─── Categories ───────────────────────────────────────────────────────────────
router.get('/categories', c.listCategoriesHandler);
router.post('/categories', validate(s.createCategorySchema), c.createCategoryHandler);
router.put('/categories/:categoryId', validate(s.updateCategorySchema), c.updateCategoryHandler);
router.post('/categories/:categoryId/image', validate(s.uploadImageSchema), c.uploadCategoryImage);
router.delete('/categories/:categoryId', c.deleteCategoryHandler);

// ─── Product tags ─────────────────────────────────────────────────────────────
router.get('/product-tags', c.listTagsHandler);
router.post('/product-tags', validate(s.createTagSchema), c.createTagHandler);
router.delete('/product-tags/:tagId', c.deleteTagHandler);

// ─── Variant option types ─────────────────────────────────────────────────────
router.get('/variant-option-types', c.listOptionTypesHandler);
router.post('/variant-option-types', validate(s.createOptionTypeSchema), c.createOptionTypeHandler);
router.post('/variant-option-types/:optionTypeId/values', validate(s.createOptionValueSchema), c.createOptionValueHandler);
router.delete('/variant-option-types/:optionTypeId/values/:valueId', c.deleteOptionValueHandler);

// ─── Products — static routes BEFORE :productId param ────────────────────────
router.get('/products/import/template', c.getImportTemplate);
router.post('/products/import', c.importProducts);
router.get('/products/import/:jobId/status', c.getImportStatus);

// ─── Products ─────────────────────────────────────────────────────────────────
router.get('/products', c.listProductsHandler);
router.post('/products', validate(s.createProductSchema), c.createProductHandler);
router.get('/products/:productId', c.getProductHandler);
router.put('/products/:productId', validate(s.updateProductSchema), c.updateProductHandler);
router.delete('/products/:productId', c.deleteProductHandler);

// ─── Product images ───────────────────────────────────────────────────────────
router.post('/products/:productId/images', validate(s.addImagesSchema), c.addProductImagesHandler);
router.put('/products/:productId/images/reorder', validate(s.reorderImagesSchema), c.reorderImagesHandler);
router.put('/products/:productId/images/:imageId/set-main', c.setMainImageHandler);
router.delete('/products/:productId/images/:imageId', c.deleteProductImageHandler);

// ─── Product option type assignments ─────────────────────────────────────────
// Manage which option types a product uses and which values are enabled per type.
router.get('/products/:productId/option-types', c.getProductOptionTypesHandler);
router.post('/products/:productId/option-types', validate(s.assignOptionTypeSchema), c.assignOptionTypeHandler);
router.put('/products/:productId/option-types/:optionTypeId', validate(s.updateProductOptionTypeSchema), c.updateProductOptionTypeHandler);
router.delete('/products/:productId/option-types/:optionTypeId', c.removeProductOptionTypeHandler);

// ─── Variants — static bulk-stock BEFORE :variantId param ────────────────────
router.post('/products/:productId/variants/bulk-stock', validate(s.bulkStockSchema), c.bulkStockHandler);
router.post('/products/:productId/variants', validate(s.createVariantSchema), c.createVariantHandler);
router.put('/products/:productId/variants/:variantId', validate(s.updateVariantSchema), c.updateVariantHandler);
router.delete('/products/:productId/variants/:variantId', c.deleteVariantHandler);

// ─── Duplicate ────────────────────────────────────────────────────────────────
router.post('/products/:productId/duplicate', c.duplicateProductHandler);

// ─── Bundles ──────────────────────────────────────────────────────────────────
router.get('/bundles', c.listBundlesHandler);
router.post('/bundles', validate(s.createBundleSchema), c.createBundleHandler);
router.get('/bundles/:bundleId', c.getBundleHandler);
router.put('/bundles/:bundleId', validate(s.updateBundleSchema), c.updateBundleHandler);
router.delete('/bundles/:bundleId', c.deleteBundleHandler);
router.post('/bundles/:bundleId/image', validate(s.uploadImageSchema), c.uploadBundleImage);

module.exports = router;
