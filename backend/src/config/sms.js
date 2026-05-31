const axios = require('axios');
const { config } = require('./env');

const sendSms = async (to, message) => {
  if (!config.termiiApiKey) {
    console.warn('[sms] Termii API key not configured — SMS skipped');
    return { messageId: null };
  }
  try {
    const { data } = await axios.post('https://api.ng.termii.com/api/sms/send', {
      to,
      from: config.termiiSenderId,
      sms: message,
      type: 'plain',
      channel: 'generic',
      api_key: config.termiiApiKey,
    });
    return { messageId: data.message_id };
  } catch (err) {
    console.error('[sms] Send failed:', err.message);
    return { messageId: null };
  }
};

const sendBulkSms = async (recipients, message) => {
  const batches = [];
  for (let i = 0; i < recipients.length; i += 100) {
    batches.push(recipients.slice(i, i + 100));
  }
  for (const batch of batches) {
    await Promise.allSettled(batch.map((r) => sendSms(r, message)));
  }
};

const sendOtpSms = (to, code) => sendSms(to, `Your Varanda verification code is: ${code}. Valid for 10 minutes.`);

module.exports = { sendSms, sendBulkSms, sendOtpSms };
