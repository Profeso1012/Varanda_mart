const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const { stub } = require('../_stub');

// GET /ext/v1/products — Phase 7
const listProducts = stub('Phase 7');
const getProduct = stub('Phase 7');
const listCategories = stub('Phase 7');
const getProductVariants = stub('Phase 7');

module.exports = { listProducts, getProduct, listCategories, getProductVariants };
