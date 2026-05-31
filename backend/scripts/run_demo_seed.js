/**
 * Run Demo Business Seed
 * 
 * Executes the demo business seed to create mystore.varanda.com
 */

require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

const seedFile = path.join(__dirname, '..', 'seeds', '004_demo_business.seed.js');

console.log('🚀 Running demo business seed...\n');

try {
  execSync(`node "${seedFile}"`, { 
    stdio: 'inherit',
    env: process.env 
  });
} catch (error) {
  console.error('\n❌ Seed execution failed');
  process.exit(1);
}
