/**
 * Dropship Order Service — Full implementation in Phase 4 & 7.
 * Handles seller/developer confirm and dispute flows.
 */

const AppError = require('../utils/AppError');
const escrowService = require('./escrow.service');
const partnerWebhookService = require('./partnerWebhook.service');
const { findDropshipOrderById, createDispute, updateDropshipOrderStatus } = require('../db/queries/dropshipOrders.queries');
const { findDeveloperById } = require('../db/queries/developerProfiles.queries');

/**
 * Seller confirms delivery → release escrow to supplier.
 */
const confirmSellerOrder = async (dropshipOrderId, confirmedByBusinessId) => {
  const order = await findDropshipOrderById(dropshipOrderId);
  if (!order) throw new AppError('Dropship order not found.', 404, 'NOT_FOUND');
  if (order.business_id !== confirmedByBusinessId) throw new AppError('Not your order.', 403, 'FORBIDDEN');
  if (order.status !== 'SHIPPED' && order.seller_confirmation_status !== 'PENDING') {
    throw new AppError('Order is not awaiting confirmation.', 400, 'INVALID_STATUS');
  }

  return escrowService.releaseEscrowToSupplier(dropshipOrderId);
};

/**
 * Developer confirms delivery → release escrow to supplier + release developer margin.
 */
const confirmDeveloperOrder = async (dropshipOrderId, developerId) => {
  const order = await findDropshipOrderById(dropshipOrderId);
  if (!order) throw new AppError('Dropship order not found.', 404, 'NOT_FOUND');
  if (order.developer_id !== developerId) throw new AppError('Not your order.', 403, 'FORBIDDEN');

  const result = await escrowService.releaseEscrowToSupplier(dropshipOrderId);
  await escrowService.releaseDeveloperMargin(dropshipOrderId, developerId).catch(() => {});

  // Fire order.delivered webhook
  partnerWebhookService
    .dispatchWebhookEvent(developerId, 'order.delivered', { orderId: order.order_id, dropshipOrderId })
    .catch(() => {});

  return result;
};

/**
 * Seller raises a dispute — freeze escrow, create dispute record.
 */
const raiseSellerDispute = async (dropshipOrderId, businessId, data) => {
  const order = await findDropshipOrderById(dropshipOrderId);
  if (!order) throw new AppError('Dropship order not found.', 404, 'NOT_FOUND');
  if (order.business_id !== businessId) throw new AppError('Not your order.', 403, 'FORBIDDEN');
  if (order.seller_confirmation_status !== 'PENDING') {
    throw new AppError('Order is not awaiting confirmation.', 400, 'INVALID_STATUS');
  }

  await escrowService.freezeEscrow(dropshipOrderId);

  const dispute = await createDispute({
    dropshipOrderId,
    raisedByRole: 'SELLER',
    raisedById: businessId,
    supplierId: order.supplier_id,
    reason: data.reason,
    description: data.description,
    evidenceUrls: data.evidenceUrls || [],
  });

  return dispute;
};

/**
 * Developer raises a dispute — freeze escrow, create dispute record.
 */
const raiseDeveloperDispute = async (dropshipOrderId, developerId, data) => {
  const order = await findDropshipOrderById(dropshipOrderId);
  if (!order) throw new AppError('Dropship order not found.', 404, 'NOT_FOUND');
  if (order.developer_id !== developerId) throw new AppError('Not your order.', 403, 'FORBIDDEN');

  await escrowService.freezeEscrow(dropshipOrderId);

  const dispute = await createDispute({
    dropshipOrderId,
    raisedByRole: 'DEVELOPER',
    raisedById: developerId,
    supplierId: order.supplier_id,
    reason: data.reason,
    description: data.description,
    evidenceUrls: data.evidenceUrls || [],
  });

  return dispute;
};

/**
 * Create an external API order (POST /ext/v1/orders) — Phase 7.
 */
const createExternalApiOrder = async (data, developer) => {
  throw new AppError('External API orders not yet implemented.', 501, 'NOT_IMPLEMENTED');
};

module.exports = {
  confirmSellerOrder,
  confirmDeveloperOrder,
  raiseSellerDispute,
  raiseDeveloperDispute,
  createExternalApiOrder,
};
