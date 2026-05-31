const { sql } = require('../../config/database');

// ─── Product tags ─────────────────────────────────────────────────────────────

const createTag = async (businessId, name, slug) => {
  const [tag] = await sql`
    INSERT INTO product_tags (business_id, name, slug)
    VALUES (${businessId}, ${name}, ${slug})
    RETURNING *
  `;
  return tag;
};

const listTags = async (businessId) => {
  return sql`SELECT * FROM product_tags WHERE business_id = ${businessId} ORDER BY name ASC`;
};

const findTagBySlug = async (slug, businessId) => {
  const [tag] = await sql`SELECT * FROM product_tags WHERE slug = ${slug} AND business_id = ${businessId}`;
  return tag || null;
};

const deleteTag = async (id, businessId) => {
  await sql`DELETE FROM product_tags WHERE id = ${id} AND business_id = ${businessId}`;
};

// ─── Variant option types ─────────────────────────────────────────────────────

const createOptionType = async (businessId, { name, displayType, sortOrder }) => {
  const [ot] = await sql`
    INSERT INTO variant_option_types (business_id, name, display_type, sort_order)
    VALUES (${businessId}, ${name}, ${displayType || 'TEXT'}, ${sortOrder ?? 0})
    RETURNING *
  `;
  return ot;
};

const listOptionTypes = async (businessId) => {
  const types = await sql`
    SELECT vot.*, json_agg(
      json_build_object('id', vov.id, 'value', vov.value, 'displayValue', vov.display_value, 'sortOrder', vov.sort_order)
      ORDER BY vov.sort_order ASC
    ) FILTER (WHERE vov.id IS NOT NULL) AS values
    FROM variant_option_types vot
    LEFT JOIN variant_option_values vov ON vov.option_type_id = vot.id
    WHERE vot.business_id = ${businessId}
    GROUP BY vot.id
    ORDER BY vot.sort_order ASC, vot.name ASC
  `;
  return types.map((t) => ({ ...t, values: t.values || [] }));
};

const findOptionTypeById = async (id, businessId) => {
  const [ot] = await sql`SELECT * FROM variant_option_types WHERE id = ${id} AND business_id = ${businessId}`;
  return ot || null;
};

const createOptionValue = async (optionTypeId, { value, displayValue, sortOrder }) => {
  const [ov] = await sql`
    INSERT INTO variant_option_values (option_type_id, value, display_value, sort_order)
    VALUES (${optionTypeId}, ${value}, ${displayValue || null}, ${sortOrder ?? 0})
    RETURNING *
  `;
  return ov;
};

const deleteOptionValue = async (id, optionTypeId) => {
  await sql`DELETE FROM variant_option_values WHERE id = ${id} AND option_type_id = ${optionTypeId}`;
};

const isOptionValueInUse = async (id) => {
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM product_variant_option_assignments WHERE option_value_id = ${id}
  `;
  return count > 0;
};

// ─── Products ─────────────────────────────────────────────────────────────────

const createProduct = async (businessId, data) => {
  const [product] = await sql`
    INSERT INTO products (
      business_id, category_id, name, slug, description, short_description,
      base_price, compare_at_price, cost_price, currency, product_type,
      is_variable, track_inventory, status, is_featured, weight,
      seo_title, seo_description, sort_order
    ) VALUES (
      ${businessId}, ${data.categoryId || null}, ${data.name}, ${data.slug},
      ${data.description || null}, ${data.shortDescription || null},
      ${data.basePrice ?? 0}, ${data.compareAtPrice || null}, ${data.costPrice || null},
      ${data.currency || 'NGN'}, ${data.productType || 'OWN'},
      ${data.isVariable ?? false}, ${data.trackInventory ?? true},
      ${data.status || 'DRAFT'}, ${data.isFeatured ?? false}, ${data.weight || null},
      ${data.seoTitle || null}, ${data.seoDescription || null}, ${data.sortOrder ?? 0}
    )
    RETURNING *
  `;
  return product;
};

const findProductById = async (id, businessId) => {
  const [product] = await sql`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = ${id} AND p.business_id = ${businessId} AND p.deleted_at IS NULL
  `;
  return product || null;
};

const findProductBySlug = async (slug, businessId) => {
  const [product] = await sql`
    SELECT * FROM products WHERE slug = ${slug} AND business_id = ${businessId} AND deleted_at IS NULL
  `;
  return product || null;
};

const getProductFull = async (id, businessId) => {
  const product = await findProductById(id, businessId);
  if (!product) return null;

  const images = await sql`SELECT * FROM product_images WHERE product_id = ${id} ORDER BY sort_order ASC`;

  // Variants with their option value assignments
  const variants = await sql`
    SELECT pv.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', vov.id, 'value', vov.value, 'displayValue', vov.display_value,
            'optionTypeId', vot.id, 'optionTypeName', vot.name, 'displayType', vot.display_type
          ) ORDER BY vot.sort_order ASC
        ) FILTER (WHERE vov.id IS NOT NULL),
        '[]'
      ) AS option_values
    FROM product_variants pv
    LEFT JOIN product_variant_option_assignments pvoa ON pvoa.variant_id = pv.id
    LEFT JOIN variant_option_values vov ON vov.id = pvoa.option_value_id
    LEFT JOIN variant_option_types vot ON vot.id = vov.option_type_id
    WHERE pv.product_id = ${id} AND pv.deleted_at IS NULL
    GROUP BY pv.id
    ORDER BY pv.created_at ASC
  `;

  // Which option types this product uses, and which values are enabled per type
  const optionTypeAssignments = await sql`
    SELECT
      pvota.id,
      pvota.option_type_id,
      pvota.enabled_value_ids,
      pvota.sort_order,
      vot.name        AS option_type_name,
      vot.display_type,
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
    WHERE pvota.product_id = ${id}
    ORDER BY pvota.sort_order ASC
  `;

  const tags = await sql`
    SELECT pt.* FROM product_tags pt
    JOIN product_tag_assignments pta ON pta.tag_id = pt.id
    WHERE pta.product_id = ${id}
  `;

  return {
    ...product,
    images,
    variants: variants.map((v) => ({ ...v, optionValues: v.option_values || [] })),
    optionTypeAssignments,
    tags,
  };
};

const listProducts = async (businessId, { status, categoryId, tagId, search, productType, page = 1, perPage = 20 }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT DISTINCT p.*, c.name AS category_name,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) AS main_image_url,
      CASE
        WHEN p.is_variable THEN (SELECT MIN(price) FROM product_variants WHERE product_id = p.id AND deleted_at IS NULL)
        ELSE p.base_price
      END AS display_price,
      CASE
        WHEN p.track_inventory AND NOT p.is_variable THEN p.base_price  -- non-variant stock tracked differently
        WHEN p.is_variable THEN COALESCE((SELECT SUM(stock_quantity) FROM product_variants WHERE product_id = p.id AND deleted_at IS NULL), 0)
        ELSE NULL
      END AS total_stock
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    LEFT JOIN product_tag_assignments pta ON pta.product_id = p.id
    WHERE p.business_id = ${businessId}
      AND p.deleted_at IS NULL
      AND (${status || null}::text IS NULL OR p.status = ${status || null}::product_status)
      AND (${categoryId || null}::uuid IS NULL OR p.category_id = ${categoryId || null}::uuid)
      AND (${tagId || null}::uuid IS NULL OR pta.tag_id = ${tagId || null}::uuid)
      AND (${productType || null}::text IS NULL OR p.product_type = ${productType || null})
      AND (${search || null}::text IS NULL OR p.name ILIKE ${'%' + (search || '') + '%'})
    ORDER BY p.sort_order ASC, p.created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(DISTINCT p.id)::int AS count FROM products p
    LEFT JOIN product_tag_assignments pta ON pta.product_id = p.id
    WHERE p.business_id = ${businessId} AND p.deleted_at IS NULL
      AND (${status || null}::text IS NULL OR p.status = ${status || null}::product_status)
      AND (${categoryId || null}::uuid IS NULL OR p.category_id = ${categoryId || null}::uuid)
      AND (${tagId || null}::uuid IS NULL OR pta.tag_id = ${tagId || null}::uuid)
      AND (${productType || null}::text IS NULL OR p.product_type = ${productType || null})
      AND (${search || null}::text IS NULL OR p.name ILIKE ${'%' + (search || '') + '%'})
  `;
  return { rows, total: count };
};

const updateProduct = async (id, businessId, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [product] = await sql`
    UPDATE products SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id} AND business_id = ${businessId} AND deleted_at IS NULL
    RETURNING *
  `;
  return product;
};

const softDeleteProduct = async (id, businessId) => {
  // Remove from any bundles first — product_bundle_items has ON DELETE RESTRICT
  await sql`DELETE FROM product_bundle_items WHERE product_id = ${id}`;
  await sql`
    UPDATE products SET deleted_at = NOW(), updated_at = NOW()
    WHERE id = ${id} AND business_id = ${businessId}
  `;
};

const countProducts = async (businessId) => {
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM products
    WHERE business_id = ${businessId} AND deleted_at IS NULL AND product_type = 'OWN'
  `;
  return count;
};

// ─── Product images ───────────────────────────────────────────────────────────

const addProductImage = async (productId, { url, publicId, altText, isMain, sortOrder }) => {
  // If this is main, unset others first
  if (isMain) {
    await sql`UPDATE product_images SET is_main = false WHERE product_id = ${productId}`;
  }
  const [img] = await sql`
    INSERT INTO product_images (product_id, url, public_id, alt_text, is_main, sort_order)
    VALUES (${productId}, ${url}, ${publicId}, ${altText || null}, ${isMain ?? false}, ${sortOrder ?? 0})
    RETURNING *
  `;
  return img;
};

const setMainImage = async (imageId, productId) => {
  await sql`UPDATE product_images SET is_main = false WHERE product_id = ${productId}`;
  const [img] = await sql`
    UPDATE product_images SET is_main = true WHERE id = ${imageId} AND product_id = ${productId} RETURNING *
  `;
  return img;
};

const reorderImages = async (productId, updates) => {
  for (const { id, sortOrder } of updates) {
    await sql`UPDATE product_images SET sort_order = ${sortOrder} WHERE id = ${id} AND product_id = ${productId}`;
  }
};

const deleteProductImage = async (id, productId) => {
  const [img] = await sql`SELECT * FROM product_images WHERE id = ${id} AND product_id = ${productId}`;
  if (!img) return null;
  await sql`DELETE FROM product_images WHERE id = ${id}`;
  // If deleted image was main, promote the first remaining image
  if (img.is_main) {
    await sql`
      UPDATE product_images SET is_main = true
      WHERE product_id = ${productId}
      ORDER BY sort_order ASC LIMIT 1
    `;
  }
  return img;
};

// ─── Tag assignments ──────────────────────────────────────────────────────────

const setProductTags = async (productId, tagIds) => {
  await sql`DELETE FROM product_tag_assignments WHERE product_id = ${productId}`;
  if (tagIds.length) {
    const rows = tagIds.map((tagId) => ({ product_id: productId, tag_id: tagId }));
    await sql`INSERT INTO product_tag_assignments ${sql(rows)} ON CONFLICT DO NOTHING`;
  }
};

// ─── Duplicate product ────────────────────────────────────────────────────────

const duplicateProduct = async (id, businessId, newSlug) => {
  const [product] = await sql`
    INSERT INTO products (
      business_id, category_id, name, slug, description, short_description,
      base_price, compare_at_price, cost_price, currency, product_type,
      is_variable, track_inventory, status, is_featured, weight, seo_title, seo_description
    )
    SELECT business_id, category_id, name || ' (Copy)', ${newSlug}, description, short_description,
      base_price, compare_at_price, cost_price, currency, product_type,
      is_variable, track_inventory, 'DRAFT', is_featured, weight, seo_title, seo_description
    FROM products WHERE id = ${id} AND business_id = ${businessId}
    RETURNING *
  `;
  return product;
};

module.exports = {
  createTag, listTags, findTagBySlug, deleteTag,
  createOptionType, listOptionTypes, findOptionTypeById,
  createOptionValue, deleteOptionValue, isOptionValueInUse,
  createProduct, findProductById, findProductBySlug, getProductFull,
  listProducts, updateProduct, softDeleteProduct, countProducts,
  addProductImage, setMainImage, reorderImages, deleteProductImage,
  setProductTags, duplicateProduct,
};
