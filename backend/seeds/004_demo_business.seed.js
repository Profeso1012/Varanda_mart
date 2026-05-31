const sql = require('../src/config/database').sql;

/**
 * Demo Business Seed (Simplified)
 * 
 * Creates a minimal demo store at mystore.varanda.com for testing.
 * This domain is RESERVED and cannot be claimed by real users.
 * 
 * Includes:
 * - Demo user account
 * - Business with mystore slug
 * - Active domain mystore.varanda.com
 * - Applied template (Bold)
 */

async function seed() {
  try {
    await sql.begin(async (tx) => {
      console.log('🌱 Starting demo business seed...');
      
      // ─── 1. Create demo user ──────────────────────────────────────────────────
      
      const demoEmail = 'demo@varanda.com';
      const bcrypt = require('bcrypt');
      const demoPassword = await bcrypt.hash('Demo123!', 10);
      
      const existingUser = await tx`
        SELECT id FROM users WHERE email = ${demoEmail}
      `;
      
      let userId;
      if (existingUser.length > 0) {
        userId = existingUser[0].id;
        console.log('✓ Demo user already exists');
      } else {
        const userResult = await tx`
          INSERT INTO users (email, password_hash, first_name, last_name, phone, is_email_verified, email_verified_at)
          VALUES (${demoEmail}, ${demoPassword}, 'Demo', 'Store', '+2348012345678', true, NOW())
          RETURNING id
        `;
        userId = userResult[0].id;
        console.log('✓ Created demo user');
      }
      
      // ─── 2. Create demo business ──────────────────────────────────────────────
      
      const businessSlug = 'mystore';
      
      const existingBusiness = await tx`
        SELECT id FROM businesses WHERE slug = ${businessSlug}
      `;
      
      let businessId;
      if (existingBusiness.length > 0) {
        businessId = existingBusiness[0].id;
        console.log('✓ Demo business already exists');
      } else {
        const planResult = await tx`
          SELECT id FROM subscription_plans WHERE tier = 'STARTER' LIMIT 1
        `;
        
        if (planResult.length === 0) {
          throw new Error('No subscription plans found. Run seed 001 first.');
        }
        
        const planId = planResult[0].id;
        
        const businessResult = await tx`
          INSERT INTO businesses (
            owner_id, name, slug, sector,
            currency, timezone,
            is_published, published_at, status
          )
          VALUES (
            ${userId}, 'Demo Store', ${businessSlug}, 'FASHION_APPAREL',
            'NGN', 'Africa/Lagos',
            true, NOW(), 'ACTIVE'
          )
          RETURNING id
        `;
        businessId = businessResult[0].id;
        
        await tx`
          INSERT INTO business_subscriptions (business_id, plan_id, status, current_period_start, current_period_end)
          VALUES (${businessId}, ${planId}, 'ACTIVE', NOW(), NOW() + INTERVAL '1 year')
        `;
        
        console.log('✓ Created demo business');
      }
      
      // ─── 3. Create domain ─────────────────────────────────────────────────────
      
      const domainName = 'mystore.varanda.com';
      
      const existingDomain = await tx`
        SELECT id FROM domains WHERE full_domain = ${domainName}
      `;
      
      if (existingDomain.length === 0) {
        await tx`
          INSERT INTO domains (business_id, type, domain, full_domain, status, dns_verified_at)
          VALUES (${businessId}, 'SUBDOMAIN', 'mystore', ${domainName}, 'ACTIVE', NOW())
        `;
        console.log('✓ Created domain mystore.varanda.com');
      } else {
        console.log('✓ Domain already exists');
      }
      
      // ─── 4. Apply template ────────────────────────────────────────────────────
      
      const templateResult = await tx`
        SELECT id FROM templates WHERE slug = 'bold' LIMIT 1
      `;
      
      if (templateResult.length === 0) {
        throw new Error('Bold template not found. Run seed 003 first.');
      }
      
      const templateId = templateResult[0].id;
      
      const existingTheme = await tx`
        SELECT id FROM store_themes WHERE business_id = ${businessId}
      `;
      
      if (existingTheme.length === 0) {
        await tx`
          INSERT INTO store_themes (business_id, template_id, applied_at)
          VALUES (${businessId}, ${templateId}, NOW())
        `;
        
        const pageDefaults = await tx`
          SELECT page_type, schema FROM template_page_defaults WHERE template_id = ${templateId}
        `;
        
        const { v4: uuidv4 } = require('uuid');
        
        for (const pd of pageDefaults) {
          const freshSchema = replaceIdsInSchema(pd.schema, uuidv4);
          
          await tx`
            INSERT INTO store_pages (business_id, page_type, schema, is_published, published_at)
            VALUES (${businessId}, ${pd.page_type}, ${sql.json(freshSchema)}, true, NOW())
            ON CONFLICT (business_id, page_type) DO UPDATE
            SET schema = EXCLUDED.schema, is_published = true, published_at = NOW()
          `;
        }
        
        console.log('✓ Applied Bold template');
      } else {
        console.log('✓ Template already applied');
      }
      
      console.log('\n✅ Demo business seed completed successfully!');
      console.log('\n📋 Demo Account Details:');
      console.log('   Email: demo@varanda.com');
      console.log('   Password: Demo123!');
      console.log('   Store URL: https://mystore.varanda.com');
      console.log('   Business: Demo Store');
      console.log('\n🎨 Template: Bold (applied)');
      console.log('\n💡 Note: Add products through the admin panel or API');
    });
    
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

function replaceIdsInSchema(schema, uuidv4) {
  const replaceIds = (node) => {
    if (Array.isArray(node)) return node.map(replaceIds);
    if (node && typeof node === 'object') {
      const result = {};
      for (const [k, v] of Object.entries(node)) {
        result[k] = k === 'id' ? uuidv4() : replaceIds(v);
      }
      return result;
    }
    return node;
  };
  return replaceIds(schema);
}

seed().catch(console.error);
