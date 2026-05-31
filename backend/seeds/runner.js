require('dotenv').config();
const { sql } = require('../src/config/database');

const seedSubscriptionPlans = require('./001_subscription_plans.seed');
const seedMarketplaceCategories = require('./002_marketplace_categories.seed');
const seedTemplates = require('./003_templates.seed');

async function runSeeds() {
  console.log('🌱 Running seeds...\n');
  try {
    await seedSubscriptionPlans();
    await seedMarketplaceCategories();
    await seedTemplates();
    console.log('✅ All seeds complete.');
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runSeeds();
