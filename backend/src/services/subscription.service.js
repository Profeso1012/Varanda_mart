const flutterwaveConfig = require('../config/flutterwave');
const { config } = require('../config/env');
const AppError = require('../utils/AppError');
const emailConfig = require('../config/email');
const {
  getAllPlans, getPlanByTier, createSubscription,
  getSubscriptionByBusinessId, getSubscriptionByFlwId, updateSubscription, cancelSubscription,
} = require('../db/queries/subscriptions.queries');
const { findBusinessById } = require('../db/queries/businesses.queries');
const { findUserById } = require('../db/queries/users.queries');

let plansCache = null;
let plansCacheTime = 0;

const getActivePlans = async () => {
  const now = Date.now();
  if (plansCache && now - plansCacheTime < 60 * 60 * 1000) return plansCache;
  plansCache = await getAllPlans();
  plansCacheTime = now;
  return plansCache;
};

/**
 * Create a STARTER subscription immediately (no trial, no card).
 * Updates onboarding_step to BUSINESS_SETUP.
 */
const selectStarterPlan = async (businessId) => {
  const existing = await getSubscriptionByBusinessId(businessId);
  if (existing) throw new AppError('Subscription already exists.', 409, 'CONFLICT');

  const plan = await getPlanByTier('STARTER');
  const subscription = await createSubscription({
    businessId,
    planId: plan.id,
    billingCycle: 'MONTHLY',
    status: 'ACTIVE',
  });

  // Update onboarding step
  const { sql } = require('../config/database');
  await sql`
    UPDATE users SET onboarding_step = 'BUSINESS_SETUP', updated_at = NOW()
    WHERE id = (SELECT owner_id FROM businesses WHERE id = ${businessId})
  `;

  return subscription;
};

/**
 * Initiate a paid plan checkout via Flutterwave.
 * Returns a hosted checkout URL — subscription record is created by webhook.
 */
const initiatePaidPlanCheckout = async (businessId, tier, billingCycle, ownerEmail, ownerName) => {
  const existing = await getSubscriptionByBusinessId(businessId);
  if (existing) throw new AppError('Subscription already exists.', 409, 'CONFLICT');

  const plan = await getPlanByTier(tier);
  const isYearly = billingCycle === 'YEARLY';
  const amount = isYearly ? plan.yearly_price_usd : plan.monthly_price_usd;

  // Select the correct pre-seeded Flutterwave plan ID
  const planIdMap = {
    PRO_MONTHLY: config.flutterwaveMonthlyProPlanId,
    PRO_YEARLY: config.flutterwaveYearlyProPlanId,
    GROWTH_MONTHLY: config.flutterwaveMonthlyGrowthPlanId,
    GROWTH_YEARLY: config.flutterwaveYearlyGrowthPlanId,
  };
  const flwPlanId = planIdMap[`${tier}_${billingCycle}`];

  const txRef = `varanda-sub-${businessId}-${Date.now()}`;
  const trialEndDate = new Date(Date.now() + plan.trial_days * 24 * 60 * 60 * 1000);

  const { link } = await flutterwaveConfig.initializeSubscription({
    txRef,
    amount,
    currency: 'USD',
    redirectUrl: `${config.sellerDashboardUrl}/subscription/callback`,
    customerEmail: ownerEmail,
    customerName: ownerName,
    planId: flwPlanId,
    meta: { businessId, tier, billingCycle },
  });

  return {
    checkoutUrl: link,
    tier,
    trialDays: plan.trial_days,
    firstChargeDate: trialEndDate.toISOString().split('T')[0],
    firstChargeAmount: amount,
  };
};

/**
 * Handle Flutterwave subscription webhook events.
 */
const handleFlutterwaveWebhook = async (event) => {
  const { event: eventType, data } = event;

  if (eventType === 'subscription.activated') {
    const { meta } = data;
    if (!meta?.businessId) return;

    const plan = await getPlanByTier(meta.tier || 'PRO');
    const trialEndsAt = new Date(Date.now() + plan.trial_days * 24 * 60 * 60 * 1000);

    await createSubscription({
      businessId: meta.businessId,
      planId: plan.id,
      billingCycle: meta.billingCycle || 'MONTHLY',
      status: 'TRIAL',
      trialStartsAt: new Date(),
      trialEndsAt,
      flutterwaveSubscriptionId: data.id?.toString(),
      flutterwaveCustomerId: data.customer?.id?.toString(),
      flutterwavePlanId: data.plan?.toString(),
      cardLast4: data.card?.last_4digits,
      cardExpiry: data.card?.expiry,
      cardBrand: data.card?.type,
    });

    // Update onboarding step
    const { sql } = require('../config/database');
    await sql`
      UPDATE users SET onboarding_step = 'BUSINESS_SETUP', updated_at = NOW()
      WHERE id = (SELECT owner_id FROM businesses WHERE id = ${meta.businessId})
    `;

    const business = await findBusinessById(meta.businessId);
    if (business) {
      const owner = await findUserById(business.owner_id);
      if (owner) {
        emailConfig
          .sendSubscriptionConfirmation(owner.email, plan.display_name, trialEndsAt.toDateString())
          .catch(() => {});
      }
    }
  }

  if (eventType === 'subscription.charge.completed') {
    const sub = await getSubscriptionByFlwId(data.subscription_id?.toString());
    if (!sub) return;

    const periodStart = new Date();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await updateSubscription(sub.id, {
      status: 'ACTIVE',
      current_period_start: periodStart,
      current_period_end: periodEnd,
      next_billing_date: periodEnd,
      next_billing_amount: data.amount,
    });
  }

  if (eventType === 'subscription.charge.failed') {
    const sub = await getSubscriptionByFlwId(data.subscription_id?.toString());
    if (!sub) return;
    await updateSubscription(sub.id, { status: 'PAST_DUE' });

    const business = await findBusinessById(sub.business_id);
    if (business) {
      const owner = await findUserById(business.owner_id);
      if (owner) {
        emailConfig
          .sendPaymentFailed(owner.email, 'your plan', `${config.sellerDashboardUrl}/billing`)
          .catch(() => {});
      }
    }
  }

  if (eventType === 'subscription.cancelled') {
    const sub = await getSubscriptionByFlwId(data.id?.toString());
    if (!sub) return;
    await updateSubscription(sub.id, { status: 'CANCELLED', cancelled_at: new Date() });
  }
};

/**
 * Upgrade a seller's plan. Returns checkoutUrl if no card on file, else switches plan.
 */
const upgradePlan = async (businessId, newTier, billingCycle) => {
  const sub = await getSubscriptionByBusinessId(businessId);
  const business = await findBusinessById(businessId);
  const owner = await findUserById(business.owner_id);

  if (sub?.card_last4) {
    // Card on file — switch Flutterwave plan
    const plan = await getPlanByTier(newTier);
    await updateSubscription(sub.id, { plan_id: plan.id, billing_cycle: billingCycle });
    return { subscription: await getSubscriptionByBusinessId(businessId) };
  }

  // No card — return checkout URL
  const result = await initiatePaidPlanCheckout(businessId, newTier, billingCycle, owner.email, `${owner.first_name} ${owner.last_name}`);
  return { checkoutUrl: result.checkoutUrl };
};

/**
 * Cancel a subscription at period end.
 */
const cancelSubscriptionForBusiness = async (businessId) => {
  const sub = await getSubscriptionByBusinessId(businessId);
  if (!sub) throw new AppError('No active subscription found.', 404, 'NOT_FOUND');

  if (sub.flutterwave_subscription_id) {
    await flutterwaveConfig.cancelSubscription(sub.flutterwave_subscription_id).catch(() => {});
  }

  return cancelSubscription(sub.id);
};

/**
 * Get the commission rate for a business (used by checkout service).
 * Falls back to 5% (Starter rate) if no subscription found.
 */
const getCommissionRate = async (businessId) => {
  const sub = await getSubscriptionByBusinessId(businessId);
  return sub?.commission_rate ?? 0.05;
};

module.exports = {
  getActivePlans,
  selectStarterPlan,
  initiatePaidPlanCheckout,
  handleFlutterwaveWebhook,
  upgradePlan,
  cancelSubscriptionForBusiness,
  getCommissionRate,
};
