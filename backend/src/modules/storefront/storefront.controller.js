const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const builderQueries = require('../../db/queries/builder.queries');
const { getBrandSettings, listSocialLinks, findDomainByBusinessId } = require('../../db/queries/businesses.queries');
const { listCategories } = require('../../db/queries/categories.queries');
const { listProducts, findProductBySlug, getProductFull } = require('../../db/queries/products.queries');

// ─── Bootstrap ────────────────────────────────────────────────────────────────

/**
 * GET /storefront
 * Returns everything the storefront needs to render: business info, brand settings,
 * home page schema, social links, domain. Tenant is resolved by resolveTenant middleware.
 */
const bootstrap = asyncHandler(async (req, res) => {
  const business = req.tenantBusiness;

  const [brandSettings, homePage, socialLinks, domain, theme] = await Promise.all([
    getBrandSettings(business.id),
    builderQueries.findPageByType(business.id, 'HOME'),
    listSocialLinks(business.id),
    findDomainByBusinessId(business.id),
    builderQueries.findThemeByBusinessId(business.id),
  ]);

  res.json({
    success: true,
    data: {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        tagline: business.tagline,
        description: business.description,
        currency: business.currency,
        timezone: business.timezone,
        logoUrl: business.logo_url || null,
        faviconUrl: business.favicon_url || null,
        googleAnalyticsId: business.google_analytics_id || null,
        facebookPixelId: business.facebook_pixel_id || null,
      },
      brandSettings: brandSettings || null,
      theme: theme ? { templateId: theme.template_id, appliedAt: theme.applied_at } : null,
      homePage: homePage || null,
      socialLinks,
      domain: domain ? { fullDomain: domain.full_domain, type: domain.type } : null,
    },
  });
});

/**
 * GET /storefront/settings
 * Alias for the brand/theme settings portion of bootstrap.
 * Some frontend implementations call this separately to get theme data
 * without re-fetching the full bootstrap payload.
 */
const getSettings = asyncHandler(async (req, res) => {
  const business = req.tenantBusiness;

  const [brandSettings, theme, domain] = await Promise.all([
    getBrandSettings(business.id),
    builderQueries.findThemeByBusinessId(business.id),
    findDomainByBusinessId(business.id),
  ]);

  res.json({
    success: true,
    data: {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        tagline: business.tagline,
        currency: business.currency,
        logoUrl: business.logo_url || null,
        faviconUrl: business.favicon_url || null,
        googleAnalyticsId: business.google_analytics_id || null,
        facebookPixelId: business.facebook_pixel_id || null,
      },
      brandSettings: brandSettings || null,
      theme: theme ? { templateId: theme.template_id, appliedAt: theme.applied_at } : null,
      domain: domain ? { fullDomain: domain.full_domain, type: domain.type } : null,
    },
  });
});

// ─── Pages ────────────────────────────────────────────────────────────────────

/**
 * GET /storefront/pages
 * Returns all published pages for this store (HOME, PRODUCTS, ABOUT, CONTACT,
 * POLICY, CUSTOM, etc.). The frontend uses this to build navigation and know
 * which pages exist.
 */
const listPages = asyncHandler(async (req, res) => {
  const { sql } = require('../../config/database');
  const pages = await sql`
    SELECT id, page_type, slug, title, seo_title, seo_description, is_published, published_at
    FROM store_pages
    WHERE business_id = ${req.tenantBusinessId}
      AND is_published = true
    ORDER BY
      CASE page_type
        WHEN 'HOME' THEN 1
        WHEN 'PRODUCTS' THEN 2
        WHEN 'ABOUT' THEN 3
        WHEN 'CONTACT' THEN 4
        WHEN 'POLICY' THEN 5
        ELSE 6
      END,
      created_at ASC
  `;
  res.json({ success: true, data: { pages } });
});

/**
 * GET /storefront/pages/:pageTypeOrSlug
 * Fetches a page by either its page_type (HOME, PRODUCTS, ABOUT, CONTACT, POLICY,
 * PRODUCT_DETAIL, CATEGORY, CART, CHECKOUT) or its slug (for CUSTOM pages).
 *
 * The frontend should call this with the page_type for standard pages:
 *   GET /storefront/pages/HOME
 *   GET /storefront/pages/PRODUCTS
 *   GET /storefront/pages/ABOUT
 *
 * And with the slug for custom pages:
 *   GET /storefront/pages/our-story
 *   GET /storefront/pages/size-guide
 *
 * NOTE: Cart and Checkout pages are rendered entirely by the frontend — they do
 * not have schemas stored in the database. Do NOT call this endpoint for those
 * page types. The frontend handles cart/checkout UI itself and only calls the
 * cart/checkout API endpoints for data.
 */
const getPage = asyncHandler(async (req, res) => {
  const param = req.params.pageTypeOrSlug.toUpperCase();

  // Known page_type enum values
  const PAGE_TYPES = new Set([
    'HOME', 'PRODUCTS', 'PRODUCT_DETAIL', 'CATEGORY',
    'ABOUT', 'CONTACT', 'POLICY', 'CUSTOM',
  ]);

  // Cart and Checkout are frontend-only — no schema stored
  const FRONTEND_ONLY = new Set(['CART', 'CHECKOUT']);
  if (FRONTEND_ONLY.has(param)) {
    throw new AppError(
      `The ${param} page is rendered by the frontend and has no schema stored in the API. ` +
      'Do not call GET /storefront/pages/CART or /CHECKOUT.',
      400, 'FRONTEND_ONLY_PAGE'
    );
  }

  let page = null;

  if (PAGE_TYPES.has(param)) {
    // Lookup by page_type — returns the page regardless of is_published
    // (the store-level is_published check already happened in resolveTenant)
    page = await builderQueries.findPageByType(req.tenantBusinessId, param);
  } else {
    // Lookup by slug — for CUSTOM pages
    page = await builderQueries.findPublishedPageBySlug(req.tenantBusinessId, req.params.pageTypeOrSlug.toLowerCase());
  }

  if (!page) throw new AppError('Page not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: page });
});

// ─── Categories ───────────────────────────────────────────────────────────────

/**
 * GET /storefront/categories
 * Returns all active categories for the store.
 */
const getCategories = asyncHandler(async (req, res) => {
  const categories = await listCategories(req.tenantBusinessId);
  const active = categories.filter((c) => c.is_active);
  res.json({ success: true, data: active });
});

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * GET /storefront/products
 * Query: page, perPage, categoryId, tagId, search, featured, sort
 */
const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    perPage = 20,
    categoryId,
    tagId,
    search,
  } = req.query;

  const pageNum = parseInt(page, 10);
  const perPageNum = Math.min(parseInt(perPage, 10), 100);

  const { rows, total } = await listProducts(req.tenantBusinessId, {
    status: 'ACTIVE',
    categoryId: categoryId || null,
    tagId: tagId || null,
    search: search || null,
    page: pageNum,
    perPage: perPageNum,
  });

  res.json({
    success: true,
    data: {
      products: rows,
      pagination: {
        page: pageNum,
        perPage: perPageNum,
        total,
        totalPages: Math.ceil(total / perPageNum),
      },
    },
  });
});

/**
 * GET /storefront/products/:slug
 * Full product detail with variants, images, and review summary.
 */
const getProduct = asyncHandler(async (req, res) => {
  const product = await findProductBySlug(req.params.slug, req.tenantBusinessId);
  if (!product || product.status !== 'ACTIVE') throw new AppError('Product not found.', 404, 'NOT_FOUND');

  const full = await getProductFull(product.id, req.tenantBusinessId);

  // Related products — same category, exclude current
  let related = [];
  if (product.category_id) {
    const { rows } = await listProducts(req.tenantBusinessId, {
      status: 'ACTIVE',
      categoryId: product.category_id,
      page: 1,
      perPage: 4,
    });
    related = rows.filter((p) => p.id !== product.id).slice(0, 4);
  }

  res.json({
    success: true,
    data: {
      ...full,
      related,
    },
  });
});

// ─── Policies ─────────────────────────────────────────────────────────────────

/**
 * GET /storefront/policies/:slug
 * Returns a published policy page (POLICY page_type) by slug.
 */
const getPolicy = asyncHandler(async (req, res) => {
  const page = await builderQueries.findPublishedPageBySlug(req.tenantBusinessId, req.params.slug);
  if (!page || page.page_type !== 'POLICY') throw new AppError('Policy not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: page });
});

module.exports = {
  bootstrap,
  getSettings,
  listPages,
  getPage,
  getCategories,
  getProducts,
  getProduct,
  getPolicy,
};
