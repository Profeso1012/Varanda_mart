/**
 * Cart endpoints — supports both guest (session ID) and authenticated customers.
 * Guest carts use X-Guest-Session header (a UUID the frontend generates and persists in localStorage).
 * Authenticated carts use X-Customer-Token.
 */
const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');

const {
  findCartByCustomer, findCartByGuestSession, createCart,
  getCartWithItems, findCartItem, findCartItemById,
  addCartItem, updateCartItemQuantity, removeCartItem,
  clearCartItems, mergeGuestCartIntoCustomerCart, touchCart,
} = require('../../db/queries/carts.queries');

const { findProductById, findProductBySlug } = require('../../db/queries/products.queries');
const { findVariantById } = require('../../db/queries/variants.queries');
const { findDropshipImportById } = require('../../db/queries/dropshipImports.queries');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve or create the cart for the current request.
 * Authenticated customers → cart by customer_id.
 * Guests → cart by guest_session_id (from X-Guest-Session header).
 */
const resolveCart = async (req, createIfMissing = true) => {
  const businessId = req.tenantBusinessId;
  const customerId = req.customerId || null;
  const guestSessionId = req.headers['x-guest-session'] || null;

  let cart = null;

  if (customerId) {
    cart = await findCartByCustomer(businessId, customerId);
  } else if (guestSessionId) {
    cart = await findCartByGuestSession(businessId, guestSessionId);
  }

  if (!cart && createIfMissing) {
    if (!customerId && !guestSessionId) {
      throw new AppError('X-Guest-Session header required for guest cart.', 400, 'MISSING_SESSION');
    }
    cart = await createCart({ businessId, customerId, guestSessionId });
  }

  return cart;
};

/**
 * Resolve the unit price for a cart item.
 * For dropship items: use the import's retail_price.
 * For own products: use variant price or base_price.
 */
const resolveUnitPrice = async (productId, variantId, dropshipImportId, businessId) => {
  if (dropshipImportId) {
    const importRecord = await findDropshipImportById(dropshipImportId, businessId);
    if (!importRecord || !importRecord.is_active) {
      throw new AppError('This product is no longer available for import.', 400, 'PRODUCT_UNAVAILABLE');
    }
    return Number(importRecord.retail_price);
  }

  if (variantId) {
    const variant = await findVariantById(variantId, productId);
    if (!variant || !variant.is_active) throw new AppError('Variant not found or inactive.', 400, 'VARIANT_UNAVAILABLE');
    if (variant.stock_quantity <= 0) throw new AppError('This variant is out of stock.', 400, 'OUT_OF_STOCK');
    return Number(variant.price);
  }

  const product = await findProductById(productId, businessId);
  if (!product || product.status !== 'ACTIVE') throw new AppError('Product not found or inactive.', 400, 'PRODUCT_UNAVAILABLE');
  return Number(product.base_price);
};

// ─── Format cart response ─────────────────────────────────────────────────────

const formatCart = (cart) => {
  if (!cart) return null;
  const items = (cart.items || []).map((item) => {
    // Detect price changes
    const currentPrice = item.variant_id
      ? Number(item.variant_price || item.unit_price)
      : item.dropship_import_id
        ? Number(item.import_retail_price || item.unit_price)
        : Number(item.product_base_price || item.unit_price);

    const priceChanged = Math.abs(currentPrice - Number(item.unit_price)) > 0.01;

    return {
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      dropshipImportId: item.dropship_import_id,
      productName: item.product_name,
      productSlug: item.product_slug,
      productImage: item.product_image,
      variantSku: item.variant_sku,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.unit_price) * item.quantity,
      currentPrice,
      priceChanged,
      inStock: item.variant_id
        ? (item.variant_stock > 0 && item.variant_active)
        : (item.product_status === 'ACTIVE'),
    };
  });

  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);

  return {
    id: cart.id,
    businessId: cart.business_id,
    customerId: cart.customer_id,
    guestSessionId: cart.guest_session_id,
    items,
    subtotal,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

/**
 * GET /storefront/cart
 * Returns the current cart. Auth: optional customer token or X-Guest-Session.
 */
const getCart = asyncHandler(async (req, res) => {
  const cart = await resolveCart(req, false);
  if (!cart) {
    return res.json({ success: true, data: { items: [], subtotal: 0, itemCount: 0 } });
  }
  const full = await getCartWithItems(cart.id);
  res.json({ success: true, data: formatCart(full) });
});

/**
 * POST /storefront/cart/items
 * Body: { productId, variantId?, dropshipImportId?, quantity }
 */
const addItem = asyncHandler(async (req, res) => {
  const { productId, variantId, dropshipImportId, quantity = 1 } = req.body;
  if (!productId && !dropshipImportId) {
    throw new AppError('productId or dropshipImportId is required.', 422, 'VALIDATION_ERROR');
  }
  if (quantity < 1) throw new AppError('Quantity must be at least 1.', 422, 'VALIDATION_ERROR');

  const cart = await resolveCart(req, true);
  const unitPrice = await resolveUnitPrice(productId, variantId, dropshipImportId, req.tenantBusinessId);

  // Check if item already in cart — increment quantity
  const existing = await findCartItem(cart.id, productId, variantId);
  if (existing) {
    await updateCartItemQuantity(existing.id, existing.quantity + quantity);
  } else {
    await addCartItem({ cartId: cart.id, productId, variantId, dropshipImportId, quantity, unitPrice });
  }

  await touchCart(cart.id);
  const full = await getCartWithItems(cart.id);
  res.status(201).json({ success: true, data: formatCart(full) });
});

/**
 * PUT /storefront/cart/items/:itemId
 * Body: { quantity }
 */
const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) throw new AppError('Quantity must be at least 1.', 422, 'VALIDATION_ERROR');

  const cart = await resolveCart(req, false);
  if (!cart) throw new AppError('Cart not found.', 404, 'NOT_FOUND');

  const item = await findCartItemById(req.params.itemId, cart.id);
  if (!item) throw new AppError('Cart item not found.', 404, 'NOT_FOUND');

  await updateCartItemQuantity(item.id, quantity);
  await touchCart(cart.id);

  const full = await getCartWithItems(cart.id);
  res.json({ success: true, data: formatCart(full) });
});

/**
 * DELETE /storefront/cart/items/:itemId
 */
const removeItem = asyncHandler(async (req, res) => {
  const cart = await resolveCart(req, false);
  if (!cart) throw new AppError('Cart not found.', 404, 'NOT_FOUND');

  const item = await findCartItemById(req.params.itemId, cart.id);
  if (!item) throw new AppError('Cart item not found.', 404, 'NOT_FOUND');

  await removeCartItem(item.id);
  await touchCart(cart.id);

  const full = await getCartWithItems(cart.id);
  res.json({ success: true, data: formatCart(full) });
});

/**
 * DELETE /storefront/cart
 * Clears all items from the cart.
 */
const clearCart = asyncHandler(async (req, res) => {
  const cart = await resolveCart(req, false);
  if (cart) {
    await clearCartItems(cart.id);
    await touchCart(cart.id);
  }
  res.json({ success: true, data: { message: 'Cart cleared.' } });
});

/**
 * POST /storefront/cart/merge
 * Body: { guestSessionId }
 * Merges a guest cart into the authenticated customer's cart.
 * Auth: X-Customer-Token required.
 */
const mergeCart = asyncHandler(async (req, res) => {
  const { guestSessionId } = req.body;
  if (!guestSessionId) throw new AppError('guestSessionId is required.', 422, 'VALIDATION_ERROR');
  if (!req.customerId) throw new AppError('Customer authentication required.', 401, 'UNAUTHORIZED');

  const businessId = req.tenantBusinessId;

  const guestCart = await findCartByGuestSession(businessId, guestSessionId);
  if (!guestCart) {
    // No guest cart — just return the customer's cart
    const customerCart = await findCartByCustomer(businessId, req.customerId);
    if (!customerCart) return res.json({ success: true, data: { items: [], subtotal: 0, itemCount: 0 } });
    const full = await getCartWithItems(customerCart.id);
    return res.json({ success: true, data: formatCart(full) });
  }

  // Get or create customer cart
  let customerCart = await findCartByCustomer(businessId, req.customerId);
  if (!customerCart) {
    customerCart = await createCart({ businessId, customerId: req.customerId });
  }

  await mergeGuestCartIntoCustomerCart(guestCart.id, customerCart.id);

  const full = await getCartWithItems(customerCart.id);
  res.json({ success: true, data: formatCart(full) });
});

module.exports = { getCart, addItem, updateItem, removeItem, clearCart, mergeCart };
