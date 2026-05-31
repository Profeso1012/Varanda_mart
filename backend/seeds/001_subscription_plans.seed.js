const sql = require('../src/config/database').sql;

const plans = [
  {
    tier: 'STARTER',
    display_name: 'Starter',
    monthly_price_usd: 0.00,
    yearly_price_usd: 0.00,
    trial_days: 0,
    commission_rate: 0.0500,
    platform_service_fee_rate: 0.0025,  // 0.25%
    max_products: 30,
    max_stores: 1,
    max_staff_seats: 3,
    max_dropship_imports: 5,
    features: {
      canUseCustomDomain: false,
      canConnectExternalPaymentGateways: false,
      hasInventoryManagement: false,
      hasAdvancedReporting: false,
      hasMultipleShippingOptions: false,
      hasAdvancedAnalytics: false,
      hasAutomationTools: false,
      canConnectThirdPartyDropship: false,
      canAccessMarketplace: true,
    },
    is_active: true,
    sort_order: 0,
  },
  {
    tier: 'PRO',
    display_name: 'Pro',
    monthly_price_usd: 6.00,
    yearly_price_usd: 60.00,
    trial_days: 90,
    commission_rate: 0.0000,
    platform_service_fee_rate: 0.0025,  // 0.25%
    max_products: null,
    max_stores: 1,
    max_staff_seats: 5,
    max_dropship_imports: null,
    features: {
      canUseCustomDomain: true,
      canConnectExternalPaymentGateways: true,
      hasInventoryManagement: true,
      hasAdvancedReporting: true,
      hasMultipleShippingOptions: true,
      hasAdvancedAnalytics: false,
      hasAutomationTools: false,
      canConnectThirdPartyDropship: true,
      canAccessMarketplace: true,
    },
    is_active: true,
    sort_order: 1,
  },
  {
    tier: 'GROWTH',
    display_name: 'Growth',
    monthly_price_usd: 20.00,
    yearly_price_usd: 200.00,
    trial_days: 90,
    commission_rate: 0.0000,
    platform_service_fee_rate: 0.0025,  // 0.25%
    max_products: null,
    max_stores: 1,
    max_staff_seats: 20,
    max_dropship_imports: null,
    features: {
      canUseCustomDomain: true,
      canConnectExternalPaymentGateways: true,
      hasInventoryManagement: true,
      hasAdvancedReporting: true,
      hasMultipleShippingOptions: true,
      hasAdvancedAnalytics: true,
      hasAutomationTools: true,
      canConnectThirdPartyDropship: true,
      canAccessMarketplace: true,
    },
    is_active: true,
    sort_order: 2,
  },
];

async function seed() {
  console.log('Seeding subscription_plans...');
  for (const plan of plans) {
    await sql`
      INSERT INTO subscription_plans (
        tier, display_name, monthly_price_usd, yearly_price_usd, trial_days,
        commission_rate, platform_service_fee_rate, max_products, max_stores,
        max_staff_seats, max_dropship_imports, features, is_active, sort_order
      ) VALUES (
        ${plan.tier}, ${plan.display_name}, ${plan.monthly_price_usd}, ${plan.yearly_price_usd},
        ${plan.trial_days}, ${plan.commission_rate}, ${plan.platform_service_fee_rate},
        ${plan.max_products}, ${plan.max_stores}, ${plan.max_staff_seats},
        ${plan.max_dropship_imports}, ${sql.json(plan.features)}, ${plan.is_active}, ${plan.sort_order}
      )
      ON CONFLICT (tier) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        monthly_price_usd = EXCLUDED.monthly_price_usd,
        yearly_price_usd = EXCLUDED.yearly_price_usd,
        trial_days = EXCLUDED.trial_days,
        commission_rate = EXCLUDED.commission_rate,
        platform_service_fee_rate = EXCLUDED.platform_service_fee_rate,
        max_products = EXCLUDED.max_products,
        max_staff_seats = EXCLUDED.max_staff_seats,
        max_dropship_imports = EXCLUDED.max_dropship_imports,
        features = EXCLUDED.features
    `;
    console.log(`  ✅ ${plan.display_name}`);
  }
  console.log('subscription_plans seeded.\n');
}

module.exports = seed;
