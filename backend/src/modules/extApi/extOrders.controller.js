const { stub } = require('../_stub');

const createOrder = stub('Phase 7');
const listOrders = stub('Phase 7');
const getOrder = stub('Phase 7');
const confirmOrder = stub('Phase 7');
const disputeOrder = stub('Phase 7');

module.exports = { createOrder, listOrders, getOrder, confirmOrder, disputeOrder };
