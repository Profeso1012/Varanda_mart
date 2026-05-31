const { sql } = require('../../config/database');

const createDiscount = async (businessId, data) => {
  const [discount] = await sql`
    INSERT INTO discount_codes (
      business_id, code, type, value, minimum_order, usage_limit,
      per_customer_limit, starts_at, expires_at, is_active
    ) VALUES (
      ${businessId}, ${data.code.toUpperCase()}, ${data.type}, ${data.value},
      ${data.minimumOrder || null}, ${data.usageLimit || null},
      ${data.perCustomerLimit ?? 1}, ${data.startsAt || null}, ${data.expiresAt || null},
      ${data.isActive ?? true}
    )
    RETURNING *
  `;
  return discount;
};

const findDiscountById = async (id, businessId) => {
  const [d] = await sql`SELECT * FROM discount_codes WHERE id = ${id} AND business_id = ${businessId}`;
  return d || null;
};

const findDiscountByCode = async (code, businessId) => {
  const [d] = await sql`
    SELECT * FROM discount_codes
    WHERE code = ${code.toUpperCase()} AND business_id = ${businessId}
  `;
  return d || null;
};

const listDiscounts = async (businessId, { page = 1, perPage = 20 }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT * FROM discount_codes WHERE business_id = ${businessId}
    ORDER BY created_at DESC LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM discount_codes WHERE business_id = ${businessId}`;
  return { rows, total: count };
};

const updateDiscount = async (id, businessId, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [d] = await sql`
    UPDATE discount_codes SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id} AND business_id = ${businessId}
    RETURNING *
  `;
  return d;
};

const deleteDiscount = async (id, businessId) => {
  await sql`DELETE FROM discount_codes WHERE id = ${id} AND business_id = ${businessId}`;
};

const getDiscountUsages = async (discountId, { page = 1, perPage = 20 }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT dcu.*, o.order_number FROM discount_code_usages dcu
    LEFT JOIN orders o ON o.id = dcu.order_id
    WHERE dcu.discount_code_id = ${discountId}
    ORDER BY dcu.used_at DESC LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM discount_code_usages WHERE discount_code_id = ${discountId}
  `;
  return { rows, total: count };
};

/**
 * Validate a discount code for a given order.
 * Returns the discount record if valid, throws descriptive AppError if not.
 */
const validateDiscountCode = async (code, businessId, orderTotal, customerEmail) => {
  const discount = await findDiscountByCode(code, businessId);
  if (!discount) return null;
  if (!discount.is_active) return null;

  const now = new Date();
  if (discount.starts_at && new Date(discount.starts_at) > now) return null;
  if (discount.expires_at && new Date(discount.expires_at) < now) {
    return { error: 'EXPIRED', message: 'This discount code has expired.' };
  }
  if (discount.minimum_order && Number(orderTotal) < Number(discount.minimum_order)) {
    return { error: 'MINIMUM_ORDER', message: `Minimum order of ₦${Number(discount.minimum_order).toLocaleString()} required for this code.` };
  }
  if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
    return { error: 'USAGE_LIMIT', message: 'This discount code has reached its usage limit.' };
  }
  if (customerEmail && discount.per_customer_limit) {
    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count FROM discount_code_usages
      WHERE discount_code_id = ${discount.id} AND customer_email = ${customerEmail.toLowerCase()}
    `;
    if (count >= discount.per_customer_limit) {
      return { error: 'PER_CUSTOMER_LIMIT', message: "You've already used this discount code." };
    }
  }

  // Compute discount amount
  let discountAmount = 0;
  if (discount.type === 'PERCENTAGE') {
    discountAmount = Math.round((Number(orderTotal) * Number(discount.value)) / 100 * 100) / 100;
  } else if (discount.type === 'FIXED_AMOUNT') {
    discountAmount = Math.min(Number(discount.value), Number(orderTotal));
  } else if (discount.type === 'FREE_SHIPPING') {
    discountAmount = 0; // applied to shipping at checkout
  }

  return { discount, discountAmount, valid: true };
};

module.exports = {
  createDiscount, findDiscountById, findDiscountByCode, listDiscounts,
  updateDiscount, deleteDiscount, getDiscountUsages, validateDiscountCode,
};
