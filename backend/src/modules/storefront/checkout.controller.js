/**
 * Checkout, shipping rates, discount validation, and payment verify endpoints.
 */
const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');

const checkoutService = require('../../services/checkout.service');
const { resolveShippingRates } = require('../../db/queries/shipping.queries');
const { findDiscountByCode } = require('../../db/queries/discounts.queries');
const { findCartByCustomer, findCartByGuestSession, getCartWithItems } = require('../../db/queries/carts.queries');
const { findOrderByNumber } = require('../../db/queries/orders.queries');

// ─── Shipping rates ───────────────────────────────────────────────────────────

/**
 * GET /storefront/shipping/rates
 * Query: city?, state?, country?, orderWeight?, orderTotal?
 * Returns available shipping rates for the customer's address.
 * Merges manual zone rates with Shipbubble live rates if connected.
 * No auth required — called before checkout.
 */
const getShippingRates = asyncHandler(async (req, res) => {
  const { city, state, country = 'Nigeria', orderWeight, orderTotal } = req.query;

  // Check if Shipbubble is connected for this store
  const { sql } = require('../../config/database');
  const { decrypt } = require('../../utils/encrypt');
  const [integration] = await sql`
    SELECT * FROM logistics_integrations
    WHERE business_id = ${req.tenantBusinessId} AND provider = 'SHIPBUBBLE' AND is_active = true
  `;

  let shipbubbleIntegration = null;
  let receiverAddress = null;

  if (integration?.api_key_encrypted && integration?.origin_address) {
    try {
      shipbubbleIntegration = {
        apiKey: decrypt(integration.api_key_encrypted),
        originAddress: integration.origin_address,
      };
      // Build receiver address from query params for Shipbubble
      if (state || city) {
        receiverAddress = {
          name: 'Customer',
          email: '',
          phone: '',
          address: '',
          city: city || state || '',
          state: state || '',
          country: country || 'Nigeria',
        };
      }
    } catch {
      // Decryption failed — skip Shipbubble
    }
  }

  const result = await resolveShippingRates(req.tenantBusinessId, {
    city: city || null,
    state: state || null,
    country,
    orderWeight: orderWeight ? parseFloat(orderWeight) : null,
    orderTotal: orderTotal ? parseFloat(orderTotal) : null,
    shipbubbleIntegration,
    receiverAddress,
  });

  res.json({ success: true, data: result });
});

// ─── Discount validation ──────────────────────────────────────────────────────

/**
 * POST /storefront/discounts/validate
 * Body: { code, orderTotal, customerEmail? }
 * Public, tenant-scoped. Returns discount details if valid.
 */
const validateDiscount = asyncHandler(async (req, res) => {
  const { code, orderTotal, customerEmail } = req.body;
  if (!code) throw new AppError('Discount code is required.', 422, 'VALIDATION_ERROR');

  const discount = await findDiscountByCode(code, req.tenantBusinessId);

  if (!discount || !discount.is_active) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_CODE', message: 'This discount code is invalid or inactive.' },
    });
  }

  const now = new Date();
  if (discount.starts_at && new Date(discount.starts_at) > now) {
    return res.status(400).json({
      success: false,
      error: { code: 'NOT_ACTIVE_YET', message: 'This discount code is not yet active.' },
    });
  }
  if (discount.expires_at && new Date(discount.expires_at) < now) {
    return res.status(400).json({
      success: false,
      error: { code: 'EXPIRED', message: 'This discount code has expired.' },
    });
  }
  if (discount.usage_limit && discount.used_count >= discount.usage_limit) {
    return res.status(400).json({
      success: false,
      error: { code: 'LIMIT_REACHED', message: 'This discount code has reached its usage limit.' },
    });
  }
  if (discount.minimum_order && orderTotal && Number(orderTotal) < Number(discount.minimum_order)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MINIMUM_NOT_MET',
        message: `Minimum order of ₦${Number(discount.minimum_order).toLocaleString()} required.`,
      },
    });
  }

  // Compute discount amount
  let discountAmount = 0;
  if (orderTotal) {
    const total = Number(orderTotal);
    if (discount.type === 'PERCENTAGE') {
      discountAmount = Math.round((total * Number(discount.value)) / 100 * 100) / 100;
    } else if (discount.type === 'FIXED_AMOUNT') {
      discountAmount = Math.min(Number(discount.value), total);
    }
  }

  res.json({
    success: true,
    data: {
      valid: true,
      discountCode: {
        id: discount.id,
        code: discount.code,
        type: discount.type,
        value: Number(discount.value),
        discountAmount,
      },
    },
  });
});

// ─── Checkout ─────────────────────────────────────────────────────────────────

/**
 * POST /storefront/checkout/initiate
 * Body: {
 *   customerEmail, customerName, shippingAddress,
 *   shippingRateId, discountCode?, customerNote?,
 *   guestSessionId? (for guest checkout)
 * }
 * Auth: optional customer token.
 */
const initiateCheckout = asyncHandler(async (req, res) => {
  const {
    customerEmail, customerName, shippingAddress,
    shippingRateId, shippingRateAmount, discountCode, customerNote, guestSessionId,
  } = req.body;

  if (!customerEmail) throw new AppError('customerEmail is required.', 422, 'VALIDATION_ERROR');
  if (!customerName) throw new AppError('customerName is required.', 422, 'VALIDATION_ERROR');
  if (!shippingAddress) throw new AppError('shippingAddress is required.', 422, 'VALIDATION_ERROR');

  const businessId = req.tenantBusinessId;
  const customerId = req.customerId || null;

  // Resolve cart
  let cart = null;
  if (customerId) {
    cart = await findCartByCustomer(businessId, customerId);
  } else if (guestSessionId) {
    cart = await findCartByGuestSession(businessId, guestSessionId);
  }

  if (!cart) throw new AppError('Cart not found. Add items before checking out.', 400, 'CART_NOT_FOUND');

  const cartWithItems = await getCartWithItems(cart.id);
  if (!cartWithItems?.items?.length) throw new AppError('Cart is empty.', 400, 'EMPTY_CART');

  const result = await checkoutService.initiateCheckout(businessId, cartWithItems, {
    customerEmail,
    customerName,
    shippingAddress,
    shippingRateId,
    shippingRateAmount: shippingRateAmount !== undefined ? Number(shippingRateAmount) : undefined,
    discountCode,
    customerNote,
    customerId,
  });

  res.status(201).json({ success: true, data: result });
});

/**
 * GET /storefront/checkout/verify/:orderNumber
 * Polling endpoint — frontend calls after Paystack redirect to confirm payment.
 */
const verifyCheckout = asyncHandler(async (req, res) => {
  const result = await checkoutService.verifyPayment(req.params.orderNumber);
  res.json({ success: true, data: result });
});

module.exports = { getShippingRates, validateDiscount, initiateCheckout, verifyCheckout };
