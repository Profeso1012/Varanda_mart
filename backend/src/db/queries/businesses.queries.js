const { sql, withTransaction } = require('../../config/database');

const createBusiness = async ({ ownerId, name, slug, sector }) => {
  return withTransaction(async (tx) => {
    const [business] = await tx`
      INSERT INTO businesses (owner_id, name, slug, sector)
      VALUES (${ownerId}, ${name}, ${slug}, ${sector})
      RETURNING *
    `;
    // Create default brand_settings
    await tx`
      INSERT INTO brand_settings (business_id) VALUES (${business.id})
      ON CONFLICT (business_id) DO NOTHING
    `;
    return business;
  });
};

const findBusinessById = async (id) => {
  const [b] = await sql`SELECT * FROM businesses WHERE id = ${id}`;
  return b || null;
};

const findBusinessBySlug = async (slug) => {
  const [b] = await sql`SELECT * FROM businesses WHERE slug = ${slug}`;
  return b || null;
};

const findBusinessByOwnerId = async (ownerId) => {
  const [b] = await sql`SELECT * FROM businesses WHERE owner_id = ${ownerId}`;
  return b || null;
};

const findBusinessByDomain = async (fullDomain) => {
  const [b] = await sql`
    SELECT b.* FROM businesses b
    JOIN domains d ON d.business_id = b.id
    WHERE d.full_domain = ${fullDomain}
      AND d.status IN ('ACTIVE', 'PENDING')
    LIMIT 1
  `;
  return b || null;
};

const updateBusiness = async (id, fields) => {
  const [b] = await sql`
    UPDATE businesses SET ${sql(fields, Object.keys(fields))}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return b;
};

const updateLastSaleAt = async (id) => {
  await sql`UPDATE businesses SET last_sale_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
};

const getFullBusinessProfile = async (id) => {
  const [business] = await sql`SELECT * FROM businesses WHERE id = ${id}`;
  if (!business) return null;

  const [address] = await sql`SELECT * FROM business_addresses WHERE business_id = ${id} LIMIT 1`;
  const [brandSettings] = await sql`SELECT * FROM brand_settings WHERE business_id = ${id}`;
  const [bankAccount] = await sql`SELECT * FROM business_bank_accounts WHERE business_id = ${id}`;
  const documents = await sql`SELECT * FROM business_documents WHERE business_id = ${id}`;
  const paymentGateways = await sql`SELECT * FROM payment_gateway_integrations WHERE business_id = ${id}`;

  return { business, address: address || null, brandSettings: brandSettings || null, bankAccount: bankAccount || null, documents, paymentGateways };
};

const createOrUpdateBrandSettings = async (businessId, data) => {
  // Build explicit SET clause to avoid postgres sql() helper issues with mixed types
  const setClauses = Object.entries(data)
    .map(([col]) => `${col} = $${col}`)
    .join(', ');

  // Use a safe upsert: try UPDATE first, INSERT if no row exists
  const existing = await sql`SELECT id FROM brand_settings WHERE business_id = ${businessId}`;

  if (existing.length > 0) {
    // UPDATE existing row
    const [bs] = await sql`
      UPDATE brand_settings
      SET ${sql(data, Object.keys(data))}, updated_at = NOW()
      WHERE business_id = ${businessId}
      RETURNING *
    `;
    return bs;
  }

  // INSERT new row with defaults for missing columns
  const defaults = {
    primary_color: '#000000', secondary_color: '#555555', accent_color: '#0066CC',
    background_color: '#FFFFFF', text_color: '#111111', font_heading: 'Inter',
    font_body: 'Inter', base_font_size: 16, heading_scale: 1.25,
    button_border_radius: 0, card_border_radius: 0, input_border_radius: 0,
  };
  const merged = { ...defaults, ...data };
  const [bs] = await sql`
    INSERT INTO brand_settings (
      business_id, primary_color, secondary_color, accent_color, background_color,
      text_color, font_heading, font_body, base_font_size, heading_scale,
      button_border_radius, card_border_radius, input_border_radius, global_css
    ) VALUES (
      ${businessId},
      ${merged.primary_color}, ${merged.secondary_color}, ${merged.accent_color},
      ${merged.background_color}, ${merged.text_color}, ${merged.font_heading},
      ${merged.font_body}, ${merged.base_font_size}, ${merged.heading_scale},
      ${merged.button_border_radius}, ${merged.card_border_radius},
      ${merged.input_border_radius}, ${merged.global_css || null}
    )
    ON CONFLICT (business_id) DO UPDATE SET
      primary_color = EXCLUDED.primary_color,
      secondary_color = EXCLUDED.secondary_color,
      accent_color = EXCLUDED.accent_color,
      background_color = EXCLUDED.background_color,
      text_color = EXCLUDED.text_color,
      font_heading = EXCLUDED.font_heading,
      font_body = EXCLUDED.font_body,
      base_font_size = EXCLUDED.base_font_size,
      heading_scale = EXCLUDED.heading_scale,
      button_border_radius = EXCLUDED.button_border_radius,
      card_border_radius = EXCLUDED.card_border_radius,
      input_border_radius = EXCLUDED.input_border_radius,
      global_css = EXCLUDED.global_css,
      updated_at = NOW()
    RETURNING *
  `;
  return bs;
};

const getBrandSettings = async (businessId) => {
  const [bs] = await sql`SELECT * FROM brand_settings WHERE business_id = ${businessId}`;
  return bs || null;
};

const createAddress = async (businessId, data) => {
  const [addr] = await sql`
    INSERT INTO business_addresses (business_id, type, street_line1, street_line2, city, state, country, postal_code)
    VALUES (${businessId}, ${data.type || 'BUSINESS'}, ${data.streetLine1}, ${data.streetLine2 || null},
            ${data.city}, ${data.state}, ${data.country || 'Nigeria'}, ${data.postalCode || null})
    RETURNING *
  `;
  return addr;
};

const updateAddress = async (businessId, data) => {
  const [addr] = await sql`
    UPDATE business_addresses
    SET type = ${data.type || 'BUSINESS'},
        street_line1 = ${data.streetLine1},
        street_line2 = ${data.streetLine2 || null},
        city = ${data.city},
        state = ${data.state},
        country = ${data.country || 'Nigeria'},
        postal_code = ${data.postalCode || null},
        updated_at = NOW()
    WHERE business_id = ${businessId}
    RETURNING *
  `;
  return addr;
};

const createDocument = async (data) => {
  const [doc] = await sql`
    INSERT INTO business_documents (business_id, type, file_url, file_public_id, file_name)
    VALUES (${data.businessId}, ${data.type}, ${data.fileUrl}, ${data.filePublicId}, ${data.fileName || null})
    RETURNING *
  `;
  return doc;
};

const listDocuments = async (businessId) => {
  return sql`SELECT * FROM business_documents WHERE business_id = ${businessId} ORDER BY created_at DESC`;
};

const updateDocumentStatus = async (id, status, reviewedBy, reason) => {
  const [doc] = await sql`
    UPDATE business_documents
    SET status = ${status}, reviewed_by = ${reviewedBy}, reviewed_at = NOW(),
        rejection_reason = ${reason || null}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return doc;
};

const createSocialLink = async (businessId, data) => {
  const [link] = await sql`
    INSERT INTO social_links (business_id, platform, url, label, is_visible, sort_order)
    VALUES (${businessId}, ${data.platform}, ${data.url}, ${data.label || null},
            ${data.isVisible !== false}, ${data.sortOrder || 0})
    RETURNING *
  `;
  return link;
};

const listSocialLinks = async (businessId) => {
  return sql`SELECT * FROM social_links WHERE business_id = ${businessId} ORDER BY sort_order ASC`;
};

const updateSocialLink = async (id, businessId, data) => {
  const [link] = await sql`
    UPDATE social_links
    SET platform = COALESCE(${data.platform || null}, platform),
        url = COALESCE(${data.url || null}, url),
        label = COALESCE(${data.label || null}, label),
        is_visible = COALESCE(${data.isVisible !== undefined ? data.isVisible : null}, is_visible),
        sort_order = COALESCE(${data.sortOrder !== undefined ? data.sortOrder : null}, sort_order),
        updated_at = NOW()
    WHERE id = ${id} AND business_id = ${businessId}
    RETURNING *
  `;
  return link;
};

const deleteSocialLink = async (id, businessId) => {
  await sql`DELETE FROM social_links WHERE id = ${id} AND business_id = ${businessId}`;
};

const reorderSocialLinks = async (businessId, updates) => {
  for (const { id, sortOrder } of updates) {
    await sql`UPDATE social_links SET sort_order = ${sortOrder} WHERE id = ${id} AND business_id = ${businessId}`;
  }
};

const upsertChatbot = async (businessId, data) => {
  const [chatbot] = await sql`
    INSERT INTO chatbot_integrations (business_id, provider, config, is_active, position)
    VALUES (${businessId}, ${data.provider}, ${sql.json(data.config || {})}, ${data.isActive || false}, ${data.position || 'BOTTOM_RIGHT'})
    ON CONFLICT (business_id) DO UPDATE
    SET provider = ${data.provider}, config = ${sql.json(data.config || {})},
        is_active = ${data.isActive || false}, position = ${data.position || 'BOTTOM_RIGHT'},
        updated_at = NOW()
    RETURNING *
  `;
  return chatbot;
};

const createBankAccount = async (businessId, data) => {
  const [account] = await sql`
    INSERT INTO business_bank_accounts
      (business_id, bank_name, bank_code, account_number, account_name,
       paystack_subaccount_id, paystack_subaccount_code, is_active, activated_at)
    VALUES (${businessId}, ${data.bankName}, ${data.bankCode}, ${data.accountNumber},
            ${data.accountName}, ${data.paystackSubaccountId || null},
            ${data.paystackSubaccountCode || null}, true, NOW())
    RETURNING *
  `;
  return account;
};

const updateBankAccount = async (businessId, data) => {
  const [account] = await sql`
    UPDATE business_bank_accounts
    SET bank_name = ${data.bankName}, bank_code = ${data.bankCode},
        account_number = ${data.accountNumber}, account_name = ${data.accountName},
        paystack_subaccount_id = ${data.paystackSubaccountId || null},
        paystack_subaccount_code = ${data.paystackSubaccountCode || null},
        is_active = true, activated_at = NOW(), updated_at = NOW()
    WHERE business_id = ${businessId}
    RETURNING *
  `;
  return account;
};

const getBankAccount = async (businessId) => {
  const [account] = await sql`SELECT * FROM business_bank_accounts WHERE business_id = ${businessId}`;
  return account || null;
};

const deleteBankAccount = async (businessId) => {
  const [account] = await sql`
    DELETE FROM business_bank_accounts
    WHERE business_id = ${businessId}
    RETURNING *
  `;
  return account || null;
};

const createPaymentIntegration = async (businessId, data) => {
  const [integration] = await sql`
    INSERT INTO payment_gateway_integrations
      (business_id, gateway, api_key_encrypted, api_secret_encrypted, webhook_secret_encrypted, is_active, connected_at)
    VALUES (${businessId}, ${data.gateway}, ${data.apiKeyEncrypted}, ${data.apiSecretEncrypted || null},
            ${data.webhookSecretEncrypted || null}, true, NOW())
    ON CONFLICT (business_id, gateway) DO UPDATE
    SET api_key_encrypted = ${data.apiKeyEncrypted},
        api_secret_encrypted = ${data.apiSecretEncrypted || null},
        webhook_secret_encrypted = ${data.webhookSecretEncrypted || null},
        is_active = true, connected_at = NOW(), updated_at = NOW()
    RETURNING *
  `;
  return integration;
};

const deletePaymentIntegration = async (businessId, gateway) => {
  await sql`DELETE FROM payment_gateway_integrations WHERE business_id = ${businessId} AND gateway = ${gateway}`;
};

const createDomain = async (businessId, data) => {
  const [domain] = await sql`
    INSERT INTO domains (business_id, type, domain, full_domain, status, dns_txt_record)
    VALUES (${businessId}, ${data.type}, ${data.domain}, ${data.fullDomain}, ${data.status || 'PENDING'}, ${data.dnsTxtRecord || null})
    RETURNING *
  `;
  return domain;
};

const updateDomainStatus = async (id, status, verifiedAt) => {
  const [domain] = await sql`
    UPDATE domains
    SET status = ${status}, dns_verified_at = ${verifiedAt || null}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return domain;
};

const deleteDomain = async (id, businessId) => {
  await sql`DELETE FROM domains WHERE id = ${id} AND business_id = ${businessId}`;
};

const findDomainByBusinessId = async (businessId) => {
  const [domain] = await sql`SELECT * FROM domains WHERE business_id = ${businessId} ORDER BY created_at DESC LIMIT 1`;
  return domain || null;
};

const listInactiveFreeTierBusinesses = async (cutoffDate) => {
  const rows = await sql`
    SELECT b.id FROM businesses b
    LEFT JOIN business_subscriptions bs ON bs.business_id = b.id
    WHERE (bs.id IS NULL OR bs.status IN ('EXPIRED', 'CANCELLED'))
      AND (b.last_sale_at IS NULL OR b.last_sale_at < ${cutoffDate})
  `;
  return rows.map((r) => r.id);
};

const purgeBusinessData = async (businessId, tx) => {
  const db = tx || sql;
  await db`DELETE FROM store_pages WHERE business_id = ${businessId}`;
  await db`DELETE FROM store_themes WHERE business_id = ${businessId}`;
  await db`DELETE FROM products WHERE business_id = ${businessId}`;
  await db`DELETE FROM categories WHERE business_id = ${businessId}`;
  await db`DELETE FROM orders WHERE business_id = ${businessId}`;
  await db`DELETE FROM customers WHERE id IN (SELECT customer_id FROM orders WHERE business_id = ${businessId})`;
  await db`DELETE FROM brand_settings WHERE business_id = ${businessId}`;
  await db`UPDATE domains SET status = 'SUSPENDED' WHERE business_id = ${businessId}`;
};

module.exports = {
  createBusiness,
  findBusinessById,
  findBusinessBySlug,
  findBusinessByOwnerId,
  findBusinessByDomain,
  updateBusiness,
  updateLastSaleAt,
  getFullBusinessProfile,
  createOrUpdateBrandSettings,
  getBrandSettings,
  createAddress,
  updateAddress,
  createDocument,
  listDocuments,
  updateDocumentStatus,
  createSocialLink,
  listSocialLinks,
  updateSocialLink,
  deleteSocialLink,
  reorderSocialLinks,
  upsertChatbot,
  createBankAccount,
  updateBankAccount,
  getBankAccount,
  deleteBankAccount,
  createPaymentIntegration,
  deletePaymentIntegration,
  createDomain,
  updateDomainStatus,
  deleteDomain,
  findDomainByBusinessId,
  listInactiveFreeTierBusinesses,
  purgeBusinessData,
};
