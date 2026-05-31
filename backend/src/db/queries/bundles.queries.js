const { sql } = require('../../config/database');

const createBundle = async (businessId, data) => {
  const [bundle] = await sql`
    INSERT INTO product_bundles (business_id, name, slug, description, price, is_active)
    VALUES (${businessId}, ${data.name}, ${data.slug}, ${data.description || null},
            ${data.price}, ${data.isActive ?? true})
    RETURNING *
  `;
  return bundle;
};

const findBundleById = async (id, businessId) => {
  const [bundle] = await sql`SELECT * FROM product_bundles WHERE id = ${id} AND business_id = ${businessId}`;
  return bundle || null;
};

const findBundleBySlug = async (slug, businessId) => {
  const [bundle] = await sql`SELECT * FROM product_bundles WHERE slug = ${slug} AND business_id = ${businessId}`;
  return bundle || null;
};

const getBundleFull = async (id, businessId) => {
  const bundle = await findBundleById(id, businessId);
  if (!bundle) return null;

  const items = await sql`
    SELECT pbi.*, p.name AS product_name, p.base_price,
      pv.sku AS variant_sku, pv.price AS variant_price,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) AS product_image
    FROM product_bundle_items pbi
    JOIN products p ON p.id = pbi.product_id
    LEFT JOIN product_variants pv ON pv.id = pbi.variant_id
    WHERE pbi.bundle_id = ${id}
  `;

  // Compute individual total vs bundle price
  const individualTotal = items.reduce((sum, item) => {
    const price = Number(item.variant_price || item.base_price || 0);
    return sum + price * item.quantity;
  }, 0);

  return { ...bundle, items, individualTotal, savings: individualTotal - Number(bundle.price) };
};

const listBundles = async (businessId, { page = 1, perPage = 20 }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT pb.*, COUNT(pbi.id)::int AS item_count
    FROM product_bundles pb
    LEFT JOIN product_bundle_items pbi ON pbi.bundle_id = pb.id
    WHERE pb.business_id = ${businessId}
    GROUP BY pb.id
    ORDER BY pb.created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM product_bundles WHERE business_id = ${businessId}`;
  return { rows, total: count };
};

const updateBundle = async (id, businessId, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [bundle] = await sql`
    UPDATE product_bundles SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id} AND business_id = ${businessId}
    RETURNING *
  `;
  return bundle;
};

const deleteBundle = async (id, businessId) => {
  await sql`DELETE FROM product_bundles WHERE id = ${id} AND business_id = ${businessId}`;
};

const setBundleItems = async (bundleId, items) => {
  await sql`DELETE FROM product_bundle_items WHERE bundle_id = ${bundleId}`;
  if (items.length) {
    const rows = items.map((item) => ({
      bundle_id: bundleId,
      product_id: item.productId,
      variant_id: item.variantId || null,
      quantity: item.quantity || 1,
    }));
    await sql`INSERT INTO product_bundle_items ${sql(rows)}`;
  }
};

module.exports = {
  createBundle, findBundleById, findBundleBySlug, getBundleFull,
  listBundles, updateBundle, deleteBundle, setBundleItems,
};
