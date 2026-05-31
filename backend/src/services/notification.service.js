const emailConfig = require('../config/email');
const { config } = require('../config/env');

/**
 * Sends order confirmation to both customer and seller in parallel.
 * Called after Paystack webhook confirms payment.
 */
const sendOrderConfirmation = async (order, business, sellerEmail) => {
  await Promise.allSettled([
    emailConfig.sendOrderConfirmationToCustomer(order, business),
    emailConfig.sendOrderNotificationToSeller({ ...order, sellerEmail }),
  ]);
};

/**
 * Sends new dropship order notification to the supplier.
 */
const sendDropshipOrderToSupplier = async (dropshipOrder, supplierEmail) => {
  await emailConfig.sendDropshipOrderToSupplier({ ...dropshipOrder, supplierEmail }).catch((err) => {
    console.error('[notification] Failed to send dropship order to supplier:', err.message);
  });
};

/**
 * Prompts the seller to confirm or dispute a dropship order after supplier ships.
 */
const sendSellerConfirmationPrompt = async (sellerEmail, dropshipOrderNumber) => {
  const dashboardUrl = `${config.sellerDashboardUrl}/dropship-orders/${dropshipOrderNumber}`;
  await emailConfig
    .sendSellerConfirmationPrompt(sellerEmail, dropshipOrderNumber, dashboardUrl)
    .catch((err) => {
      console.error('[notification] Failed to send seller confirmation prompt:', err.message);
    });
};

/**
 * Sends shipping update to customer.
 */
const sendShippingUpdate = async (order) => {
  // Placeholder — full implementation in Phase 6
  console.log(`[notification] Shipping update for order ${order.order_number}`);
};

module.exports = {
  sendOrderConfirmation,
  sendDropshipOrderToSupplier,
  sendSellerConfirmationPrompt,
  sendShippingUpdate,
};
