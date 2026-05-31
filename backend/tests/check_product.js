require('dotenv').config();
const { sql } = require('../src/config/database');

const id = process.argv[2];
if (!id) { console.log('Usage: node tests/check_product.js <product_id>'); process.exit(1); }

sql`SELECT id, name, supplier_price, platform_markup_rate, status FROM supplier_products WHERE id = ${id}`
  .then((rows) => { console.log(JSON.stringify(rows, null, 2)); sql.end(); })
  .catch((e) => { console.error(e.message); sql.end(); });
