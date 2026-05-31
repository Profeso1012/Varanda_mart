const { sql } = require('../../config/database');

const createCategory = async (businessId, { name, slug, parentId, description, sortOrder }) => {
  const [cat] = await sql`
    INSERT INTO categories (business_id, name, slug, parent_id, description, sort_order)
    VALUES (${businessId}, ${name}, ${slug}, ${parentId || null}, ${description || null}, ${sortOrder ?? 0})
    RETURNING *
  `;
  return cat;
};

const findCategoryById = async (id, businessId) => {
  const [cat] = await sql`
    SELECT * FROM categories WHERE id = ${id} AND business_id = ${businessId}
  `;
  return cat || null;
};

const findCategoryBySlug = async (slug, businessId) => {
  const [cat] = await sql`SELECT * FROM categories WHERE slug = ${slug} AND business_id = ${businessId}`;
  return cat || null;
};

const listCategories = async (businessId, includeInactive = false) => {
  return sql`
    SELECT * FROM categories
    WHERE business_id = ${businessId}
      AND (${includeInactive} OR is_active = true)
    ORDER BY sort_order ASC, name ASC
  `;
};

const updateCategory = async (id, businessId, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [cat] = await sql`
    UPDATE categories SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id} AND business_id = ${businessId}
    RETURNING *
  `;
  return cat;
};

const deleteCategory = async (id, businessId) => {
  await sql`DELETE FROM categories WHERE id = ${id} AND business_id = ${businessId}`;
};

const getCategoryProductCount = async (id, businessId) => {
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM products
    WHERE category_id = ${id} AND business_id = ${businessId} AND deleted_at IS NULL
  `;
  return count;
};

const reassignCategoryProducts = async (fromCategoryId, toCategoryId, businessId) => {
  await sql`
    UPDATE products SET category_id = ${toCategoryId || null}, updated_at = NOW()
    WHERE category_id = ${fromCategoryId} AND business_id = ${businessId}
  `;
};

/**
 * Returns the depth of the given category (0 = root, 1 = child of root).
 * We allow max depth of 1 (root + one level of children).
 * So if the parent is already a child (depth=1), we block creation.
 */
const getCategoryDepth = async (parentId, businessId) => {
  if (!parentId) return 0;
  const [parent] = await sql`SELECT parent_id FROM categories WHERE id = ${parentId} AND business_id = ${businessId}`;
  if (!parent) return 0;
  // If the parent itself has a parent, it's at depth 1 — adding a child would make depth 2 (blocked)
  return parent.parent_id ? 1 : 0;
};

module.exports = {
  createCategory, findCategoryById, findCategoryBySlug, listCategories,
  updateCategory, deleteCategory, getCategoryProductCount,
  reassignCategoryProducts, getCategoryDepth,
};
