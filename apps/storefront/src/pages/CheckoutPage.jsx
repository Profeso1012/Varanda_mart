// apps/storefront/src/pages/CheckoutPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Truck, Tag, CreditCard, ChevronRight, Check, AlertCircle, Loader } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { getShippingRates, validateDiscount, initiateCheckout, getOrCreateGuestSessionId } from '../api/storefrontApi';
import AuthModal from '../components/AuthModal';
import './CheckoutPage.css';

const formatPrice = (n) => `₦${Number(n || 0).toLocaleString()}`;

const STEPS = ['Address', 'Shipping', 'Review & Pay'];

export default function CheckoutPage() {
  const { cart, loading: cartLoading, clearAllItems } = useCart();
  const { isLoggedIn, customer } = useAuth();
  const { store } = useStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [showAuth, setShowAuth] = useState(false);

  // Step 1 — Address
  const [address, setAddress] = useState({
    customerName: customer?.firstName ? `${customer.firstName} ${customer.lastName || ''}`.trim() : '',
    customerEmail: customer?.email || '',
    streetLine1: '',
    city: '',
    state: '',
    country: 'Nigeria',
    customerNote: '',
  });

  // Step 2 — Shipping
  const [rates, setRates] = useState([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState(null);
  const [selectedRate, setSelectedRate] = useState(null);

  // Discount
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState(null);

  // Step 3 — Checkout initiation
  const [initiating, setInitiating] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  // Redirect empty cart
  useEffect(() => {
    if (!cartLoading && (!cart?.items?.length)) navigate('/cart');
  }, [cart, cartLoading, navigate]);

  // Pre-fill email from customer
  useEffect(() => {
    if (customer) {
      setAddress(prev => ({
        ...prev,
        customerName: prev.customerName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        customerEmail: prev.customerEmail || customer.email,
      }));
    }
  }, [customer]);

  // ── Step 1: Address submit → fetch shipping rates ─────────────────────────
  const handleAddressNext = async (e) => {
    e.preventDefault();
    setRatesLoading(true);
    setRatesError(null);
    try {
      const data = await getShippingRates({
        city: address.city,
        state: address.state,
        country: address.country,
        orderTotal: cart?.subtotal,
      });
      setRates(data.rates || []);
      if (data.rates?.length === 1) setSelectedRate(data.rates[0]);
      setStep(1);
    } catch {
      setRatesError('Could not load shipping rates. Please try again.');
    } finally {
      setRatesLoading(false);
    }
  };

  // ── Step 2: Rate selected ─────────────────────────────────────────────────
  const handleRateNext = () => {
    if (!selectedRate) return;
    setStep(2);
  };

  // ── Discount validation ───────────────────────────────────────────────────
  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setDiscountLoading(true);
    setDiscountError(null);
    setDiscount(null);
    try {
      const data = await validateDiscount(discountCode, cart?.subtotal, address.customerEmail);
      setDiscount(data.discountCode);
    } catch (err) {
      const code = err.response?.data?.error?.code;
      const msgs = {
        INVALID_CODE: 'Invalid discount code',
        NOT_ACTIVE_YET: 'This code is not active yet',
        EXPIRED: 'This code has expired',
        LIMIT_REACHED: 'Usage limit reached for this code',
        MINIMUM_NOT_MET: `Minimum order required: ${formatPrice(err.response?.data?.error?.minOrder)}`,
      };
      setDiscountError(msgs[code] || 'Could not apply discount');
    } finally {
      setDiscountLoading(false);
    }
  };

  // ── Final: Initiate checkout ──────────────────────────────────────────────
  const handlePay = async () => {
    setInitiating(true);
    setCheckoutError(null);
    try {
      const shippingIsManual = selectedRate?.id && !selectedRate.serviceCode;
      const payload = {
        customerEmail: address.customerEmail,
        customerName: address.customerName,
        shippingAddress: {
          streetLine1: address.streetLine1,
          city: address.city,
          state: address.state,
          country: address.country,
        },
        shippingRateId: selectedRate.serviceCode || selectedRate.id,
        ...(selectedRate.serviceCode ? { shippingRateAmount: selectedRate.rate } : {}),
        ...(discountCode ? { discountCode } : {}),
        ...(address.customerNote ? { customerNote: address.customerNote } : {}),
        ...(!isLoggedIn ? { guestSessionId: getOrCreateGuestSessionId() } : {}),
      };

      const data = await initiateCheckout(payload);
      // Store orderNumber for the verify page
      sessionStorage.setItem('varanda_pending_order', data.orderNumber);
      // Redirect to Paystack
      window.location.href = data.paymentUrl;
    } catch (err) {
      const code = err.response?.data?.error?.code;
      const msgs = {
        EMPTY_CART: 'Your cart is empty',
        CART_NOT_FOUND: 'Cart session expired. Please add items again.',
        INVALID_SHIPPING_RATE: 'Selected shipping rate is no longer available',
        INVALID_DISCOUNT_CODE: 'Discount code is invalid',
      };
      setCheckoutError(msgs[code] || 'Checkout failed. Please try again.');
    } finally {
      setInitiating(false);
    }
  };

  // ── Totals ────────────────────────────────────────────────────────────────
  const shipping = selectedRate?.rate ?? 0;
  const discountAmount = discount?.discountAmount ?? 0;
  const subtotal = cart?.subtotal ?? 0;
  const total = Math.max(0, subtotal + shipping - discountAmount);

  if (cartLoading) return <div className="page-loading"><span className="spinner spinner--lg" /></div>;

  return (
    <div className="checkout-page">
      <div className="container container--md">
        {/* Store brand header */}
        <div className="checkout-page__brand">
          {store?.logoUrl
            ? <img src={store.logoUrl} alt={store.name} className="checkout-page__logo" />
            : <span className="checkout-page__store-name">{store?.name}</span>
          }
        </div>

        {/* Step indicators */}
        <div className="checkout-steps">
          {STEPS.map((label, i) => (
            <div key={label} className={`checkout-step ${i === step ? 'checkout-step--active' : ''} ${i < step ? 'checkout-step--done' : ''}`}>
              <div className="checkout-step__dot">
                {i < step ? <Check size={13} /> : <span>{i + 1}</span>}
              </div>
              <span className="checkout-step__label">{label}</span>
              {i < STEPS.length - 1 && <div className="checkout-step__line" />}
            </div>
          ))}
        </div>

        <div className="checkout-layout">
          {/* Left: active step form */}
          <div className="checkout-form">

            {/* ── Step 0: Address ─────────────────────────────────────── */}
            {step === 0 && (
              <div className="card">
                <div className="checkout-form__title">
                  <MapPin size={20} style={{ color: 'var(--brand-primary)' }} />
                  Shipping Address
                </div>

                {!isLoggedIn && (
                  <div className="checkout-auth-notice">
                    <span>Have an account?</span>
                    <button className="btn btn--outline btn--sm" onClick={() => setShowAuth(true)}>
                      Sign in to autofill
                    </button>
                  </div>
                )}

                <form onSubmit={handleAddressNext} className="checkout-form__fields">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input className="form-input" required
                        value={address.customerName}
                        onChange={e => setAddress(p => ({ ...p, customerName: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input className="form-input" type="email" required
                        value={address.customerEmail}
                        onChange={e => setAddress(p => ({ ...p, customerEmail: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Street Address *</label>
                    <input className="form-input" required
                      value={address.streetLine1}
                      onChange={e => setAddress(p => ({ ...p, streetLine1: e.target.value }))}
                      placeholder="12 Lagos Street"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <input className="form-input" required
                        value={address.city}
                        onChange={e => setAddress(p => ({ ...p, city: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <input className="form-input" required
                        value={address.state}
                        onChange={e => setAddress(p => ({ ...p, state: e.target.value }))}
                        placeholder="Lagos"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input className="form-input"
                      value={address.country}
                      onChange={e => setAddress(p => ({ ...p, country: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Order Note (optional)</label>
                    <textarea className="form-input" rows={2}
                      value={address.customerNote}
                      onChange={e => setAddress(p => ({ ...p, customerNote: e.target.value }))}
                      placeholder="Special instructions…"
                    />
                  </div>

                  {ratesError && (
                    <div className="checkout-error"><AlertCircle size={16} />{ratesError}</div>
                  )}

                  <button type="submit" className="btn btn--primary btn--full btn--lg" disabled={ratesLoading}>
                    {ratesLoading ? <><Loader size={16} className="spin" /> Loading shipping rates…</> : <>Continue to Shipping <ChevronRight size={18} /></>}
                  </button>
                </form>
              </div>
            )}

            {/* ── Step 1: Shipping ────────────────────────────────────── */}
            {step === 1 && (
              <div className="card">
                <div className="checkout-form__title">
                  <Truck size={20} style={{ color: 'var(--brand-primary)' }} />
                  Choose Shipping
                </div>

                {rates.length === 0 ? (
                  <div className="checkout-no-rates">
                    <AlertCircle size={20} />
                    <p>No shipping rates available for your address. Contact the store for assistance.</p>
                  </div>
                ) : (
                  <div className="shipping-rates">
                    {rates.map((rate) => {
                      const rateId = rate.serviceCode || rate.id;
                      const selected = (selectedRate?.serviceCode || selectedRate?.id) === rateId;
                      return (
                        <label key={rateId} className={`shipping-rate ${selected ? 'shipping-rate--selected' : ''}`}>
                          <input
                            type="radio"
                            name="shippingRate"
                            checked={selected}
                            onChange={() => setSelectedRate(rate)}
                          />
                          <div className="shipping-rate__info">
                            <span className="shipping-rate__name">{rate.name}</span>
                            {rate.description && <span className="shipping-rate__desc">{rate.description}</span>}
                            {rate.estimatedDays && <span className="shipping-rate__eta">Est. {rate.estimatedDays}</span>}
                          </div>
                          <div className="shipping-rate__price">
                            {rate.isFree || rate.rate === 0 ? (
                              <span className="shipping-rate__free">FREE</span>
                            ) : formatPrice(rate.rate)}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Discount code */}
                <div className="checkout-discount">
                  <div className="checkout-discount__row">
                    <div className="checkout-discount__icon"><Tag size={16} /></div>
                    <input
                      className="form-input"
                      placeholder="Discount code"
                      value={discountCode}
                      onChange={e => { setDiscountCode(e.target.value.toUpperCase()); setDiscount(null); setDiscountError(null); }}
                    />
                    <button
                      className="btn btn--outline btn--sm"
                      onClick={handleApplyDiscount}
                      disabled={discountLoading || !discountCode.trim()}
                    >
                      {discountLoading ? <span className="spinner" /> : 'Apply'}
                    </button>
                  </div>
                  {discountError && <p className="form-error">{discountError}</p>}
                  {discount && (
                    <p className="checkout-discount__success">
                      <Check size={14} /> {discount.code} — saving {formatPrice(discount.discountAmount)}
                    </p>
                  )}
                </div>

                <div className="checkout-form__actions">
                  <button className="btn btn--ghost" onClick={() => setStep(0)}>← Back</button>
                  <button
                    className="btn btn--primary btn--lg"
                    onClick={handleRateNext}
                    disabled={!selectedRate}
                  >
                    Review Order <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Review & Pay ────────────────────────────────── */}
            {step === 2 && (
              <div className="card">
                <div className="checkout-form__title">
                  <CreditCard size={20} style={{ color: 'var(--brand-primary)' }} />
                  Review & Pay
                </div>

                {/* Address summary */}
                <div className="checkout-summary-block">
                  <div className="checkout-summary-block__header">
                    <span className="checkout-summary-block__label">Delivering to</span>
                    <button className="btn btn--ghost btn--sm" onClick={() => setStep(0)}>Edit</button>
                  </div>
                  <p className="checkout-summary-block__text">
                    {address.customerName}<br />
                    {address.streetLine1}, {address.city}, {address.state}, {address.country}
                  </p>
                </div>

                {/* Shipping summary */}
                <div className="checkout-summary-block">
                  <div className="checkout-summary-block__header">
                    <span className="checkout-summary-block__label">Shipping</span>
                    <button className="btn btn--ghost btn--sm" onClick={() => setStep(1)}>Edit</button>
                  </div>
                  <p className="checkout-summary-block__text">
                    {selectedRate?.name} — {selectedRate?.rate === 0 ? 'FREE' : formatPrice(selectedRate?.rate)}
                    {selectedRate?.estimatedDays && ` (${selectedRate.estimatedDays})`}
                  </p>
                </div>

                {checkoutError && (
                  <div className="checkout-error"><AlertCircle size={16} />{checkoutError}</div>
                )}

                <button
                  className="btn btn--primary btn--full btn--lg"
                  onClick={handlePay}
                  disabled={initiating}
                  style={{ marginTop: 24 }}
                >
                  {initiating
                    ? <><Loader size={16} className="spin" /> Processing…</>
                    : <><CreditCard size={18} /> Pay {formatPrice(total)}</>
                  }
                </button>

                <p className="checkout-secure-note">
                  🔒 Secure payment via Paystack
                </p>

                <button className="btn btn--ghost btn--full" style={{ marginTop: 8 }} onClick={() => setStep(1)}>
                  ← Back
                </button>
              </div>
            )}
          </div>

          {/* Right: Order summary sidebar */}
          <div className="checkout-sidebar">
            <div className="card">
              <h3 className="cart-summary__title">Order Summary</h3>
              <div className="checkout-sidebar__items">
                {cart?.items?.map(item => (
                  <div key={item.id} className="checkout-sidebar__item">
                    <div className="checkout-sidebar__item-img">
                      {item.productImage
                        ? <img src={item.productImage} alt={item.productName} />
                        : <div className="checkout-sidebar__item-placeholder" />
                      }
                      <span className="checkout-sidebar__item-qty">{item.quantity}</span>
                    </div>
                    <div className="checkout-sidebar__item-name">{item.productName}</div>
                    <div className="checkout-sidebar__item-price">{formatPrice(item.totalPrice)}</div>
                  </div>
                ))}
              </div>
              <hr className="divider" />
              <div className="cart-summary__row">
                <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
              </div>
              <div className="cart-summary__row">
                <span>Shipping</span>
                <span>{selectedRate ? (selectedRate.rate === 0 ? 'FREE' : formatPrice(shipping)) : '—'}</span>
              </div>
              {discount && (
                <div className="cart-summary__row" style={{ color: '#16a34a' }}>
                  <span>Discount ({discount.code})</span>
                  <span>−{formatPrice(discountAmount)}</span>
                </div>
              )}
              <hr className="divider" />
              <div className="cart-summary__row cart-summary__row--total">
                <span>Total</span><span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </div>
  );
}
