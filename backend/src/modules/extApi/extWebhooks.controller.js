const { stub } = require('../_stub');

const listWebhooks = stub('Phase 7');
const createWebhook = stub('Phase 7');
const updateWebhook = stub('Phase 7');
const deleteWebhook = stub('Phase 7');
const testWebhook = stub('Phase 7');

module.exports = { listWebhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook };
