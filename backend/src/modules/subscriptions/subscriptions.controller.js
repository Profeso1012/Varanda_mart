const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const subscriptionService = require('../../services/subscription.service');
const { getAllPlans, getSubscriptionByBusinessId } = require('../../db/queries/subscriptions.queries');
const { findBusinessByOwnerId } = require('../../db/queries/businesses.queries');

// GET /api/v1/plans — no auth
const getPlans = asyncHandler(async (req, res) => {
  const plans = await getAllPlans();
  res.json({
    success: true,
    data: {
      plans: plans.map((p) => ({
        id: p.id,
        tier: p.tier,
        displayName: p.display_name,
        monthlyPriceUsd: p.monthly_price_usd,
        yearlyPriceUsd: p.yearly_price_usd,
        trialDays: p.trial_days,
        commissionRate: p.commission_rate,
        platformServiceFeeRate: p.platform_service_fee_rate,
        maxProducts: p.max_products,
        maxStores: p.max_stores,
        maxStaffSeats: p.max_staff_seats,
        maxDropshipImports: p.max_dropship_imports,
        features: p.features,
      })),
    },
  });
});

// POST /api/v1/subscriptions/select-plan
// Called immediately after role selection. STARTER creates subscription directly.
// PRO/GROWTH delegates to initiatePaid flow.
const selectPlan = asyncHandler(async (req, res) => {
  const { tier, billingCycle } = req.body;
  const user = req.user;

  if (user.role !== 'SELLER' && user.role !== 'HYBRID') {
    throw new AppError('Seller role required.', 403, 'ROLE_REQUIRED');
  }

  const business = await findBusinessByOwnerId(user.id);
  if (!business) throw new AppError('Business not found.', 404, 'NOT_FOUND');

  if (tier === 'STARTER') {
    const subscription = await subscriptionService.selectStarterPlan(business.id);
    // onboarding_step is advanced to BUSINESS_SETUP inside selectStarterPlan
    return res.status(201).json({
      success: true,
      data: {
        subscription: { tier: 'STARTER', status: subscription.status, commissionRate: 0.05 },
        nextStep: 'BUSINESS_SETUP',
      },
    });
  }

  // PRO or GROWTH — initiate Flutterwave checkout
  // onboarding_step advances to BUSINESS_SETUP only after the webhook confirms payment
  const result = await subscriptionService.initiatePaidPlanCheckout(
    business.id,
    tier,
    billingCycle,
    user.email,
    `${user.first_name || ''} ${user.last_name || ''}`.trim()
  );

  res.status(200).json({ success: true, data: result });
});

// POST /api/v1/subscriptions/initiate-paid
// Explicit endpoint for starting a paid plan checkout (PRO/GROWTH).
// Returns a Flutterwave hosted checkout URL. Subscription record is created by webhook.
const initiatePaid = asyncHandler(async (req, res) => {
  const { tier, billingCycle } = req.body;
  const user = req.user;

  if (user.role !== 'SELLER' && user.role !== 'HYBRID') {
    throw new AppError('Seller role required.', 403, 'ROLE_REQUIRED');
  }

  const business = await findBusinessByOwnerId(user.id);
  if (!business) throw new AppError('Business not found.', 404, 'NOT_FOUND');

  const result = await subscriptionService.initiatePaidPlanCheckout(
    business.id,
    tier,
    billingCycle,
    user.email,
    `${user.first_name || ''} ${user.last_name || ''}`.trim()
  );

  res.status(200).json({ success: true, data: result });
});

// GET /api/v1/subscriptions/current
const getCurrent = asyncHandler(async (req, res) => {
  const sub = await getSubscriptionByBusinessId(req.businessId);
  if (!sub) throw new AppError('No subscription found.', 404, 'NOT_FOUND');

  const trialEndsAt = sub.trial_ends_at;
  const daysLeftInTrial = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  res.json({
    success: true,
    data: {
      subscription: {
        id: sub.id,
        tier: sub.tier,
        status: sub.status,
        billingCycle: sub.billing_cycle,
        trialEndsAt,
        daysLeftInTrial,
        currentPeriodStart: sub.current_period_start,
        currentPeriodEnd: sub.current_period_end,
        nextBillingDate: sub.next_billing_date,
        nextBillingAmount: sub.next_billing_amount,
        card: sub.card_last4
          ? { last4: sub.card_last4, expiry: sub.card_expiry, brand: sub.card_brand }
          : null,
        features: sub.features,
        limits: {
          maxProducts: sub.max_products,
          maxStaffSeats: sub.max_staff_seats,
          maxDropshipImports: sub.max_dropship_imports,
        },
      },
    },
  });
});

// POST /api/v1/subscriptions/upgrade
const upgrade = asyncHandler(async (req, res) => {
  const { tier, billingCycle } = req.body;
  const result = await subscriptionService.upgradePlan(req.businessId, tier, billingCycle);
  res.json({ success: true, data: result });
});

// POST /api/v1/subscriptions/cancel
const cancel = asyncHandler(async (req, res) => {
  const sub = await subscriptionService.cancelSubscriptionForBusiness(req.businessId);
  res.json({
    success: true,
    data: {
      message: `Cancelled. Access continues until ${sub.current_period_end || 'end of period'}.`,
      accessUntil: sub.current_period_end,
    },
  });
});

module.exports = { getPlans, selectPlan, initiatePaid, getCurrent, upgrade, cancel };
