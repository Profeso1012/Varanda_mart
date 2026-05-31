/**
 * Direct Node.js test for the marketplace import endpoint.
 * Bypasses PowerShell entirely — no variable scoping issues, no string escaping.
 * Run: node tests/test_import.js
 */
require('dotenv').config();
const http = require('http');

const BASE = 'http://localhost:4000';

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 4000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...headers,
      },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('=== Import endpoint direct test ===\n');

  // 1. Login as supplier
  let r = await request('POST', '/api/v1/auth/login', { email: 'eoluwaseyi204@gmail.com', password: 'Secured123!' });
  const supplierToken = r.body.data?.accessToken;
  console.log('Supplier login:', r.status, supplierToken ? 'token OK' : 'FAILED');

  // 2. Login as seller
  r = await request('POST', '/api/v1/auth/login', { email: 'itzairso204@gmail.com', password: 'Secured123!' });
  const sellerToken = r.body.data?.accessToken;
  console.log('Seller login:', r.status, sellerToken ? 'token OK' : 'FAILED');

  const SH = { Authorization: `Bearer ${supplierToken}` };
  const SEH = { Authorization: `Bearer ${sellerToken}` };

  // 3. Get marketplace categories
  r = await request('GET', '/api/v1/marketplace/categories', null, SEH);
  const catId = r.body.data?.categories?.[0]?.id;
  console.log('Marketplace categories:', r.status, 'catId:', catId);

  // 4. Create supplier product
  const ts = Date.now();
  r = await request('POST', '/api/v1/supplier/products', {
    name: `Test Fabric ${ts}`,
    marketplaceCategoryId: catId,
    supplierPrice: 5000,
    suggestedRetailPrice: 8000,
    currency: 'NGN',
    isVariable: false,
    trackInventory: true,
    processingTimeDays: 2,
    description: 'Test product',
  }, SH);
  const spId = r.body.data?.product?.id;
  const spPrice = r.body.data?.product?.supplier_price;
  console.log('Create product:', r.status, 'id:', spId, 'supplier_price:', spPrice);

  if (!spId) { console.error('Product creation failed:', JSON.stringify(r.body)); return; }

  // 5. Add image (required for submit)
  r = await request('POST', `/api/v1/supplier/products/${spId}/images`, {
    images: [{ url: 'https://res.cloudinary.com/test/image/upload/v1/test.jpg', publicId: 'test/img', isMain: true }],
  }, SH);
  console.log('Add image:', r.status);

  // 6. Submit for review
  r = await request('POST', `/api/v1/supplier/products/${spId}/submit`, null, SH);
  console.log('Submit:', r.status, r.body.data?.product?.status);

  // 7. Approve via DB
  const { sql } = require('../src/config/database');
  await sql`UPDATE supplier_products SET status = 'ACTIVE', reviewed_at = NOW() WHERE id = ${spId}`;
  console.log('DB approve: done');

  // 8. Get product from marketplace (seller view) — check display_price
  r = await request('GET', `/api/v1/marketplace/products/${spId}`, null, SEH);
  const displayPrice = r.body.data?.product?.display_price;
  const hasSupplierPrice = 'supplier_price' in (r.body.data?.product || {});
  console.log('Marketplace detail:', r.status, 'display_price:', displayPrice, 'has supplier_price:', hasSupplierPrice);

  // 9. Attempt import with correct retail price
  const retailPrice = Math.ceil(Number(displayPrice) * 1.4);
  console.log(`\nAttempting import: supplierProductId=${spId}, retailPrice=${retailPrice} (displayPrice=${displayPrice})`);
  r = await request('POST', '/api/v1/marketplace/import', {
    supplierProductId: spId,
    retailPrice,
  }, SEH);
  console.log('Import result:', r.status, JSON.stringify(r.body));

  // 10. If failed, check what the server actually finds for this product
  if (r.status !== 201) {
    const [dbProduct] = await sql`SELECT id, name, supplier_price, platform_markup_rate, status FROM supplier_products WHERE id = ${spId}`;
    console.log('\nDB product at time of import:', JSON.stringify(dbProduct));
    const serverDisplayPrice = Math.round(Number(dbProduct.supplier_price) * (1 + Number(dbProduct.platform_markup_rate)) * 100) / 100;
    console.log('Server would compute display_price as:', serverDisplayPrice);
    console.log('retailPrice sent:', retailPrice, '>=', serverDisplayPrice, '?', retailPrice >= serverDisplayPrice);
  }

  await sql.end();
}

run().catch(console.error);
