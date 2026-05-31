const { sql } = require('../../config/database');

// ─── Order number generation ──────────────────────────────────────────────────

const generateOrderNumber = async () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM orders
    WHERE order_number LIKE ${'VRD-' + dateStr + '-%'}
  `;
  const seq = String(count + 1).padStart(4, '0');
  return `VRD-${dateStr}-${seq}`;
};

// ─── Orders ───────────────────────────────────────────────────────────────────

const createOrder = async (data, tx) => {
  const db = tx || sql;
  const [order] = await db`
    INSERT INTO orders (
      order_number, business_id, customer_id, customer_email, customer_name,
      shipping_address, billing_address, order_type,
      subtotal, shipping_fee, discount_amount, service_fee, total, currency,
      status, payment_status, payment_gateway,
      shipping_zone_id, shipping_rate_id, discount_code_id, customer_note
    ) VALUES (
      ${data.orderNumber}, ${data.businessId}, ${data.customerId || null},
      ${data.customerEmail}, ${data.customerName},
      ${sql.json(data.shippingAddress)}, ${data.billingAddress ? sql.json(data.billingAddress) : null},
      ${data.orderType || 'DIRECT'},
      ${data.subtotal}, ${data.shippingFee || 0}, ${data.discountAmount || 0},
      ${data.serviceFee || 0}, ${data.total}, ${data.currency || 'NGN'},
      'PENDING', 'PENDING', ${data.paymentGateway || 'VARANDA_PAY'},
      ${data.shippingZoneId || null}, ${data.shippingRateId || null},
      ${data.discountCodeId || null}, ${data.customerNote || null}
    )
    RETURNING *
  `;
  return order;
};

const createOrderItems = async (orderId, items, tx) => {
  const db = tx || sql;
  for (const item of items) {
    await db`
      INSERT INTO order_items (
        order_id, product_id, variant_id, supplier_product_id, supplier_variant_id,
        dropship_import_id, product_snapshot, variant_snapshot,
        quantity, unit_price, total_price, item_type
      ) VALUES (
        ${orderId}, ${item.productId || null}, ${item.variantId || null},
        ${item.supplierProductId || null}, ${item.supplierVariantId || null},
        ${item.dropshipImportId || null},
        ${sql.json(item.productSnapshot)}, ${item.variantSnapshot ? sql.json(item.variantSnapshot) : null},
        ${item.quantity}, ${item.unitPrice}, ${item.totalPrice},
        ${item.itemType || 'OWN'}
      )
    `;
  }
};

const findOrderById = async (id, businessId) => {
  const [order] = await sql`
    SELECT o.*,
      json_agg(oi.* ORDER BY oi.created_at ASC) FILTER (WHERE oi.id IS NOT NULL) AS items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.id = ${id}
      AND (${businessId || null}::uuid IS NULL OR o.business_id = ${businessId || null}::uuid)
    GROUP BY o.id
  `;
  return order || null;
};

const findOrderByNumber = async (orderNumber) => {
  const [order] = await sql`SELECT * FROM orders WHERE order_number = ${orderNumber}`;
  return order || null;
};

const findOrderByNumberFull = async (orderNumber) => {
  const [order] = await sql`
    SELECT o.*,
      json_agg(oi.* ORDER BY oi.created_at ASC) FILTER (WHERE oi.id IS NOT NULL) AS items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.order_number = ${orderNumber}
    GROUP BY o.id
  `;
  return order || null;
};

const listOrdersByBusiness = async (businessId, { status, page = 1, perPage = 20, search }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT o.*,
      (SELECT COUNT(*)::int FROM order_items WHERE order_id = o.id) AS item_count
    FROM orders o
    WHERE o.business_id = ${businessId}
      AND (${status || null}::text IS NULL OR o.status = ${status || null}::order_status)
      AND (${search || null}::text IS NULL
           OR o.order_number ILIKE ${'%' + (search || '') + '%'}
           OR o.customer_email ILIKE ${'%' + (search || '') + '%'}
           OR o.customer_name ILIKE ${'%' + (search || '') + '%'})
    ORDER BY o.created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM orders WHERE business_id = ${businessId}
      AND (${status || null}::text IS NULL OR status = ${status || null}::order_status)
  `;
  return { rows, total: count };
};

const listOrdersByCustomer = async (customerId, businessId, { page = 1, perPage = 20 }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT o.*,
      json_agg(oi.* ORDER BY oi.created_at ASC) FILTER (WHERE oi.id IS NOT NULL) AS items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.customer_id = ${customerId} AND o.business_id = ${businessId}
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM orders
    WHERE customer_id = ${customerId} AND business_id = ${businessId}
  `;
  return { rows, total: count };
};

const updateOrderStatus = async (id, status, extra = {}) => {
  const updates = { status };
  if (extra.trackingNumber) updates.tracking_number = extra.trackingNumber;
  if (extra.trackingUrl) updates.tracking_url = extra.trackingUrl;
  if (extra.sellerNote) updates.seller_note = extra.sellerNote;
  if (extra.cancelledAt) updates.cancelled_at = extra.cancelledAt;
  if (extra.cancellationReason) updates.cancellation_reason = extra.cancellationReason;
  if (extra.deliveredAt) updates.delivered_at = extra.deliveredAt;

  const keys = Object.keys(updates);
  const [order] = await sql`
    UPDATE orders SET ${sql(updates, keys)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return order;
};

const updateOrderPaymentStatus = async (id, paymentStatus, tx) => {
  const db = tx || sql;
  const [order] = await db`
    UPDATE orders SET payment_status = ${paymentStatus}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return order;
};

const getOrderStats = async (businessId) => {
  const [stats] = await sql`
    SELECT
      COUNT(*)::int AS total_orders,
      COUNT(*) FILTER (WHERE status = 'PENDING')::int AS pending,
      COUNT(*) FILTER (WHERE status = 'CONFIRMED')::int AS confirmed,
      COUNT(*) FILTER (WHERE status = 'PROCESSING')::int AS processing,
      COUNT(*) FILTER (WHERE status = 'SHIPPED')::int AS shipped,
      COUNT(*) FILTER (WHERE status = 'DELIVERED')::int AS delivered,
      COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled,
      COALESCE(SUM(total) FILTER (WHERE payment_status = 'PAID'), 0) AS total_revenue,
      COALESCE(SUM(total) FILTER (WHERE payment_status = 'PAID'
        AND created_at >= date_trunc('month', NOW())), 0) AS revenue_this_month
    FROM orders
    WHERE business_id = ${businessId}
  `;
  return stats;
};

// ─── Payments ─────────────────────────────────────────────────────────────────

const createPayment = async ({ orderId, provider, reference, amount, currency }, tx) => {
  const db = tx || sql;
  const [payment] = await db`
    INSERT INTO payments (order_id, provider, reference, amount, currency)
    VALUES (${orderId}, ${provider || 'PAYSTACK'}, ${reference}, ${amount}, ${currency || 'NGN'})
    RETURNING *
  `;
  return payment;
};

const findPaymentByReference = async (reference) => {
  const [payment] = await sql`SELECT * FROM payments WHERE reference = ${reference}`;
  return payment || null;
};

const updatePaymentStatus = async (id, status, gatewayResponse, tx) => {
  const db = tx || sql;
  const [payment] = await db`
    UPDATE payments
    SET status = ${status},
        gateway_response = ${gatewayResponse ? sql.json(gatewayResponse) : null},
        paid_at = ${status === 'PAID' ? new Date() : null},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return payment;
};

const recordWebhookEvent = async ({ provider, eventType, reference, payload }) => {
  const [record] = await sql`
    INSERT INTO payment_webhooks (provider, event_type, reference, payload)
    VALUES (${provider}, ${eventType}, ${reference || null}, ${sql.json(payload)})
    RETURNING id
  `;
  return record;
};

const findWebhookByReference = async (reference, eventType) => {
  const [record] = await sql`
    SELECT * FROM payment_webhooks
    WHERE reference = ${reference} AND event_type = ${eventType} AND processed_at IS NOT NULL
    LIMIT 1
  `;
  return record || null;
};

const markWebhookProcessed = async (id) => {
  await sql`UPDATE payment_webhooks SET processed_at = NOW() WHERE id = ${id}`;
};

// ─── Commissions ──────────────────────────────────────────────────────────────

const createCommission = async ({ orderId, businessId, commissionRate, commissionAmount, serviceFee, markupRevenue }, tx) => {
  const db = tx || sql;
  await db`
    INSERT INTO commissions (
      order_id, business_id, commission_rate, commission_amount,
      service_fee, markup_revenue, total_platform_revenue
    ) VALUES (
      ${orderId}, ${businessId}, ${commissionRate}, ${commissionAmount},
      ${serviceFee}, ${markupRevenue || 0},
      ${commissionAmount + serviceFee + (markupRevenue || 0)}
    )
  `;
};

// ─── Discount usage ───────────────────────────────────────────────────────────

const recordDiscountUsage = async ({ discountCodeId, orderId, customerEmail, discountAmount }, tx) => {
  const db = tx || sql;
  await db`
    INSERT INTO discount_code_usages (discount_code_id, order_id, customer_email, discount_amount)
    VALUES (${discountCodeId}, ${orderId}, ${customerEmail}, ${discountAmount})
  `;
  await db`
    UPDATE discount_codes SET used_count = used_count + 1, updated_at = NOW()
    WHERE id = ${discountCodeId}
  `;
};

module.exports = {
  generateOrderNumber,
  createOrder,
  createOrderItems,
  findOrderById,
  findOrderByNumber,
  findOrderByNumberFull,
  listOrdersByBusiness,
  listOrdersByCustomer,
  updateOrderStatus,
  updateOrderPaymentStatus,
  getOrderStats,
  createPayment,
  findPaymentByReference,
  updatePaymentStatus,
  recordWebhookEvent,
  findWebhookByReference,
  markWebhookProcessed,
  createCommission,
  recordDiscountUsage,
};
