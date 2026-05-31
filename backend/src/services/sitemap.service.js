const { sql } = require('../config/database');
const { config } = require('../config/env');

/**
 * Generate an XML sitemap for a given business storefront.
 * Includes home, product pages, and category pages.
 */
const generateSitemap = async (businessId) => {
  const [business] = await sql`SELECT slug FROM businesses WHERE id = ${businessId}`;
  const domain = await sql`SELECT full_domain FROM domains WHERE business_id = ${businessId} AND status = 'ACTIVE' LIMIT 1`;
  const baseUrl = domain[0] ? `https://${domain[0].full_domain}` : `https://${business?.slug}.${config.baseDomain}`;

  const products = await sql`
    SELECT slug, updated_at FROM products
    WHERE business_id = ${businessId} AND status = 'ACTIVE' AND deleted_at IS NULL
  `;

  const categories = await sql`
    SELECT slug, updated_at FROM categories
    WHERE business_id = ${businessId} AND is_active = true
  `;

  const urls = [
    { loc: baseUrl, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/products`, changefreq: 'daily', priority: '0.9' },
    ...products.map((p) => ({
      loc: `${baseUrl}/products/${p.slug}`,
      lastmod: new Date(p.updated_at).toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.8',
    })),
    ...categories.map((c) => ({
      loc: `${baseUrl}/category/${c.slug}`,
      lastmod: new Date(c.updated_at).toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.7',
    })),
  ];

  const urlEntries = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
};

module.exports = { generateSitemap };
