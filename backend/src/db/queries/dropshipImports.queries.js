const { sql } = require('../../config/database');

const createDropshipImport = async (businessId, data) => {
  const [imp] = await sql`
    INSERT INTO dropship_imports
      (business_id, supplier_product_id, store_product_id, retail_price, compare_at_price,
       seller_margin, custom_title, custom_description)
    VALUES (${businessId}, ${data.supplierProductId}, ${data.storeProductId || null},
            ${data.retailPrice}, ${data.compareAtPrice || null}, ${data.sellerMargin},
            ${data.customTitle || null}, ${data.customDescription || null})
    RETURNING *
  `;
  return imp;
};

const findDropshipImport = async (businessId, supplierProductId) => {
  const [imp] = await sql`
    SELECT * FROM dropship_imports
    WHERE business_id = ${businessId} AND supplier_product_id = ${supplierProductId}
  `;
  return imp || null;
};

const findDropshipImportById = async (id, businessId) => {
  const [imp] = await sql`
    SELECT * FROM dropship_imports WHERE id = ${id} AND business_id = ${businessId}
  `;
  return imp || null;
};

const getDropshipImportsByBusiness = async (businessId, { status, page = 1, perPage = 20 }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT di.*, sp.name AS supplier_product_name, sp.status AS supplier_product_status
    FROM dropship_imports di
    JOIN supplier_products sp ON sp.id = di.supplier_product_id
    WHERE di.business_id = ${businessId}
      AND (${status || null}::text IS NULL OR di.is_active = (${status} = 'active'))
    ORDER BY di.created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM dropship_imports WHERE business_id = ${businessId}
  `;
  return { rows, total: count };
};

const updateDropshipImport = async (id, businessId, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [imp] = await sql`
    UPDATE dropship_imports SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id} AND business_id = ${businessId}
    RETURNING *
  `;
  return imp;
};

const softDeleteDropshipImport = async (id, businessId) => {
  await sql`
    UPDATE dropship_imports SET is_active = false, updated_at = NOW()
    WHERE id = ${id} AND business_id = ${businessId}
  `;
};

const getImportCountByBusiness = async (businessId) => {
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM dropship_imports
    WHERE business_id = ${businessId} AND is_active = true
  `;
  return count;
};

const createImportVariantMappings = async (importId, mappings) => {
  if (!mappings.length) return;
  const values = mappings.map((m) => ({
    dropship_import_id: importId,
    supplier_variant_id: m.supplierVariantId,
    store_variant_id: m.storeVariantId || null,
    retail_price: m.retailPrice,
  }));
  await sql`INSERT INTO dropship_import_variant_mappings ${sql(values)}`;
};

const getVariantMappingsByImport = async (importId) => {
  return sql`SELECT * FROM dropship_import_variant_mappings WHERE dropship_import_id = ${importId}`;
};

const hasPendingOrders = async (importId) => {
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM order_items
    WHERE dropship_import_id = ${importId}
  `;
  return count > 0;
};

module.exports = {
  createDropshipImport,
  findDropshipImport,
  findDropshipImportById,
  getDropshipImportsByBusiness,
  updateDropshipImport,
  softDeleteDropshipImport,
  getImportCountByBusiness,
  createImportVariantMappings,
  getVariantMappingsByImport,
  hasPendingOrders,
};
