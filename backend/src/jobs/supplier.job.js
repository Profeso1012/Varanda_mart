const { sql } = require('../config/database');
const { upsertSupplierMetrics } = require('../db/queries/supplierProfiles.queries');

/**
 * Compute supplier metrics nightly.
 * Updates supplier_metrics and denormalized fields on supplier_profiles.
 */
const computeSupplierMetrics = async () => {
  const suppliers = await sql`SELECT id FROM supplier_profiles WHERE is_active = true`;

  for (const { id: supplierId } of suppliers) {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [orderStats] = await sql`
      SELECT
        COUNT(*)::int AS total_orders,
        COUNT(*) FILTER (WHERE status IN ('DELIVERED'))::int AS fulfilled_orders,
        AVG(EXTRACT(EPOCH FROM (shipped_at - created_at)) / 86400)::numeric(4,1) AS avg_shipping_days
      FROM dropship_orders
      WHERE supplier_id = ${supplierId} AND created_at >= ${cutoff}
    `;

    const [disputeStats] = await sql`
      SELECT COUNT(*)::int AS dispute_count
      FROM supplier_disputes
      WHERE supplier_id = ${supplierId} AND created_at >= ${cutoff}
    `;

    const [reviewStats] = await sql`
      SELECT
        COUNT(*)::int AS review_count,
        AVG(rating)::numeric(3,2) AS avg_rating
      FROM marketplace_product_reviews mpr
      JOIN supplier_products sp ON sp.id = mpr.supplier_product_id
      WHERE sp.supplier_id = ${supplierId}
    `;

    const totalOrders = orderStats.total_orders || 0;
    const fulfilledOrders = orderStats.fulfilled_orders || 0;
    const fulfillmentRate = totalOrders > 0 ? Math.round((fulfilledOrders / totalOrders) * 10000) / 100 : 100;
    const disputeCount = disputeStats.dispute_count || 0;
    const disputeRate = totalOrders > 0 ? Math.round((disputeCount / totalOrders) * 10000) / 100 : 0;

    await upsertSupplierMetrics(supplierId, {
      periodDays: 30,
      totalOrders,
      fulfilledOrders,
      fulfillmentRate,
      avgShippingDays: Number(orderStats.avg_shipping_days) || 0,
      disputeCount,
      disputeRate,
      avgRating: Number(reviewStats.avg_rating) || 5,
      reviewCount: reviewStats.review_count || 0,
    });

    // Update denormalized fields on supplier_profiles
    await sql`
      UPDATE supplier_profiles
      SET fulfillment_rate = ${fulfillmentRate},
          avg_shipping_days = ${Number(orderStats.avg_shipping_days) || 0},
          dispute_rate = ${disputeRate},
          updated_at = NOW()
      WHERE id = ${supplierId}
    `;
  }

  console.log(`[supplier.job] Computed metrics for ${suppliers.length} supplier(s)`);
};

module.exports = { computeSupplierMetrics };
