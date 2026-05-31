const { sql, withTransaction } = require('../../config/database');

// ─── Product option type assignments (product ↔ option type) ──────────────────

/**
 * Returns the option types assigned to a product, with their enabled values.
 * If enabled_value_ids is NULL, all values for that type are returned.
 */
const getProductOptionTypes = async (productId) => {
  const rows = await sql`
    SELECT
      pvota.id,
      pvota.product_id,
      pvota.option_type_id,
      pvota.enabled_value_ids,
      pvota.sort_order,
      vot.name        AS option_type_name,
      vot.display_type,
      -- Return only the enabled values (or all values if enabled_value_ids is NULL)
      COALESCE(
        (
          SELECT json_agg(
            json_build_object('id', vov.id, 'value', vov.value, 'displayValue', vov.display_value, 'sortOrder', vov.sort_order)
            ORDER BY vov.sort_order ASC
          )
          FROM variant_option_values vov
          WHERE vov.option_type_id = pvota.option_type_id
            AND (pvota.enabled_value_ids IS NULL OR vov.id = ANY(pvota.enabled_value_ids))
        ),
        '[]'::json
      ) AS enabled_values
    FROM product_variant_option_type_assignments pvota
    JOIN variant_option_types vot ON vot.id = pvota.option_type_id
    WHERE pvota.product_id = ${productId}
    ORDER BY pvota.sort_order ASC, vot.name ASC
  `;
  return rows;
};

/**
 * Assign an option type to a product, optionally restricting to specific value IDs.
 * enabledValueIds = null → all values of this type are available for this product.
 * enabledValueIds = [uuid, ...] → only those values can be used when creating variants.
 */
const assignOptionTypeToProduct = async (productId, optionTypeId, enabledValueIds = null, sortOrder = 0) => {
  const [row] = await sql`
    INSERT INTO product_variant_option_type_assignments
      (product_id, option_type_id, enabled_value_ids, sort_order)
    VALUES (
      ${productId},
      ${optionTypeId},
      ${enabledValueIds ? sql.array(enabledValueIds, 'uuid') : null},
      ${sortOrder}
    )
    ON CONFLICT (product_id, option_type_id) DO UPDATE SET
      enabled_value_ids = EXCLUDED.enabled_value_ids,
      sort_order        = EXCLUDED.sort_order,
      updated_at        = NOW()
    RETURNING *
  `;
  return row;
};

/**
 * Update which values are enabled for an already-assigned option type on a product.
 * Pass null to re-enable all values.
 */
const updateProductOptionTypeValues = async (productId, optionTypeId, enabledValueIds) => {
  const [row] = await sql`
    UPDATE product_variant_option_type_assignments
    SET enabled_value_ids = ${enabledValueIds ? sql.array(enabledValueIds, 'uuid') : null},
        updated_at = NOW()
    WHERE product_id = ${productId} AND option_type_id = ${optionTypeId}
    RETURNING *
  `;
  return row || null;
};

/**
 * Remove an option type from a product.
 * Blocked if any active variants use values from this option type.
 */
const removeOptionTypeFromProduct = async (productId, optionTypeId) => {
  // Check if any active variants use values from this option type
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM product_variant_option_assignments pvoa
    JOIN product_variants pv ON pv.id = pvoa.variant_id
    JOIN variant_option_values vov ON vov.id = pvoa.option_value_id
    WHERE pv.product_id = ${productId}
      AND pv.deleted_at IS NULL
      AND vov.option_type_id = ${optionTypeId}
  `;
  if (count > 0) {
    throw new Error(`OPTION_TYPE_IN_USE:${count}`);
  }
  await sql`
    DELETE FROM product_variant_option_type_assignments
    WHERE product_id = ${productId} AND option_type_id = ${optionTypeId}
  `;
};

// ─── Variants ─────────────────────────────────────────────────────────────────

const createVariant = async (productId, data) => {
  return withTransaction(async (tx) => {
    const [variant] = await tx`
      INSERT INTO product_variants (
        product_id, sku, price, compare_at_price, cost_price,
        stock_quantity, image_url, image_public_id, weight, is_active
      ) VALUES (
        ${productId},
        ${data.sku || null},
        ${data.price},
        ${data.compareAtPrice || null},
        ${data.costPrice || null},
        ${data.stockQuantity ?? 0},
        ${data.imageUrl || null},
        ${data.imagePublicId || null},
        ${data.weight || null},
        true
      )
      RETURNING *
    `;

    // Assign option values (e.g. Size:M + Color:Black)
    if (data.optionValueIds?.length) {
      const assignments = data.optionValueIds.map((ovId) => ({
        variant_id: variant.id,
        option_value_id: ovId,
      }));
      await tx`INSERT INTO product_variant_option_assignments ${sql(assignments)} ON CONFLICT DO NOTHING`;
    }

    // Write stock movement for initial stock
    if (data.stockQuantity > 0) {
      await tx`
        INSERT INTO stock_movements
          (business_id, product_id, variant_id, movement_type, quantity_change, quantity_before, quantity_after, note)
        SELECT p.business_id, ${productId}, ${variant.id},
          'VARIANT_CREATION', ${data.stockQuantity}, 0, ${data.stockQuantity},
          'Initial stock on variant creation'
        FROM products p WHERE p.id = ${productId}
      `;
    }

    return variant;
  });
};

const findVariantById = async (id, productId) => {
  const [v] = await sql`
    SELECT pv.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', vov.id,
            'value', vov.value,
            'displayValue', vov.display_value,
            'optionTypeId', vot.id,
            'optionTypeName', vot.name,
            'displayType', vot.display_type
          ) ORDER BY vot.sort_order ASC
        ) FILTER (WHERE vov.id IS NOT NULL),
        '[]'
      ) AS option_values
    FROM product_variants pv
    LEFT JOIN product_variant_option_assignments pvoa ON pvoa.variant_id = pv.id
    LEFT JOIN variant_option_values vov ON vov.id = pvoa.option_value_id
    LEFT JOIN variant_option_types vot ON vot.id = vov.option_type_id
    WHERE pv.id = ${id} AND pv.product_id = ${productId} AND pv.deleted_at IS NULL
    GROUP BY pv.id
  `;
  return v ? { ...v, optionValues: v.option_values || [] } : null;
};

const updateVariant = async (id, productId, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [v] = await sql`
    UPDATE product_variants SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id} AND product_id = ${productId} AND deleted_at IS NULL
    RETURNING *
  `;
  return v || null;
};

/**
 * Replace the option value assignments for a variant.
 * Used when the seller wants to change which values a variant represents.
 * Validates that the new combination doesn't already exist on another variant.
 */
const replaceVariantOptionValues = async (variantId, productId, newOptionValueIds) => {
  return withTransaction(async (tx) => {
    // Check the new combination doesn't already exist on a different variant
    const sorted = [...newOptionValueIds].sort();
    const [{ count }] = await tx`
      SELECT COUNT(*)::int AS count
      FROM product_variants pv
      WHERE pv.product_id = ${productId}
        AND pv.id != ${variantId}
        AND pv.deleted_at IS NULL
        AND (
          SELECT array_agg(option_value_id ORDER BY option_value_id)
          FROM product_variant_option_assignments
          WHERE variant_id = pv.id
        ) = ${sorted}::uuid[]
    `;
    if (count > 0) throw new Error('DUPLICATE_VARIANT');

    // Replace assignments
    await tx`DELETE FROM product_variant_option_assignments WHERE variant_id = ${variantId}`;
    if (newOptionValueIds.length) {
      const rows = newOptionValueIds.map((ovId) => ({ variant_id: variantId, option_value_id: ovId }));
      await tx`INSERT INTO product_variant_option_assignments ${sql(rows)} ON CONFLICT DO NOTHING`;
    }
  });
};

const softDeleteVariant = async (id, productId) => {
  await sql`
    UPDATE product_variants SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = ${id} AND product_id = ${productId}
  `;
};

/**
 * Check if a variant combination already exists for this product.
 * Compares the sorted set of option_value_ids.
 */
const variantCombinationExists = async (productId, optionValueIds, excludeVariantId = null) => {
  if (!optionValueIds?.length) return false;
  const sorted = [...optionValueIds].sort();
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count
    FROM product_variants pv
    WHERE pv.product_id = ${productId}
      AND pv.deleted_at IS NULL
      AND (${excludeVariantId || null}::uuid IS NULL OR pv.id != ${excludeVariantId || null}::uuid)
      AND (
        SELECT array_agg(option_value_id ORDER BY option_value_id)
        FROM product_variant_option_assignments
        WHERE variant_id = pv.id
      ) = ${sorted}::uuid[]
  `;
  return count > 0;
};

/**
 * Bulk update stock quantities. Writes stock_movement records for each change.
 */
const bulkUpdateStock = async (businessId, updates) => {
  return withTransaction(async (tx) => {
    for (const { variantId, stockQuantity } of updates) {
      const [current] = await tx`
        SELECT pv.stock_quantity, pv.product_id FROM product_variants pv WHERE pv.id = ${variantId}
      `;
      if (!current) continue;

      const diff = stockQuantity - current.stock_quantity;
      await tx`
        UPDATE product_variants SET stock_quantity = ${stockQuantity}, updated_at = NOW()
        WHERE id = ${variantId}
      `;
      await tx`
        INSERT INTO stock_movements
          (business_id, product_id, variant_id, movement_type, quantity_change, quantity_before, quantity_after, note)
        VALUES (
          ${businessId}, ${current.product_id}, ${variantId},
          ${diff >= 0 ? 'MANUAL_INCREASE' : 'MANUAL_DECREASE'},
          ${diff}, ${current.stock_quantity}, ${stockQuantity},
          'Bulk stock update'
        )
      `;
    }
  });
};

module.exports = {
  // Option type ↔ product assignments
  getProductOptionTypes,
  assignOptionTypeToProduct,
  updateProductOptionTypeValues,
  removeOptionTypeFromProduct,
  // Variants
  createVariant,
  findVariantById,
  updateVariant,
  replaceVariantOptionValues,
  softDeleteVariant,
  variantCombinationExists,
  bulkUpdateStock,
};
