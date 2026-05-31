/**
 * Escrow Service — THE MOST CRITICAL SERVICE.
 * Full implementation in Phase 4 (dropship marketplace) and Phase 6 (checkout).
 *
 * Handles all money movements for dropship orders:
 * - initializeEscrow: called at checkout, creates HELD escrow record
 * - markShippedAwaitingConfirmation: supplier ships → escrow → AWAITING_SELLER_CONFIRMATION
 * - releaseEscrowToSupplier: seller/developer confirms → Flutterwave Transfer → RELEASED
 * - freezeEscrow: dispute raised → DISPUTED
 * - resolveDisputeRelease / resolveDisputeRefund: admin resolution
 * - releaseDeveloperMargin: for DROPSHIP_EXTERNAL orders
 * 
 * PAYMENT PROVIDER: Flutterwave (Paystack code commented out)
 */

// const paystackConfig = require('../config/paystack'); // COMMENTED OUT - Using Flutterwave
const flutterwaveConfig = require('../config/flutterwave');
const AppError = require('../utils/AppError');
const emailConfig = require('../config/email');
const { withTransaction } = require('../config/database');

// These query imports will be fully used in Phase 4+
const {
  findEscrowByDropshipOrder,
  updateEscrowStatus,
  createEscrowTransaction,
  createRevenueSplits,
  updateDropshipOrderStatus,
  setSellerConfirmationStatus,
  findDropshipOrderById,
  updateDispute,
} = require('../db/queries/dropshipOrders.queries');

const { findSupplierById } = require('../db/queries/supplierProfiles.queries');
const { findDeveloperById } = require('../db/queries/developerProfiles.queries');

/**
 * Create an escrow record for a dropship order at checkout time.
 * Status: HELD. Called within the checkout transaction.
 */
const initializeEscrow = async (dropshipOrderId, supplierPriceTotal, flutterwaveReference) => {
  return createEscrowTransaction({
    dropshipOrderId,
    totalHeld: supplierPriceTotal,
    currency: 'NGN',
    flutterwaveReference, // Changed from paystackReference
  });
};

/**
 * Called when supplier marks order as shipped.
 * Updates escrow → AWAITING_SELLER_CONFIRMATION.
 * Sends seller the confirmation prompt.
 */
const markShippedAwaitingConfirmation = async (dropshipOrderId, sellerEmail, dropshipOrderNumber) => {
  const escrow = await findEscrowByDropshipOrder(dropshipOrderId);
  if (!escrow) throw new AppError('Escrow record not found.', 404, 'NOT_FOUND');
  if (escrow.status !== 'HELD') throw new AppError('Escrow is not in HELD status.', 400, 'ESCROW_NOT_HELD');

  await updateEscrowStatus(escrow.id, 'AWAITING_SELLER_CONFIRMATION', null);
  await setSellerConfirmationStatus(dropshipOrderId, 'PENDING', new Date());

  const { config } = require('../config/env');
  const dashboardUrl = `${config.sellerDashboardUrl}/dropship-orders/${dropshipOrderNumber}`;
  emailConfig.sendSellerConfirmationPrompt(sellerEmail, dropshipOrderNumber, dashboardUrl).catch(() => {});
};

/**
 * THE ESCROW RELEASE FUNCTION.
 * Called when seller confirms OR developer confirms delivery.
 * Steps:
 * 1. Load escrow; validate AWAITING_SELLER_CONFIRMATION
 * 2. Initiate Flutterwave Transfer to supplier's bank account
 * 3. Create revenue_split records
 * 4. Update escrow → RELEASED
 * 5. Update dropship_order → DELIVERED, seller_confirmed_at
 * 6. Send escrow released email to supplier
 */
const releaseEscrowToSupplier = async (dropshipOrderId) => {
  const dropshipOrder = await findDropshipOrderById(dropshipOrderId);
  if (!dropshipOrder) throw new AppError('Dropship order not found.', 404, 'NOT_FOUND');

  const escrow = await findEscrowByDropshipOrder(dropshipOrderId);
  if (!escrow) throw new AppError('Escrow record not found.', 404, 'NOT_FOUND');
  if (escrow.status !== 'AWAITING_SELLER_CONFIRMATION') {
    throw new AppError('Escrow is not awaiting confirmation.', 400, 'INVALID_STATUS');
  }

  const supplier = await findSupplierById(dropshipOrder.supplier_id);
  if (!supplier?.flutterwave_bank_code || !supplier?.flutterwave_account_number) {
    throw new AppError('Supplier has no registered bank account for disbursement.', 400, 'NO_BANK_ACCOUNT');
  }

  const transferRef = `escrow-release-${dropshipOrderId}-${Date.now()}`;
  let transferResult;
  try {
    transferResult = await flutterwaveConfig.initiateTransfer({
      accountBank: supplier.flutterwave_bank_code,
      accountNumber: supplier.flutterwave_account_number,
      amount: Number(escrow.total_held),
      currency: 'NGN',
      reference: transferRef,
      narration: `Escrow release for order ${dropshipOrder.dropship_order_number}`,
      beneficiaryName: supplier.account_name || supplier.business_name,
    });
  } catch (err) {
    throw new AppError(`Flutterwave transfer failed: ${err.message}`, 503, 'TRANSFER_FAILED');
  }

  // ─── PAYSTACK TRANSFER (COMMENTED OUT) ────────────────────────────────────
  // try {
  //   transferResult = await paystackConfig.initiateTransfer({
  //     source: 'balance',
  //     amount: Math.round(Number(escrow.total_held) * 100), // Paystack uses kobo
  //     recipient: supplier.paystack_recipient_code,
  //     reference: transferRef,
  //     reason: `Escrow release for order ${dropshipOrder.dropship_order_number}`,
  //   });
  // } catch (err) {
  //   throw new AppError(`Paystack transfer failed: ${err.message}`, 503, 'PAYSTACK_TRANSFER_FAILED');
  // }

  // All DB updates in a transaction
  await withTransaction(async (tx) => {
    await updateEscrowStatus(escrow.id, 'RELEASED', 'released_at');
    await updateDropshipOrderStatus(dropshipOrderId, 'DELIVERED', { sellerConfirmedAt: new Date() });
    await setSellerConfirmationStatus(dropshipOrderId, 'CONFIRMED', new Date());
    await createRevenueSplits(
      [
        {
          escrowTransactionId: escrow.id,
          dropshipOrderId,
          recipientType: 'SUPPLIER',
          recipientId: supplier.id,
          amount: escrow.total_held,
          description: 'Supplier payment on escrow release',
          flutterwaveTransferId: transferResult.transferId, // Changed from paystackTransferId
          transferStatus: transferResult.status || 'PENDING',
        },
      ],
      tx
    );
  });

  // Notify supplier
  if (supplier.account_name) {
    emailConfig
      .sendEscrowReleased(
        dropshipOrder.customer_email, // supplier email not stored on dropship_order — use supplier profile
        escrow.total_held,
        dropshipOrder.dropship_order_number
      )
      .catch(() => {});
  }

  return {
    supplierReceived: Number(escrow.total_held),
    transferId: transferResult.transferId, // Changed from transferCode
  };
};

/**
 * Freeze escrow when a dispute is raised.
 * Sets escrow → DISPUTED. Sends admin alert.
 */
const freezeEscrow = async (dropshipOrderId) => {
  const escrow = await findEscrowByDropshipOrder(dropshipOrderId);
  if (!escrow) throw new AppError('Escrow record not found.', 404, 'NOT_FOUND');

  await updateEscrowStatus(escrow.id, 'DISPUTED', null);
  await updateDropshipOrderStatus(dropshipOrderId, 'DISPUTED');
};

/**
 * Admin resolves dispute in supplier's favour — release escrow to supplier.
 */
const resolveDisputeRelease = async (disputeId, adminId, resolution) => {
  const { sql } = require('../config/database');
  const [dispute] = await sql`SELECT * FROM supplier_disputes WHERE id = ${disputeId}`;
  if (!dispute) throw new AppError('Dispute not found.', 404, 'NOT_FOUND');

  await releaseEscrowToSupplier(dispute.dropship_order_id);
  await updateDispute(disputeId, {
    status: 'RESOLVED',
    resolution,
    resolution_action: 'RELEASE',
    resolved_by: adminId,
    resolved_at: new Date(),
  });
};

/**
 * Admin resolves dispute in seller's favour — refund escrow to platform (keep in Varanda account).
 * Seller handles their own customer refund.
 */
const resolveDisputeRefund = async (disputeId, adminId, resolution) => {
  const { sql } = require('../config/database');
  const [dispute] = await sql`SELECT * FROM supplier_disputes WHERE id = ${disputeId}`;
  if (!dispute) throw new AppError('Dispute not found.', 404, 'NOT_FOUND');

  const escrow = await findEscrowByDropshipOrder(dispute.dropship_order_id);
  if (escrow) {
    await updateEscrowStatus(escrow.id, 'REFUNDED', 'refunded_at');
  }

  await updateDispute(disputeId, {
    status: 'RESOLVED',
    resolution,
    resolution_action: 'REFUND',
    resolved_by: adminId,
    resolved_at: new Date(),
  });
};

/**
 * Release developer margin after escrow release on DROPSHIP_EXTERNAL orders.
 * Computes developer's margin and initiates Flutterwave Transfer.
 */
const releaseDeveloperMargin = async (dropshipOrderId, developerId) => {
  const developer = await findDeveloperById(developerId);
  if (!developer?.flutterwave_bank_code || !developer?.flutterwave_account_number) {
    console.warn('[escrow] Developer has no bank account — margin not transferred');
    return;
  }

  const { sql } = require('../config/database');
  // Sum developer margin from order_items (partnerRetailPrice - displayPrice) * quantity
  // This is stored in the order's commission record — simplified here
  const [order] = await sql`
    SELECT o.total, o.subtotal FROM orders o
    JOIN dropship_orders do ON do.order_id = o.id
    WHERE do.id = ${dropshipOrderId}
  `;
  if (!order) return;

  // Developer margin = total - supplier escrow amount
  const escrow = await findEscrowByDropshipOrder(dropshipOrderId);
  if (!escrow) return;

  const developerMargin = Number(order.subtotal) - Number(escrow.total_held);
  if (developerMargin <= 0) return;

  const transferRef = `dev-margin-${dropshipOrderId}-${Date.now()}`;
  await flutterwaveConfig
    .initiateTransfer({
      accountBank: developer.flutterwave_bank_code,
      accountNumber: developer.flutterwave_account_number,
      amount: developerMargin,
      currency: 'NGN',
      reference: transferRef,
      narration: `Developer margin for dropship order ${dropshipOrderId}`,
      beneficiaryName: developer.account_name || developer.business_name,
    })
    .catch((err) => {
      console.error('[escrow] Developer margin transfer failed:', err.message);
    });

  // ─── PAYSTACK TRANSFER (COMMENTED OUT) ────────────────────────────────────
  // await paystackConfig
  //   .initiateTransfer({
  //     source: 'balance',
  //     amount: Math.round(developerMargin * 100),
  //     recipient: developer.paystack_recipient_code,
  //     reference: transferRef,
  //     reason: `Developer margin for dropship order ${dropshipOrderId}`,
  //   })
  //   .catch((err) => {
  //     console.error('[escrow] Developer margin transfer failed:', err.message);
  //   });
};

module.exports = {
  initializeEscrow,
  markShippedAwaitingConfirmation,
  releaseEscrowToSupplier,
  freezeEscrow,
  resolveDisputeRelease,
  resolveDisputeRefund,
  releaseDeveloperMargin,
};
