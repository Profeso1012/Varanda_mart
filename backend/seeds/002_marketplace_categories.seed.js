const sql = require('../src/config/database').sql;

const categories = [
  { name: 'Fashion & Apparel', slug: 'fashion-apparel', description: 'Clothing, shoes, and accessories' },
  { name: 'Electronics', slug: 'electronics', description: 'Gadgets, devices, and accessories' },
  { name: 'Food & Beverage', slug: 'food-beverage', description: 'Food products and drinks' },
  { name: 'Health & Beauty', slug: 'health-beauty', description: 'Skincare, haircare, and wellness' },
  { name: 'Home & Living', slug: 'home-living', description: 'Furniture, decor, and household items' },
  { name: 'Books & Stationery', slug: 'books-stationery', description: 'Books, notebooks, and office supplies' },
  { name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Sports equipment and activewear' },
  { name: 'Toys & Games', slug: 'toys-games', description: 'Toys, games, and entertainment' },
  { name: 'Automotive', slug: 'automotive', description: 'Car accessories and parts' },
  { name: 'Jewelry & Accessories', slug: 'jewelry-accessories', description: 'Jewelry, watches, and accessories' },
  { name: 'Art & Crafts', slug: 'art-crafts', description: 'Art supplies and handmade goods' },
  { name: 'Digital Products', slug: 'digital-products', description: 'Software, templates, and digital downloads' },
  { name: 'General Merchandise', slug: 'general-merchandise', description: 'Miscellaneous products' },
];

async function seed() {
  console.log('Seeding marketplace_categories...');
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    await sql`
      INSERT INTO marketplace_categories (name, slug, description, sort_order)
      VALUES (${cat.name}, ${cat.slug}, ${cat.description}, ${i})
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description
    `;
    console.log(`  ✅ ${cat.name}`);
  }
  console.log('marketplace_categories seeded.\n');
}

module.exports = seed;
