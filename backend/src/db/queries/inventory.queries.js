const { sql, withTransaction } = require('../../config/database');

/**
 * Adjust stock for a single variant. Writes a stock_movement record atomically.
 */
const adjustStock = async (businessId, variantId, quantityChange, movementType, note, performedBy) => {
  return withTransaction(async (tx) => {
    const [variant] = await tx`
      SELECT pv.stock_quantity, pv.product_id FROM product_variants pv WHERE pv.id = ${variantId}
    `;
    if (!variant) throw new Error('Variant not found');

    const before = variant.stock_quantity;
    const after = before + quantityChange;
    if (after < 0) throw new Error('Stock cannot go below zero');

    await tx`
      UPDATE product_variants SET stock_quantity = ${after}, updated_at = NOW()
      WHERE id = ${variantId}
    `;

    const [movement] = await tx`
      INSERT INTO stock_movements (
        business_id, product_id, variant_id, movement_type,
        quantity_change, quantity_before, quantity_after, note, performed_by
      ) VALUES (
        ${businessId}, ${variant.product_id}, ${variantId},
        ${movementType || 'MANUAL_INCREASE'}, ${quantityChange},
        ${before}, ${after}, ${note || null}, ${performedBy || null}
      )
      RETURNING *
    `;
    return { movement, stockBefore: before, stockAfter: after };
  });
};

/**
 * List stock movements for a business, optionally filtered by variant.
 */
const listMovements = async (businessId, { variantId, productId, page = 1, perPage = 50 }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT sm.*, p.name AS product_name, pv.sku AS variant_sku
    FROM stock_movements sm
    LEFT JOIN products p ON p.id = sm.product_id
    LEFT JOIN product_variants pv ON pv.id = sm.variant_id
    WHERE sm.business_id = ${businessId}
      AND (${variantId || null}::uuid IS NULL OR sm.variant_id = ${variantId || null}::uuid)
      AND (${productId || null}::uuid IS NULL OR sm.product_id = ${productId || null}::uuid)
    ORDER BY sm.created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM stock_movements
    WHERE business_id = ${businessId}
      AND (${variantId || null}::uuid IS NULL OR variant_id = ${variantId || null}::uuid)
  `;
  return { rows, total: count };
};

/**
 * Get low-stock variants (stock_quantity <= threshold, default 5).
 */
const getLowStockVariants = async (businessId, threshold = 5) => {
  return sql`
    SELECT pv.*, p.name AS product_name, p.id AS product_id,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) AS product_image
    FROM product_variants pv
    JOIN products p ON p.id = pv.product_id
    WHERE p.business_id = ${businessId}
      AND p.deleted_at IS NULL
      AND p.track_inventory = true
      AND pv.deleted_at IS NULL
      AND pv.is_active = true
      AND pv.stock_quantity <= ${threshold}
    ORDER BY pv.stock_quantity ASC
  `;
};

module.exports = { adjustStock, listMovements, getLowStockVariants };
