const { sql, withTransaction } = require('../../config/database');

// ─── Order number generation ──────────────────────────────────────────────────

const generateDropshipOrderNumber = async () => {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM dropship_orders
    WHERE dropship_order_number LIKE ${'VRD-DS-' + dateStr + '-%'}
  `;
  const seq = String(count + 1).padStart(4, '0');
  return `VRD-DS-${dateStr}-${seq}`;
};

// ─── Dropship orders ──────────────────────────────────────────────────────────

const createDropshipOrder = async (data, tx) => {
  const db = tx || sql;
  const [order] = await db`
    INSERT INTO dropship_orders (
      order_id, supplier_id, business_id, developer_id, dropship_order_number,
      status, seller_confirmation_status, customer_name, customer_email, shipping_address,
      supplier_note
    ) VALUES (
      ${data.orderId}, ${data.supplierId}, ${data.businessId || null}, ${data.developerId || null},
      ${data.dropshipOrderNumber}, ${data.status || 'PENDING'}, ${data.sellerConfirmationStatus || 'PENDING'},
      ${data.customerName}, ${data.customerEmail}, ${sql.json(data.shippingAddress)},
      ${data.supplierNote || null}
    )
    RETURNING *
  `;
  return order;
};

const createDropshipOrderItems = async (dropshipOrderId, items, tx) => {
  const db = tx || sql;
  for (const item of items) {
    await db`
      INSERT INTO dropship_order_items (
        dropship_order_id, supplier_product_id, supplier_variant_id,
        product_snapshot, variant_snapshot, quantity, supplier_unit_price, supplier_total
      ) VALUES (
        ${dropshipOrderId}, ${item.supplierProductId}, ${item.supplierVariantId || null},
        ${sql.json(item.productSnapshot)}, ${item.variantSnapshot ? sql.json(item.variantSnapshot) : null},
        ${item.quantity}, ${item.supplierUnitPrice}, ${item.supplierTotal}
      )
    `;
  }
};

const findDropshipOrderById = async (id) => {
  const [order] = await sql`
    SELECT dso.*, 
           json_agg(doi.*) FILTER (WHERE doi.id IS NOT NULL) AS items
    FROM dropship_orders dso
    LEFT JOIN dropship_order_items doi ON doi.dropship_order_id = dso.id
    WHERE dso.id = ${id}
    GROUP BY dso.id
  `;
  return order || null;
};

const findDropshipOrderByNumber = async (number) => {
  const [order] = await sql`SELECT * FROM dropship_orders WHERE dropship_order_number = ${number}`;
  return order || null;
};

const getDropshipOrdersBySupplier = async (supplierId, { status, sellerConfirmationStatus, page = 1, perPage = 20 }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT dso.* FROM dropship_orders dso
    WHERE dso.supplier_id = ${supplierId}
      AND (${status || null}::text IS NULL OR dso.status = ${status || null}::dropship_order_status)
      AND (${sellerConfirmationStatus || null}::text IS NULL
           OR dso.seller_confirmation_status = ${sellerConfirmationStatus || null}::seller_confirmation_status)
    ORDER BY dso.created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM dropship_orders WHERE supplier_id = ${supplierId}
  `;
  return { rows, total: count };
};

const getDropshipOrdersByBusiness = async (businessId, { status, page = 1, perPage = 20 }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT dso.*, sp.display_name AS supplier_name
    FROM dropship_orders dso
    JOIN supplier_profiles sp ON sp.id = dso.supplier_id
    WHERE dso.business_id = ${businessId}
      AND (${status || null}::text IS NULL OR dso.status = ${status || null}::dropship_order_status)
    ORDER BY dso.created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM dropship_orders WHERE business_id = ${businessId}
  `;
  return { rows, total: count };
};

const getDropshipOrdersByDeveloper = async (developerId, { status, page = 1, perPage = 20 }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT * FROM dropship_orders
    WHERE developer_id = ${developerId}
      AND (${status || null}::text IS NULL OR status = ${status || null}::dropship_order_status)
    ORDER BY created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM dropship_orders WHERE developer_id = ${developerId}
  `;
  return { rows, total: count };
};

const updateDropshipOrderStatus = async (id, status, extra = {}) => {
  const updates = { status };
  if (extra.shippedAt) updates.shipped_at = extra.shippedAt;
  if (extra.trackingNumber) updates.tracking_number = extra.trackingNumber;
  if (extra.trackingUrl) updates.tracking_url = extra.trackingUrl;
  if (extra.carrierName) updates.carrier_name = extra.carrierName;
  if (extra.sellerConfirmedAt) updates.seller_confirmed_at = extra.sellerConfirmedAt;
  if (extra.deliveredAt) updates.delivered_at = extra.deliveredAt;

  const keys = Object.keys(updates);
  const [order] = await sql`
    UPDATE dropship_orders SET ${sql(updates, keys)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return order;
};

const setSellerConfirmationStatus = async (id, status, timestamp) => {
  const field = status === 'CONFIRMED' ? 'seller_confirmed_at' : status === 'DISPUTED' ? 'seller_disputed_at' : null;
  const updates = { seller_confirmation_status: status };
  if (field && timestamp) updates[field] = timestamp;

  const keys = Object.keys(updates);
  const [order] = await sql`
    UPDATE dropship_orders SET ${sql(updates, keys)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  // Also update escrow status when supplier ships (PENDING → AWAITING_SELLER_CONFIRMATION)
  if (status === 'PENDING') {
    await sql`
      UPDATE escrow_transactions SET status = 'AWAITING_SELLER_CONFIRMATION', updated_at = NOW()
      WHERE dropship_order_id = ${id} AND status = 'HELD'
    `;
  }

  return order;
};

// ─── Escrow ───────────────────────────────────────────────────────────────────

const createEscrowTransaction = async ({ dropshipOrderId, totalHeld, currency, paystackReference }) => {
  const [escrow] = await sql`
    INSERT INTO escrow_transactions (dropship_order_id, total_held, currency, paystack_reference)
    VALUES (${dropshipOrderId}, ${totalHeld}, ${currency || 'NGN'}, ${paystackReference || null})
    RETURNING *
  `;
  // Link back to dropship_order
  await sql`UPDATE dropship_orders SET escrow_transaction_id = ${escrow.id} WHERE id = ${dropshipOrderId}`;
  return escrow;
};

const findEscrowByDropshipOrder = async (dropshipOrderId) => {
  const [escrow] = await sql`
    SELECT * FROM escrow_transactions WHERE dropship_order_id = ${dropshipOrderId}
  `;
  return escrow || null;
};

const updateEscrowStatus = async (id, status, timestampField) => {
  const updates = { status };
  if (timestampField) updates[timestampField] = new Date();

  const keys = Object.keys(updates);
  const [escrow] = await sql`
    UPDATE escrow_transactions SET ${sql(updates, keys)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return escrow;
};

// ─── Revenue splits ───────────────────────────────────────────────────────────

const createRevenueSplits = async (splits, tx) => {
  const db = tx || sql;
  for (const split of splits) {
    await db`
      INSERT INTO revenue_splits (
        escrow_transaction_id, dropship_order_id, recipient_type, recipient_id,
        amount, description, paystack_transfer_id, transfer_status, sent_at
      ) VALUES (
        ${split.escrowTransactionId}, ${split.dropshipOrderId}, ${split.recipientType},
        ${split.recipientId || null}, ${split.amount}, ${split.description || null},
        ${split.paystackTransferId || null}, ${split.transferStatus || 'PENDING'},
        ${split.sentAt || null}
      )
    `;
  }
};

const getRevenueSplitsByDropshipOrder = async (dropshipOrderId) => {
  return sql`SELECT * FROM revenue_splits WHERE dropship_order_id = ${dropshipOrderId}`;
};

// ─── Disputes ─────────────────────────────────────────────────────────────────

const createDispute = async (data) => {
  const [dispute] = await sql`
    INSERT INTO supplier_disputes (
      dropship_order_id, raised_by_role, raised_by_id, supplier_id,
      reason, description, evidence_urls
    ) VALUES (
      ${data.dropshipOrderId}, ${data.raisedByRole}, ${data.raisedById}, ${data.supplierId},
      ${data.reason}, ${data.description}, ${data.evidenceUrls || []}
    )
    RETURNING *
  `;
  return dispute;
};

const findDisputeByDropshipOrder = async (dropshipOrderId) => {
  const [dispute] = await sql`
    SELECT * FROM supplier_disputes WHERE dropship_order_id = ${dropshipOrderId}
  `;
  return dispute || null;
};

const updateDispute = async (id, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [dispute] = await sql`
    UPDATE supplier_disputes SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return dispute;
};

const listOpenDisputes = async ({ page = 1, perPage = 20 }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT sd.*, dso.dropship_order_number, dso.customer_name
    FROM supplier_disputes sd
    JOIN dropship_orders do ON dso.id = sd.dropship_order_id
    WHERE sd.status = 'OPEN'
    ORDER BY sd.created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM supplier_disputes WHERE status = 'OPEN'`;
  return { rows, total: count };
};

module.exports = {
  generateDropshipOrderNumber,
  createDropshipOrder,
  createDropshipOrderItems,
  findDropshipOrderById,
  findDropshipOrderByNumber,
  getDropshipOrdersBySupplier,
  getDropshipOrdersByBusiness,
  getDropshipOrdersByDeveloper,
  updateDropshipOrderStatus,
  setSellerConfirmationStatus,
  createEscrowTransaction,
  findEscrowByDropshipOrder,
  updateEscrowStatus,
  createRevenueSplits,
  getRevenueSplitsByDropshipOrder,
  createDispute,
  findDisputeByDropshipOrder,
  updateDispute,
  listOpenDisputes,
};
