/**
 * Third-Party Sync Service — Full implementation in Phase 8.
 * Handles external dropship platform sync and order forwarding.
 */

const { providers } = require('../config/thirdPartyProviders');
const { decrypt } = require('../utils/encrypt');

const syncProducts = async (connection) => {
  const adapter = providers[connection.provider];
  if (!adapter) throw new Error(`Unknown provider: ${connection.provider}`);
  const decryptedKey = decrypt(connection.api_key_encrypted);
  return adapter.fetchProducts({ ...connection, apiKey: decryptedKey }, {});
};

const forwardOrder = async (connection, orderData) => {
  const adapter = providers[connection.provider];
  if (!adapter) throw new Error(`Unknown provider: ${connection.provider}`);
  const decryptedKey = decrypt(connection.api_key_encrypted);
  return adapter.placeOrder({ ...connection, apiKey: decryptedKey }, orderData);
};

const getOrderStatus = async (connection, externalOrderId) => {
  const adapter = providers[connection.provider];
  if (!adapter) throw new Error(`Unknown provider: ${connection.provider}`);
  const decryptedKey = decrypt(connection.api_key_encrypted);
  return adapter.getOrderStatus({ ...connection, apiKey: decryptedKey }, externalOrderId);
};

module.exports = { syncProducts, forwardOrder, getOrderStatus };
