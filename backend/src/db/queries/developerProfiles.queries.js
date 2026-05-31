const { sql } = require('../../config/database');

const createDeveloperProfile = async ({ userId, businessName, contactName, websiteUrl, description }) => {
  const [profile] = await sql`
    INSERT INTO developer_profiles (user_id, business_name, contact_name, website_url, description)
    VALUES (${userId}, ${businessName}, ${contactName}, ${websiteUrl || null}, ${description || null})
    RETURNING *
  `;
  return profile;
};

const findDeveloperByUserId = async (userId) => {
  const [profile] = await sql`SELECT * FROM developer_profiles WHERE user_id = ${userId}`;
  return profile || null;
};

const findDeveloperById = async (id) => {
  const [profile] = await sql`SELECT * FROM developer_profiles WHERE id = ${id}`;
  return profile || null;
};

const updateDeveloperProfile = async (id, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [profile] = await sql`
    UPDATE developer_profiles SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return profile;
};

const approveDeveloper = async (id, approvedBy) => {
  const [profile] = await sql`
    UPDATE developer_profiles
    SET status = 'ACTIVE', approved_at = NOW(), approved_by = ${approvedBy}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return profile;
};

const suspendDeveloper = async (id) => {
  const [profile] = await sql`
    UPDATE developer_profiles SET status = 'SUSPENDED', updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return profile;
};

const setDeveloperBankAccount = async (id, { bankName, bankCode, accountNumber, accountName, paystackRecipientCode }) => {
  const [profile] = await sql`
    UPDATE developer_profiles
    SET bank_name = ${bankName}, bank_code = ${bankCode}, account_number = ${accountNumber},
        account_name = ${accountName}, paystack_recipient_code = ${paystackRecipientCode},
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return profile;
};

const createApiCredentials = async (developerId, publicKey, secretKeyHash) => {
  const [cred] = await sql`
    INSERT INTO developer_credentials (developer_id, public_key, secret_key_hash)
    VALUES (${developerId}, ${publicKey}, ${secretKeyHash})
    RETURNING *
  `;
  return cred;
};

const findCredentialsByPublicKey = async (publicKey) => {
  const [cred] = await sql`
    SELECT dc.*, dp.status AS developer_status, dp.id AS developer_profile_id,
           dp.business_name, dp.contact_name, dp.paystack_recipient_code,
           dp.total_orders, dp.total_revenue_earned
    FROM developer_credentials dc
    JOIN developer_profiles dp ON dp.id = dc.developer_id
    WHERE dc.public_key = ${publicKey}
  `;
  if (!cred) return null;
  return {
    ...cred,
    developer: {
      id: cred.developer_profile_id,
      businessName: cred.business_name,
      contactName: cred.contact_name,
      status: cred.developer_status,
      paystackRecipientCode: cred.paystack_recipient_code,
    },
  };
};

const deactivateCredentials = async (developerId) => {
  await sql`
    UPDATE developer_credentials SET is_active = false WHERE developer_id = ${developerId}
  `;
};

const createDeveloperWebhook = async (developerId, { url, events, secretHash }) => {
  const [webhook] = await sql`
    INSERT INTO developer_webhooks (developer_id, url, events, secret_hash)
    VALUES (${developerId}, ${url}, ${events}, ${secretHash})
    RETURNING *
  `;
  return webhook;
};

const getDeveloperWebhooks = async (developerId) => {
  return sql`SELECT * FROM developer_webhooks WHERE developer_id = ${developerId} ORDER BY created_at DESC`;
};

const updateDeveloperWebhook = async (id, developerId, fields) => {
  const keys = Object.keys(fields);
  if (!keys.length) return null;
  const [webhook] = await sql`
    UPDATE developer_webhooks SET ${sql(fields, keys)}, updated_at = NOW()
    WHERE id = ${id} AND developer_id = ${developerId}
    RETURNING *
  `;
  return webhook;
};

const deleteDeveloperWebhook = async (id, developerId) => {
  await sql`DELETE FROM developer_webhooks WHERE id = ${id} AND developer_id = ${developerId}`;
};

const getActiveWebhooksForEvent = async (developerId, event) => {
  return sql`
    SELECT * FROM developer_webhooks
    WHERE developer_id = ${developerId}
      AND events @> ARRAY[${event}]::text[]
      AND is_active = true
      AND disabled_at IS NULL
  `;
};

const incrementWebhookFailures = async (id) => {
  const [w] = await sql`
    UPDATE developer_webhooks SET consecutive_failures = consecutive_failures + 1
    WHERE id = ${id} RETURNING consecutive_failures
  `;
  return w.consecutive_failures;
};

const disableWebhook = async (id) => {
  await sql`UPDATE developer_webhooks SET disabled_at = NOW(), is_active = false WHERE id = ${id}`;
};

const resetWebhookFailures = async (id) => {
  await sql`
    UPDATE developer_webhooks
    SET consecutive_failures = 0, last_triggered_at = NOW()
    WHERE id = ${id}
  `;
};

const listDevelopers = async ({ status, page = 1, perPage = 20 }) => {
  const offset = (page - 1) * perPage;
  const rows = await sql`
    SELECT dp.*, u.email, u.first_name, u.last_name
    FROM developer_profiles dp
    JOIN users u ON u.id = dp.user_id
    WHERE (${status || null}::text IS NULL OR dp.status = ${status || null}::developer_status)
    ORDER BY dp.created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `;
  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM developer_profiles
    WHERE (${status || null}::text IS NULL OR status = ${status || null}::developer_status)
  `;
  return { rows, total: count };
};

module.exports = {
  createDeveloperProfile,
  findDeveloperByUserId,
  findDeveloperById,
  updateDeveloperProfile,
  approveDeveloper,
  suspendDeveloper,
  setDeveloperBankAccount,
  createApiCredentials,
  findCredentialsByPublicKey,
  deactivateCredentials,
  createDeveloperWebhook,
  getDeveloperWebhooks,
  updateDeveloperWebhook,
  deleteDeveloperWebhook,
  getActiveWebhooksForEvent,
  incrementWebhookFailures,
  disableWebhook,
  resetWebhookFailures,
  listDevelopers,
};
