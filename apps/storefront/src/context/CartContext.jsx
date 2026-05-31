// apps/storefront/src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeCartItem as apiRemoveCartItem,
  clearCart as apiClearCart,
} from '../api/storefrontApi';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = useCallback(async () => {
    try {
      const data = await getCart();
      setCart(data);
    } catch (_) {
      setCart({ items: [], subtotal: 0, itemCount: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  // Called from AuthContext after merge
  const refreshCart = useCallback((merged) => {
    if (merged) setCart(merged);
    else fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (productId, variantId, quantity = 1, dropshipImportId = null) => {
    setActionLoading(true);
    setError(null);
    try {
      const updated = await apiAddToCart(productId, variantId, quantity, dropshipImportId);
      setCart(updated);
      return { success: true };
    } catch (err) {
      const code = err.response?.data?.error?.code;
      const msg = code === 'OUT_OF_STOCK' ? 'This item is out of stock'
        : code === 'PRODUCT_UNAVAILABLE' ? 'This product is unavailable'
        : code === 'VARIANT_UNAVAILABLE' ? 'This variant is unavailable'
        : 'Failed to add to cart';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setActionLoading(false);
    }
  }, []);

  const updateItem = useCallback(async (itemId, quantity) => {
    setActionLoading(true);
    try {
      const updated = await apiUpdateCartItem(itemId, quantity);
      setCart(updated);
    } catch (err) {
      setError('Failed to update item');
    } finally {
      setActionLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (itemId) => {
    setActionLoading(true);
    try {
      const updated = await apiRemoveCartItem(itemId);
      setCart(updated);
    } catch (_) {
      setError('Failed to remove item');
    } finally {
      setActionLoading(false);
    }
  }, []);

  const clearAllItems = useCallback(async () => {
    setActionLoading(true);
    try {
      await apiClearCart();
      setCart({ items: [], subtotal: 0, itemCount: 0 });
    } catch (_) {} finally {
      setActionLoading(false);
    }
  }, []);

  const itemCount = cart?.itemCount ?? 0;

  return (
    <CartContext.Provider value={{
      cart, loading, actionLoading, error,
      itemCount, addToCart, updateItem, removeItem,
      clearAllItems, refreshCart, fetchCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
