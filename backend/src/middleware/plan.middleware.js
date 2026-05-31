const AppError = require('../utils/AppError');
const asyncHandler = require('./asyncHandler');
const { getSubscriptionByBusinessId } = require('../db/queries/subscriptions.queries');
const { getImportCountByBusiness } = require('../db/queries/dropshipImports.queries');
const { config } = require('../config/env');

const requireSellerSubscription = asyncHandler(async (req, res, next) => {
  if (!req.businessId) throw new AppError('Business context required.', 403, 'SUBSCRIPTION_REQUIRED');

  const subscription = await getSubscriptionByBusinessId(req.businessId);
  if (!subscription || subscription.status === 'EXPIRED') {
    throw new AppError('Active subscription required.', 403, 'SUBSCRIPTION_REQUIRED');
  }

  req.subscription = subscription;
  req.plan = subscription.plan;
  next();
});

const requirePlanFeature = (featureKey) =>
  asyncHandler(async (req, res, next) => {
    const features = req.plan?.features || {};
    if (!features[featureKey]) {
      throw new AppError(
        `Your current plan does not include this feature. Upgrade to access it.`,
        403,
        'PLAN_LIMIT'
      );
    }
    next();
  });

const checkProductLimit = asyncHandler(async (req, res, next) => {
  const maxProducts = req.plan?.max_products;
  if (maxProducts === null || maxProducts === undefined) return next(); // unlimited

  const { sql } = require('../config/database');
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM products
    WHERE business_id = ${req.businessId} AND deleted_at IS NULL
  `;
  if (count >= maxProducts) {
    throw new AppError(
      `You've reached the product limit (${maxProducts}) for your plan. Upgrade to add more.`,
      403,
      'PLAN_LIMIT'
    );
  }
  next();
});

const checkStaffLimit = asyncHandler(async (req, res, next) => {
  const maxSeats = req.plan?.max_staff_seats;
  if (!maxSeats) return next();

  const { sql } = require('../config/database');
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM staff_members
    WHERE business_id = ${req.businessId} AND status NOT IN ('REMOVED')
  `;
  if (count >= maxSeats) {
    throw new AppError(
      `You've reached the staff seat limit (${maxSeats}) for your plan.`,
      403,
      'PLAN_LIMIT'
    );
  }
  next();
});

const checkDropshipImportLimit = asyncHandler(async (req, res, next) => {
  const maxImports = req.plan?.max_dropship_imports;
  if (maxImports === null || maxImports === undefined) return next();

  const count = await getImportCountByBusiness(req.businessId);
  if (count >= maxImports) {
    throw new AppError(
      `You've reached the dropship import limit (${maxImports}) for your plan.`,
      403,
      'PLAN_LIMIT'
    );
  }
  next();
});

module.exports = {
  requireSellerSubscription,
  requirePlanFeature,
  checkProductLimit,
  checkStaffLimit,
  checkDropshipImportLimit,
};
