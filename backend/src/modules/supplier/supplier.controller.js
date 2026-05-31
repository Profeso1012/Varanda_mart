const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const paystackConfig = require('../../config/paystack');
const cloudinaryService = require('../../services/cloudinary.service');
const { getPaginationMeta, getPaginationParams } = require('../../utils/paginate');
const emailConfig = require('../../config/email');

const { updateSupplierProfile, setSupplierBankAccount, getSupplierWithMetrics } =
  require('../../db/queries/supplierProfiles.queries');
const { updateOnboardingStep } = require('../../db/queries/users.queries');
const {
  createSupplierProduct, findSupplierProductByIdAndSupplier, updateSupplierProduct,
  softDeleteSupplierProduct, getSupplierProductsForSupplier, getSupplierProductFull,
  submitSupplierProductForReview, pauseSupplierProduct, reactivateSupplierProduct,
  createSupplierVariant, updateSupplierVariant, softDeleteSupplierVariant,
  addSupplierProductImage, reorderSupplierImages, deleteSupplierProductImage,
  getSupplierRevenueSummary, getImporterEmailsForProduct,
} = require('../../db/queries/supplierProducts.queries');
const escrowService = require('../../services/escrow.service');
const {
  getDropshipOrdersBySupplier, updateDropshipOrderStatus, findDropshipOrderById,
} = require('../../db/queries/dropshipOrders.queries');

// ─── Profile ──────────────────────────────────────────────────────────────────

const getProfile = asyncHandler(async (req, res) => {
  const data = await getSupplierWithMetrics(req.supplierProfile.id);
  const sp = req.supplierProfile;
  res.json({
    success: true,
    data: {
      supplier: data,
      metrics: data.metrics || {},
      bankAccount: sp.account_number
        ? { bankName: sp.bank_name, maskedAccount: `****${sp.account_number.slice(-4)}`, paystackRecipientCode: sp.paystack_recipient_code }
        : null,
    },
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { displayName, description, processingTimeDays, shipsTo } = req.body;
  const fields = {};
  if (displayName !== undefined) fields.display_name = displayName;
  if (description !== undefined) fields.description = description;
  if (processingTimeDays !== undefined) fields.processing_time_days = processingTimeDays;
  if (shipsTo !== undefined) fields.ships_to = shipsTo;
  const supplier = await updateSupplierProfile(req.supplierProfile.id, fields);

  // Advance onboarding to COMPLETE on supplier profile completion (if still in BUSINESS_SETUP)
  if (req.user.onboarding_step === 'BUSINESS_SETUP') {
    await updateOnboardingStep(req.userId, 'COMPLETE');
  }

  res.json({ success: true, data: { supplier } });
});

const verifyBankAccount = asyncHandler(async (req, res) => {
  const { bankCode, accountNumber } = req.body;
  try {
    const result = await paystackConfig.resolveAccount(bankCode, accountNumber);
    res.json({ success: true, data: result });
  } catch {
    throw new AppError('Account not found. Check the bank code and account number.', 400, 'ACCOUNT_NOT_FOUND');
  }
});

const createBankAccount = asyncHandler(async (req, res) => {
  const sp = req.supplierProfile;
  if (sp.paystack_recipient_code) throw new AppError('Bank account already registered.', 409, 'CONFLICT');
  const { bankCode, accountNumber, accountName } = req.body;

  let recipientCode;
  try {
    const result = await paystackConfig.createTransferRecipient({ type: 'nuban', name: accountName, accountNumber, bankCode });
    recipientCode = result.recipientCode;
  } catch (err) {
    throw new AppError(`Paystack error: ${err.message}`, 400, 'PAYSTACK_ERROR');
  }

  let bankName = bankCode;
  try { const banks = await paystackConfig.getBanks(); const bank = banks.find((b) => b.code === bankCode); if (bank) bankName = bank.name; } catch {}

  await setSupplierBankAccount(sp.id, { bankCode, accountNumber, accountName, bankName, paystackRecipientCode: recipientCode });

  // Advance onboarding to COMPLETE on first bank account registration (still in BUSINESS_SETUP)
  if (req.user.onboarding_step === 'BUSINESS_SETUP') {
    await updateOnboardingStep(req.userId, 'COMPLETE');
  }

  res.status(201).json({ success: true, data: { recipientCode, bankName, maskedAccount: `****${accountNumber.slice(-4)}`, accountName } });
});

// ─── Products ─────────────────────────────────────────────────────────────────

// GET /api/v1/supplier/products
const listProducts = asyncHandler(async (req, res) => {
  const { page, perPage } = getPaginationParams(req.query);
  const { status, search } = req.query;
  const result = await getSupplierProductsForSupplier(req.supplierProfile.id, { status, search, page, perPage });
  res.json({ success: true, data: { products: result.rows }, meta: getPaginationMeta(result.total, page, perPage) });
});

// POST /api/v1/supplier/products
const createProduct = asyncHandler(async (req, res) => {
  const product = await createSupplierProduct(req.supplierProfile.id, req.body);
  res.status(201).json({ success: true, data: { product: { id: product.id, name: product.name, slug: product.slug, status: product.status, supplierPrice: product.supplier_price } } });
});

// GET /api/v1/supplier/products/:productId
const getProduct = asyncHandler(async (req, res) => {
  const product = await getSupplierProductFull(req.params.productId, req.supplierProfile.id);
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { product } });
});

// PUT /api/v1/supplier/products/:productId
const updateProduct = asyncHandler(async (req, res) => {
  const { name, marketplaceCategoryId, description, supplierPrice, suggestedRetailPrice,
    currency, isVariable, trackInventory, processingTimeDays, weight, tags, seoTitle, seoDescription } = req.body;

  const fields = {};
  if (name !== undefined) fields.name = name;
  if (marketplaceCategoryId !== undefined) fields.marketplace_category_id = marketplaceCategoryId || null;
  if (description !== undefined) fields.description = description;
  if (supplierPrice !== undefined) fields.supplier_price = supplierPrice;
  if (suggestedRetailPrice !== undefined) fields.suggested_retail_price = suggestedRetailPrice || null;
  if (currency !== undefined) fields.currency = currency;
  if (isVariable !== undefined) fields.is_variable = isVariable;
  if (trackInventory !== undefined) fields.track_inventory = trackInventory;
  if (processingTimeDays !== undefined) fields.processing_time_days = processingTimeDays;
  if (weight !== undefined) fields.weight = weight || null;
  if (tags !== undefined) fields.tags = tags;
  if (seoTitle !== undefined) fields.seo_title = seoTitle;
  if (seoDescription !== undefined) fields.seo_description = seoDescription;

  const product = await updateSupplierProduct(req.params.productId, req.supplierProfile.id, fields);
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');

  // Notify importers if price changed
  let importersNotified = 0;
  if (supplierPrice !== undefined) {
    const emails = await getImporterEmailsForProduct(req.params.productId);
    importersNotified = emails.length;
    emails.forEach((email) => {
      emailConfig.sendEmail(email, 'Supplier price update', `A product you imported has had its supplier price updated.`).catch(() => {});
    });
  }

  res.json({ success: true, data: { product, importersNotified } });
});

// DELETE /api/v1/supplier/products/:productId
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await findSupplierProductByIdAndSupplier(req.params.productId, req.supplierProfile.id);
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');
  if (product.status === 'ACTIVE') throw new AppError('Pause the product before deleting it.', 400, 'INVALID_STATUS');
  if (product.status === 'PENDING_REVIEW') throw new AppError('Withdraw the product from review before deleting it.', 400, 'INVALID_STATUS');
  await softDeleteSupplierProduct(req.params.productId, req.supplierProfile.id);
  res.json({ success: true, data: { message: 'Product deleted.' } });
});

// ─── Product images ───────────────────────────────────────────────────────────

// POST /api/v1/supplier/products/:productId/images
// Body: { images: [{ url, publicId, altText, isMain }] }
const uploadImages = asyncHandler(async (req, res) => {
  const product = await findSupplierProductByIdAndSupplier(req.params.productId, req.supplierProfile.id);
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');

  const { sql } = require('../../config/database');
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM supplier_product_images WHERE supplier_product_id = ${product.id}`;

  const images = Array.isArray(req.body.images) ? req.body.images : [req.body];
  const added = [];
  for (let i = 0; i < images.length; i++) {
    const { url, publicId, altText, isMain } = images[i];
    if (!url) continue;
    const img = await addSupplierProductImage(product.id, {
      url, publicId: publicId || '', altText,
      isMain: isMain ?? (count === 0 && i === 0),
      sortOrder: count + i,
    });
    added.push(img);
  }
  res.status(201).json({ success: true, data: { images: added } });
});

// PUT /api/v1/supplier/products/:productId/images/reorder
const reorderImages = asyncHandler(async (req, res) => {
  await reorderSupplierImages(req.params.productId, req.body.images);
  res.json({ success: true, data: { message: 'Images reordered.' } });
});

// DELETE /api/v1/supplier/products/:productId/images/:imageId
const deleteImage = asyncHandler(async (req, res) => {
  const img = await deleteSupplierProductImage(req.params.imageId, req.params.productId);
  if (!img) throw new AppError('Image not found.', 404, 'NOT_FOUND');
  if (img.public_id) cloudinaryService.deleteImage(img.public_id).catch(() => {});
  res.json({ success: true, data: { message: 'Image deleted.' } });
});

// ─── Variants ─────────────────────────────────────────────────────────────────

// POST /api/v1/supplier/products/:productId/variants
const createVariant = asyncHandler(async (req, res) => {
  const product = await findSupplierProductByIdAndSupplier(req.params.productId, req.supplierProfile.id);
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');
  const variant = await createSupplierVariant(req.supplierProfile.id, product.id, req.body);
  res.status(201).json({ success: true, data: { variant } });
});

// PUT /api/v1/supplier/products/:productId/variants/:variantId
const updateVariant = asyncHandler(async (req, res) => {
  const { variantLabel, sku, supplierPrice, suggestedRetailPrice, stockQuantity, optionValues, imageUrl, weight, isActive } = req.body;
  const fields = {};
  if (variantLabel !== undefined) fields.variant_label = variantLabel;
  if (sku !== undefined) fields.sku = sku;
  if (supplierPrice !== undefined) fields.supplier_price = supplierPrice;
  if (suggestedRetailPrice !== undefined) fields.suggested_retail_price = suggestedRetailPrice || null;
  if (stockQuantity !== undefined) fields.stock_quantity = stockQuantity;
  if (optionValues !== undefined) fields.option_values = JSON.stringify(optionValues);
  if (imageUrl !== undefined) fields.image_url = imageUrl || null;
  if (weight !== undefined) fields.weight = weight || null;
  if (isActive !== undefined) fields.is_active = isActive;

  const variant = await updateSupplierVariant(req.params.variantId, fields);
  if (!variant) throw new AppError('Variant not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { variant } });
});

// DELETE /api/v1/supplier/products/:productId/variants/:variantId
const deleteVariant = asyncHandler(async (req, res) => {
  await softDeleteSupplierVariant(req.params.variantId);
  res.json({ success: true, data: { message: 'Variant deleted.' } });
});

// ─── Status transitions ───────────────────────────────────────────────────────

// POST /api/v1/supplier/products/:productId/submit
const submitForReview = asyncHandler(async (req, res) => {
  const product = await findSupplierProductByIdAndSupplier(req.params.productId, req.supplierProfile.id);
  if (!product) throw new AppError('Product not found.', 404, 'NOT_FOUND');

  // Validate completeness
  const { sql } = require('../../config/database');
  const [{ imgCount }] = await sql`SELECT COUNT(*)::int AS "imgCount" FROM supplier_product_images WHERE supplier_product_id = ${product.id}`;
  if (imgCount === 0) throw new AppError('Add at least one product image before submitting for review.', 400, 'INCOMPLETE_PRODUCT');
  if (!product.marketplace_category_id) throw new AppError('Select a marketplace category before submitting.', 400, 'INCOMPLETE_PRODUCT');
  if (!product.supplier_price || product.supplier_price <= 0) throw new AppError('Set a valid supplier price before submitting.', 400, 'INCOMPLETE_PRODUCT');

  const updated = await submitSupplierProductForReview(product.id, req.supplierProfile.id);
  if (!updated) throw new AppError('Product must be in DRAFT status to submit for review.', 400, 'INVALID_STATUS');
  res.json({ success: true, data: { product: { status: updated.status } } });
});

// POST /api/v1/supplier/products/:productId/pause
const pauseProduct = asyncHandler(async (req, res) => {
  const updated = await pauseSupplierProduct(req.params.productId, req.supplierProfile.id);
  if (!updated) throw new AppError('Product not found or not in ACTIVE status.', 400, 'INVALID_STATUS');

  // Notify importers
  const emails = await getImporterEmailsForProduct(req.params.productId);
  emails.forEach((email) => {
    emailConfig.sendEmail(email, 'Imported product paused', 'A product you imported has been paused by the supplier.').catch(() => {});
  });

  res.json({ success: true, data: { product: { status: updated.status }, importersNotified: emails.length } });
});

// POST /api/v1/supplier/products/:productId/reactivate
const reactivateProduct = asyncHandler(async (req, res) => {
  const updated = await reactivateSupplierProduct(req.params.productId, req.supplierProfile.id);
  if (!updated) throw new AppError('Product not found or cannot be reactivated from its current status.', 400, 'INVALID_STATUS');
  res.json({ success: true, data: { product: { status: updated.status } } });
});

// ─── Orders ───────────────────────────────────────────────────────────────────

const listOrders = asyncHandler(async (req, res) => {
  const { page, perPage } = getPaginationParams(req.query);
  const { status } = req.query;
  const result = await getDropshipOrdersBySupplier(req.supplierProfile.id, { status, page, perPage });
  res.json({ success: true, data: { orders: result.rows }, meta: getPaginationMeta(result.total, page, perPage) });
});

const confirmOrder = asyncHandler(async (req, res) => {
  const order = await findDropshipOrderById(req.params.dropshipOrderId);
  if (!order) throw new AppError('Order not found.', 404, 'NOT_FOUND');
  if (order.supplier_id !== req.supplierProfile.id) throw new AppError('Not your order.', 403, 'FORBIDDEN');
  if (order.status !== 'PENDING') throw new AppError('Order must be in PENDING status to confirm.', 400, 'INVALID_STATUS');
  const updated = await updateDropshipOrderStatus(req.params.dropshipOrderId, 'CONFIRMED', {});
  res.json({ success: true, data: { dropshipOrder: { status: updated.status } } });
});

const shipOrder = asyncHandler(async (req, res) => {
  const { trackingNumber, carrierName, trackingUrl } = req.body;
  const order = await findDropshipOrderById(req.params.dropshipOrderId);
  if (!order) throw new AppError('Order not found.', 404, 'NOT_FOUND');
  if (order.supplier_id !== req.supplierProfile.id) throw new AppError('Not your order.', 403, 'FORBIDDEN');
  if (order.status === 'SHIPPED') throw new AppError('Order already shipped.', 400, 'ALREADY_SHIPPED');
  if (order.status !== 'CONFIRMED') throw new AppError('Order must be CONFIRMED before marking as shipped.', 400, 'INVALID_STATUS');

  const updated = await updateDropshipOrderStatus(req.params.dropshipOrderId, 'SHIPPED', {
    shippedAt: new Date(), trackingNumber, trackingUrl, carrierName,
  });

  await escrowService.markShippedAwaitingConfirmation(
    req.params.dropshipOrderId,
    order.customer_email,
    order.dropship_order_number
  ).catch((err) => console.error('[supplier] escrow update failed:', err.message));

  res.json({
    success: true,
    data: {
      dropshipOrder: {
        status: 'SHIPPED',
        sellerConfirmationStatus: 'PENDING',
        shippedAt: updated.shipped_at,
        message: 'Order marked as shipped. Awaiting seller confirmation to release escrow.',
      },
    },
  });
});

// ─── Revenue ──────────────────────────────────────────────────────────────────

const getRevenue = asyncHandler(async (req, res) => {
  const { period = '30d' } = req.query;
  const summary = await getSupplierRevenueSummary(req.supplierProfile.id, period);
  res.json({ success: true, data: summary });
});

const requestWithdrawal = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const summary = await getSupplierRevenueSummary(req.supplierProfile.id, '30d');
  if (amount > summary.availableForWithdrawal) {
    throw new AppError(`Insufficient balance. Available: ₦${summary.availableForWithdrawal.toLocaleString()}`, 400, 'INSUFFICIENT_BALANCE');
  }
  // Withdrawal request tracking — full disbursement via Paystack Transfer in Phase 6+
  res.status(201).json({
    success: true,
    data: { withdrawalRequest: { id: require('crypto').randomUUID(), amount, status: 'PENDING' } },
  });
});

module.exports = {
  getProfile, updateProfile, verifyBankAccount, createBankAccount,
  listProducts, createProduct, getProduct, updateProduct, deleteProduct,
  uploadImages, reorderImages, deleteImage,
  createVariant, updateVariant, deleteVariant,
  submitForReview, pauseProduct, reactivateProduct,
  listOrders, confirmOrder, shipOrder,
  getRevenue, requestWithdrawal,
};
