/**
 * Checkout Service — Phase 6 full implementation.
 *
 * Handles:
 * - computeOrderTotals: pure function for subtotal/shipping/discount/service fee/commission
 * - buildFlutterwaveSplit: constructs Flutterwave subaccount split config
 * - initiateCheckout: creates order, escrow (for dropship), payment URL
 * - handleFlutterwaveWebhook: processes charge.completed with DIRECT vs DROPSHIP settlement
 * 
 * PAYMENT PROVIDER: Flutterwave (Paystack code commented out for reference)
 * 
 * TEST ACCOUNTS:
 * - Flutterwave recognizes test transactions when using test secret key
 * - Test cards: 5531886652142950 (successful), 5531886652142951 (failed)
 * - Test email suffix: Use any email with test secret key
 */

const crypto = require('crypto');
const { config } = require('../config/env');
const AppError = require('../utils/AppError');
// const paystackConfig = require('../config/paystack'); // COMMENTED OUT - Using Flutterwave
const flutterwaveConfig = require('../config/flutterwave');
const emailConfig = require('../config/email');
const { withTransaction, sql } = require('../config/database');
const escrowService = require('./escrow.service');
const subscriptionService = require('./subscription.service');

const {
  generateOrderNumber, createOrder, createOrderItems,
  findOrderByNumber, findOrderByNumberFull,
  updateOrderStatus, updateOrderPaymentStatus,
  createPayment, findPaymentByReference, updatePaymentStatus,
  recordWebhookEvent, findWebhookByReference, markWebhookProcessed,
  createCommission, recordDiscountUsage,
} = require('../db/queries/orders.queries');

const {
  generateDropshipOrderNumber, createDropshipOrder, createDropshipOrderItems,
  createEscrowTransaction,
} = require('../db/queries/dropshipOrders.queries');

const { findDropshipImportById } = require('../db/queries/dropshipImports.queries');
const { findProductById } = require('../db/queries/products.queries');
const { findVariantById } = require('../db/queries/variants.queries');
const { getBankAccount } = require('../db/queries/businesses.queries');
const { findDiscountByCode } = require('../db/queries/discounts.queries');
const { findShippingRateById } = require('../db/queries/shipping.queries');
const { updateLastSaleAt } = require('../db/queries/businesses.queries');

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const computeOrderTotals = (cartItems, shippingRate, discountCode, commissionRate) => {
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);
  const shippingFee = shippingRate ? Number(shippingRate.flat_rate || 0) : 0;

  let discountAmount = 0;
  if (discountCode) {
    if (discountCode.type === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * Number(discountCode.value)) / 100 * 100) / 100;
    } else if (discountCode.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(Number(discountCode.value), subtotal);
    }
    // FREE_SHIPPING handled via shippingFee = 0 at checkout
  }

  const taxableAmount = subtotal - discountAmount;
  const serviceFee = Math.round(taxableAmount * config.platformServiceFeeRate * 100) / 100;
  const commission = Math.round(taxableAmount * (commissionRate || 0) * 100) / 100;
  const total = taxableAmount + shippingFee + serviceFee;

  return { subtotal, shippingFee, discountAmount, serviceFee, commission, total };
};

// ─── PAYSTACK SPLIT (COMMENTED OUT) ───────────────────────────────────────────
// const buildPaystackSplit = (subaccountCode, sellerNetAmount) => {
//   if (!subaccountCode) return null;
//   return {
//     type: 'flat',
//     bearer_type: 'account',
//     subaccounts: [
//       {
//         subaccount: subaccountCode,
//         share: Math.round(sellerNetAmount * 100), // kobo
//       },
//     ],
//   };
// };

// ─── FLUTTERWAVE SPLIT ────────────────────────────────────────────────────────

/**
 * Build Flutterwave subaccount split configuration
 * @param {string} subaccountId - Flutterwave subaccount ID
 * @param {number} sellerNetAmount - Amount to split to seller
 * @returns {array|null} Subaccount split array or null
 */
const buildFlutterwaveSplit = (subaccountId, sellerNetAmount) => {
  if (!subaccountId) return null;
  return [
    {
      id: subaccountId,
      transaction_split_ratio: sellerNetAmount, // Flutterwave uses actual amount, not percentage
      transaction_charge_type: 'flat',
      transaction_charge: 0,
    },
  ];
};

// ─── Checkout initiation ──────────────────────────────────────────────────────

/**
 * Main checkout function.
 * Creates order + order_items + payment record + escrow (for dropship items).
 * Returns Flutterwave payment URL.
 *
 * @param {string} tenantBusinessId
 * @param {object} cart - { id, items: [...] }
 * @param {object} checkoutData - { customerEmail, customerName, shippingAddress, shippingRateId, discountCode?, customerNote?, customerId? }
 */
const initiateCheckout = async (tenantBusinessId, cart, checkoutData) => {
  const {
    customerEmail, customerName, shippingAddress,
    shippingRateId, discountCode: discountCodeStr,
    customerNote, customerId,
  } = checkoutData;

  if (!cart.items || cart.items.length === 0) {
    throw new AppError('Cart is empty.', 400, 'EMPTY_CART');
  }

  // Load shipping rate — supports both manual DB rates and Shipbubble live rates
  let shippingRate = null;
  let shippingZoneId = null;
  if (shippingRateId) {
    // Try DB first (manual rate — UUID)
    shippingRate = await findShippingRateById(shippingRateId);
    if (shippingRate) {
      shippingZoneId = shippingRate.zone_id;
    } else if (checkoutData.shippingRateAmount !== undefined) {
      // Shipbubble live rate — no DB record, amount passed directly from frontend
      shippingRate = {
        flat_rate: checkoutData.shippingRateAmount,
        rate_type: 'FLAT',
        zone_id: null,
        source: 'SHIPBUBBLE',
        serviceCode: shippingRateId,
      };
    } else {
      throw new AppError('Shipping rate not found.', 400, 'INVALID_SHIPPING_RATE');
    }
  }

  // Load and validate discount code
  let discountCodeRecord = null;
  if (discountCodeStr) {
    discountCodeRecord = await findDiscountByCode(discountCodeStr, tenantBusinessId);
    if (!discountCodeRecord || !discountCodeRecord.is_active) {
      throw new AppError('Invalid or inactive discount code.', 400, 'INVALID_DISCOUNT_CODE');
    }
    const now = new Date();
    if (discountCodeRecord.starts_at && new Date(discountCodeRecord.starts_at) > now) {
      throw new AppError('Discount code is not yet active.', 400, 'DISCOUNT_NOT_ACTIVE');
    }
    if (discountCodeRecord.expires_at && new Date(discountCodeRecord.expires_at) < now) {
      throw new AppError('Discount code has expired.', 400, 'DISCOUNT_EXPIRED');
    }
    if (discountCodeRecord.usage_limit && discountCodeRecord.used_count >= discountCodeRecord.usage_limit) {
      throw new AppError('Discount code usage limit reached.', 400, 'DISCOUNT_LIMIT_REACHED');
    }
  }

  // Get commission rate for this business
  const commissionRate = await subscriptionService.getCommissionRate(tenantBusinessId);

  // Compute totals
  const { subtotal, shippingFee, discountAmount, serviceFee, commission, total } =
    computeOrderTotals(cart.items, shippingRate, discountCodeRecord, commissionRate);

  // Determine order type — any dropship item makes it DROPSHIP_INAPP
  const hasDropship = cart.items.some((item) => item.dropship_import_id);
  const orderType = hasDropship ? 'DROPSHIP_INAPP' : 'DIRECT';

  // Build order items with snapshots
  const orderItemsData = [];
  const dropshipGroups = {}; // supplierId → { items, supplierPriceTotal }

  for (const cartItem of cart.items) {
    const product = cartItem.product_id
      ? await findProductById(cartItem.product_id, tenantBusinessId)
      : null;
    const variant = cartItem.variant_id
      ? await findVariantById(cartItem.variant_id, cartItem.product_id)
      : null;

    const productSnapshot = product ? {
      id: product.id, name: product.name, slug: product.slug,
      imageUrl: cartItem.product_image || null,
    } : {};

    const variantSnapshot = variant ? {
      id: variant.id, sku: variant.sku,
      optionValues: variant.option_values || [],
    } : null;

    let itemType = 'OWN';
    let supplierProductId = null;
    let supplierVariantId = null;
    let supplierUnitPrice = null;

    if (cartItem.dropship_import_id) {
      itemType = 'DROPSHIP';
      const importRecord = await findDropshipImportById(cartItem.dropship_import_id, tenantBusinessId);
      if (importRecord) {
        // Get supplier product info from the import
        const [spRow] = await sql`
          SELECT sp.id AS supplier_product_id, sp.supplier_price,
                 sp.supplier_id,
                 spr.id AS supplier_profile_id
          FROM dropship_imports di
          JOIN supplier_products sp ON sp.id = di.supplier_product_id
          JOIN supplier_profiles spr ON spr.id = sp.supplier_id
          WHERE di.id = ${cartItem.dropship_import_id}
        `;
        if (spRow) {
          supplierProductId = spRow.supplier_product_id;
          supplierUnitPrice = Number(spRow.supplier_price);

          // Group by supplier for dropship order creation
          const supplierId = spRow.supplier_profile_id;
          if (!dropshipGroups[supplierId]) {
            dropshipGroups[supplierId] = { items: [], supplierPriceTotal: 0, supplierId };
          }
          dropshipGroups[supplierId].items.push({
            supplierProductId,
            supplierVariantId: null, // variant mapping handled separately
            productSnapshot,
            variantSnapshot,
            quantity: cartItem.quantity,
            supplierUnitPrice,
            supplierTotal: supplierUnitPrice * cartItem.quantity,
          });
          dropshipGroups[supplierId].supplierPriceTotal += supplierUnitPrice * cartItem.quantity;
        }
      }
    }

    orderItemsData.push({
      productId: cartItem.product_id,
      variantId: cartItem.variant_id,
      supplierProductId,
      supplierVariantId,
      dropshipImportId: cartItem.dropship_import_id,
      productSnapshot,
      variantSnapshot,
      quantity: cartItem.quantity,
      unitPrice: cartItem.unit_price,
      totalPrice: Number(cartItem.unit_price) * cartItem.quantity,
      itemType,
    });
  }

  // Get seller's bank account for split
  const bankAccount = await getBankAccount(tenantBusinessId);
  const flutterwaveSubaccountId = bankAccount?.flutterwave_subaccount_id;

  // Seller net = total - service_fee - commission (what goes to seller's subaccount)
  const sellerNet = total - serviceFee - commission;
  const subaccounts = flutterwaveSubaccountId && sellerNet > 0
    ? buildFlutterwaveSplit(flutterwaveSubaccountId, sellerNet)
    : null;

  const paymentReference = `VRD-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  const callbackUrl = `${config.sellerDashboardUrl}/checkout/callback`;

  // Initialize Flutterwave payment
  const flutterwaveResult = await flutterwaveConfig.initializePayment({
    txRef: paymentReference,
    amount: total,
    currency: 'NGN',
    redirectUrl: callbackUrl,
    customerEmail,
    customerName,
    meta: {
      businessId: tenantBusinessId,
      customerId: customerId || null,
      cartId: cart.id,
      orderType,
    },
    subaccounts,
  });

  // ─── PAYSTACK INITIALIZATION (COMMENTED OUT) ────────────────────────────────
  // const paystackResult = await paystackConfig.initializeTransaction({
  //   email: customerEmail,
  //   amount: Math.round(total * 100), // kobo
  //   reference: paymentReference,
  //   callbackUrl,
  //   metadata: {
  //     businessId: tenantBusinessId,
  //     customerId: customerId || null,
  //     cartId: cart.id,
  //     orderType,
  //   },
  //   split,
  // });

  // Create order + items + payment in a transaction
  let createdOrder;
  await withTransaction(async (tx) => {
    const orderNumber = await generateOrderNumber();
    createdOrder = await createOrder({
      orderNumber,
      businessId: tenantBusinessId,
      customerId: customerId || null,
      customerEmail,
      customerName,
      shippingAddress,
      orderType,
      subtotal,
      shippingFee,
      discountAmount,
      serviceFee,
      total,
      currency: 'NGN',
      shippingZoneId,
      shippingRateId: shippingRateId || null,
      discountCodeId: discountCodeRecord?.id || null,
      customerNote,
    }, tx);

    await createOrderItems(createdOrder.id, orderItemsData, tx);

    await createPayment({
      orderId: createdOrder.id,
      provider: 'FLUTTERWAVE', // Changed from PAYSTACK
      reference: paymentReference,
      amount: total,
      currency: 'NGN',
    }, tx);

    // Create dropship orders + escrow records for each supplier group
    for (const group of Object.values(dropshipGroups)) {
      const dropshipOrderNumber = await generateDropshipOrderNumber();
      const dropshipOrder = await createDropshipOrder({
        orderId: createdOrder.id,
        supplierId: group.supplierId,
        businessId: tenantBusinessId,
        dropshipOrderNumber,
        status: 'PENDING',
        sellerConfirmationStatus: 'PENDING',
        customerName,
        customerEmail,
        shippingAddress,
      }, tx);

      await createDropshipOrderItems(dropshipOrder.id, group.items, tx);

      // Create escrow record (HELD) — money will be in Varanda's main account after payment
      await createEscrowTransaction({
        dropshipOrderId: dropshipOrder.id,
        totalHeld: group.supplierPriceTotal,
        currency: 'NGN',
        flutterwaveReference: paymentReference, // Changed from paystackReference
      });
    }
  });

  return {
    orderNumber: createdOrder.order_number,
    paymentUrl: flutterwaveResult.paymentLink, // Changed from authorizationUrl
    reference: paymentReference,
    total,
    currency: 'NGN',
  };
};

// ─── Flutterwave webhook handler ──────────────────────────────────────────────

/**
 * Handle Flutterwave webhook events
 * Event: charge.completed (successful payment)
 */
const handleFlutterwaveWebhook = async (event) => {
  const { event: eventType, data } = event;

  // Only process successful charge events
  if (eventType !== 'charge.completed') return;
  if (data.status !== 'successful' && data.status !== 'succeeded') return;

  const reference = data?.tx_ref;
  if (!reference) return;

  // Idempotency — skip if already processed
  const existing = await findWebhookByReference(reference, eventType);
  if (existing) return;

  // Record the webhook event
  const webhookRecord = await recordWebhookEvent({
    provider: 'FLUTTERWAVE',
    eventType,
    reference,
    payload: event,
  });

  try {
    // Verify transaction with Flutterwave to prevent fake webhooks
    const verification = await flutterwaveConfig.verifyTransactionByRef(reference);
    if (verification.status !== 'successful' && verification.status !== 'succeeded') {
      console.warn('[webhook:flutterwave] Transaction verification failed:', reference, verification.status);
      await markWebhookProcessed(webhookRecord.id);
      return;
    }

    // Find the payment record
    const payment = await findPaymentByReference(reference);
    if (!payment) {
      console.warn('[webhook:flutterwave] Payment not found for reference:', reference);
      await markWebhookProcessed(webhookRecord.id);
      return;
    }

    // Find the order
    const order = await findOrderByNumberFull(
      (await sql`SELECT order_number FROM orders WHERE id = ${payment.order_id}`)[0]?.order_number
    );
    if (!order) {
      console.warn('[webhook:flutterwave] Order not found for payment:', payment.id);
      await markWebhookProcessed(webhookRecord.id);
      return;
    }

    // Verify amount matches
    const paidAmount = data.amount || data.charged_amount;
    if (Math.abs(paidAmount - Number(order.total)) > 1) {
      console.warn('[webhook:flutterwave] Amount mismatch:', paidAmount, 'vs', order.total);
    }

    await withTransaction(async (tx) => {
      // Mark payment as PAID
      await updatePaymentStatus(payment.id, 'PAID', data, tx);

      // Mark order as CONFIRMED + payment PAID
      await updateOrderPaymentStatus(order.id, 'PAID', tx);
      await updateOrderStatus(order.id, 'CONFIRMED');

      // Record commission
      const commissionRate = await subscriptionService.getCommissionRate(order.business_id);
      const commissionAmount = Math.round(Number(order.subtotal) * commissionRate * 100) / 100;
      await createCommission({
        orderId: order.id,
        businessId: order.business_id,
        commissionRate,
        commissionAmount,
        serviceFee: Number(order.service_fee),
        markupRevenue: 0, // markup tracked separately via supplier price delta
      }, tx);

      // Record discount usage if applicable
      if (order.discount_code_id && order.discount_amount > 0) {
        await recordDiscountUsage({
          discountCodeId: order.discount_code_id,
          orderId: order.id,
          customerEmail: order.customer_email,
          discountAmount: order.discount_amount,
        }, tx);
      }

      // Decrement stock for OWN items
      if (order.items) {
        for (const item of order.items) {
          if (item.item_type === 'OWN' && item.variant_id) {
            await tx`
              UPDATE product_variants
              SET stock_quantity = GREATEST(0, stock_quantity - ${item.quantity}),
                  updated_at = NOW()
              WHERE id = ${item.variant_id}
            `;
            await tx`
              INSERT INTO stock_movements (variant_id, product_id, order_id, movement_type, quantity_change, quantity_before, quantity_after)
              SELECT ${item.variant_id}, ${item.product_id}, ${order.id}, 'SALE', ${-item.quantity},
                     stock_quantity + ${item.quantity}, stock_quantity
              FROM product_variants WHERE id = ${item.variant_id}
            `;
          }
        }
      }
    });

    // Update last_sale_at on the business
    await updateLastSaleAt(order.business_id);

    // Clear the cart
    if (data.meta?.cartId) {
      await sql`DELETE FROM carts WHERE id = ${data.meta.cartId}`;
    }

    // Send order confirmation email
    emailConfig.sendOrderConfirmation(
      order.customer_email,
      order.customer_name,
      order.order_number,
      Number(order.total)
    ).catch(() => {});

    await markWebhookProcessed(webhookRecord.id);
    console.log('[webhook:flutterwave] Processed charge.completed for order:', order.order_number);

  } catch (err) {
    console.error('[webhook:flutterwave] Error processing webhook:', err.message);
    // Don't mark as processed so it can be retried
  }
};

// ─── PAYSTACK WEBHOOK HANDLER (COMMENTED OUT) ─────────────────────────────────
// const handlePaystackWebhook = async (event) => {
//   const { event: eventType, data } = event;
//   if (eventType !== 'charge.success') return;
//   const reference = data?.reference;
//   if (!reference) return;
//   // ... rest of Paystack webhook logic
// };

// ─── Payment verify polling ───────────────────────────────────────────────────

/**
 * Fallback polling endpoint — frontend calls this after Flutterwave redirect
 * to confirm payment status without waiting for webhook.
 */
const verifyPayment = async (orderNumber) => {
  const order = await findOrderByNumber(orderNumber);
  if (!order) throw new AppError('Order not found.', 404, 'NOT_FOUND');

  // If already confirmed, return immediately
  if (order.payment_status === 'PAID') {
    return { paymentStatus: 'PAID', orderStatus: order.status, orderNumber };
  }

  // Poll Flutterwave directly
  const payment = await findPaymentByReference(
    (await sql`SELECT reference FROM payments WHERE order_id = ${order.id} LIMIT 1`)[0]?.reference
  );

  if (!payment) return { paymentStatus: order.payment_status, orderStatus: order.status, orderNumber };

  try {
    const result = await flutterwaveConfig.verifyTransactionByRef(payment.reference);
    if ((result.status === 'successful' || result.status === 'succeeded') && order.payment_status !== 'PAID') {
      // Trigger the same webhook processing logic
      await handleFlutterwaveWebhook({
        event: 'charge.completed',
        data: { 
          tx_ref: payment.reference, 
          amount: Number(order.total), 
          status: 'successful',
          meta: {} 
        },
      });
      return { paymentStatus: 'PAID', orderStatus: 'CONFIRMED', orderNumber };
    }
  } catch (err) {
    console.warn('[checkout] Flutterwave verify failed:', err.message);
  }

  return { paymentStatus: order.payment_status, orderStatus: order.status, orderNumber };
};

module.exports = {
  computeOrderTotals,
  buildFlutterwaveSplit, // Changed from buildPaystackSplit
  initiateCheckout,
  handleFlutterwaveWebhook, // Changed from handlePaystackWebhook
  verifyPayment,
};
