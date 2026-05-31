const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const { slugify } = require('../../utils/slugify');
const { generateUniqueSlug } = require('../../services/slug.service');
const { getPaginationMeta, getPaginationParams } = require('../../utils/paginate');
const cloudinaryService = require('../../services/cloudinary.service');

const {
  createTag, listTags, findTagBySlug, deleteTag,
  createOptionType, listOptionTypes, findOptionTypeById,
  createOptionValue, deleteOptionValue, isOptionValueInUse,
  createProduct, findProductById, findProductBySlug, getProductFull,
  listProducts, updateProduct, softDeleteProduct, countProducts,
  addProductImage, setMainImage, reorderImages, deleteProductImage,
  setProductTags, duplicateProduct,
} = require('../../db/queries/products.queries');

const {
  createCategory, findCategoryById, findCategoryBySlug, listCategories,
  updateCategory, deleteCategory, getCategoryProductCount,
  reassignCategoryProducts, getCategoryDepth,
} = require('../../db/queries/categories.queries');

const {
  createVariant, findVariantById, updateVariant, softDeleteVariant,
  variantCombinationExists, bulkUpdateStock,
  getProductOptionTypes, assignOptionTypeToProduct,
  updateProductOptionTypeValues, removeOptionTypeFromProduct,
  replaceVariantOptionValues,
} = require('../../db/queries/variants.queries');

const {
  createBundle, findBundleById, findBundleBySlug, getBundleFull,
  listBundles, updateBundle, deleteBundle, setBundleItems,
} = require('../../db/queries/bundles.queries');

const { config } = require('../../config/env');

// ─── Categories ───────────────────────────────────────────────────────────────

// GET /api/v1/catalog/categories
const listCategoriesHandler = asyncHandler(async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const all = await listCategories(req.businessId, includeInactive);

  // Build tree
  const map = {};
  all.forEach((c) => { map[c.id] = { ...c, children: [] }; });
  const roots = [];
  all.forEach((c) => {
    if (c.parent_id && map[c.parent_id]) map[c.parent_id].children.push(map[c.id]);
    else roots.push(map[c.id]);
  });

  res.json({ success: true, data: { categories: roots } });
});

// POST /api/v1/catalog/categories
const createCategoryHandler = asyncHandler(async (req, res) => {
  const { name, parentId, description, sortOrder } = req.body;

  // Depth check — max 2 levels
  if (parentId) {
    const depth = await getCategoryDepth(parentId, req.businessId);
    if (depth >= 1) throw new AppError('Categories can only be nested one level deep (parent + subcategory).', 400, 'DEPTH_LIMIT');
  }

  const slug = await generateUniqueSlug(name, async (s) => !!(await findCategoryBySlug(s, req.businessId)));
  const category = await createCategory(req.businessId, { name, slug, parentId, description, sortOrder });
  res.status(201).json({ success: true, data: { category } });
});

// PUT /api/v1/catalog/categories/:categoryId
const updateCategoryHandler = asyncHandler(async (req, res) => {
  const { name, description, sortOrder, isActive, parentId } = req.body;
  const fields = {};
  if (name !== undefined) fields.name = name;
  if (description !== undefined) fields.description = description;
  if (sortOrder !== undefined) fields.sort_order = sortOrder;
  if (isActive !== undefined) fields.is_active = isActive;
  if (parentId !== undefined) fields.parent_id = parentId || null;

  const category = await updateCategory(req.params.categoryId, req.businessId, fields);
  if (!category) throw new AppError('Category not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { category } });
});

// POST /api/v1/catalog/categories/:categoryId/image
const uploadCategoryImage = asyncHandler(async (req, res) => {
  const { url, publicId } = req.body;
  if (!url) throw new AppError('url is required.', 422, 'VALIDATION_ERROR');
  const category = await updateCategory(req.params.categoryId, req.businessId, {
    image_url: url, image_public_id: publicId || null,
  });
  if (!category) throw new AppError('Category not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { category } });
});

// DELETE /api/v1/catalog/categories/:categoryId
const deleteCategoryHandler = asyncHandler(async (req, res) => {
  const { reassignTo } = req.body;
  const count = await getCategoryProductCount(req.params.categoryId, req.businessId);
  if (count > 0) {
    if (!reassignTo) {
      throw new AppError(
        `This category has ${count} product${count !== 1 ? 's' : ''}. Provide "reassignTo" with another category ID, or null to remove the category assignment.`,
        409, 'CONFLICT'
      );
    }
    await reassignCategoryProducts(req.params.categoryId, reassignTo, req.businessId);
  }
  await deleteCategory(req.params.categoryId, req.businessId);
  res.json({ success: true, data: { message: 'Category deleted.' } });
});

// ─── Product tags ─────────────────────────────────────────────────────────────

// GET /api/v1/catalog/product-tags
const listTagsHandler = asyncHandler(async (req, res) => {
  const tags = await listTags(req.businessId);
  res.json({ success: true, data: { tags } });
});

// POST /api/v1/catalog/product-tags
const createTagHandler = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const slug = slugify(name);
  const existing = await findTagBySlug(slug, req.businessId);
  if (existing) throw new AppError('A tag with this name already exists.', 409, 'CONFLICT');
  const tag = await createTag(req.businessId, name, slug);
  res.status(201).json({ success: true, data: { tag } });
});

// DELETE /api/v1/catalog/product-tags/:tagId
const deleteTagHandler = asyncHandler(async (req, res) => {
  await deleteTag(req.params.tagId, req.businessId);
  res.json({ success: true, data: { message: 'Tag deleted.' } });
});

// ─── Variant option types ─────────────────────────────────────────────────────

// GET /api/v1/catalog/variant-option-types
const listOptionTypesHandler = asyncHandler(async (req, res) => {
  const optionTypes = await listOptionTypes(req.businessId);
  res.json({ success: true, data: { optionTypes } });
});

// POST /api/v1/catalog/variant-option-types
const createOptionTypeHandler = asyncHandler(async (req, res) => {
  const { name, displayType } = req.body;
  const optionType = await createOptionType(req.businessId, { name, displayType }).catch((err) => {
    if (err.code === '23505') throw new AppError(`An option type named "${name}" already exists.`, 409, 'CONFLICT');
    throw err;
  });
  res.status(201).json({ success: true, data: { optionType } });
});

// POST /api/v1/catalog/variant-option-types/:optionTypeId/values
const createOptionValueHandler = asyncHandler(async (req, res) => {
  const { value, displayValue, sortOrder } = req.body;
  const optionType = await findOptionTypeById(req.params.optionTypeId, req.businessId);
  if (!optionType) throw new AppError('Option type not found.', 404, 'NOT_FOUND');
  const optionValue = await createOptionValue(req.params.optionTypeId, { value, displayValue, sortOrder });
  res.status(201).json({ success: true, data: { optionValue } });
});

// DELETE /api/v1/catalog/variant-option-types/:optionTypeId/values/:valueId
const deleteOptionValueHandler = asyncHandler(async (req, res) => {
  const inUse = await isOptionValueInUse(req.params.valueId);
  if (inUse) throw new AppError('This option value is used by one or more variants and cannot be deleted.', 409, 'CONFLICT');
  await deleteOptionValue(req.params.valueId, req.params.optionTypeId);
  res.json({ success: true, data: { message: 'Option value deleted.' } });
});

// ─── Product option type assignments ─────────────────────────────────────────
// These endpoints manage which option types a product uses and which values are enabled.

// GET /api/v1/catalog/products/:productId/option-types
const getProductOptionTypesHandler = asyncHandler(async (req, res) => {
  const product = await findProductById(req.params.productId, req.businessId);
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');
  const assignments = await getProductOptionTypes(req.params.productId);
  res.json({ success: true, data: { optionTypeAssignments: assignments } });
});

// POST /api/v1/catalog/products/:productId/option-types
// Body: { optionTypeId, enabledValueIds?: [uuid, ...] | null, sortOrder?: 0 }
// enabledValueIds null = all values of this type are available for this product.
// enabledValueIds [uuid, uuid] = only those values can be used when creating variants.
const assignOptionTypeHandler = asyncHandler(async (req, res) => {
  const product = await findProductById(req.params.productId, req.businessId);
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');
  if (!product.is_variable) throw new AppError('Enable variants on this product first.', 422, 'VALIDATION_ERROR');

  const { optionTypeId, enabledValueIds = null, sortOrder = 0 } = req.body;
  if (!optionTypeId) throw new AppError('optionTypeId is required.', 422, 'VALIDATION_ERROR');

  // Verify the option type belongs to this business
  const optionType = await findOptionTypeById(optionTypeId, req.businessId);
  if (!optionType) throw new AppError('Option type not found.', 404, 'NOT_FOUND');

  const assignment = await assignOptionTypeToProduct(
    req.params.productId, optionTypeId, enabledValueIds, sortOrder
  );
  res.status(201).json({ success: true, data: { assignment } });
});

// PUT /api/v1/catalog/products/:productId/option-types/:optionTypeId
// Body: { enabledValueIds: [uuid, ...] | null }
// Use this to add or remove specific values from a product's option type.
// Pass null to re-enable all values.
const updateProductOptionTypeHandler = asyncHandler(async (req, res) => {
  const { enabledValueIds } = req.body;
  const assignment = await updateProductOptionTypeValues(
    req.params.productId, req.params.optionTypeId, enabledValueIds ?? null
  );
  if (!assignment) throw new AppError('Option type not assigned to this product.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { assignment } });
});

// DELETE /api/v1/catalog/products/:productId/option-types/:optionTypeId
// Blocked if any active variants use values from this option type.
const removeProductOptionTypeHandler = asyncHandler(async (req, res) => {
  try {
    await removeOptionTypeFromProduct(req.params.productId, req.params.optionTypeId);
    res.json({ success: true, data: { message: 'Option type removed from product.' } });
  } catch (err) {
    if (err.message.startsWith('OPTION_TYPE_IN_USE:')) {
      const count = err.message.split(':')[1];
      throw new AppError(
        `${count} active variant(s) use this option type. Delete or update those variants first.`,
        409, 'OPTION_TYPE_IN_USE'
      );
    }
    throw err;
  }
});

// ─── Products ─────────────────────────────────────────────────────────────────

// GET /api/v1/catalog/products
const listProductsHandler = asyncHandler(async (req, res) => {
  const { page, perPage } = getPaginationParams(req.query);
  const { status, categoryId, tagId, search, productType } = req.query;
  const result = await listProducts(req.businessId, { status, categoryId, tagId, search, productType, page, perPage });
  res.json({ success: true, data: { products: result.rows }, meta: getPaginationMeta(result.total, page, perPage) });
});

// POST /api/v1/catalog/products
const createProductHandler = asyncHandler(async (req, res) => {
  // Plan limit check
  const maxProducts = req.plan?.max_products;
  if (maxProducts !== null && maxProducts !== undefined) {
    const count = await countProducts(req.businessId);
    if (count >= maxProducts) {
      throw new AppError(
        `You've reached the ${maxProducts}-product limit on your plan. Upgrade to add more products.`,
        403, 'PLAN_LIMIT'
      );
    }
  }

  const { name, categoryId, basePrice, compareAtPrice, costPrice, description, shortDescription,
    currency, isVariable, trackInventory, status, isFeatured, weight, seoTitle, seoDescription,
    sortOrder, tagIds, stockQuantity } = req.body;

  const slug = await generateUniqueSlug(name, async (s) => !!(await findProductBySlug(s, req.businessId)));

  const product = await createProduct(req.businessId, {
    name, slug, categoryId, basePrice: basePrice ?? 0, compareAtPrice, costPrice,
    description, shortDescription, currency, isVariable: isVariable ?? false,
    trackInventory: trackInventory ?? true, status: status || 'DRAFT',
    isFeatured: isFeatured ?? false, weight, seoTitle, seoDescription, sortOrder,
  });

  // Assign tags
  if (tagIds?.length) await setProductTags(product.id, tagIds);

  // For non-variable products, if stockQuantity provided, write initial stock movement
  if (!isVariable && stockQuantity > 0) {
    const { sql } = require('../../config/database');
    await sql`
      INSERT INTO stock_movements (business_id, product_id, movement_type, quantity_change, quantity_before, quantity_after, note)
      VALUES (${req.businessId}, ${product.id}, 'IMPORT', ${stockQuantity}, 0, ${stockQuantity}, 'Initial stock on product creation')
    `;
    // Store stock on product itself (non-variant products use base_price row as stock reference)
    await sql`UPDATE products SET sort_order = sort_order WHERE id = ${product.id}`;
  }

  res.status(201).json({
    success: true,
    data: { product: { id: product.id, name: product.name, slug: product.slug, status: product.status, productType: product.product_type } },
  });
});

// GET /api/v1/catalog/products/:productId
const getProductHandler = asyncHandler(async (req, res) => {
  const product = await getProductFull(req.params.productId, req.businessId);
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { product } });
});

// PUT /api/v1/catalog/products/:productId
const updateProductHandler = asyncHandler(async (req, res) => {
  const { name, categoryId, basePrice, compareAtPrice, costPrice, description, shortDescription,
    currency, isVariable, trackInventory, status, isFeatured, weight, seoTitle, seoDescription,
    sortOrder, tagIds } = req.body;

  const fields = {};
  if (name !== undefined) {
    fields.name = name;
    // Regenerate slug only if name changed
    const existing = await findProductById(req.params.productId, req.businessId);
    if (existing && existing.name !== name) {
      fields.slug = await generateUniqueSlug(name, async (s) => {
        const found = await findProductBySlug(s, req.businessId);
        return found && found.id !== req.params.productId;
      });
    }
  }
  if (categoryId !== undefined) fields.category_id = categoryId || null;
  if (basePrice !== undefined) fields.base_price = basePrice;
  if (compareAtPrice !== undefined) fields.compare_at_price = compareAtPrice || null;
  if (costPrice !== undefined) fields.cost_price = costPrice || null;
  if (description !== undefined) fields.description = description;
  if (shortDescription !== undefined) fields.short_description = shortDescription;
  if (currency !== undefined) fields.currency = currency;
  if (isVariable !== undefined) fields.is_variable = isVariable;
  if (trackInventory !== undefined) fields.track_inventory = trackInventory;
  if (status !== undefined) fields.status = status;
  if (isFeatured !== undefined) fields.is_featured = isFeatured;
  if (weight !== undefined) fields.weight = weight || null;
  if (seoTitle !== undefined) fields.seo_title = seoTitle;
  if (seoDescription !== undefined) fields.seo_description = seoDescription;
  if (sortOrder !== undefined) fields.sort_order = sortOrder;

  const product = await updateProduct(req.params.productId, req.businessId, fields);
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');

  if (tagIds !== undefined) await setProductTags(product.id, tagIds);

  res.json({ success: true, data: { product } });
});

// DELETE /api/v1/catalog/products/:productId
const deleteProductHandler = asyncHandler(async (req, res) => {
  const product = await findProductById(req.params.productId, req.businessId);
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');
  if (product.status === 'ACTIVE') throw new AppError('Archive the product before deleting it.', 400, 'INVALID_STATUS');
  await softDeleteProduct(req.params.productId, req.businessId);
  res.json({ success: true, data: { message: 'Product deleted.' } });
});

// ─── Product images ───────────────────────────────────────────────────────────

// POST /api/v1/catalog/products/:productId/images
// Body: [{ url, publicId, altText, isMain }] — frontend uploads to Cloudinary first
const addProductImagesHandler = asyncHandler(async (req, res) => {
  const product = await findProductById(req.params.productId, req.businessId);
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');

  const images = Array.isArray(req.body.images) ? req.body.images : [req.body];
  const { sql } = require('../../config/database');

  // Get current image count for sort_order
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM product_images WHERE product_id = ${product.id}`;

  const added = [];
  for (let i = 0; i < images.length; i++) {
    const { url, publicId, altText, isMain } = images[i];
    if (!url) continue;
    const img = await addProductImage(product.id, {
      url, publicId: publicId || '', altText,
      isMain: isMain ?? (count === 0 && i === 0), // first image is main if no images exist
      sortOrder: count + i,
    });
    added.push(img);
  }

  res.status(201).json({ success: true, data: { images: added } });
});

// PUT /api/v1/catalog/products/:productId/images/reorder
const reorderImagesHandler = asyncHandler(async (req, res) => {
  await reorderImages(req.params.productId, req.body.images);
  res.json({ success: true, data: { message: 'Images reordered.' } });
});

// PUT /api/v1/catalog/products/:productId/images/:imageId/set-main
const setMainImageHandler = asyncHandler(async (req, res) => {
  const img = await setMainImage(req.params.imageId, req.params.productId);
  if (!img) throw new AppError('Image not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { image: img } });
});

// DELETE /api/v1/catalog/products/:productId/images/:imageId
const deleteProductImageHandler = asyncHandler(async (req, res) => {
  const img = await deleteProductImage(req.params.imageId, req.params.productId);
  if (!img) throw new AppError('Image not found.', 404, 'NOT_FOUND');
  // Delete from Cloudinary asynchronously
  if (img.public_id) cloudinaryService.deleteImage(img.public_id).catch(() => {});
  res.json({ success: true, data: { message: 'Image deleted.' } });
});

// ─── Variants ─────────────────────────────────────────────────────────────────

// POST /api/v1/catalog/products/:productId/variants
const createVariantHandler = asyncHandler(async (req, res) => {
  const product = await findProductById(req.params.productId, req.businessId);
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');
  if (!product.is_variable) throw new AppError('This product does not have variants enabled. Enable "This product has multiple options" first.', 422, 'VALIDATION_ERROR');

  const { sku, price, compareAtPrice, costPrice, stockQuantity, optionValueIds, imageUrl, imagePublicId, weight } = req.body;

  // Validate that all provided option values are enabled for this product
  if (optionValueIds?.length) {
    const assignments = await getProductOptionTypes(req.params.productId);
    const enabledIds = new Set(
      assignments.flatMap((a) => (a.enabled_values || []).map((v) => v.id))
    );
    // If the product has no option type assignments yet, skip this check (permissive)
    if (assignments.length > 0) {
      const disallowed = optionValueIds.filter((id) => !enabledIds.has(id));
      if (disallowed.length) {
        throw new AppError(
          'One or more option values are not enabled for this product. Update the product\'s option type assignments first.',
          422, 'OPTION_VALUE_NOT_ENABLED'
        );
      }
    }

    const exists = await variantCombinationExists(product.id, optionValueIds);
    if (exists) throw new AppError('A variant with this combination of options already exists.', 409, 'DUPLICATE_VARIANT');
  }

  const variant = await createVariant(product.id, {
    sku, price, compareAtPrice, costPrice,
    stockQuantity: stockQuantity ?? 0,
    optionValueIds,
    imageUrl: imageUrl || null,
    imagePublicId: imagePublicId || null,
    weight,
  });

  res.status(201).json({ success: true, data: { variant } });
});

// PUT /api/v1/catalog/products/:productId/variants/:variantId
const updateVariantHandler = asyncHandler(async (req, res) => {
  const { sku, price, compareAtPrice, costPrice, stockQuantity,
    imageUrl, imagePublicId, weight, isActive, optionValueIds } = req.body;

  const fields = {};
  if (sku !== undefined) fields.sku = sku;
  if (price !== undefined) fields.price = price;
  if (compareAtPrice !== undefined) fields.compare_at_price = compareAtPrice || null;
  if (costPrice !== undefined) fields.cost_price = costPrice || null;
  if (stockQuantity !== undefined) fields.stock_quantity = stockQuantity;
  if (imageUrl !== undefined) fields.image_url = imageUrl || null;
  if (imagePublicId !== undefined) fields.image_public_id = imagePublicId || null;
  if (weight !== undefined) fields.weight = weight || null;
  if (isActive !== undefined) fields.is_active = isActive;

  // Update scalar fields first
  let variant = null;
  if (Object.keys(fields).length) {
    variant = await updateVariant(req.params.variantId, req.params.productId, fields);
    if (!variant) throw new AppError('Variant not found.', 404, 'NOT_FOUND');
  }

  // Replace option value assignments if provided
  if (optionValueIds !== undefined) {
    try {
      await replaceVariantOptionValues(req.params.variantId, req.params.productId, optionValueIds);
    } catch (err) {
      if (err.message === 'DUPLICATE_VARIANT') {
        throw new AppError('A variant with this combination of options already exists.', 409, 'DUPLICATE_VARIANT');
      }
      throw err;
    }
  }

  // Re-fetch with option values attached
  const updated = await findVariantById(req.params.variantId, req.params.productId);
  if (!updated) throw new AppError('Variant not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { variant: updated } });
});

// POST /api/v1/catalog/products/:productId/variants/bulk-stock
const bulkStockHandler = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates) || !updates.length) {
    throw new AppError('updates array is required.', 422, 'VALIDATION_ERROR');
  }
  await bulkUpdateStock(req.businessId, updates);
  res.json({ success: true, data: { message: `Updated stock for ${updates.length} variant(s).` } });
});

// DELETE /api/v1/catalog/products/:productId/variants/:variantId
const deleteVariantHandler = asyncHandler(async (req, res) => {
  await softDeleteVariant(req.params.variantId, req.params.productId);
  res.json({ success: true, data: { message: 'Variant deleted.' } });
});

// POST /api/v1/catalog/products/:productId/duplicate
const duplicateProductHandler = asyncHandler(async (req, res) => {
  const product = await findProductById(req.params.productId, req.businessId);
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');

  const newSlug = await generateUniqueSlug(product.name + ' copy', async (s) => !!(await findProductBySlug(s, req.businessId)));
  const duplicate = await duplicateProduct(req.params.productId, req.businessId, newSlug);
  res.status(201).json({ success: true, data: { product: duplicate } });
});

// ─── Bundles ──────────────────────────────────────────────────────────────────

// GET /api/v1/catalog/bundles
const listBundlesHandler = asyncHandler(async (req, res) => {
  const { page, perPage } = getPaginationParams(req.query);
  const result = await listBundles(req.businessId, { page, perPage });
  res.json({ success: true, data: { bundles: result.rows }, meta: getPaginationMeta(result.total, page, perPage) });
});

// POST /api/v1/catalog/bundles
const createBundleHandler = asyncHandler(async (req, res) => {
  const { name, price, compareAtPrice, description, isActive, items } = req.body;
  const slug = await generateUniqueSlug(name, async (s) => !!(await findBundleBySlug(s, req.businessId)));
  const bundle = await createBundle(req.businessId, { name, slug, price, compareAtPrice, description, isActive });
  if (items?.length) await setBundleItems(bundle.id, items);
  const full = await getBundleFull(bundle.id, req.businessId);
  res.status(201).json({ success: true, data: { bundle: full } });
});

// GET /api/v1/catalog/bundles/:bundleId
const getBundleHandler = asyncHandler(async (req, res) => {
  const bundle = await getBundleFull(req.params.bundleId, req.businessId);
  if (!bundle) throw new AppError('Bundle not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { bundle } });
});

// PUT /api/v1/catalog/bundles/:bundleId
const updateBundleHandler = asyncHandler(async (req, res) => {
  const { name, price, compareAtPrice, description, isActive, items } = req.body;
  const fields = {};
  if (name !== undefined) {
    fields.name = name;
    fields.slug = await generateUniqueSlug(name, async (s) => {
      const found = await findBundleBySlug(s, req.businessId);
      return found && found.id !== req.params.bundleId;
    });
  }
  if (price !== undefined) fields.price = price;
  if (description !== undefined) fields.description = description;
  if (isActive !== undefined) fields.is_active = isActive;

  const bundle = await updateBundle(req.params.bundleId, req.businessId, fields);
  if (!bundle) throw new AppError('Bundle not found.', 404, 'NOT_FOUND');
  if (items !== undefined) await setBundleItems(bundle.id, items);
  const full = await getBundleFull(bundle.id, req.businessId);
  res.json({ success: true, data: { bundle: full } });
});

// DELETE /api/v1/catalog/bundles/:bundleId
const deleteBundleHandler = asyncHandler(async (req, res) => {
  const bundle = await findBundleById(req.params.bundleId, req.businessId);
  if (!bundle) throw new AppError('Bundle not found.', 404, 'NOT_FOUND');
  await deleteBundle(req.params.bundleId, req.businessId);
  res.json({ success: true, data: { message: 'Bundle deleted.' } });
});

// POST /api/v1/catalog/bundles/:bundleId/image
const uploadBundleImage = asyncHandler(async (req, res) => {
  const { url, publicId } = req.body;
  const bundle = await updateBundle(req.params.bundleId, req.businessId, {
    image_url: url, image_public_id: publicId || null,
  });
  if (!bundle) throw new AppError('Bundle not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { bundle } });
});

// ─── CSV bulk import ──────────────────────────────────────────────────────────

// GET /api/v1/catalog/products/import/template
const getImportTemplate = asyncHandler(async (req, res) => {
  const csv = 'name,description,basePrice,compareAtPrice,costPrice,category,status,isVariable,trackInventory,weight,seoTitle,seoDescription,tags\n' +
    'Example Product,A great product,5000,6000,2000,Clothing,ACTIVE,false,true,0.5,SEO Title,SEO Description,tag1|tag2\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="varanda-products-template.csv"');
  res.send(csv);
});

// POST /api/v1/catalog/products/import — Phase 3 stub (full CSV parsing in Phase 3 completion)
const importProducts = asyncHandler(async (req, res) => {
  throw new AppError('CSV bulk import is available in Phase 3. Use the template endpoint to download the format.', 501, 'NOT_IMPLEMENTED');
});

// GET /api/v1/catalog/products/import/:jobId/status
const getImportStatus = asyncHandler(async (req, res) => {
  throw new AppError('CSV bulk import is available in Phase 3.', 501, 'NOT_IMPLEMENTED');
});

module.exports = {
  listCategoriesHandler, createCategoryHandler, updateCategoryHandler,
  uploadCategoryImage, deleteCategoryHandler,
  listTagsHandler, createTagHandler, deleteTagHandler,
  listOptionTypesHandler, createOptionTypeHandler, createOptionValueHandler, deleteOptionValueHandler,
  getProductOptionTypesHandler, assignOptionTypeHandler, updateProductOptionTypeHandler, removeProductOptionTypeHandler,
  listProductsHandler, createProductHandler, getProductHandler, updateProductHandler, deleteProductHandler,
  addProductImagesHandler, reorderImagesHandler, setMainImageHandler, deleteProductImageHandler,
  createVariantHandler, updateVariantHandler, bulkStockHandler, deleteVariantHandler,
  duplicateProductHandler, getImportTemplate, importProducts, getImportStatus,
  listBundlesHandler, createBundleHandler, getBundleHandler, updateBundleHandler, deleteBundleHandler, uploadBundleImage,
};
