// apps/dashboard/src/api/shipping.js
import { sellerApi } from '../lib/axios';

// ─── Manual Zones & Rates ─────────────────────────────────────────────────────

export const getZones = () =>
  sellerApi.get('/shipping/zones').then(r => r.data.data);

export const createZone = (data) =>
  sellerApi.post('/shipping/zones', data).then(r => r.data.data);

export const updateZone = (zoneId, data) =>
  sellerApi.put(`/shipping/zones/${zoneId}`, data).then(r => r.data.data);

export const deleteZone = (zoneId) =>
  sellerApi.delete(`/shipping/zones/${zoneId}`).then(r => r.data.data);

export const addRegionToZone = (zoneId, data) =>
  sellerApi.post(`/shipping/zones/${zoneId}/regions`, data).then(r => r.data.data);

export const removeRegionFromZone = (zoneId, regionId) =>
  sellerApi.delete(`/shipping/zones/${zoneId}/regions/${regionId}`).then(r => r.data.data);

export const addRateToZone = (zoneId, data) =>
  sellerApi.post(`/shipping/zones/${zoneId}/rates`, data).then(r => r.data.data);

export const updateRate = (rateId, data) =>
  sellerApi.put(`/shipping/rates/${rateId}`, data).then(r => r.data.data);

export const deleteRate = (rateId) =>
  sellerApi.delete(`/shipping/rates/${rateId}`).then(r => r.data.data);

// ─── Shipping Policies ────────────────────────────────────────────────────────

export const getPolicies = () =>
  sellerApi.get('/shipping/policies').then(r => r.data.data);

export const createPolicy = (data) =>
  sellerApi.post('/shipping/policies', data).then(r => r.data.data);

export const updatePolicy = (policyId, data) =>
  sellerApi.put(`/shipping/policies/${policyId}`, data).then(r => r.data.data);

export const deletePolicy = (policyId) =>
  sellerApi.delete(`/shipping/policies/${policyId}`).then(r => r.data.data);

// ─── Shipbubble Integration ───────────────────────────────────────────────────

export const getShipbubbleStatus = () =>
  sellerApi.get('/integrations/shipbubble/status').then(r => r.data.data);

export const connectShipbubble = (data) =>
  sellerApi.post('/integrations/shipbubble/connect', data).then(r => r.data.data);

export const updateShipbubbleOrigin = (data) =>
  sellerApi.put('/integrations/shipbubble/origin-address', data).then(r => r.data.data);

export const disconnectShipbubble = () =>
  sellerApi.delete('/integrations/shipbubble/disconnect').then(r => r.data.data);
