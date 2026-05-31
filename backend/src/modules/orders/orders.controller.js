const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const { getPaginationMeta, getPaginationParams } = require('../../utils/paginate');

const {
  listOrdersByBusiness, findOrderById, updateOrderStatus, getOrderStats,
} = require('../../db/queries/orders.queries');

// Valid status transitions for seller
const VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

// ─── GET /orders/stats ────────────────────────────────────────────────────────

const getStats = asyncHandler(async (req, res) => {
  const stats = await getOrderStats(req.businessId);
  res.json({ success: true, data: stats });
});

// ─── GET /orders ──────────────────────────────────────────────────────────────

const listOrders = asyncHandler(async (req, res) => {
  const { page, perPage } = getPaginationParams(req.query);
  const { status, search } = req.query;

  const { rows, total } = await listOrdersByBusiness(req.businessId, { status, search, page, perPage });
  res.json({
    success: true,
    data: { orders: rows },
    meta: getPaginationMeta(total, page, perPage),
  });
});

// ─── GET /orders/:orderId ─────────────────────────────────────────────────────

const getOrder = asyncHandler(async (req, res) => {
  const order = await findOrderById(req.params.orderId, req.businessId);
  if (!order) throw new AppError('Order not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: order });
});

// ─── PUT /orders/:orderId/status ──────────────────────────────────────────────

const updateStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber, trackingUrl, sellerNote } = req.body;
  if (!status) throw new AppError('status is required.', 422, 'VALIDATION_ERROR');

  const order = await findOrderById(req.params.orderId, req.businessId);
  if (!order) throw new AppError('Order not found.', 404, 'NOT_FOUND');

  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    throw new AppError(
      `Cannot transition from ${order.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}.`,
      400,
      'INVALID_TRANSITION'
    );
  }

  const updated = await updateOrderStatus(order.id, status, { trackingNumber, trackingUrl, sellerNote });
  res.json({ success: true, data: updated });
});

// ─── POST /orders/:orderId/cancel ─────────────────────────────────────────────

const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await findOrderById(req.params.orderId, req.businessId);
  if (!order) throw new AppError('Order not found.', 404, 'NOT_FOUND');

  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw new AppError('Only PENDING or CONFIRMED orders can be cancelled.', 400, 'INVALID_TRANSITION');
  }

  const updated = await updateOrderStatus(order.id, 'CANCELLED', {
    cancelledAt: new Date(),
    cancellationReason: reason || null,
  });
  res.json({ success: true, data: updated });
});

// ─── POST /orders/:orderId/ship ───────────────────────────────────────────────

const shipOrder = asyncHandler(async (req, res) => {
  const { trackingNumber, trackingUrl, carrierName } = req.body;
  const order = await findOrderById(req.params.orderId, req.businessId);
  if (!order) throw new AppError('Order not found.', 404, 'NOT_FOUND');

  if (order.status !== 'PROCESSING') {
    throw new AppError('Order must be in PROCESSING status to mark as shipped.', 400, 'INVALID_TRANSITION');
  }

  const updated = await updateOrderStatus(order.id, 'SHIPPED', { trackingNumber, trackingUrl });
  res.json({ success: true, data: updated });
});

// ─── GET /orders/:orderId/shipment ────────────────────────────────────────────

const getShipment = asyncHandler(async (req, res) => {
  const order = await findOrderById(req.params.orderId, req.businessId);
  if (!order) throw new AppError('Order not found.', 404, 'NOT_FOUND');

  const { sql } = require('../../config/database');
  const [shipment] = await sql`SELECT * FROM shipments WHERE order_id = ${order.id} LIMIT 1`;

  res.json({
    success: true,
    data: {
      trackingNumber: order.tracking_number,
      trackingUrl: order.tracking_url,
      shipment: shipment || null,
    },
  });
});

module.exports = { getStats, listOrders, getOrder, updateStatus, cancelOrder, shipOrder, getShipment };
