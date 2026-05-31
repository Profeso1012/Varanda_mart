const { sql } = require('../../config/database');

const createSupplierProfile = async ({ userId, businessId, displayName, description, processingTimeDays, shipsTo }) => {
  const [profile] = await sql`
    INSERT INTO supplier_profiles (user_id, business_id, display_name, description, processing_time_days, ships_to)
    VALUES (${userId}, ${businessId || null}, ${displayName}, ${description || null},
            ${processingTimeDays || 3}, ${shipsTo || []})
    RETURNING *
  `;
  return profile;
};

const findSupplierByUserId = async (userId) => {
  const [profile] = await sql`SELECT * FROM supplier_profiles WHERE user_id = ${userId}`;
  return profile || null;
};

const findSupplierById = async (id) => {
  const [profile] = await sql`SELECT * FROM supplier_profiles WHERE id = ${id}`;
  return profile || null;
};

const updateSupplierProfile = async (id, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [profile] = await sql`
    UPDATE supplier_profiles SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return profile;
};

const setSupplierBankAccount = async (id, { bankCode, accountNumber, accountName, bankName, paystackRecipientCode }) => {
  const [profile] = await sql`
    UPDATE supplier_profiles
    SET bank_code = ${bankCode}, account_number = ${accountNumber},
        account_name = ${accountName}, bank_name = ${bankName},
        paystack_recipient_code = ${paystackRecipientCode},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return profile;
};

const getSupplierWithMetrics = async (id) => {
  const [profile] = await sql`SELECT * FROM supplier_profiles WHERE id = ${id}`;
  if (!profile) return null;
  const [metrics] = await sql`SELECT * FROM supplier_metrics WHERE supplier_id = ${id}`;
  return { ...profile, metrics: metrics || null };
};

const listSuppliers = async ({ verified, minRating, search, page = 1, perPage = 20 }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT sp.*, sm.avg_rating, sm.fulfillment_rate
    FROM supplier_profiles sp
    LEFT JOIN supplier_metrics sm ON sm.supplier_id = sp.id
    WHERE sp.is_active = true
      AND (${verified === undefined ? null : verified}::boolean IS NULL OR sp.is_verified = ${verified === undefined ? null : verified}::boolean)
      AND (${minRating || null}::numeric IS NULL OR sm.avg_rating >= ${minRating || null}::numeric)
      AND (${search || null}::text IS NULL OR sp.display_name ILIKE ${'%' + (search || '') + '%'})
    ORDER BY sp.created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM supplier_profiles WHERE is_active = true
  `;
  return { rows, total: count };
};

const verifySupplier = async (id, adminId) => {
  const [profile] = await sql`
    UPDATE supplier_profiles
    SET is_verified = true, verified_at = NOW(), updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return profile;
};

const upsertSupplierMetrics = async (supplierId, data) => {
  await sql`
    INSERT INTO supplier_metrics (supplier_id, period_days, total_orders, fulfilled_orders,
      fulfillment_rate, avg_shipping_days, dispute_count, dispute_rate, avg_rating, review_count)
    VALUES (${supplierId}, ${data.periodDays || 30}, ${data.totalOrders || 0}, ${data.fulfilledOrders || 0},
            ${data.fulfillmentRate || 100}, ${data.avgShippingDays || 0}, ${data.disputeCount || 0},
            ${data.disputeRate || 0}, ${data.avgRating || 5}, ${data.reviewCount || 0})
    ON CONFLICT (supplier_id) DO UPDATE
    SET period_days = ${data.periodDays || 30},
        total_orders = ${data.totalOrders || 0},
        fulfilled_orders = ${data.fulfilledOrders || 0},
        fulfillment_rate = ${data.fulfillmentRate || 100},
        avg_shipping_days = ${data.avgShippingDays || 0},
        dispute_count = ${data.disputeCount || 0},
        dispute_rate = ${data.disputeRate || 0},
        avg_rating = ${data.avgRating || 5},
        review_count = ${data.reviewCount || 0},
        updated_at = NOW()
  `;
};

const getPublicSupplierProfile = async (id) => {
  const [profile] = await sql`
    SELECT id, display_name, description, logo_url, country, processing_time_days,
           ships_to, is_verified, verified_at, total_dropship_sales, total_revenue_earned,
           fulfillment_rate, avg_shipping_days, dispute_rate, created_at
    FROM supplier_profiles WHERE id = ${id} AND is_active = true
  `;
  return profile || null;
};

module.exports = {
  createSupplierProfile,
  findSupplierByUserId,
  findSupplierById,
  updateSupplierProfile,
  setSupplierBankAccount,
  getSupplierWithMetrics,
  listSuppliers,
  verifySupplier,
  upsertSupplierMetrics,
  getPublicSupplierProfile,
};
