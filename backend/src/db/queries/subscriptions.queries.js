const { sql } = require('../../config/database');

let plansCache = null;
let plansCacheTime = 0;

const getAllPlans = async () => {
  const now = Date.now();
  if (plansCache && now - plansCacheTime < 60 * 60 * 1000) return plansCache;
  const plans = await sql`SELECT * FROM subscription_plans WHERE is_active = true ORDER BY sort_order ASC`;
  plansCache = plans;
  plansCacheTime = now;
  return plans;
};

const getPlanByTier = async (tier) => {
  const [plan] = await sql`SELECT * FROM subscription_plans WHERE tier = ${tier}`;
  return plan || null;
};

const createSubscription = async (data) => {
  const [sub] = await sql`
    INSERT INTO business_subscriptions (
      business_id, plan_id, billing_cycle, status,
      trial_starts_at, trial_ends_at,
      current_period_start, current_period_end,
      next_billing_amount, next_billing_date,
      flutterwave_subscription_id, flutterwave_customer_id, flutterwave_plan_id,
      card_last4, card_expiry, card_brand
    ) VALUES (
      ${data.businessId}, ${data.planId}, ${data.billingCycle || 'MONTHLY'}, ${data.status || 'TRIAL'},
      ${data.trialStartsAt || null}, ${data.trialEndsAt || null},
      ${data.currentPeriodStart || null}, ${data.currentPeriodEnd || null},
      ${data.nextBillingAmount || null}, ${data.nextBillingDate || null},
      ${data.flutterwaveSubscriptionId || null}, ${data.flutterwaveCustomerId || null}, ${data.flutterwavePlanId || null},
      ${data.cardLast4 || null}, ${data.cardExpiry || null}, ${data.cardBrand || null}
    )
    RETURNING *
  `;
  return sub;
};

const getSubscriptionByBusinessId = async (businessId) => {
  const [sub] = await sql`
    SELECT bs.*, sp.tier, sp.display_name, sp.monthly_price_usd, sp.yearly_price_usd,
           sp.commission_rate, sp.platform_service_fee_rate, sp.max_products,
           sp.max_stores, sp.max_staff_seats, sp.max_dropship_imports, sp.features,
           sp.trial_days
    FROM business_subscriptions bs
    JOIN subscription_plans sp ON sp.id = bs.plan_id
    WHERE bs.business_id = ${businessId}
  `;
  if (!sub) return null;
  return {
    ...sub,
    plan: {
      id: sub.plan_id,
      tier: sub.tier,
      displayName: sub.display_name,
      monthlyPriceUsd: sub.monthly_price_usd,
      yearlyPriceUsd: sub.yearly_price_usd,
      commissionRate: sub.commission_rate,
      platformServiceFeeRate: sub.platform_service_fee_rate,
      maxProducts: sub.max_products,
      maxStores: sub.max_stores,
      maxStaffSeats: sub.max_staff_seats,
      maxDropshipImports: sub.max_dropship_imports,
      features: sub.features,
      trialDays: sub.trial_days,
    },
  };
};

const getSubscriptionByFlwId = async (flwId) => {
  const [sub] = await sql`
    SELECT * FROM business_subscriptions WHERE flutterwave_subscription_id = ${flwId}
  `;
  return sub || null;
};

const updateSubscription = async (id, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [sub] = await sql`
    UPDATE business_subscriptions
    SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return sub;
};

const getSubscriptionsEndingTrial = async (cutoffDate) => {
  return sql`
    SELECT bs.*, b.owner_id FROM business_subscriptions bs
    JOIN businesses b ON b.id = bs.business_id
    WHERE bs.status = 'TRIAL' AND bs.trial_ends_at <= ${cutoffDate}
  `;
};

const getSubscriptionsNearingTrial = async (daysAhead) => {
  return sql`
    SELECT bs.*, b.owner_id FROM business_subscriptions bs
    JOIN businesses b ON b.id = bs.business_id
    WHERE bs.status = 'TRIAL'
      AND bs.trial_ends_at BETWEEN NOW() AND NOW() + INTERVAL '1 day' * ${daysAhead}
  `;
};

const cancelSubscription = async (id) => {
  const [sub] = await sql`
    UPDATE business_subscriptions
    SET status = 'CANCELLED', cancelled_at = NOW(), updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return sub;
};

module.exports = {
  getAllPlans,
  getPlanByTier,
  createSubscription,
  getSubscriptionByBusinessId,
  getSubscriptionByFlwId,
  updateSubscription,
  getSubscriptionsEndingTrial,
  getSubscriptionsNearingTrial,
  cancelSubscription,
};
