// Third-party dropship provider adapters — Phase 8
// Each adapter implements: fetchProducts, fetchProductDetail, placeOrder, getOrderStatus

const printfulAdapter = {
  fetchProducts: async (connection, params) => [],
  fetchProductDetail: async (connection, externalProductId) => null,
  placeOrder: async (connection, orderData) => ({ externalOrderId: null, estimatedShipping: null }),
  getOrderStatus: async (connection, externalOrderId) => ({ status: 'UNKNOWN', trackingInfo: null }),
};

const aliexpressAdapter = { ...printfulAdapter };
const zendropAdapter = { ...printfulAdapter };
const customAdapter = { ...printfulAdapter };

const providers = {
  PRINTFUL: printfulAdapter,
  ALIEXPRESS: aliexpressAdapter,
  ZENDROP: zendropAdapter,
  CUSTOM: customAdapter,
};

module.exports = { providers };
