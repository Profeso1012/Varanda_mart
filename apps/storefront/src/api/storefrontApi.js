// apps/storefront/src/api/storefrontApi.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

// ─── Tenant domain resolution ─────────────────────────────────────────────────
// In dev: always send X-Tenant-Domain (localhost has no meaningful Host header).
// In production: the browser's Host header is used automatically by the server —
// no extra header needed. We only inject it when on localhost/127.0.0.1.
const getTenantDomain = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return import.meta.env.VITE_DEV_TENANT_DOMAIN || 'mystore.varanda.com';
  }
  // In production the Host header is the domain — no override needed
  return null;
};

// ─── Guest session UUID ───────────────────────────────────────────────────────
export const getOrCreateGuestSessionId = () => {
  let id = localStorage.getItem('varanda_guest_session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('varanda_guest_session', id);
  }
  return id;
};

export const getCustomerToken = () => localStorage.getItem('varanda_customer_token');
export const setCustomerToken = (token) => localStorage.setItem('varanda_customer_token', token);
export const removeCustomerToken = () => localStorage.removeItem('varanda_customer_token');

// ─── Axios instance ───────────────────────────────────────────────────────────
const storefrontApi = axios.create({ baseURL: API_BASE_URL });

storefrontApi.interceptors.request.use((config) => {
  // Only inject X-Tenant-Domain when running on localhost
  const tenantDomain = getTenantDomain();
  if (tenantDomain) {
    config.headers['X-Tenant-Domain'] = tenantDomain;
  }

  // Customer auth or guest session
  const token = getCustomerToken();
  if (token) {
    config.headers['X-Customer-Token'] = `Bearer ${token}`;
  } else {
    config.headers['X-Guest-Session'] = getOrCreateGuestSessionId();
  }

  return config;
});

// ─── Bootstrap (call once on app init) ───────────────────────────────────────
// Returns: business, brandSettings, theme, homePage, socialLinks, domain
export const getBootstrap = () =>
  storefrontApi.get('/storefront').then(r => r.data.data);

// ─── Settings only (brand/theme without home page schema) ────────────────────
export const getStoreSettings = () =>
  storefrontApi.get('/storefront/settings').then(r => r.data.data);

// ─── Pages ────────────────────────────────────────────────────────────────────
// List all published pages (for nav building)
export const getPages = () =>
  storefrontApi.get('/storefront/pages').then(r => r.data.data.pages);

// Get a page by its type (HOME, PRODUCTS, ABOUT, etc.) or custom slug (our-story)
// The API accepts both — same endpoint, same param
export const getPage = (pageTypeOrSlug) =>
  storefrontApi.get(`/storefront/pages/${pageTypeOrSlug}`).then(r => r.data.data);

// Alias kept for backward compat with existing usages
export const getStorefrontPage = getPage;

// Policy page by slug (privacy-policy, return-policy, etc.)
export const getPolicyPage = (slug) =>
  storefrontApi.get(`/storefront/policies/${slug}`).then(r => r.data.data);

// ─── Categories ───────────────────────────────────────────────────────────────
// Returns flat list — build tree client-side with buildCategoryTree()
export const getCategories = () =>
  storefrontApi.get('/storefront/categories').then(r => r.data.data);

export function buildCategoryTree(categories) {
  const map = {};
  categories.forEach(c => { map[c.id] = { ...c, children: [] }; });
  const roots = [];
  categories.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children.push(map[c.id]);
    } else {
      roots.push(map[c.id]);
    }
  });
  return roots;
}

// ─── Products ─────────────────────────────────────────────────────────────────
// params: { page, perPage, categoryId, tagId, search }
export const getProducts = (params = {}) =>
  storefrontApi.get('/storefront/products', { params }).then(r => r.data.data);

// Full product detail by slug
export const getProduct = (slug) =>
  storefrontApi.get(`/storefront/products/${slug}`).then(r => r.data.data);

// ─── Customer Auth (OTP) ──────────────────────────────────────────────────────
export const requestOtp = (email) =>
  storefrontApi.post('/storefront/auth/request-otp', { email }).then(r => r.data.data);

export const verifyOtp = (email, code) =>
  storefrontApi.post('/storefront/auth/verify-otp', { email, code }).then(r => r.data.data);

export const logoutCustomer = () =>
  storefrontApi.post('/storefront/auth/logout').then(r => r.data.data);

// ─── Customer Profile ─────────────────────────────────────────────────────────
export const getProfile = () =>
  storefrontApi.get('/storefront/customer/profile').then(r => r.data.data);

export const updateProfile = (data) =>
  storefrontApi.put('/storefront/customer/profile', data).then(r => r.data.data);

export const getAddresses = () =>
  storefrontApi.get('/storefront/customer/addresses').then(r => r.data.data);

export const createAddress = (data) =>
  storefrontApi.post('/storefront/customer/addresses', data).then(r => r.data.data);

export const updateAddress = (addressId, data) =>
  storefrontApi.put(`/storefront/customer/addresses/${addressId}`, data).then(r => r.data.data);

export const deleteAddress = (addressId) =>
  storefrontApi.delete(`/storefront/customer/addresses/${addressId}`).then(r => r.data.data);

export const getCustomerOrders = (page = 1, perPage = 10) =>
  storefrontApi.get('/storefront/customer/orders', { params: { page, perPage } }).then(r => r.data);

export const getCustomerOrder = (orderId) =>
  storefrontApi.get(`/storefront/customer/orders/${orderId}`).then(r => r.data.data);

// ─── Cart ─────────────────────────────────────────────────────────────────────
export const getCart = () =>
  storefrontApi.get('/storefront/cart').then(r => r.data.data);

export const addToCart = (productId, variantId, quantity = 1, dropshipImportId = null) =>
  storefrontApi.post('/storefront/cart/items', {
    productId,
    ...(dropshipImportId ? { dropshipImportId } : { variantId }),
    quantity,
  }).then(r => r.data.data);

export const updateCartItem = (itemId, quantity) =>
  storefrontApi.put(`/storefront/cart/items/${itemId}`, { quantity }).then(r => r.data.data);

export const removeCartItem = (itemId) =>
  storefrontApi.delete(`/storefront/cart/items/${itemId}`).then(r => r.data.data);

export const clearCart = () =>
  storefrontApi.delete('/storefront/cart').then(r => r.data.data);

export const mergeCart = (guestSessionId) =>
  storefrontApi.post('/storefront/cart/merge', { guestSessionId }).then(r => r.data.data);

// ─── Shipping ─────────────────────────────────────────────────────────────────
export const getShippingRates = (params) =>
  storefrontApi.get('/storefront/shipping/rates', { params }).then(r => r.data.data);

// ─── Discounts ────────────────────────────────────────────────────────────────
// API expects: { code, cartTotal }  (not orderTotal or customerEmail)
export const validateDiscount = (code, cartTotal) =>
  storefrontApi
    .post('/storefront/discounts/validate', { code, cartTotal })
    .then(r => r.data.data);

// ─── Checkout ─────────────────────────────────────────────────────────────────
export const initiateCheckout = (data) =>
  storefrontApi.post('/storefront/checkout/initiate', data).then(r => r.data.data);

export const verifyCheckout = (orderNumber) =>
  storefrontApi.get(`/storefront/checkout/verify/${orderNumber}`).then(r => r.data.data);

export default storefrontApi;
