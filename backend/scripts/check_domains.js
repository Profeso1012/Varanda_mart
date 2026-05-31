require('dotenv').config();
const { sql } = require('../src/config/database');

async function check() {
  console.log('\n── domains table ──────────────────────────────────────────');
  const domains = await sql`
    SELECT d.id, d.business_id, d.type, d.domain, d.full_domain, d.status,
           b.name AS business_name, b.slug AS business_slug, b.is_published
    FROM domains d
    JOIN businesses b ON b.id = d.business_id
    ORDER BY d.created_at DESC
    LIMIT 20
  `;
  if (!domains.length) {
    console.log('  (no rows — no domains have been registered yet)');
  } else {
    domains.forEach(d => {
      console.log(`  [${d.status}] full_domain="${d.full_domain}" | business="${d.business_name}" (${d.business_slug}) | published=${d.is_published}`);
    });
  }

  console.log('\n── businesses table ────────────────────────────────────────');
  const businesses = await sql`
    SELECT id, name, slug, is_published, created_at
    FROM businesses
    ORDER BY created_at DESC
    LIMIT 10
  `;
  if (!businesses.length) {
    console.log('  (no businesses)');
  } else {
    businesses.forEach(b => {
      console.log(`  id=${b.id} | slug="${b.slug}" | name="${b.name}" | published=${b.is_published}`);
    });
  }

  await sql.end();
}

check().catch(e => { console.error(e.message); process.exit(1); });
