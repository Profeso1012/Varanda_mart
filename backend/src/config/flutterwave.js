const axios = require('axios');
const crypto = require('crypto');
const { config } = require('./env');

const flwClient = axios.create({
  baseURL: 'https://api.flutterwave.com/v3',
  headers: { Authorization: `Bearer ${config.flutterwaveSecretKey}` },
  timeout: 15000,
});

let banksCache = null;
let banksCacheTime = 0;

// ─── Subscription Methods (existing) ──────────────────────────────────────────

const initializeSubscription = async ({ txRef, amount, currency = 'USD', redirectUrl, customerEmail, customerName, planId, meta }) => {
  const { data } = await flwClient.post('/payments', {
    tx_ref: txRef,
    amount,
    currency,
    redirect_url: redirectUrl,
    customer: { email: customerEmail, name: customerName },
    payment_plan: planId,
    meta,
  });
  return { link: data.data.link };
};

const getSubscription = async (flwSubscriptionId) => {
  const { data } = await flwClient.get(`/subscriptions/${flwSubscriptionId}`);
  return data.data;
};

const cancelSubscription = async (flwSubscriptionId) => {
  await flwClient.put(`/subscriptions/${flwSubscriptionId}/cancel`);
};

// ─── Payment Methods (for orders) ─────────────────────────────────────────────

/**
 * Initialize a standard payment (for orders, not subscriptions)
 * @param {object} params
 * @param {string} params.txRef - Unique transaction reference
 * @param {number} params.amount - Amount to charge
 * @param {string} params.currency - Currency code (NGN, USD, etc.)
 * @param {string} params.redirectUrl - URL to redirect after payment
 * @param {string} params.customerEmail - Customer email
 * @param {string} params.customerName - Customer name
 * @param {object} params.meta - Additional metadata
 * @param {object} params.subaccounts - Optional subaccount split configuration
 */
const initializePayment = async ({ txRef, amount, currency = 'NGN', redirectUrl, customerEmail, customerName, meta, subaccounts }) => {
  const payload = {
    tx_ref: txRef,
    amount,
    currency,
    redirect_url: redirectUrl,
    customer: {
      email: customerEmail,
      name: customerName,
    },
    customizations: {
      title: 'Varanda Mart',
      description: 'Order Payment',
      logo: 'https://varanda.com/logo.png',
    },
    meta,
  };

  // Add subaccount split if provided
  if (subaccounts && subaccounts.length > 0) {
    payload.subaccounts = subaccounts;
  }

  const { data } = await flwClient.post('/payments', payload);
  return {
    paymentLink: data.data.link,
    reference: txRef,
  };
};

/**
 * Verify a transaction by ID
 */
const verifyTransaction = async (transactionId) => {
  const { data } = await flwClient.get(`/transactions/${transactionId}/verify`);
  return {
    status: data.data.status, // 'successful', 'failed', 'pending'
    amount: data.data.amount,
    currency: data.data.currency,
    txRef: data.data.tx_ref,
    flwRef: data.data.flw_ref,
    chargedAmount: data.data.charged_amount,
    appFee: data.data.app_fee,
    merchantFee: data.data.merchant_fee,
    processorResponse: data.data.processor_response,
    customer: data.data.customer,
    meta: data.data.meta,
    planToken: data.data.plan_token,
  };
};

/**
 * Verify transaction by reference (tx_ref)
 */
const verifyTransactionByRef = async (txRef) => {
  const { data } = await flwClient.get(`/transactions/verify_by_reference?tx_ref=${txRef}`);
  return {
    status: data.data.status,
    amount: data.data.amount,
    currency: data.data.currency,
    txRef: data.data.tx_ref,
    flwRef: data.data.flw_ref,
    chargedAmount: data.data.charged_amount,
    customer: data.data.customer,
    meta: data.data.meta,
  };
};

/**
 * Get list of banks for account verification
 * @param {string} country - Country code (NG, GH, KE, etc.)
 */
const getBanks = async (country = 'NG') => {
  const now = Date.now();
  const cacheKey = `banks_${country}`;
  
  if (banksCache && banksCache[cacheKey] && now - banksCacheTime < 24 * 60 * 60 * 1000) {
    return banksCache[cacheKey];
  }

  const { data } = await flwClient.get(`/banks/${country}`);
  
  if (!banksCache) banksCache = {};
  banksCache[cacheKey] = data.data;
  banksCacheTime = now;
  
  return data.data;
};

/**
 * Resolve/verify bank account
 * @param {string} accountNumber - Account number to verify
 * @param {string} accountBank - Bank code
 */
const resolveAccount = async (accountNumber, accountBank) => {
  const { data } = await flwClient.post('/accounts/resolve', {
    account_number: accountNumber,
    account_bank: accountBank,
  });
  return {
    accountNumber: data.data.account_number,
    accountName: data.data.account_name,
    bankCode: accountBank,
  };
};

/**
 * Create a subaccount for split payments
 * @param {object} params
 * @param {string} params.accountBank - Bank code
 * @param {string} params.accountNumber - Account number
 * @param {string} params.businessName - Business name
 * @param {string} params.businessEmail - Business email
 * @param {string} params.businessContact - Business contact
 * @param {string} params.businessMobile - Business mobile
 * @param {string} params.country - Country code (NG, GH, etc.)
 * @param {number} params.splitValue - Split value (0.5 = 50%)
 */
const createSubaccount = async ({ accountBank, accountNumber, businessName, businessEmail, businessContact, businessMobile, country = 'NG', splitValue = 0.5 }) => {
  const { data } = await flwClient.post('/subaccounts', {
    account_bank: accountBank,
    account_number: accountNumber,
    business_name: businessName,
    business_email: businessEmail,
    business_contact: businessContact,
    business_mobile: businessMobile,
    country,
    split_type: 'percentage',
    split_value: splitValue,
  });
  return {
    subaccountId: data.data.id,
    subaccountCode: data.data.subaccount_id,
    accountId: data.data.account_id,
  };
};

/**
 * Initiate a transfer (payout) to a bank account
 * @param {object} params
 * @param {string} params.accountBank - Bank code
 * @param {string} params.accountNumber - Account number
 * @param {number} params.amount - Amount to transfer
 * @param {string} params.currency - Currency (NGN, USD, etc.)
 * @param {string} params.reference - Unique reference
 * @param {string} params.narration - Transfer description
 * @param {string} params.beneficiaryName - Beneficiary name
 */
const initiateTransfer = async ({ accountBank, accountNumber, amount, currency = 'NGN', reference, narration, beneficiaryName }) => {
  const { data } = await flwClient.post('/transfers', {
    account_bank: accountBank,
    account_number: accountNumber,
    amount,
    currency,
    reference,
    narration,
    beneficiary_name: beneficiaryName,
  });
  return {
    transferId: data.data.id,
    reference: data.data.reference,
    status: data.data.status, // 'NEW', 'PENDING', 'SUCCESSFUL', 'FAILED'
  };
};

/**
 * Verify webhook signature
 * Flutterwave sends a 'verif-hash' header with webhook requests
 */
const verifyWebhookSignature = (hash) => {
  if (!config.flutterwaveWebhookHash) return true; // skip in dev if not set
  return hash === config.flutterwaveWebhookHash;
};

module.exports = {
  // Subscription methods
  initializeSubscription,
  getSubscription,
  cancelSubscription,
  
  // Payment methods (for orders)
  initializePayment,
  verifyTransaction,
  verifyTransactionByRef,
  
  // Bank & account methods
  getBanks,
  resolveAccount,
  createSubaccount,
  
  // Transfer methods
  initiateTransfer,
  
  // Webhook
  verifyWebhookSignature,
};
