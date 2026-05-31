const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const builderQueries = require('../../db/queries/builder.queries');
const { findDomainByBusinessId } = require('../../db/queries/businesses.queries');
const { updateBusiness } = require('../../db/queries/businesses.queries');
const schemaService = require('../../services/schema.service');

// ─── Templates ────────────────────────────────────────────────────────────────

// GET /builder/templates
const getTemplates = asyncHandler(async (req, res) => {
  const templates = await builderQueries.listTemplates();
  res.json({ success: true, data: templates });
});

// POST /builder/apply-template
// Body: { templateId, confirm?: false }
// If a theme already exists and confirm !== true → 409 EXISTING_THEME
const applyTemplate = asyncHandler(async (req, res) => {
  const businessId = req.businessId;
  const { templateId, confirm = false } = req.body;

  const template = await builderQueries.findTemplateById(templateId);
  if (!template) throw new AppError('Template not found.', 404, 'NOT_FOUND');

  // Check if a theme already exists
  const existingTheme = await builderQueries.findThemeByBusinessId(businessId);
  if (existingTheme && !confirm) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'EXISTING_THEME',
        message: 'Applying this template will replace your current design.',
        requiresConfirm: true,
      },
    });
  }

  // Load template page defaults
  const pageDefaults = await builderQueries.getTemplatePageDefaults(templateId);

  // Upsert theme record
  await builderQueries.upsertTheme(businessId, templateId);

  // Apply each page default — deep copy with new IDs so each store has unique section IDs
  for (const pd of pageDefaults) {
    const freshSchema = schemaService.deepCopyWithNewIds(pd.schema);
    await builderQueries.upsertPage(businessId, pd.page_type, { schema: freshSchema });
  }

  // Ensure HOME page exists even if template has no HOME default
  const homePage = await builderQueries.findPageByType(businessId, 'HOME');
  if (!homePage) {
    await builderQueries.upsertPage(businessId, 'HOME', { schema: { sections: [] } });
  }

  const pages = await builderQueries.listPages(businessId);
  res.json({ success: true, data: { template, pages } });
});

// ─── Pages ────────────────────────────────────────────────────────────────────

// GET /builder/pages
const getPages = asyncHandler(async (req, res) => {
  const pages = await builderQueries.listPages(req.businessId);
  res.json({ success: true, data: pages });
});

// GET /builder/pages/:pageType
const getPage = asyncHandler(async (req, res) => {
  const page = await builderQueries.findPageByType(req.businessId, req.params.pageType.toUpperCase());
  if (!page) throw new AppError('Page not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: page });
});

// PUT /builder/pages/:pageType/schema
// Body: { schema }
const updatePageSchema = asyncHandler(async (req, res) => {
  const pageType = req.params.pageType.toUpperCase();
  const page = await builderQueries.updatePageSchema(req.businessId, pageType, req.body.schema);
  if (!page) throw new AppError('Page not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: page });
});

// PUT /builder/pages/:pageType/seo
// Body: { title?, seoTitle?, seoDescription? }
const updatePageSeo = asyncHandler(async (req, res) => {
  const pageType = req.params.pageType.toUpperCase();
  const page = await builderQueries.updatePageSeo(req.businessId, pageType, req.body);
  if (!page) throw new AppError('Page not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: page });
});

// POST /builder/pages/custom
// Body: { title, slug, seoTitle?, seoDescription? }
const createCustomPage = asyncHandler(async (req, res) => {
  const { title, slug, seoTitle, seoDescription } = req.body;

  // Check slug uniqueness
  const existing = await builderQueries.findPageBySlug(req.businessId, slug);
  if (existing) throw new AppError('A page with this slug already exists.', 409, 'SLUG_TAKEN');

  const page = await builderQueries.createCustomPage(req.businessId, { title, slug, seoTitle, seoDescription });
  res.status(201).json({ success: true, data: page });
});

// ─── Sections ─────────────────────────────────────────────────────────────────

// POST /builder/pages/:pageType/sections
// Body: { sectionType, afterSectionId?, config? }
const addSection = asyncHandler(async (req, res) => {
  const pageType = req.params.pageType.toUpperCase();
  const page = await builderQueries.findPageByType(req.businessId, pageType);
  if (!page) throw new AppError('Page not found.', 404, 'NOT_FOUND');

  const { sectionType, afterSectionId = null, config = {} } = req.body;
  const newSchema = schemaService.addSection(page.schema, sectionType, afterSectionId, config);
  const updated = await builderQueries.updatePageSchema(req.businessId, pageType, newSchema);
  res.json({ success: true, data: updated });
});

// PUT /builder/pages/:pageType/sections/:sectionId
// Body: { config }
const updateSection = asyncHandler(async (req, res) => {
  const pageType = req.params.pageType.toUpperCase();
  const page = await builderQueries.findPageByType(req.businessId, pageType);
  if (!page) throw new AppError('Page not found.', 404, 'NOT_FOUND');

  const newSchema = schemaService.updateSection(page.schema, req.params.sectionId, req.body.config || {});
  const updated = await builderQueries.updatePageSchema(req.businessId, pageType, newSchema);
  res.json({ success: true, data: updated });
});

// DELETE /builder/pages/:pageType/sections/:sectionId
const deleteSection = asyncHandler(async (req, res) => {
  const pageType = req.params.pageType.toUpperCase();
  const page = await builderQueries.findPageByType(req.businessId, pageType);
  if (!page) throw new AppError('Page not found.', 404, 'NOT_FOUND');

  const newSchema = schemaService.deleteSection(page.schema, req.params.sectionId);
  const updated = await builderQueries.updatePageSchema(req.businessId, pageType, newSchema);
  res.json({ success: true, data: updated });
});

// PUT /builder/pages/:pageType/sections/reorder
// Body: { sectionIds: string[] }
const reorderSections = asyncHandler(async (req, res) => {
  const pageType = req.params.pageType.toUpperCase();
  const page = await builderQueries.findPageByType(req.businessId, pageType);
  if (!page) throw new AppError('Page not found.', 404, 'NOT_FOUND');

  const newSchema = schemaService.reorderSections(page.schema, req.body.sectionIds);
  const updated = await builderQueries.updatePageSchema(req.businessId, pageType, newSchema);
  res.json({ success: true, data: updated });
});

// ─── Components ───────────────────────────────────────────────────────────────

// POST /builder/pages/:pageType/sections/:sectionId/components
// Body: { componentType, afterComponentId?, config? }
const addComponent = asyncHandler(async (req, res) => {
  const pageType = req.params.pageType.toUpperCase();
  const page = await builderQueries.findPageByType(req.businessId, pageType);
  if (!page) throw new AppError('Page not found.', 404, 'NOT_FOUND');

  const { componentType, afterComponentId = null, config = {} } = req.body;
  const newSchema = schemaService.addComponent(page.schema, req.params.sectionId, componentType, afterComponentId, config);
  const updated = await builderQueries.updatePageSchema(req.businessId, pageType, newSchema);
  res.json({ success: true, data: updated });
});

// PUT /builder/pages/:pageType/sections/:sectionId/components/:componentId
// Body: { config }
const updateComponent = asyncHandler(async (req, res) => {
  const pageType = req.params.pageType.toUpperCase();
  const page = await builderQueries.findPageByType(req.businessId, pageType);
  if (!page) throw new AppError('Page not found.', 404, 'NOT_FOUND');

  const newSchema = schemaService.updateComponent(page.schema, req.params.sectionId, req.params.componentId, req.body.config || {});
  const updated = await builderQueries.updatePageSchema(req.businessId, pageType, newSchema);
  res.json({ success: true, data: updated });
});

// DELETE /builder/pages/:pageType/sections/:sectionId/components/:componentId
const deleteComponent = asyncHandler(async (req, res) => {
  const pageType = req.params.pageType.toUpperCase();
  const page = await builderQueries.findPageByType(req.businessId, pageType);
  if (!page) throw new AppError('Page not found.', 404, 'NOT_FOUND');

  const newSchema = schemaService.deleteComponent(page.schema, req.params.sectionId, req.params.componentId);
  const updated = await builderQueries.updatePageSchema(req.businessId, pageType, newSchema);
  res.json({ success: true, data: updated });
});

// ─── Child Components (nested in containers) ─────────────────────────────────

// POST /builder/pages/:pageType/sections/:sectionId/components/:componentId/children
// Body: { childType, afterChildId?, config? }
const addChild = asyncHandler(async (req, res) => {
  const pageType = req.params.pageType.toUpperCase();
  const page = await builderQueries.findPageByType(req.businessId, pageType);
  if (!page) throw new AppError('Page not found.', 404, 'NOT_FOUND');

  const { childType, afterChildId = null, config = {} } = req.body;
  const newSchema = schemaService.addChild(
    page.schema,
    req.params.sectionId,
    req.params.componentId,
    childType,
    afterChildId,
    config
  );
  const updated = await builderQueries.updatePageSchema(req.businessId, pageType, newSchema);
  res.json({ success: true, data: updated });
});

// PUT /builder/pages/:pageType/sections/:sectionId/components/:componentId/children/:childId
// Body: { config }
const updateChild = asyncHandler(async (req, res) => {
  const pageType = req.params.pageType.toUpperCase();
  const page = await builderQueries.findPageByType(req.businessId, pageType);
  if (!page) throw new AppError('Page not found.', 404, 'NOT_FOUND');

  const newSchema = schemaService.updateChild(
    page.schema,
    req.params.sectionId,
    req.params.componentId,
    req.params.childId,
    req.body.config || {}
  );
  const updated = await builderQueries.updatePageSchema(req.businessId, pageType, newSchema);
  res.json({ success: true, data: updated });
});

// DELETE /builder/pages/:pageType/sections/:sectionId/components/:componentId/children/:childId
const deleteChild = asyncHandler(async (req, res) => {
  const pageType = req.params.pageType.toUpperCase();
  const page = await builderQueries.findPageByType(req.businessId, pageType);
  if (!page) throw new AppError('Page not found.', 404, 'NOT_FOUND');

  const newSchema = schemaService.deleteChild(
    page.schema,
    req.params.sectionId,
    req.params.componentId,
    req.params.childId
  );
  const updated = await builderQueries.updatePageSchema(req.businessId, pageType, newSchema);
  res.json({ success: true, data: updated });
});

// PUT /builder/pages/:pageType/sections/:sectionId/components/:componentId/children/reorder
// Body: { childIds: string[] }
const reorderChildren = asyncHandler(async (req, res) => {
  const pageType = req.params.pageType.toUpperCase();
  const page = await builderQueries.findPageByType(req.businessId, pageType);
  if (!page) throw new AppError('Page not found.', 404, 'NOT_FOUND');

  const newSchema = schemaService.reorderChildren(
    page.schema,
    req.params.sectionId,
    req.params.componentId,
    req.body.childIds
  );
  const updated = await builderQueries.updatePageSchema(req.businessId, pageType, newSchema);
  res.json({ success: true, data: updated });
});

// ─── Publish / Unpublish ──────────────────────────────────────────────────────

// POST /builder/publish
const publishStore = asyncHandler(async (req, res) => {
  const businessId = req.businessId;

  // Must have a domain
  const domain = await findDomainByBusinessId(businessId);
  if (!domain || domain.status !== 'ACTIVE') {
    throw new AppError('Connect and verify a domain before publishing.', 400, 'NO_DOMAIN');
  }

  // Home page must have at least one section
  const homePage = await builderQueries.findPageByType(businessId, 'HOME');
  if (!homePage || !homePage.schema?.sections?.length) {
    throw new AppError('Add at least one section to your home page before publishing.', 400, 'EMPTY_HOME_PAGE');
  }

  // Mark business as published
  await updateBusiness(businessId, { is_published: true, published_at: new Date() });

  // Publish the home page
  await builderQueries.publishPage(businessId, 'HOME');

  res.json({
    success: true,
    data: {
      message: 'Your store is now live.',
      storeUrl: domain.full_domain,
    },
  });
});

// POST /builder/unpublish
const unpublishStore = asyncHandler(async (req, res) => {
  await updateBusiness(req.businessId, { is_published: false });
  res.json({ success: true, data: { message: 'Store unpublished.' } });
});

module.exports = {
  getTemplates,
  applyTemplate,
  getPages,
  getPage,
  updatePageSchema,
  updatePageSeo,
  createCustomPage,
  addSection,
  updateSection,
  deleteSection,
  reorderSections,
  addComponent,
  updateComponent,
  deleteComponent,
  addChild,
  updateChild,
  deleteChild,
  reorderChildren,
  publishStore,
  unpublishStore,
};
