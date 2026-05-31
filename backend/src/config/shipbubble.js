const axios = require('axios');
const { config } = require('./env');
const { encrypt, decrypt } = require('../utils/encrypt');

const shipbubbleClient = (apiKey) =>
  axios.create({
    baseURL: config.shipbubbleApiUrl,
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    timeout: 15000,
  });

/**
 * Test a Shipbubble API key by fetching the account profile.
 * Returns { valid: true, accountEmail } or throws.
 */
const testConnection = async (apiKey) => {
  const client = shipbubbleClient(apiKey);
  const { data } = await client.get('/account/profile');
  return { valid: true, accountEmail: data?.data?.email || null };
};

/**
 * Get live shipping rates from Shipbubble.
 * @param {string} apiKey - decrypted API key
 * @param {object} params
 * @param {object} params.senderAddress - { name, email, phone, address, city, state, country }
 * @param {object} params.receiverAddress - { name, email, phone, address, city, state, country }
 * @param {object[]} params.packages - [{ weight, length, width, height }]
 * @param {number} params.serviceCode - optional: filter to specific carrier service
 */
const getLiveRates = async (apiKey, { senderAddress, receiverAddress, packages }) => {
  const client = shipbubbleClient(apiKey);
  const { data } = await client.post('/shipping/fetch-rates', {
    sender_details: senderAddress,
    receiver_details: receiverAddress,
    package_items: packages,
  });
  // Shipbubble returns data.data.rates array
  const rates = data?.data?.rates || [];
  return rates.map((r) => ({
    serviceCode: r.service_code,
    name: r.courier_name,
    description: r.service_type || null,
    estimatedDays: r.estimated_delivery_date || null,
    rate: Number(r.total || r.amount || 0),
    isFree: false,
    source: 'SHIPBUBBLE',
    rawRate: r,
  }));
};

/**
 * Book a shipment with Shipbubble.
 */
const bookShipment = async (apiKey, { serviceCode, senderAddress, receiverAddress, packages, orderRef }) => {
  const client = shipbubbleClient(apiKey);
  const { data } = await client.post('/shipping/labels', {
    service_code: serviceCode,
    sender_details: senderAddress,
    receiver_details: receiverAddress,
    package_items: packages,
    order_id: orderRef,
  });
  return {
    trackingCode: data?.data?.tracking_code || null,
    trackingUrl: data?.data?.tracking_url || null,
    waybillUrl: data?.data?.waybill_url || null,
    carrierId: data?.data?.courier_id || null,
    carrierName: data?.data?.courier_name || null,
    externalId: data?.data?.shipment_id || null,
  };
};

/**
 * Get shipment status from Shipbubble.
 */
const getShipmentStatus = async (apiKey, trackingCode) => {
  const client = shipbubbleClient(apiKey);
  const { data } = await client.get(`/shipping/track/${trackingCode}`);
  return data?.data || null;
};

module.exports = { testConnection, getLiveRates, bookShipment, getShipmentStatus };
