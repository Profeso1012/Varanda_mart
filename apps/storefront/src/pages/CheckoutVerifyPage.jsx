// apps/storefront/src/pages/CheckoutVerifyPage.jsx
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Package } from 'lucide-react';
import { verifyCheckout } from '../api/storefrontApi';
import { useStore } from '../context/StoreContext';
import './CheckoutVerifyPage.css';

const POLL_INTERVAL = 2000;  // 2 seconds
const POLL_TIMEOUT  = 30000; // 30 seconds

export default function CheckoutVerifyPage() {
  const { store } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState('polling'); // 'polling' | 'paid' | 'failed' | 'timeout'
  const [orderNumber, setOrderNumber] = useState(null);
  const intervalRef = useRef(null);
  const timeoutRef  = useRef(null);

  useEffect(() => {
    // Paystack passes reference in query; we stored orderNumber in sessionStorage before redirect
    const stored = sessionStorage.getItem('varanda_pending_order');
    const fromQuery = searchParams.get('order');
    const num = stored || fromQuery;
    setOrderNumber(num);

    if (!num) {
      setStatus('failed');
      return;
    }

    const poll = async () => {
      try {
        const data = await verifyCheckout(num);
        if (data.paymentStatus === 'PAID') {
          clearAll();
          sessionStorage.removeItem('varanda_pending_order');
          setStatus('paid');
        } else if (data.paymentStatus === 'FAILED') {
          clearAll();
          setStatus('failed');
        }
        // PENDING → keep polling
      } catch {
        // network hiccup — keep polling
      }
    };

    const clearAll = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current)  clearTimeout(timeoutRef.current);
    };

    intervalRef.current = setInterval(poll, POLL_INTERVAL);
    poll(); // immediate first check

    timeoutRef.current = setTimeout(() => {
      clearAll();
      setStatus('timeout');
    }, POLL_TIMEOUT);

    return clearAll;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="verify-page">
      <div className="verify-page__card card">
        {/* Store brand */}
        <div className="verify-page__brand">
          {store?.logoUrl
            ? <img src={store.logoUrl} alt={store.name} className="verify-page__logo" />
            : <span className="verify-page__store-name">{store?.name}</span>
          }
        </div>

        {/* ── Polling ──────────────────────────────────────────────────── */}
        {status === 'polling' && (
          <div className="verify-page__state">
            <div className="verify-page__pulse">
              <span className="spinner spinner--lg" />
            </div>
            <h2 className="verify-page__title">Confirming your payment…</h2>
            <p className="verify-page__sub">
              Please don't close this page. This usually takes a few seconds.
            </p>
            {orderNumber && (
              <p className="verify-page__order-num">Order #{orderNumber}</p>
            )}
          </div>
        )}

        {/* ── Paid ─────────────────────────────────────────────────────── */}
        {status === 'paid' && (
          <div className="verify-page__state verify-page__state--success">
            <div className="verify-page__icon verify-page__icon--success">
              <CheckCircle size={52} />
            </div>
            <h2 className="verify-page__title">Payment Successful! 🎉</h2>
            <p className="verify-page__sub">
              Your order <strong>#{orderNumber}</strong> has been confirmed.
              A confirmation email is on its way.
            </p>
            <div className="verify-page__actions">
              <Link to="/account/orders" className="btn btn--primary btn--lg">
                <Package size={18} /> Track Order
              </Link>
              <Link to="/products" className="btn btn--outline">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}

        {/* ── Failed ───────────────────────────────────────────────────── */}
        {status === 'failed' && (
          <div className="verify-page__state verify-page__state--error">
            <div className="verify-page__icon verify-page__icon--error">
              <XCircle size={52} />
            </div>
            <h2 className="verify-page__title">Payment Failed</h2>
            <p className="verify-page__sub">
              Your payment could not be processed. No charge was made.
            </p>
            <div className="verify-page__actions">
              <button className="btn btn--primary btn--lg" onClick={() => navigate('/checkout')}>
                Try Again
              </button>
              <Link to="/cart" className="btn btn--outline">Back to Cart</Link>
            </div>
          </div>
        )}

        {/* ── Timeout ──────────────────────────────────────────────────── */}
        {status === 'timeout' && (
          <div className="verify-page__state verify-page__state--timeout">
            <div className="verify-page__icon verify-page__icon--timeout">
              <Clock size={52} />
            </div>
            <h2 className="verify-page__title">Payment Processing</h2>
            <p className="verify-page__sub">
              Your payment is still being processed. Check your email for a
              confirmation, or view your orders to track its status.
            </p>
            {orderNumber && (
              <p className="verify-page__order-num">Order #{orderNumber}</p>
            )}
            <div className="verify-page__actions">
              <Link to="/account/orders" className="btn btn--primary btn--lg">
                <Package size={18} /> View Orders
              </Link>
              <Link to="/" className="btn btn--outline">Go Home</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
