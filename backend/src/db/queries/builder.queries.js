const { sql } = require('../../config/database');

// ─── Templates ────────────────────────────────────────────────────────────────

const listTemplates = async () => {
  return sql`SELECT * FROM templates WHERE is_active = true ORDER BY sort_order ASC`;
};

const findTemplateById = async (id) => {
  const [t] = await sql`SELECT * FROM templates WHERE id = ${id} AND is_active = true`;
  return t || null;
};

const getTemplatePageDefaults = async (templateId) => {
  return sql`SELECT * FROM template_page_defaults WHERE template_id = ${templateId}`;
};

// ─── Store Theme ──────────────────────────────────────────────────────────────

const findThemeByBusinessId = async (businessId) => {
  const [t] = await sql`SELECT * FROM store_themes WHERE business_id = ${businessId}`;
  return t || null;
};

const upsertTheme = async (businessId, templateId) => {
  const [t] = await sql`
    INSERT INTO store_themes (business_id, template_id, applied_at)
    VALUES (${businessId}, ${templateId}, NOW())
    ON CONFLICT (business_id) DO UPDATE
      SET template_id = ${templateId}, applied_at = NOW(), updated_at = NOW()
    RETURNING *
  `;
  return t;
};

// ─── Store Pages ──────────────────────────────────────────────────────────────

const listPages = async (businessId) => {
  return sql`
    SELECT id, business_id, page_type, slug, title, seo_title, seo_description,
           is_published, published_at, created_at, updated_at
    FROM store_pages
    WHERE business_id = ${businessId}
    ORDER BY created_at ASC
  `;
};

const findPageByType = async (businessId, pageType) => {
  const [p] = await sql`
    SELECT * FROM store_pages
    WHERE business_id = ${businessId} AND page_type = ${pageType}
  `;
  return p || null;
};

const findPageBySlug = async (businessId, slug) => {
  const [p] = await sql`
    SELECT * FROM store_pages
    WHERE business_id = ${businessId} AND slug = ${slug}
  `;
  return p || null;
};

const findPublishedPageBySlug = async (businessId, slug) => {
  const [p] = await sql`
    SELECT * FROM store_pages
    WHERE business_id = ${businessId} AND slug = ${slug} AND is_published = true
  `;
  return p || null;
};

const upsertPage = async (businessId, pageType, data) => {
  const [p] = await sql`
    INSERT INTO store_pages (business_id, page_type, slug, title, seo_title, seo_description, schema)
    VALUES (
      ${businessId}, ${pageType},
      ${data.slug || null}, ${data.title || null},
      ${data.seoTitle || null}, ${data.seoDescription || null},
      ${sql.json(data.schema || { sections: [] })}
    )
    ON CONFLICT (business_id, page_type) DO UPDATE
      SET slug = COALESCE(EXCLUDED.slug, store_pages.slug),
          title = COALESCE(EXCLUDED.title, store_pages.title),
          seo_title = COALESCE(EXCLUDED.seo_title, store_pages.seo_title),
          seo_description = COALESCE(EXCLUDED.seo_description, store_pages.seo_description),
          schema = EXCLUDED.schema,
          updated_at = NOW()
    RETURNING *
  `;
  return p;
};

const createCustomPage = async (businessId, data) => {
  const [p] = await sql`
    INSERT INTO store_pages (business_id, page_type, slug, title, seo_title, seo_description, schema)
    VALUES (
      ${businessId}, 'CUSTOM',
      ${data.slug}, ${data.title},
      ${data.seoTitle || null}, ${data.seoDescription || null},
      ${sql.json({ sections: [] })}
    )
    RETURNING *
  `;
  return p;
};

const updatePageSchema = async (businessId, pageType, schema) => {
  const [p] = await sql`
    UPDATE store_pages
    SET schema = ${sql.json(schema)}, updated_at = NOW()
    WHERE business_id = ${businessId} AND page_type = ${pageType}
    RETURNING *
  `;
  return p || null;
};

const updatePageSeo = async (businessId, pageType, data) => {
  const [p] = await sql`
    UPDATE store_pages
    SET seo_title = ${data.seoTitle || null},
        seo_description = ${data.seoDescription || null},
        title = COALESCE(${data.title || null}, title),
        updated_at = NOW()
    WHERE business_id = ${businessId} AND page_type = ${pageType}
    RETURNING *
  `;
  return p || null;
};

const publishPage = async (businessId, pageType) => {
  const [p] = await sql`
    UPDATE store_pages
    SET is_published = true, published_at = NOW(), updated_at = NOW()
    WHERE business_id = ${businessId} AND page_type = ${pageType}
    RETURNING *
  `;
  return p || null;
};

const unpublishPage = async (businessId, pageType) => {
  const [p] = await sql`
    UPDATE store_pages
    SET is_published = false, updated_at = NOW()
    WHERE business_id = ${businessId} AND page_type = ${pageType}
    RETURNING *
  `;
  return p || null;
};

const deleteCustomPage = async (businessId, slug) => {
  await sql`
    DELETE FROM store_pages
    WHERE business_id = ${businessId} AND slug = ${slug} AND page_type = 'CUSTOM'
  `;
};

module.exports = {
  listTemplates,
  findTemplateById,
  getTemplatePageDefaults,
  findThemeByBusinessId,
  upsertTheme,
  listPages,
  findPageByType,
  findPageBySlug,
  findPublishedPageBySlug,
  upsertPage,
  createCustomPage,
  updatePageSchema,
  updatePageSeo,
  publishPage,
  unpublishPage,
  deleteCustomPage,
};
