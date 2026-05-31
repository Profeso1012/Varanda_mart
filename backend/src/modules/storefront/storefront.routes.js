const { Router } = require('express');
const { stub } = require('../_stub');
const { requireCustomerAuth, optionalCustomerAuth } = require('../../middleware/auth.middleware');

const {
  bootstrap, getSettings, listPages, getPage, getCategories, getProducts, getProduct, getPolicy,
} = require('./storefront.controller');

const {
  requestOtp, verifyOtp, logout: customerLogout,
  getProfile, updateProfile,
  getAddresses, createAddress, updateAddress, deleteAddress,
  getOrders: getCustomerOrders, getOrder: getCustomerOrder,
} = require('./customer.controller');

const { getCart, addItem, updateItem, removeItem, clearCart, mergeCart } = require('./cart.controller');
const { getShippingRates, validateDiscount, initiateCheckout, verifyCheckout } = require('./checkout.controller');

const router = Router();

// ─── Phase 5: Public storefront ───────────────────────────────────────────────
router.get('/', bootstrap);
router.get('/settings', getSettings);          // brand/theme settings (subset of bootstrap)
router.get('/pages', listPages);               // list all published pages
router.get('/categories', getCategories);
router.get('/products', getProducts);
router.get('/products/:slug/reviews', stub('Phase 9'));
router.post('/products/:slug/reviews', requireCustomerAuth, stub('Phase 9'));
router.get('/products/:slug', getProduct);
router.get('/pages/:pageTypeOrSlug', getPage); // by page_type (HOME, ABOUT...) or custom slug
router.get('/policies/:slug', getPolicy);
router.get('/sitemap.xml', stub('Phase 10'));
router.get('/robots.txt', stub('Phase 10'));

// ─── Phase 6: Customer auth ───────────────────────────────────────────────────
router.post('/auth/request-otp', requestOtp);
router.post('/auth/verify-otp', verifyOtp);
router.post('/auth/logout', requireCustomerAuth, customerLogout);

// ─── Phase 6: Customer profile ────────────────────────────────────────────────
router.get('/customer/profile', requireCustomerAuth, getProfile);
router.put('/customer/profile', requireCustomerAuth, updateProfile);
router.get('/customer/addresses', requireCustomerAuth, getAddresses);
router.post('/customer/addresses', requireCustomerAuth, createAddress);
router.put('/customer/addresses/:addressId', requireCustomerAuth, updateAddress);
router.delete('/customer/addresses/:addressId', requireCustomerAuth, deleteAddress);
router.get('/customer/orders', requireCustomerAuth, getCustomerOrders);
router.get('/customer/orders/:orderId', requireCustomerAuth, getCustomerOrder);

// ─── Phase 6: Cart (optional auth — supports guest + authenticated) ───────────
router.get('/cart', optionalCustomerAuth, getCart);
router.post('/cart/items', optionalCustomerAuth, addItem);
router.put('/cart/items/:itemId', optionalCustomerAuth, updateItem);
router.delete('/cart/items/:itemId', optionalCustomerAuth, removeItem);
router.delete('/cart', optionalCustomerAuth, clearCart);
router.post('/cart/merge', requireCustomerAuth, mergeCart);

// ─── Phase 6: Checkout ────────────────────────────────────────────────────────
router.get('/shipping/rates', getShippingRates);
router.post('/discounts/validate', validateDiscount);
router.post('/checkout/initiate', optionalCustomerAuth, initiateCheckout);
router.get('/checkout/verify/:orderNumber', verifyCheckout);

// ─── Phase 9: Analytics events ───────────────────────────────────────────────
router.post('/events', stub('Phase 9'));

module.exports = router;
