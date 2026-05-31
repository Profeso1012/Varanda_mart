/**
 * Diagnostic script for storefront 404 issues
 * 
 * Run with: node scripts/diagnose_storefront.js mystore.varanda.com
 */

const { sql } = require('../src/config/database');

async function diagnoseStorefront(domain) {
  console.log(`\n🔍 Diagnosing storefront for domain: ${domain}\n`);

  try {
    // 1. Check if domain exists
    console.log('1️⃣ Checking domains table...');
    const domains = await sql`
      SELECT id, business_id, type, domain, full_domain, status, dns_verified_at
      FROM domains
      WHERE full_domain = ${domain}
    `;

    if (domains.length === 0) {
      console.log('❌ Domain not found in domains table');
      console.log('\n💡 Solution: Create a domain record:');
      console.log(`   INSERT INTO domains (business_id, type, domain, full_domain, status)`);
      console.log(`   VALUES ('[business-id]', 'SUBDOMAIN', '${domain.split('.')[0]}', '${domain}', 'ACTIVE');`);
      return;
    }

    const domainRecord = domains[0];
    console.log('✅ Domain found:', {
      id: domainRecord.id,
      business_id: domainRecord.business_id,
      type: domainRecord.type,
      status: domainRecord.status,
      dns_verified: domainRecord.dns_verified_at ? 'Yes' : 'No'
    });

    if (domainRecord.status !== 'ACTIVE' && domainRecord.status !== 'PENDING') {
      console.log(`⚠️  Domain status is "${domainRecord.status}" - should be ACTIVE or PENDING`);
    }

    // 2. Check business
    console.log('\n2️⃣ Checking business...');
    const businesses = await sql`
      SELECT id, name, slug, status, is_published, owner_id
      FROM businesses
      WHERE id = ${domainRecord.business_id}
    `;

    if (businesses.length === 0) {
      console.log('❌ Business not found');
      return;
    }

    const business = businesses[0];
    console.log('✅ Business found:', {
      id: business.id,
      name: business.name,
      slug: business.slug,
      status: business.status,
      is_published: business.is_published
    });

    if (!business.is_published) {
      console.log('⚠️  Business is NOT published');
      console.log('\n💡 Solution: Publish the business:');
      console.log(`   UPDATE businesses SET is_published = true WHERE id = '${business.id}';`);
    }

    if (business.status === 'SUSPENDED') {
      console.log('❌ Business is SUSPENDED');
      return;
    }

    // 3. Check home page
    console.log('\n3️⃣ Checking home page...');
    const pages = await sql`
      SELECT id, page_type, title, is_active, is_published, schema
      FROM store_pages
      WHERE business_id = ${business.id}
        AND page_type = 'HOME'
    `;

    if (pages.length === 0) {
      console.log('❌ HOME page not found');
      console.log('\n💡 Solution: Create a home page via the builder or run:');
      console.log(`   INSERT INTO store_pages (business_id, page_type, title, schema, is_active, is_published)`);
      console.log(`   VALUES ('${business.id}', 'HOME', 'Home', '{"version":"1.0","sections":[]}', true, true);`);
      return;
    }

    const homePage = pages[0];
    console.log('✅ HOME page found:', {
      id: homePage.id,
      is_active: homePage.is_active,
      is_published: homePage.is_published,
      has_sections: homePage.schema?.sections?.length > 0
    });

    if (!homePage.is_active) {
      console.log('⚠️  HOME page is not active');
    }

    if (!homePage.is_published) {
      console.log('⚠️  HOME page is not published');
    }

    if (!homePage.schema?.sections || homePage.schema.sections.length === 0) {
      console.log('⚠️  HOME page has no sections (empty schema)');
    }

    // 4. Check brand settings
    console.log('\n4️⃣ Checking brand settings...');
    const brandSettings = await sql`
      SELECT id, primary_color, font_body, font_heading
      FROM brand_settings
      WHERE business_id = ${business.id}
    `;

    if (brandSettings.length === 0) {
      console.log('⚠️  No brand settings found (will use defaults)');
    } else {
      console.log('✅ Brand settings found');
    }

    // 5. Summary
    console.log('\n📊 SUMMARY:');
    const issues = [];
    
    if (domainRecord.status !== 'ACTIVE') {
      issues.push(`Domain status is ${domainRecord.status} (should be ACTIVE)`);
    }
    if (!business.is_published) {
      issues.push('Business is not published');
    }
    if (business.status === 'SUSPENDED') {
      issues.push('Business is suspended');
    }
    if (pages.length === 0) {
      issues.push('No HOME page exists');
    } else if (!homePage.is_active || !homePage.is_published) {
      issues.push('HOME page is not active/published');
    } else if (!homePage.schema?.sections || homePage.schema.sections.length === 0) {
      issues.push('HOME page has no content');
    }

    if (issues.length === 0) {
      console.log('✅ All checks passed! Storefront should be working.');
      console.log('\n🔧 If still seeing 404, check:');
      console.log('   - Frontend .env has correct VITE_API_URL');
      console.log('   - Frontend is sending X-Tenant-Domain header in dev');
      console.log('   - Backend logs show the correct domain being resolved');
      console.log('   - CORS is allowing the frontend origin');
    } else {
      console.log('❌ Issues found:');
      issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

// Get domain from command line
const domain = process.argv[2];

if (!domain) {
  console.error('Usage: node scripts/diagnose_storefront.js <domain>');
  console.error('Example: node scripts/diagnose_storefront.js mystore.varanda.com');
  process.exit(1);
}

diagnoseStorefront(domain);
