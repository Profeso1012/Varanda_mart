const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const { sql } = require('../../config/database');
const { getPaginationMeta, getPaginationParams } = require('../../utils/paginate');
const { applyMarkup, computeSellerMargin } = require('../../services/marketplacePrice.service');
const { findDropshipImport, createDropshipImport, getImportCountByBusiness } =
  require('../../db/queries/dropshipImports.queries');
const { getSubscriptionByBusinessId } = require('../../db/queries/subscriptions.queries');

// GET /api/v1/marketplace/categories
const listCategories = asyncHandler(async (req, res) => {
  const categories = await sql`
    SELECT id, name, slug, description, image_url, sort_order, parent_id
    FROM marketplace_categories WHERE is_active = true ORDER BY sort_order ASC
  `;
  // Build tree
  const map = {};
  categories.forEach((c) => { map[c.id] = { ...c, children: [] }; });
  const roots = [];
  categories.forEach((c) => {
    if (c.parent_id && map[c.parent_id]) map[c.parent_id].children.push(map[c.id]);
    else roots.push(map[c.id]);
  });
  res.json({ success: true, data: { categories: roots } });
});

// GET /api/v1/marketplace/products
const listProducts = asyncHandler(async (req, res) => {
  const { page, perPage, offset } = getPaginationParams(req.query);
  const { categoryId, supplierId, search, minPrice, maxPrice, sort, shipsTo } = req.query;

  const rows = await sql`
    SELECT
      sp.id, sp.name, sp.supplier_id,
      sup.display_name AS supplier_name, sup.is_verified AS supplier_verified,
      mc.name AS category_name,
      ROUND(sp.supplier_price * (1 + sp.platform_markup_rate), 2) AS display_price,
      sp.suggested_retail_price,
      ROUND(sp.suggested_retail_price - (sp.supplier_price * (1 + sp.platform_markup_rate)), 2) AS estimated_margin,
      (SELECT url FROM supplier_product_images WHERE supplier_product_id = sp.id AND is_main = true LIMIT 1) AS main_image_url,
      sp.total_orders, sp.avg_rating, sp.processing_time_days, sp.ships_to, sp.is_variable,
      EXISTS(
        SELECT 1 FROM dropship_imports di
        WHERE di.supplier_product_id = sp.id AND di.business_id = ${req.businessId} AND di.is_active = true
      ) AS already_imported,
      (SELECT id FROM dropship_imports di WHERE di.supplier_product_id = sp.id AND di.business_id = ${req.businessId} AND di.is_active = true LIMIT 1) AS import_id
    FROM supplier_products sp
    JOIN supplier_profiles sup ON sup.id = sp.supplier_id
    LEFT JOIN marketplace_categories mc ON mc.id = sp.marketplace_category_id
    WHERE sp.status = 'ACTIVE' AND sp.deleted_at IS NULL
      AND (${categoryId || null}::uuid IS NULL OR sp.marketplace_category_id = ${categoryId || null}::uuid)
      AND (${supplierId || null}::uuid IS NULL OR sp.supplier_id = ${supplierId || null}::uuid)
      AND (${search || null}::text IS NULL OR sp.name ILIKE ${'%' + (search || '') + '%'})
      AND (${minPrice || null}::numeric IS NULL OR sp.supplier_price * (1 + sp.platform_markup_rate) >= ${minPrice || null}::numeric)
      AND (${maxPrice || null}::numeric IS NULL OR sp.supplier_price * (1 + sp.platform_markup_rate) <= ${maxPrice || null}::numeric)
    ORDER BY ${sort === 'newest' ? sql`sp.created_at DESC` : sort === 'price_low' ? sql`display_price ASC` : sql`sp.total_orders DESC`}
    LIMIT ${perPage} OFFSET ${offset}
  `;

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM supplier_products
    WHERE status = 'ACTIVE' AND deleted_at IS NULL
  `;

  res.json({ success: true, data: { products: rows }, meta: getPaginationMeta(count, page, perPage) });
});

// GET /api/v1/marketplace/products/:productId
const getProduct = asyncHandler(async (req, res) => {
  const [product] = await sql`
    SELECT sp.*,
      ROUND(sp.supplier_price * (1 + sp.platform_markup_rate), 2) AS display_price,
      sup.display_name AS supplier_name, sup.is_verified AS supplier_verified,
      sup.processing_time_days AS supplier_processing_days,
      mc.name AS category_name
    FROM supplier_products sp
    JOIN supplier_profiles sup ON sup.id = sp.supplier_id
    LEFT JOIN marketplace_categories mc ON mc.id = sp.marketplace_category_id
    WHERE sp.id = ${req.params.productId} AND sp.status = 'ACTIVE' AND sp.deleted_at IS NULL
  `;
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');

  // Strip true supplier_price from response
  delete product.supplier_price;

  const images = await sql`SELECT * FROM supplier_product_images WHERE supplier_product_id = ${product.id} ORDER BY sort_order`;
  const variants = await sql`
    SELECT id, variant_label, option_values, stock_quantity, is_active,
      ROUND(supplier_price * (1 + platform_markup_rate), 2) AS display_price,
      suggested_retail_price
    FROM supplier_product_variants
    WHERE supplier_product_id = ${product.id} AND is_active = true AND deleted_at IS NULL
  `;

  const importRecord = await findDropshipImport(req.businessId, product.id);

  res.json({
    success: true,
    data: {
      product: { ...product, images, variants },
      alreadyImported: !!importRecord,
      importId: importRecord?.id || null,
    },
  });
});

// GET /api/v1/marketplace/suppliers
const listSuppliers = asyncHandler(async (req, res) => {
  const { page, perPage, offset } = getPaginationParams(req.query);
  const { search, verified } = req.query;
  const rows = await sql`
    SELECT id, display_name, description, logo_url, country, is_verified,
           processing_time_days, ships_to, total_dropship_sales, fulfillment_rate, avg_shipping_days
    FROM supplier_profiles
    WHERE is_active = true
      AND (${search || null}::text IS NULL OR display_name ILIKE ${'%' + (search || '') + '%'})
      AND (${verified === undefined ? null : verified === 'true'}::boolean IS NULL
           OR is_verified = ${verified === undefined ? null : verified === 'true'}::boolean)
    ORDER BY total_dropship_sales DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM supplier_profiles WHERE is_active = true`;
  res.json({ success: true, data: { suppliers: rows }, meta: getPaginationMeta(count, page, perPage) });
});

// GET /api/v1/marketplace/suppliers/:supplierId
const getSupplier = asyncHandler(async (req, res) => {
  const [supplier] = await sql`
    SELECT id, display_name, description, logo_url, country, is_verified,
           processing_time_days, ships_to, total_dropship_sales, fulfillment_rate
    FROM supplier_profiles WHERE id = ${req.params.supplierId} AND is_active = true
  `;
  if (!supplier) throw new AppError('Supplier not found.', 404, 'NOT_FOUND');
  const products = await sql`
    SELECT id, name, slug, ROUND(supplier_price * (1 + platform_markup_rate), 2) AS display_price,
           suggested_retail_price, avg_rating, total_orders
    FROM supplier_products
    WHERE supplier_id = ${req.params.supplierId} AND status = 'ACTIVE' AND deleted_at IS NULL
    LIMIT 20
  `;
  res.json({ success: true, data: { supplier, products } });
});

// POST /api/v1/marketplace/import
const importProduct = asyncHandler(async (req, res) => {
  const { supplierProductId, retailPrice, compareAtPrice, customTitle, customDescription, variantPrices } = req.body;

  // Check plan import limit
  const sub = await getSubscriptionByBusinessId(req.businessId);
  const maxImports = sub?.max_dropship_imports;
  if (maxImports !== null && maxImports !== undefined) {
    const count = await getImportCountByBusiness(req.businessId);
    if (count >= maxImports) throw new AppError(`Import limit (${maxImports}) reached for your plan.`, 403, 'PLAN_LIMIT');
  }

  // Check not already imported
  const existing = await findDropshipImport(req.businessId, supplierProductId);
  if (existing) {
    return res.status(409).json({
      success: false,
      error: { code: 'ALREADY_IMPORTED', message: 'Product already imported.', details: { importId: existing.id } },
    });
  }

  // Get supplier product (with true price for margin calc)
  const [supplierProduct] = await sql`
    SELECT * FROM supplier_products WHERE id = ${supplierProductId} AND status = 'ACTIVE' AND deleted_at IS NULL
  `;
  if (!supplierProduct) throw new AppError('Product not available.', 400, 'PRODUCT_UNAVAILABLE');

  const displayPrice = applyMarkup(supplierProduct.supplier_price, supplierProduct.platform_markup_rate);
  if (retailPrice < displayPrice) {
    throw new AppError(`Retail price must be at least ₦${displayPrice} (display price).`, 400, 'PRICE_TOO_LOW');
  }

  const { marginAmount } = computeSellerMargin(retailPrice, supplierProduct.supplier_price, supplierProduct.platform_markup_rate);

  // Create store product (DROPSHIP type)
  const { slugify } = require('../../utils/slugify');
  let slug = slugify(customTitle || supplierProduct.name);
  const [slugCheck] = await sql`SELECT id FROM products WHERE business_id = ${req.businessId} AND slug = ${slug}`;
  if (slugCheck) slug = `${slug}-${Date.now()}`;

  const [storeProduct] = await sql`
    INSERT INTO products (business_id, name, slug, base_price, product_type, status, description)
    VALUES (${req.businessId}, ${customTitle || supplierProduct.name}, ${slug},
            ${retailPrice}, 'DROPSHIP', 'DRAFT', ${customDescription || supplierProduct.description})
    RETURNING id, name, slug, status
  `;

  const importRecord = await createDropshipImport(req.businessId, {
    supplierProductId,
    storeProductId: storeProduct.id,
    retailPrice,
    compareAtPrice: compareAtPrice || null,
    sellerMargin: marginAmount,
    customTitle: customTitle || null,
    customDescription: customDescription || null,
  });

  // Increment import count on supplier product
  await sql`UPDATE supplier_products SET total_imports = total_imports + 1 WHERE id = ${supplierProductId}`;

  res.status(201).json({
    success: true,
    data: {
      import: {
        id: importRecord.id,
        supplierProductId,
        storeProductId: storeProduct.id,
        retailPrice,
        sellerMargin: marginAmount,
      },
      storeProduct,
    },
  });
});

// GET /api/v1/marketplace/imports
const listImports = asyncHandler(async (req, res) => {
  const { page, perPage, offset } = getPaginationParams(req.query);
  const rows = await sql`
    SELECT di.*, sp.name AS supplier_product_name
    FROM dropship_imports di
    JOIN supplier_products sp ON sp.id = di.supplier_product_id
    WHERE di.business_id = ${req.businessId}
    ORDER BY di.created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM dropship_imports WHERE business_id = ${req.businessId}
  `;
  res.json({ success: true, data: { imports: rows }, meta: getPaginationMeta(count, page, perPage) });
});

// PUT /api/v1/marketplace/imports/:importId
const updateImport = asyncHandler(async (req, res) => {
  const { updateDropshipImport } = require('../../db/queries/dropshipImports.queries');
  const { retailPrice, customTitle, customDescription } = req.body;
  const fields = {};
  if (retailPrice !== undefined) fields.retail_price = retailPrice;
  if (customTitle !== undefined) fields.custom_title = customTitle;
  if (customDescription !== undefined) fields.custom_description = customDescription;
  const updated = await updateDropshipImport(req.params.importId, req.businessId, fields);
  if (!updated) throw new AppError('Import not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { import: updated } });
});

// DELETE /api/v1/marketplace/imports/:importId
const deleteImport = asyncHandler(async (req, res) => {
  const { hasPendingOrders, softDeleteDropshipImport } = require('../../db/queries/dropshipImports.queries');
  const pending = await hasPendingOrders(req.params.importId);
  if (pending) throw new AppError('Cannot delete import with pending orders.', 409, 'CONFLICT');
  await softDeleteDropshipImport(req.params.importId, req.businessId);
  res.json({ success: true, data: { message: 'Import removed.' } });
});

// POST /api/v1/marketplace/products/:productId/reviews
const createReview = asyncHandler(async (req, res) => {
  const { rating, title, body: reviewBody } = req.body;
  if (!rating || rating < 1 || rating > 5) throw new AppError('Rating must be between 1 and 5.', 422, 'VALIDATION_ERROR');

  const { createMarketplaceReview, hasVerifiedDropshipOrder, listMarketplaceReviews } = require('../../db/queries/supplierProducts.queries');

  // Must have a verified (delivered) dropship order for this product
  const eligible = await hasVerifiedDropshipOrder(req.params.productId, req.businessId);
  if (!eligible) throw new AppError('You can only review products you have successfully sold through your store.', 403, 'NOT_ELIGIBLE');

  // Check not already reviewed
  const { sql } = require('../../config/database');
  const [existing] = await sql`
    SELECT id FROM marketplace_product_reviews
    WHERE supplier_product_id = ${req.params.productId} AND reviewer_business_id = ${req.businessId}
  `;
  if (existing) throw new AppError('You have already reviewed this product.', 409, 'CONFLICT');

  const review = await createMarketplaceReview({
    supplierProductId: req.params.productId,
    reviewerBusinessId: req.businessId,
    rating,
    title,
    body: reviewBody,
    isVerifiedPurchase: true,
  });

  res.status(201).json({ success: true, data: { review } });
});

module.exports = {
  listCategories, listProducts, getProduct, listSuppliers, getSupplier,
  importProduct, listImports, updateImport, deleteImport, createReview,
};
