// apps/storefront/src/pages/CartPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import './CartPage.css';

const formatPrice = (n) => `₦${Number(n || 0).toLocaleString()}`;

export default function CartPage() {
  const { store } = useStore();
  const { cart, loading, actionLoading, updateItem, removeItem, clearAllItems } = useCart();
  const navigate = useNavigate();
  const [confirmClear, setConfirmClear] = useState(false);

  if (loading) {
    return (
      <div className="page-loading">
        <span className="spinner spinner--lg" />
        <p>Loading cart…</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  const handleQtyChange = (item, delta) => {
    const next = item.quantity + delta;
    if (next < 1) return;
    updateItem(item.id, next);
  };

  return (
    <div className="cart-page">
      <div className="container">
        {/* Page header */}
        <div className="cart-page__header">
          <h1 className="section-title">
            <ShoppingBag size={28} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Your Cart
          </h1>
          {!isEmpty && (
            <span className="cart-page__count">{cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''}</span>
          )}
        </div>

        {isEmpty ? (
          <div className="cart-page__empty">
            <div className="cart-page__empty-icon">
              <ShoppingBag size={52} />
            </div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything yet.</p>
            <Link to="/products" className="btn btn--primary btn--lg">
              Start Shopping <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="cart-page__layout">
            {/* Items */}
            <div className="cart-page__items">
              {items.map(item => (
                <div key={item.id} className="cart-item">
                  {/* Image */}
                  <div className="cart-item__img">
                    {item.productImage
                      ? <img src={item.productImage} alt={item.productName} />
                      : <div className="cart-item__img-placeholder"><ShoppingBag size={24} /></div>
                    }
                  </div>

                  {/* Details */}
                  <div className="cart-item__details">
                    <Link to={`/products/${item.productSlug}`} className="cart-item__name">
                      {item.productName}
                    </Link>
                    {item.variantSku && (
                      <span className="cart-item__sku">SKU: {item.variantSku}</span>
                    )}

                    {/* Price changed warning */}
                    {item.priceChanged && (
                      <div className="cart-item__price-warning">
                        <AlertTriangle size={14} />
                        Price updated to {formatPrice(item.currentPrice)}
                      </div>
                    )}

                    {/* Out of stock */}
                    {!item.inStock && (
                      <div className="cart-item__oos">Out of stock — remove to continue</div>
                    )}
                  </div>

                  {/* Qty + price */}
                  <div className="cart-item__right">
                    <div className="cart-item__qty">
                      <button
                        className="cart-item__qty-btn"
                        onClick={() => handleQtyChange(item, -1)}
                        disabled={actionLoading || item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="cart-item__qty-val">{item.quantity}</span>
                      <button
                        className="cart-item__qty-btn"
                        onClick={() => handleQtyChange(item, 1)}
                        disabled={actionLoading}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <span className="cart-item__price">{formatPrice(item.totalPrice)}</span>

                    <button
                      className="cart-item__remove"
                      onClick={() => removeItem(item.id)}
                      disabled={actionLoading}
                      aria-label="Remove"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Clear cart */}
              <div className="cart-page__clear">
                {confirmClear ? (
                  <div className="cart-page__clear-confirm">
                    <span>Clear all items?</span>
                    <button className="btn btn--danger btn--sm" onClick={() => { clearAllItems(); setConfirmClear(false); }}>
                      Yes, clear
                    </button>
                    <button className="btn btn--ghost btn--sm" onClick={() => setConfirmClear(false)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button className="btn btn--ghost btn--sm" onClick={() => setConfirmClear(true)}>
                    <Trash2 size={14} /> Clear cart
                  </button>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="cart-page__summary">
              <div className="card">
                <h3 className="cart-summary__title">Order Summary</h3>

                <div className="cart-summary__row">
                  <span>Subtotal ({cart.itemCount} items)</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="cart-summary__row cart-summary__row--muted">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>

                <hr className="divider" />

                <div className="cart-summary__row cart-summary__row--total">
                  <span>Subtotal</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>

                <button
                  className="btn btn--primary btn--full btn--lg"
                  onClick={() => navigate('/checkout')}
                  disabled={actionLoading || items.some(i => !i.inStock)}
                  style={{ marginTop: 20 }}
                >
                  Proceed to Checkout <ArrowRight size={18} />
                </button>

                <Link to="/products" className="btn btn--ghost btn--full" style={{ marginTop: 8, justifyContent: 'center' }}>
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
