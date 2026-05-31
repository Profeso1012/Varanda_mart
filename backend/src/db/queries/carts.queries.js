const { sql } = require('../../config/database');

// ─── Cart ─────────────────────────────────────────────────────────────────────

const findCartByCustomer = async (businessId, customerId) => {
  const [cart] = await sql`
    SELECT * FROM carts WHERE business_id = ${businessId} AND customer_id = ${customerId}
    ORDER BY updated_at DESC LIMIT 1
  `;
  return cart || null;
};

const findCartByGuestSession = async (businessId, guestSessionId) => {
  const [cart] = await sql`
    SELECT * FROM carts WHERE business_id = ${businessId} AND guest_session_id = ${guestSessionId}
    ORDER BY updated_at DESC LIMIT 1
  `;
  return cart || null;
};

const findCartById = async (id) => {
  const [cart] = await sql`SELECT * FROM carts WHERE id = ${id}`;
  return cart || null;
};

const createCart = async ({ businessId, customerId, guestSessionId }) => {
  const [cart] = await sql`
    INSERT INTO carts (business_id, customer_id, guest_session_id)
    VALUES (${businessId}, ${customerId || null}, ${guestSessionId || null})
    RETURNING *
  `;
  return cart;
};

const assignCartToCustomer = async (cartId, customerId) => {
  const [cart] = await sql`
    UPDATE carts SET customer_id = ${customerId}, guest_session_id = NULL, updated_at = NOW()
    WHERE id = ${cartId}
    RETURNING *
  `;
  return cart;
};

const touchCart = async (cartId) => {
  await sql`UPDATE carts SET updated_at = NOW() WHERE id = ${cartId}`;
};

const deleteCart = async (id) => {
  await sql`DELETE FROM carts WHERE id = ${id}`;
};

// ─── Cart items ───────────────────────────────────────────────────────────────

const getCartWithItems = async (cartId) => {
  const [cart] = await sql`SELECT * FROM carts WHERE id = ${cartId}`;
  if (!cart) return null;

  const items = await sql`
    SELECT
      ci.*,
      p.name AS product_name,
      p.slug AS product_slug,
      p.status AS product_status,
      p.base_price AS product_base_price,
      (SELECT url FROM product_images WHERE product_id = p.id AND is_main = true LIMIT 1) AS product_image,
      pv.sku AS variant_sku,
      pv.price AS variant_price,
      pv.stock_quantity AS variant_stock,
      pv.is_active AS variant_active,
      di.retail_price AS import_retail_price,
      di.is_active AS import_active
    FROM cart_items ci
    LEFT JOIN products p ON p.id = ci.product_id
    LEFT JOIN product_variants pv ON pv.id = ci.variant_id
    LEFT JOIN dropship_imports di ON di.id = ci.dropship_import_id
    WHERE ci.cart_id = ${cartId}
    ORDER BY ci.created_at ASC
  `;

  return { ...cart, items };
};

const findCartItem = async (cartId, productId, variantId) => {
  const [item] = await sql`
    SELECT * FROM cart_items
    WHERE cart_id = ${cartId}
      AND product_id = ${productId}
      AND (${variantId || null}::uuid IS NULL OR variant_id = ${variantId || null}::uuid)
    LIMIT 1
  `;
  return item || null;
};

const findCartItemById = async (itemId, cartId) => {
  const [item] = await sql`SELECT * FROM cart_items WHERE id = ${itemId} AND cart_id = ${cartId}`;
  return item || null;
};

const addCartItem = async ({ cartId, productId, variantId, dropshipImportId, quantity, unitPrice }) => {
  const [item] = await sql`
    INSERT INTO cart_items (cart_id, product_id, variant_id, dropship_import_id, quantity, unit_price)
    VALUES (
      ${cartId}, ${productId || null}, ${variantId || null},
      ${dropshipImportId || null}, ${quantity}, ${unitPrice}
    )
    RETURNING *
  `;
  return item;
};

const updateCartItemQuantity = async (itemId, quantity) => {
  const [item] = await sql`
    UPDATE cart_items SET quantity = ${quantity}, updated_at = NOW()
    WHERE id = ${itemId}
    RETURNING *
  `;
  return item;
};

const removeCartItem = async (itemId) => {
  await sql`DELETE FROM cart_items WHERE id = ${itemId}`;
};

const clearCartItems = async (cartId) => {
  await sql`DELETE FROM cart_items WHERE cart_id = ${cartId}`;
};

// ─── Cart merge ───────────────────────────────────────────────────────────────

/**
 * Merge guest cart items into the authenticated customer's cart.
 * If the customer already has the same product+variant, add quantities.
 * Deletes the guest cart after merging.
 */
const mergeGuestCartIntoCustomerCart = async (guestCartId, customerCartId) => {
  const guestItems = await sql`SELECT * FROM cart_items WHERE cart_id = ${guestCartId}`;

  for (const guestItem of guestItems) {
    // Check if customer cart already has this product+variant
    const existing = await findCartItem(customerCartId, guestItem.product_id, guestItem.variant_id);
    if (existing) {
      await updateCartItemQuantity(existing.id, existing.quantity + guestItem.quantity);
    } else {
      await addCartItem({
        cartId: customerCartId,
        productId: guestItem.product_id,
        variantId: guestItem.variant_id,
        dropshipImportId: guestItem.dropship_import_id,
        quantity: guestItem.quantity,
        unitPrice: guestItem.unit_price,
      });
    }
  }

  // Delete the guest cart (cascades to its items)
  await deleteCart(guestCartId);
  await touchCart(customerCartId);
};

module.exports = {
  findCartByCustomer,
  findCartByGuestSession,
  findCartById,
  createCart,
  assignCartToCustomer,
  touchCart,
  deleteCart,
  getCartWithItems,
  findCartItem,
  findCartItemById,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCartItems,
  mergeGuestCartIntoCustomerCart,
};
