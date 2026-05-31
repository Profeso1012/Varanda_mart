// apps/dashboard/src/api/orders.js
import { sellerApi } from '../lib/axios';

// ─── Seller Orders ────────────────────────────────────────────────────────────

export const getOrderStats = () =>
  sellerApi.get('/orders/stats').then(r => r.data.data);

export const getOrders = (params) =>
  sellerApi.get('/orders', { params }).then(r => r.data);

export const getOrder = (orderId) =>
  sellerApi.get(`/orders/${orderId}`).then(r => r.data.data);

export const updateOrderStatus = (orderId, statusData) =>
  sellerApi.put(`/orders/${orderId}/status`, statusData).then(r => r.data.data);

export const cancelOrder = (orderId, reason) =>
  sellerApi.post(`/orders/${orderId}/cancel`, { reason }).then(r => r.data.data);

export const shipOrder = (orderId, trackingData) =>
  sellerApi.post(`/orders/${orderId}/ship`, trackingData).then(r => r.data.data);

export const getShipmentInfo = (orderId) =>
  sellerApi.get(`/orders/${orderId}/shipment`).then(r => r.data.data);

// ─── Seller Dropship Orders ───────────────────────────────────────────────────

export const getDropshipOrders = (params) =>
  sellerApi.get('/seller/dropship-orders', { params }).then(r => r.data);

export const getDropshipOrder = (dropshipOrderId) =>
  sellerApi.get(`/seller/dropship-orders/${dropshipOrderId}`).then(r => r.data.data);

export const confirmDropshipOrder = (dropshipOrderId) =>
  sellerApi.put(`/seller/dropship-orders/${dropshipOrderId}/confirm`).then(r => r.data.data);

export const disputeDropshipOrder = (dropshipOrderId, data) =>
  sellerApi.put(`/seller/dropship-orders/${dropshipOrderId}/dispute`, data).then(r => r.data.data);
