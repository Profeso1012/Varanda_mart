require('dotenv').config();
const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  max: 1,
});

const MIGRATIONS_DIR = __dirname;

async function run() {
  // Create tracking table if not exists
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL PRIMARY KEY,
      filename   VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Get already-applied migrations
  const applied = await sql`SELECT filename FROM schema_migrations ORDER BY filename`;
  const appliedSet = new Set(applied.map((r) => r.filename));

  // Get all .sql files sorted
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let ran = 0;
  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`  ✓ ${file} (already applied)`);
      continue;
    }

    const filePath = path.join(MIGRATIONS_DIR, file);
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    try {
      await sql.begin(async (tx) => {
        await tx.unsafe(sqlContent);
        await tx`INSERT INTO schema_migrations (filename) VALUES (${file})`;
      });
      console.log(`  ✅ ${file}`);
      ran++;
    } catch (err) {
      console.error(`  ❌ ${file}: ${err.message}`);
      await sql.end();
      process.exit(1);
    }
  }

  console.log(`\nMigrations complete. ${ran} new migration(s) applied.`);
  await sql.end();
}

run().catch((err) => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});
