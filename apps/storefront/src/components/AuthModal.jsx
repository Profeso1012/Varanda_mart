// apps/storefront/src/components/AuthModal.jsx
import { useEffect, useRef } from 'react';
import { X, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import './AuthModal.css';

export default function AuthModal({ onClose, onSuccess }) {
  const { store } = useStore();
  const { otpStep, otpEmail, loading, error, sendOtp, confirmOtp, resetOtpFlow } = useAuth();
  const emailRef = useRef(null);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (otpStep === 'email' && emailRef.current) emailRef.current.focus();
  }, [otpStep]);

  // ── Email step ────────────────────────────────────────────────────────────
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const email = emailRef.current.value.trim();
    if (!email) return;
    await sendOtp(email);
  };

  // ── OTP input — auto-advance and auto-submit ──────────────────────────────
  const handleOtpKeyUp = async (e, index) => {
    const val = e.target.value;
    if (val && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
    // If all 6 filled, auto-submit
    const code = otpRefs.map(r => r.current?.value || '').join('');
    if (code.length === 6) {
      const result = await confirmOtp(code);
      if (result) onSuccess?.();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !e.target.value && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = async (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    pasted.split('').forEach((char, i) => {
      if (otpRefs[i].current) otpRefs[i].current.value = char;
    });
    if (pasted.length === 6) {
      const result = await confirmOtp(pasted);
      if (result) onSuccess?.();
    }
  };

  const handleResend = async () => {
    otpRefs.forEach(r => { if (r.current) r.current.value = ''; });
    await sendOtp(otpEmail);
    otpRefs[0].current?.focus();
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box auth-modal">
        {/* Header */}
        <div className="auth-modal__header">
          {store?.logoUrl && (
            <img src={store.logoUrl} alt={store.name} className="auth-modal__logo" />
          )}
          <button className="auth-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {otpStep === 'email' ? (
          <>
            <div className="auth-modal__icon">
              <Mail size={28} />
            </div>
            <h2 className="auth-modal__title">Sign in to {store?.name || 'the store'}</h2>
            <p className="auth-modal__sub">Enter your email to receive a verification code</p>

            <form onSubmit={handleEmailSubmit} className="auth-modal__form">
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input
                  ref={emailRef}
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              {error && <p className="form-error">{error}</p>}

              <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                {loading ? <span className="spinner" /> : <><ArrowRight size={16} /> Continue</>}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="auth-modal__icon auth-modal__icon--otp">
              <span>✉️</span>
            </div>
            <h2 className="auth-modal__title">Check your inbox</h2>
            <p className="auth-modal__sub">
              We sent a 6-digit code to <strong>{otpEmail}</strong>
            </p>

            <div className="auth-modal__otp-grid" onPaste={handleOtpPaste}>
              {otpRefs.map((ref, i) => (
                <input
                  key={i}
                  ref={ref}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="auth-modal__otp-input"
                  onKeyUp={(e) => handleOtpKeyUp(e, i)}
                  onKeyDown={(e) => handleOtpKeyDown(e, i)}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {error && <p className="form-error" style={{ textAlign: 'center' }}>{error}</p>}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '8px' }}>
                <span className="spinner" />
              </div>
            )}

            <div className="auth-modal__footer">
              <button className="btn btn--ghost btn--sm" onClick={handleResend} disabled={loading}>
                <RefreshCw size={14} /> Resend code
              </button>
              <button className="btn btn--ghost btn--sm" onClick={resetOtpFlow}>
                Change email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
