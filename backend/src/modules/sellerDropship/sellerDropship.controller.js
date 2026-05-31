const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const { getPaginationMeta, getPaginationParams } = require('../../utils/paginate');
const escrowService = require('../../services/escrow.service');

const {
  getDropshipOrdersByBusiness, findDropshipOrderById,
  setSellerConfirmationStatus, createDispute, findDisputeByDropshipOrder,
} = require('../../db/queries/dropshipOrders.queries');

// ─── GET /seller/dropship-orders ──────────────────────────────────────────────

const listDropshipOrders = asyncHandler(async (req, res) => {
  const { page, perPage } = getPaginationParams(req.query);
  const { status, sellerConfirmationStatus } = req.query;

  const { rows, total } = await getDropshipOrdersByBusiness(req.businessId, {
    status,
    sellerConfirmationStatus,
    page,
    perPage,
  });

  res.json({
    success: true,
    data: { orders: rows },
    meta: getPaginationMeta(total, page, perPage),
  });
});

// ─── GET /seller/dropship-orders/:dropshipOrderId ─────────────────────────────

const getDropshipOrder = asyncHandler(async (req, res) => {
  const order = await findDropshipOrderById(req.params.dropshipOrderId);
  if (!order || order.business_id !== req.businessId) {
    throw new AppError('Dropship order not found.', 404, 'NOT_FOUND');
  }
  res.json({ success: true, data: order });
});

// ─── PUT /seller/dropship-orders/:dropshipOrderId/confirm ─────────────────────

/**
 * Seller confirms the supplier shipped the order.
 * Triggers escrow release → Paystack Transfer to supplier.
 */
const confirmDropshipOrder = asyncHandler(async (req, res) => {
  const order = await findDropshipOrderById(req.params.dropshipOrderId);
  if (!order || order.business_id !== req.businessId) {
    throw new AppError('Dropship order not found.', 404, 'NOT_FOUND');
  }

  if (order.status !== 'SHIPPED') {
    throw new AppError(
      'Supplier must mark the order as shipped before you can confirm.',
      400,
      'INVALID_STATUS'
    );
  }

  if (order.seller_confirmation_status !== 'PENDING') {
    throw new AppError(
      `Order confirmation status is already ${order.seller_confirmation_status}.`,
      400,
      'ALREADY_ACTIONED'
    );
  }

  const result = await escrowService.releaseEscrowToSupplier(order.id);

  res.json({
    success: true,
    data: {
      dropshipOrder: {
        status: 'DELIVERED',
        sellerConfirmationStatus: 'CONFIRMED',
      },
      revenueSplit: {
        supplierReceived: result.supplierReceived,
        transferCode: result.transferCode,
      },
      message: `Escrow released. Supplier has been paid ₦${Number(result.supplierReceived).toLocaleString()}.`,
    },
  });
});

// ─── PUT /seller/dropship-orders/:dropshipOrderId/dispute ─────────────────────

/**
 * Seller raises a dispute — freezes escrow, alerts admin.
 * Body: { reason, description, evidenceUrls? }
 */
const disputeDropshipOrder = asyncHandler(async (req, res) => {
  const { reason, description, evidenceUrls } = req.body;
  if (!reason) throw new AppError('reason is required.', 422, 'VALIDATION_ERROR');
  if (!description) throw new AppError('description is required.', 422, 'VALIDATION_ERROR');

  const order = await findDropshipOrderById(req.params.dropshipOrderId);
  if (!order || order.business_id !== req.businessId) {
    throw new AppError('Dropship order not found.', 404, 'NOT_FOUND');
  }

  if (order.seller_confirmation_status !== 'PENDING') {
    throw new AppError(
      `Cannot dispute — confirmation status is already ${order.seller_confirmation_status}.`,
      400,
      'ALREADY_ACTIONED'
    );
  }

  if (order.status !== 'SHIPPED') {
    throw new AppError(
      'Can only dispute after the supplier has marked the order as shipped.',
      400,
      'INVALID_STATUS'
    );
  }

  // Check no existing dispute
  const existing = await findDisputeByDropshipOrder(order.id);
  if (existing) throw new AppError('A dispute already exists for this order.', 409, 'DISPUTE_EXISTS');

  // Freeze escrow
  await escrowService.freezeEscrow(order.id);

  // Create dispute record
  const dispute = await createDispute({
    dropshipOrderId: order.id,
    raisedByRole: 'SELLER',
    raisedById: req.userId,
    supplierId: order.supplier_id,
    reason,
    description,
    evidenceUrls: evidenceUrls || [],
  });

  res.json({
    success: true,
    data: {
      dispute: { id: dispute.id, status: 'OPEN', reason, description },
      dropshipOrder: { sellerConfirmationStatus: 'DISPUTED' },
      message: 'Dispute raised. Escrow is frozen. Admin has been notified.',
    },
  });
});

module.exports = { listDropshipOrders, getDropshipOrder, confirmDropshipOrder, disputeDropshipOrder };
