import { createContext, useContext, useState, useEffect } from 'react';
import { refreshAccessToken, sellerApi } from '../lib/axios';
import { getAccessToken, setAccessToken, clearAccessToken } from '../lib/auth';
import { getRouteForOnboarding } from '../lib/authRoutes';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [business,     setBusiness]     = useState(null);
  const [supplierProfile, setSupplierProfile] = useState(null);
  const [developerProfile, setDeveloperProfile] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading,      setLoading]      = useState(true); // true on first load
  const [initialized,  setInitialized]  = useState(false);

  const applyAuthPayload = (payload = {}) => {
    setUser(payload.user || null);
    setBusiness(payload.business || null);
    setSupplierProfile(payload.supplierProfile || null);
    setDeveloperProfile(payload.developerProfile || null);
    setSubscription(payload.subscription || null);
  };

  // Called once on app load to restore the session from the access token or refresh cookie
  const initialize = async () => {
    try {
      const token = getAccessToken();
      if (!token) await refreshAccessToken();

      const { data } = await sellerApi.get('/auth/me');
      applyAuthPayload(data.data);
    } catch {
      clearAccessToken();
      applyAuthPayload();
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  useEffect(() => {
    initialize();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Called after successful login or OTP verification
  const loginWithToken = (accessToken, payloadOrUser, businessData) => {
    setAccessToken(accessToken);
    if (payloadOrUser?.user) {
      applyAuthPayload(payloadOrUser);
    } else {
      applyAuthPayload({ user: payloadOrUser, business: businessData });
    }
  };

  const logout = async () => {
    try { await sellerApi.post('/auth/logout'); } catch {
      // Local logout should still complete if the server session is already gone.
    }
    clearAccessToken();
    applyAuthPayload();
  };

  // Determine dashboard route based on real backend data
  const getDashboardRoute = (userData = user) => getRouteForOnboarding(userData);

  return (
    <AuthContext.Provider value={{
      user, business, supplierProfile, developerProfile, subscription, loading, initialized,
      loginWithToken, logout, getDashboardRoute,
      setUser, setBusiness, setSupplierProfile, setDeveloperProfile, setSubscription, applyAuthPayload,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
