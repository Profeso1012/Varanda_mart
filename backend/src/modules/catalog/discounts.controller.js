const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const { getPaginationMeta, getPaginationParams } = require('../../utils/paginate');
const {
  createDiscount, findDiscountById, listDiscounts,
  updateDiscount, deleteDiscount, getDiscountUsages,
} = require('../../db/queries/discounts.queries');

// GET /api/v1/discounts
const listDiscountsHandler = asyncHandler(async (req, res) => {
  const { page, perPage } = getPaginationParams(req.query);
  const result = await listDiscounts(req.businessId, { page, perPage });
  res.json({ success: true, data: { discounts: result.rows }, meta: getPaginationMeta(result.total, page, perPage) });
});

// POST /api/v1/discounts
const createDiscountHandler = asyncHandler(async (req, res) => {
  const discount = await createDiscount(req.businessId, req.body).catch((err) => {
    if (err.code === '23505') throw new AppError('A discount code with this name already exists.', 409, 'CONFLICT');
    throw err;
  });
  res.status(201).json({ success: true, data: { discount } });
});

// PUT /api/v1/discounts/:discountId
const updateDiscountHandler = asyncHandler(async (req, res) => {
  const { code, type, value, minimumOrder, usageLimit, perCustomerLimit, startsAt, expiresAt, isActive } = req.body;
  const fields = {};
  if (code !== undefined) fields.code = code.toUpperCase();
  if (type !== undefined) fields.type = type;
  if (value !== undefined) fields.value = value;
  if (minimumOrder !== undefined) fields.minimum_order = minimumOrder || null;
  if (usageLimit !== undefined) fields.usage_limit = usageLimit || null;
  if (perCustomerLimit !== undefined) fields.per_customer_limit = perCustomerLimit;
  if (startsAt !== undefined) fields.starts_at = startsAt || null;
  if (expiresAt !== undefined) fields.expires_at = expiresAt || null;
  if (isActive !== undefined) fields.is_active = isActive;

  const discount = await updateDiscount(req.params.discountId, req.businessId, fields);
  if (!discount) throw new AppError('Discount code not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { discount } });
});

// DELETE /api/v1/discounts/:discountId
const deleteDiscountHandler = asyncHandler(async (req, res) => {
  const discount = await findDiscountById(req.params.discountId, req.businessId);
  if (!discount) throw new AppError('Discount code not found.', 404, 'NOT_FOUND');
  await deleteDiscount(req.params.discountId, req.businessId);
  res.json({ success: true, data: { message: 'Discount code deleted.' } });
});

// GET /api/v1/discounts/:discountId/usages
const getDiscountUsagesHandler = asyncHandler(async (req, res) => {
  const { page, perPage } = getPaginationParams(req.query);
  const discount = await findDiscountById(req.params.discountId, req.businessId);
  if (!discount) throw new AppError('Discount code not found.', 404, 'NOT_FOUND');
  const result = await getDiscountUsages(req.params.discountId, { page, perPage });
  res.json({ success: true, data: { usages: result.rows }, meta: getPaginationMeta(result.total, page, perPage) });
});

module.exports = { listDiscountsHandler, createDiscountHandler, updateDiscountHandler, deleteDiscountHandler, getDiscountUsagesHandler };
