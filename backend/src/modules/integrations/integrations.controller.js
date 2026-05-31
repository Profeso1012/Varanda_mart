const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const { encrypt, decrypt } = require('../../utils/encrypt');
const shipbubbleConfig = require('../../config/shipbubble');
const { sql } = require('../../config/database');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getLogisticsIntegration = async (businessId, provider = 'SHIPBUBBLE') => {
  const [row] = await sql`
    SELECT * FROM logistics_integrations
    WHERE business_id = ${businessId} AND provider = ${provider}
  `;
  return row || null;
};

// ─── POST /integrations/shipbubble/connect ────────────────────────────────────
/**
 * Body: { apiKey, originAddress }
 * originAddress: { contactName, phone, email, streetAddress, city, state, country }
 * Tests the key, then stores encrypted.
 */
const connectShipbubble = asyncHandler(async (req, res) => {
  const { apiKey, originAddress } = req.body;
  if (!apiKey) throw new AppError('apiKey is required.', 422, 'VALIDATION_ERROR');

  // Test the key
  let accountEmail;
  try {
    const result = await shipbubbleConfig.testConnection(apiKey);
    accountEmail = result.accountEmail;
  } catch (err) {
    throw new AppError('Could not connect. Check your API key.', 400, 'INVALID_API_KEY');
  }

  const encryptedKey = encrypt(apiKey);

  const existing = await getLogisticsIntegration(req.businessId);
  if (existing) {
    const [updated] = await sql`
      UPDATE logistics_integrations
      SET api_key_encrypted = ${encryptedKey},
          is_active = true,
          origin_address = ${originAddress ? sql.json(originAddress) : null},
          connected_at = NOW(),
          last_tested_at = NOW(),
          updated_at = NOW()
      WHERE business_id = ${req.businessId} AND provider = 'SHIPBUBBLE'
      RETURNING *
    `;
    return res.json({
      success: true,
      data: { connected: true, accountEmail, isActive: updated.is_active },
    });
  }

  await sql`
    INSERT INTO logistics_integrations
      (business_id, provider, api_key_encrypted, is_active, origin_address, connected_at, last_tested_at)
    VALUES (
      ${req.businessId}, 'SHIPBUBBLE', ${encryptedKey}, true,
      ${originAddress ? sql.json(originAddress) : null}, NOW(), NOW()
    )
  `;

  res.status(201).json({
    success: true,
    data: { connected: true, accountEmail, isActive: true },
  });
});

// ─── GET /integrations/shipbubble/status ──────────────────────────────────────

const getShipbubbleStatus = asyncHandler(async (req, res) => {
  const integration = await getLogisticsIntegration(req.businessId);
  if (!integration) {
    return res.json({ success: true, data: { connected: false } });
  }

  // Re-test the key to confirm it's still valid
  let accountEmail = null;
  let valid = false;
  try {
    const apiKey = decrypt(integration.api_key_encrypted);
    const result = await shipbubbleConfig.testConnection(apiKey);
    accountEmail = result.accountEmail;
    valid = true;
    await sql`
      UPDATE logistics_integrations SET last_tested_at = NOW() WHERE id = ${integration.id}
    `;
  } catch {}

  res.json({
    success: true,
    data: {
      connected: true,
      isActive: integration.is_active,
      accountEmail,
      keyValid: valid,
      originAddress: integration.origin_address,
      connectedAt: integration.connected_at,
      lastTestedAt: integration.last_tested_at,
    },
  });
});

// ─── DELETE /integrations/shipbubble/disconnect ───────────────────────────────

const disconnectShipbubble = asyncHandler(async (req, res) => {
  await sql`
    UPDATE logistics_integrations
    SET is_active = false, updated_at = NOW()
    WHERE business_id = ${req.businessId} AND provider = 'SHIPBUBBLE'
  `;
  res.json({ success: true, data: { message: 'Shipbubble disconnected. Manual shipping zones will be used.' } });
});

// ─── PUT /integrations/shipbubble/origin-address ─────────────────────────────

const updateOriginAddress = asyncHandler(async (req, res) => {
  const integration = await getLogisticsIntegration(req.businessId);
  if (!integration) throw new AppError('Shipbubble is not connected.', 404, 'NOT_FOUND');

  const [updated] = await sql`
    UPDATE logistics_integrations
    SET origin_address = ${sql.json(req.body)}, updated_at = NOW()
    WHERE business_id = ${req.businessId} AND provider = 'SHIPBUBBLE'
    RETURNING *
  `;
  res.json({ success: true, data: { originAddress: updated.origin_address } });
});

module.exports = { connectShipbubble, getShipbubbleStatus, disconnectShipbubble, updateOriginAddress };
