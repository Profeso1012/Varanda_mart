// apps/storefront/src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import {
  requestOtp as apiRequestOtp,
  verifyOtp as apiVerifyOtp,
  logoutCustomer as apiLogout,
  getCustomerToken,
  setCustomerToken,
  removeCustomerToken,
  getOrCreateGuestSessionId,
  mergeCart,
} from '../api/storefrontApi';

const AuthContext = createContext(null);

export function AuthProvider({ children, onCartMerge }) {
  const [customer, setCustomer] = useState(null);
  const [token, setToken] = useState(() => getCustomerToken());
  const [otpStep, setOtpStep] = useState('email'); // 'email' | 'otp'
  const [otpEmail, setOtpEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendOtp = useCallback(async (email) => {
    setLoading(true);
    setError(null);
    try {
      await apiRequestOtp(email);
      setOtpEmail(email);
      setOtpStep('otp');
      return true;
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to send OTP');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmOtp = useCallback(async (code) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiVerifyOtp(otpEmail, code);
      setCustomerToken(data.token);
      setToken(data.token);
      setCustomer(data.customer);
      setOtpStep('email');

      // Merge guest cart into account
      const guestId = localStorage.getItem('varanda_guest_session');
      if (guestId) {
        try {
          const merged = await mergeCart(guestId);
          if (onCartMerge) onCartMerge(merged);
        } catch (_) { /* non-fatal */ }
      }
      return data;
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 'INVALID_CODE') setError('Incorrect code. Please try again.');
      else if (code === 'GONE') setError('Code expired. Request a new one.');
      else if (code === 'MAX_ATTEMPTS') setError('Too many attempts. Request a new code.');
      else setError(err.response?.data?.error?.message || 'Verification failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, [otpEmail, onCartMerge]);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch (_) { /* ignore */ }
    removeCustomerToken();
    setToken(null);
    setCustomer(null);
  }, []);

  const resetOtpFlow = useCallback(() => {
    setOtpStep('email');
    setOtpEmail('');
    setError(null);
  }, []);

  const isLoggedIn = Boolean(token);

  return (
    <AuthContext.Provider value={{
      customer, token, isLoggedIn,
      otpStep, otpEmail, loading, error,
      sendOtp, confirmOtp, logout, resetOtpFlow,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
