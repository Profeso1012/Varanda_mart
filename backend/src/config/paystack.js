const axios = require('axios');
const crypto = require('crypto');
const { config } = require('./env');

const paystackClient = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: { Authorization: `Bearer ${config.paystackSecretKey}` },
  timeout: 15000,
});

let banksCache = null;
let banksCacheTime = 0;

const resolveAccount = async (bankCode, accountNumber) => {
  const { data } = await paystackClient.get('/bank/resolve', {
    params: { account_number: accountNumber, bank_code: bankCode },
  });
  return {
    accountName: data.data.account_name,
    accountNumber: data.data.account_number,
    bankName: data.data.bank_name || bankCode,
  };
};

const createSubaccount = async ({ businessName, settlementBank, accountNumber, percentageCharge }) => {
  const { data } = await paystackClient.post('/subaccount', {
    business_name: businessName,
    settlement_bank: settlementBank,
    account_number: accountNumber,
    percentage_charge: percentageCharge,
  });
  return {
    subaccountId: data.data.id,
    subaccountCode: data.data.subaccount_code,
  };
};

const createTransferRecipient = async ({ type = 'nuban', name, accountNumber, bankCode }) => {
  const { data } = await paystackClient.post('/transferrecipient', {
    type,
    name,
    account_number: accountNumber,
    bank_code: bankCode,
    currency: 'NGN',
  });
  return { recipientCode: data.data.recipient_code };
};

const initializeTransaction = async ({ email, amount, reference, callbackUrl, metadata, split }) => {
  const payload = { email, amount, reference, callback_url: callbackUrl, metadata };
  if (split) payload.split = split;
  const { data } = await paystackClient.post('/transaction/initialize', payload);
  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
};

const verifyTransaction = async (reference) => {
  const { data } = await paystackClient.get(`/transaction/verify/${reference}`);
  return {
    status: data.data.status,
    amount: data.data.amount,
    metadata: data.data.metadata,
    channel: data.data.channel,
  };
};

const initiateTransfer = async ({ source = 'balance', amount, recipient, reference, reason }) => {
  const { data } = await paystackClient.post('/transfer', {
    source,
    amount,
    recipient,
    reference,
    reason,
  });
  return { transferCode: data.data.transfer_code, status: data.data.status };
};

const verifyWebhookSignature = (rawBody, signature) => {
  if (!config.paystackWebhookSecret) return true; // skip in dev if not set
  const hash = crypto
    .createHmac('sha512', config.paystackWebhookSecret)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
};

const getBanks = async () => {
  const now = Date.now();
  if (banksCache && now - banksCacheTime < 24 * 60 * 60 * 1000) return banksCache;
  const { data } = await paystackClient.get('/bank');
  banksCache = data.data;
  banksCacheTime = now;
  return banksCache;
};

module.exports = {
  resolveAccount,
  createSubaccount,
  createTransferRecipient,
  initializeTransaction,
  verifyTransaction,
  initiateTransfer,
  verifyWebhookSignature,
  getBanks,
};
