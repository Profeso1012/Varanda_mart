require('dotenv').config();
const { sql } = require('../src/config/database');

// Check what the import controller would find
const id = process.argv[2];
sql`SELECT id, name, supplier_price, platform_markup_rate, status, deleted_at 
    FROM supplier_products WHERE id = ${id}`
  .then((rows) => {
    console.log('Product:', JSON.stringify(rows, null, 2));
    const p = rows[0];
    if (p) {
      const display = Math.round(Number(p.supplier_price) * (1 + Number(p.platform_markup_rate)) * 100) / 100;
      console.log('Computed display_price:', display);
    }
    sql.end();
  })
  .catch((e) => { console.error(e.message); sql.end(); });
