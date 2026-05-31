const { sql } = require('../../config/database');
const { slugify } = require('../../utils/slugify');

// ─── Products ─────────────────────────────────────────────────────────────────

const createSupplierProduct = async (supplierId, data) => {
  let slug = slugify(data.name);
  // Ensure unique slug within this supplier
  const [existing] = await sql`SELECT id FROM supplier_products WHERE supplier_id = ${supplierId} AND slug = ${slug}`;
  if (existing) slug = `${slug}-${Date.now()}`;

  const [product] = await sql`
    INSERT INTO supplier_products (
      supplier_id, marketplace_category_id, name, slug, description, short_description,
      supplier_price, platform_markup_rate, suggested_retail_price, currency,
      is_variable, track_inventory, min_order_quantity, processing_time_days,
      ships_to, weight, seo_title, seo_description, tags
    ) VALUES (
      ${supplierId}, ${data.marketplaceCategoryId || null}, ${data.name}, ${slug},
      ${data.description || null}, ${data.shortDescription || null},
      ${data.supplierPrice}, ${data.platformMarkupRate ?? 0.02},
      ${data.suggestedRetailPrice || null}, ${data.currency || 'NGN'},
      ${data.isVariable ?? false}, ${data.trackInventory ?? true},
      ${data.minOrderQuantity ?? 1}, ${data.processingTimeDays ?? 3},
      ${data.shipsTo || []}, ${data.weight || null},
      ${data.seoTitle || null}, ${data.seoDescription || null},
      ${data.tags || []}
    )
    RETURNING *
  `;
  return product;
};

const findSupplierProductById = async (id) => {
  const [product] = await sql`SELECT * FROM supplier_products WHERE id = ${id} AND deleted_at IS NULL`;
  return product || null;
};

const findSupplierProductByIdAndSupplier = async (id, supplierId) => {
  const [product] = await sql`
    SELECT * FROM supplier_products WHERE id = ${id} AND supplier_id = ${supplierId} AND deleted_at IS NULL
  `;
  return product || null;
};

const updateSupplierProduct = async (id, supplierId, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [product] = await sql`
    UPDATE supplier_products SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id} AND supplier_id = ${supplierId} AND deleted_at IS NULL
    RETURNING *
  `;
  return product;
};

const softDeleteSupplierProduct = async (id, supplierId) => {
  // Deactivate any active dropship imports so businesses can no longer sell this product
  await sql`
    UPDATE dropship_imports SET is_active = false, updated_at = NOW()
    WHERE supplier_product_id = ${id} AND is_active = true
  `;
  await sql`
    UPDATE supplier_products SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = ${id} AND supplier_id = ${supplierId}
  `;
};

const getSupplierProductsForSupplier = async (supplierId, { status, search, page = 1, perPage = 20 }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT sp.*,
      (SELECT url FROM supplier_product_images WHERE supplier_product_id = sp.id AND is_main = true LIMIT 1) AS main_image_url,
      COALESCE((SELECT SUM(stock_quantity) FROM supplier_product_variants WHERE supplier_product_id = sp.id AND deleted_at IS NULL), 0) AS stock_total
    FROM supplier_products sp
    WHERE sp.supplier_id = ${supplierId}
      AND sp.deleted_at IS NULL
      AND (${status || null}::text IS NULL OR sp.status = ${status || null}::supplier_product_status)
      AND (${search || null}::text IS NULL OR sp.name ILIKE ${'%' + (search || '') + '%'})
    ORDER BY sp.created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM supplier_products
    WHERE supplier_id = ${supplierId} AND deleted_at IS NULL
      AND (${status || null}::text IS NULL OR status = ${status || null}::supplier_product_status)
  `;
  return { rows, total: count };
};

const getSupplierProductFull = async (id, supplierId) => {
  const product = await findSupplierProductByIdAndSupplier(id, supplierId);
  if (!product) return null;
  const images = await sql`SELECT * FROM supplier_product_images WHERE supplier_product_id = ${id} ORDER BY sort_order ASC`;
  const variants = await sql`SELECT * FROM supplier_product_variants WHERE supplier_product_id = ${id} AND deleted_at IS NULL ORDER BY created_at ASC`;
  return { ...product, images, variants };
};

const submitSupplierProductForReview = async (id, supplierId) => {
  const [product] = await sql`
    UPDATE supplier_products SET status = 'PENDING_REVIEW', updated_at = NOW()
    WHERE id = ${id} AND supplier_id = ${supplierId} AND status = 'DRAFT'
    RETURNING *
  `;
  return product;
};

const approveSupplierProduct = async (id, reviewedBy) => {
  const [product] = await sql`
    UPDATE supplier_products
    SET status = 'ACTIVE', reviewed_by = ${reviewedBy}, reviewed_at = NOW(), updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return product;
};

const rejectSupplierProduct = async (id, reviewedBy, reason) => {
  const [product] = await sql`
    UPDATE supplier_products
    SET status = 'REJECTED', rejection_reason = ${reason}, reviewed_by = ${reviewedBy}, reviewed_at = NOW(), updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return product;
};

const pauseSupplierProduct = async (id, supplierId) => {
  const [product] = await sql`
    UPDATE supplier_products SET status = 'PAUSED', updated_at = NOW()
    WHERE id = ${id} AND supplier_id = ${supplierId} AND status = 'ACTIVE'
    RETURNING *
  `;
  return product;
};

const reactivateSupplierProduct = async (id, supplierId) => {
  const [product] = await sql`
    UPDATE supplier_products
    SET status = CASE
      WHEN status = 'PAUSED' THEN 'ACTIVE'::supplier_product_status
      ELSE 'PENDING_REVIEW'::supplier_product_status
    END,
        updated_at = NOW()
    WHERE id = ${id} AND supplier_id = ${supplierId} AND status IN ('PAUSED', 'REJECTED')
    RETURNING *
  `;
  return product;
};

const getImporterEmailsForProduct = async (supplierProductId) => {
  const rows = await sql`
    SELECT DISTINCT u.email FROM dropship_imports di
    JOIN businesses b ON b.id = di.business_id
    JOIN users u ON u.id = b.owner_id
    WHERE di.supplier_product_id = ${supplierProductId} AND di.is_active = true
  `;
  return rows.map((r) => r.email);
};

const decrementSupplierProductStock = async (variantId, quantity, tx) => {
  const db = tx || sql;
  await db`
    UPDATE supplier_product_variants
    SET stock_quantity = GREATEST(0, stock_quantity - ${quantity}), updated_at = NOW()
    WHERE id = ${variantId}
  `;
};

const incrementSupplierProductStock = async (variantId, quantity) => {
  await sql`
    UPDATE supplier_product_variants
    SET stock_quantity = stock_quantity + ${quantity}, updated_at = NOW()
    WHERE id = ${variantId}
  `;
};

const incrementProductImportCount = async (supplierProductId) => {
  await sql`UPDATE supplier_products SET total_imports = total_imports + 1 WHERE id = ${supplierProductId}`;
};

const incrementProductOrderCount = async (supplierProductId) => {
  await sql`UPDATE supplier_products SET total_orders = total_orders + 1 WHERE id = ${supplierProductId}`;
};

// ─── Variants ─────────────────────────────────────────────────────────────────

const createSupplierVariant = async (supplierId, productId, data) => {
  const [variant] = await sql`
    INSERT INTO supplier_product_variants (
      supplier_product_id, sku, supplier_price, platform_markup_rate,
      suggested_retail_price, stock_quantity, variant_label, option_values,
      image_url, weight
    ) VALUES (
      ${productId}, ${data.sku || null}, ${data.supplierPrice},
      ${data.platformMarkupRate ?? 0.02}, ${data.suggestedRetailPrice || null},
      ${data.stockQuantity ?? 0}, ${data.variantLabel},
      ${sql.json(data.optionValues || [])}, ${data.imageUrl || null}, ${data.weight || null}
    )
    RETURNING *
  `;
  // Update total_stock on parent product
  await sql`
    UPDATE supplier_products
    SET total_stock = (SELECT COALESCE(SUM(stock_quantity), 0) FROM supplier_product_variants WHERE supplier_product_id = ${productId} AND deleted_at IS NULL),
        updated_at = NOW()
    WHERE id = ${productId}
  `;
  return variant;
};

const updateSupplierVariant = async (id, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [variant] = await sql`
    UPDATE supplier_product_variants SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING *
  `;
  return variant;
};

const softDeleteSupplierVariant = async (id) => {
  await sql`UPDATE supplier_product_variants SET deleted_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
};

const listSupplierVariants = async (productId) => {
  return sql`SELECT * FROM supplier_product_variants WHERE supplier_product_id = ${productId} AND deleted_at IS NULL ORDER BY created_at ASC`;
};

// ─── Images ───────────────────────────────────────────────────────────────────

const addSupplierProductImage = async (productId, { url, publicId, altText, isMain, sortOrder }) => {
  if (isMain) {
    await sql`UPDATE supplier_product_images SET is_main = false WHERE supplier_product_id = ${productId}`;
  }
  const [img] = await sql`
    INSERT INTO supplier_product_images (supplier_product_id, url, public_id, alt_text, is_main, sort_order)
    VALUES (${productId}, ${url}, ${publicId || ''}, ${altText || null}, ${isMain ?? false}, ${sortOrder ?? 0})
    RETURNING *
  `;
  return img;
};

const reorderSupplierImages = async (productId, updates) => {
  for (const { id, sortOrder } of updates) {
    await sql`UPDATE supplier_product_images SET sort_order = ${sortOrder} WHERE id = ${id} AND supplier_product_id = ${productId}`;
  }
};

const deleteSupplierProductImage = async (id, productId) => {
  const [img] = await sql`SELECT * FROM supplier_product_images WHERE id = ${id} AND supplier_product_id = ${productId}`;
  if (!img) return null;
  await sql`DELETE FROM supplier_product_images WHERE id = ${id}`;
  return img;
};

// ─── Revenue ──────────────────────────────────────────────────────────────────

const getSupplierRevenueSummary = async (supplierId, period) => {
  const periodMap = { '7d': 7, '30d': 30, '90d': 90, 'ytd': 365 };
  const days = periodMap[period] || 30;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totals] = await sql`
    SELECT
      COALESCE(SUM(CASE WHEN et.status = 'RELEASED' THEN et.total_held ELSE 0 END), 0) AS total_earned,
      COALESCE(SUM(CASE WHEN et.status = 'HELD' THEN et.total_held ELSE 0 END), 0) AS pending_escrow,
      COALESCE(SUM(CASE WHEN et.status = 'AWAITING_SELLER_CONFIRMATION' THEN et.total_held ELSE 0 END), 0) AS awaiting_confirmation
    FROM dropship_orders dso
    JOIN escrow_transactions et ON et.dropship_order_id = dso.id
    WHERE dso.supplier_id = ${supplierId}
  `;

  const [periodStats] = await sql`
    SELECT
      COALESCE(SUM(CASE WHEN et.status = 'RELEASED' THEN et.total_held ELSE 0 END), 0) AS period_revenue,
      COUNT(DISTINCT dso.id)::int AS period_orders
    FROM dropship_orders dso
    JOIN escrow_transactions et ON et.dropship_order_id = dso.id
    WHERE dso.supplier_id = ${supplierId} AND dso.created_at >= ${cutoff}
  `;

  return {
    totalEarned: Number(totals.total_earned),
    pendingEscrow: Number(totals.pending_escrow),
    awaitingConfirmation: Number(totals.awaiting_confirmation),
    availableForWithdrawal: Number(totals.total_earned), // simplified — full impl tracks withdrawals
    periodRevenue: Number(periodStats.period_revenue),
    periodOrders: periodStats.period_orders,
  };
};

// ─── Marketplace reviews ──────────────────────────────────────────────────────

const createMarketplaceReview = async (data) => {
  const [review] = await sql`
    INSERT INTO marketplace_product_reviews (
      supplier_product_id, reviewer_business_id, reviewer_developer_id,
      dropship_order_id, rating, title, body, is_verified_purchase
    ) VALUES (
      ${data.supplierProductId}, ${data.reviewerBusinessId || null},
      ${data.reviewerDeveloperId || null}, ${data.dropshipOrderId || null},
      ${data.rating}, ${data.title || null}, ${data.body || null},
      ${data.isVerifiedPurchase ?? false}
    )
    RETURNING *
  `;
  // Update avg_rating on product
  await sql`
    UPDATE supplier_products
    SET avg_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2) FROM marketplace_product_reviews
      WHERE supplier_product_id = ${data.supplierProductId} AND is_published = true
    ), updated_at = NOW()
    WHERE id = ${data.supplierProductId}
  `;
  return review;
};

const listMarketplaceReviews = async (supplierProductId, { page = 1, perPage = 20, rating }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT mpr.*, b.name AS reviewer_name
    FROM marketplace_product_reviews mpr
    LEFT JOIN businesses b ON b.id = mpr.reviewer_business_id
    WHERE mpr.supplier_product_id = ${supplierProductId}
      AND mpr.is_published = true
      AND (${rating || null}::int IS NULL OR mpr.rating = ${rating || null}::int)
    ORDER BY mpr.created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM marketplace_product_reviews
    WHERE supplier_product_id = ${supplierProductId} AND is_published = true
  `;
  return { rows, total: count };
};

const hasVerifiedDropshipOrder = async (supplierProductId, businessId) => {
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM dropship_orders dso
    JOIN dropship_order_items doi ON doi.dropship_order_id = dso.id
    WHERE doi.supplier_product_id = ${supplierProductId}
      AND dso.business_id = ${businessId}
      AND dso.status = 'DELIVERED'
  `;
  return count > 0;
};

module.exports = {
  createSupplierProduct, findSupplierProductById, findSupplierProductByIdAndSupplier,
  updateSupplierProduct, softDeleteSupplierProduct,
  getSupplierProductsForSupplier, getSupplierProductFull,
  submitSupplierProductForReview, approveSupplierProduct, rejectSupplierProduct,
  pauseSupplierProduct, reactivateSupplierProduct,
  getImporterEmailsForProduct, decrementSupplierProductStock, incrementSupplierProductStock,
  incrementProductImportCount, incrementProductOrderCount,
  createSupplierVariant, updateSupplierVariant, softDeleteSupplierVariant, listSupplierVariants,
  addSupplierProductImage, reorderSupplierImages, deleteSupplierProductImage,
  getSupplierRevenueSummary,
  createMarketplaceReview, listMarketplaceReviews, hasVerifiedDropshipOrder,
};
