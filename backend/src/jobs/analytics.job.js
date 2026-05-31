const { sql } = require('../config/database');

/**
 * Aggregate raw store_events from the previous day into analytics_snapshots.
 * Runs nightly at 2am.
 */
const buildDailySnapshot = async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  const businesses = await sql`SELECT id FROM businesses WHERE is_published = true`;

  for (const { id: businessId } of businesses) {
    const [events] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'PAGE_VIEW') AS page_views,
        COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'PAGE_VIEW') AS unique_visitors,
        COUNT(*) FILTER (WHERE event_type = 'ADD_TO_CART') AS add_to_cart,
        COUNT(*) FILTER (WHERE event_type = 'CHECKOUT_STARTED') AS checkout_started
      FROM store_events
      WHERE business_id = ${businessId}
        AND created_at::date = ${dateStr}::date
    `;

    const [orderStats] = await sql`
      SELECT COUNT(*)::int AS orders_count, COALESCE(SUM(total), 0) AS revenue
      FROM orders
      WHERE business_id = ${businessId}
        AND created_at::date = ${dateStr}::date
        AND payment_status = 'PAID'
    `;

    await sql`
      INSERT INTO analytics_snapshots (
        business_id, snapshot_date, page_views, unique_visitors,
        add_to_cart, checkout_started, orders_count, revenue
      ) VALUES (
        ${businessId}, ${dateStr}::date,
        ${Number(events.page_views) || 0}, ${Number(events.unique_visitors) || 0},
        ${Number(events.add_to_cart) || 0}, ${Number(events.checkout_started) || 0},
        ${orderStats.orders_count || 0}, ${orderStats.revenue || 0}
      )
      ON CONFLICT (business_id, snapshot_date) DO UPDATE SET
        page_views = EXCLUDED.page_views,
        unique_visitors = EXCLUDED.unique_visitors,
        add_to_cart = EXCLUDED.add_to_cart,
        checkout_started = EXCLUDED.checkout_started,
        orders_count = EXCLUDED.orders_count,
        revenue = EXCLUDED.revenue
    `;
  }

  console.log(`[analytics.job] Built daily snapshot for ${dateStr} (${businesses.length} stores)`);
};

module.exports = { buildDailySnapshot };
