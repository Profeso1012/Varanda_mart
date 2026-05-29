import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://varanda-api-v1.onrender.com/api/v1';

let refreshPromise = null;

export const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => {
        const newToken = data?.data?.accessToken;
        if (!newToken) throw new Error('Refresh response did not include an access token');
        sessionStorage.setItem('sellerToken', newToken);
        return newToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// 1. Seller Dashboard instance
export const sellerApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

sellerApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('sellerToken');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

sellerApi.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    // Plan limit: fire global event
    if (err.response?.status === 403) {
      const code = err.response.data?.error?.code;
      if (code === 'PLAN_LIMIT') {
        window.dispatchEvent(
          new CustomEvent('varanda:plan-limit', { detail: err.response.data.error })
        );
        return Promise.reject(err);
      }
      if (code === 'SUBSCRIPTION_REQUIRED') {
        window.location.href = '/pricing';
        return Promise.reject(err);
      }
    }

    // Token refresh on 401
    if (
      err.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/refresh')
    ) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers = original.headers || {};
        original.headers['Authorization'] = `Bearer ${newToken}`;
        return sellerApi(original);
      } catch (refreshErr) {
        sessionStorage.removeItem('sellerToken');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(err);
  }
);

// 2. Storefront instance
export const storefrontApi = axios.create({ baseURL: BASE_URL });

storefrontApi.interceptors.request.use((config) => {
  const customerToken = localStorage.getItem('customerToken');
  if (customerToken) config.headers['X-Customer-Token'] = `Bearer ${customerToken}`;
  if (import.meta.env.DEV) {
    config.headers['X-Tenant-Domain'] =
      import.meta.env.VITE_DEV_TENANT_DOMAIN || 'teststore.varanda.com';
  }
  return config;
});

// 3. External API Partner instance
export const partnerApi = axios.create({
  baseURL: import.meta.env.VITE_EXT_API_URL || 'https://api.varanda.com/ext/v1',
});

partnerApi.interceptors.request.use((config) => {
  const publicKey = localStorage.getItem('partnerPublicKey');
  if (publicKey) config.headers['X-Varanda-Public-Key'] = publicKey;
  return config;
});

// Default export for backward compatibility with existing auth pages
export default sellerApi;
