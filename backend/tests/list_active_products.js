require('dotenv').config();
const { sql } = require('../src/config/database');
sql`SELECT id, name, supplier_price, status FROM supplier_products WHERE status='ACTIVE' AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 10`
  .then((r) => { console.log(JSON.stringify(r, null, 2)); sql.end(); })
  .catch((e) => { console.error(e.message); sql.end(); });
