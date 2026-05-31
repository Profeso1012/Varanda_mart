const asyncHandler = require('../../middleware/asyncHandler');
const AppError = require('../../utils/AppError');
const paystackConfig = require('../../config/paystack');
const cloudinaryService = require('../../services/cloudinary.service');
const { encrypt } = require('../../utils/encrypt');
const { config } = require('../../config/env');
const crypto = require('crypto');
const dns = require('dns').promises;

const {
  findBusinessById, getFullBusinessProfile, updateBusiness,
  createOrUpdateBrandSettings, createAddress, updateAddress,
  createDocument, listDocuments, createSocialLink, listSocialLinks,
  updateSocialLink, deleteSocialLink, reorderSocialLinks, upsertChatbot,
  createBankAccount, updateBankAccount, getBankAccount,
  createPaymentIntegration, deletePaymentIntegration,
  createDomain, updateDomainStatus, deleteDomain, findDomainByBusinessId,
} = require('../../db/queries/businesses.queries');
const { updateOnboardingStep, findUserById } = require('../../db/queries/users.queries');

// GET /api/v1/business
const getProfile = asyncHandler(async (req, res) => {
  const profile = await getFullBusinessProfile(req.businessId);
  if (!profile) throw new AppError('Business not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: profile });
});

// PUT /api/v1/business
const updateBusinessHandler = asyncHandler(async (req, res) => {
  const { name, sector, tagline, description, currency, timezone } = req.body;
  const fields = {};
  if (name !== undefined) fields.name = name;
  if (sector !== undefined) fields.sector = sector;
  if (tagline !== undefined) fields.tagline = tagline;
  if (description !== undefined) fields.description = description;
  if (currency !== undefined) fields.currency = currency;
  if (timezone !== undefined) fields.timezone = timezone;

  const business = await updateBusiness(req.businessId, fields);
  res.json({ success: true, data: { business } });
});

// PUT /api/v1/business/seo
const updateSeo = asyncHandler(async (req, res) => {
  const { seoTitle, seoDescription, seoKeywords, googleAnalyticsId, facebookPixelId } = req.body;
  const fields = {};
  if (seoTitle !== undefined) fields.seo_title = seoTitle;
  if (seoDescription !== undefined) fields.seo_description = seoDescription;
  if (seoKeywords !== undefined) fields.seo_keywords = seoKeywords;
  if (googleAnalyticsId !== undefined) fields.google_analytics_id = googleAnalyticsId;
  if (facebookPixelId !== undefined) fields.facebook_pixel_id = facebookPixelId;

  const business = await updateBusiness(req.businessId, fields);
  res.json({ success: true, data: { business } });
});

// POST /api/v1/business/logo
// Body: { url: "https://res.cloudinary.com/...", publicId: "varanda/businesses/.../logo/..." }
// Frontend uploads directly to Cloudinary using signed params from GET /cloudinary/sign?type=logo
// then sends the resulting URL here.
const uploadLogo = asyncHandler(async (req, res) => {
  const { url, publicId } = req.body;
  if (!url) throw new AppError('url is required.', 422, 'VALIDATION_ERROR');

  // Delete old logo if exists
  const existing = await findBusinessById(req.businessId);
  if (existing?.logo_public_id && publicId && existing.logo_public_id !== publicId) {
    cloudinaryService.deleteImage(existing.logo_public_id).catch(() => {});
  }

  await updateBusiness(req.businessId, { logo_url: url, logo_public_id: publicId || null });
  res.json({ success: true, data: { logoUrl: url } });
});

// POST /api/v1/business/favicon
// Body: { url: "https://res.cloudinary.com/...", publicId: "..." }
const uploadFavicon = asyncHandler(async (req, res) => {
  const { url, publicId } = req.body;
  if (!url) throw new AppError('url is required.', 422, 'VALIDATION_ERROR');

  const existing = await findBusinessById(req.businessId);
  if (existing?.favicon_public_id && publicId && existing.favicon_public_id !== publicId) {
    cloudinaryService.deleteImage(existing.favicon_public_id).catch(() => {});
  }

  await updateBusiness(req.businessId, { favicon_url: url, favicon_public_id: publicId || null });
  res.json({ success: true, data: { faviconUrl: url } });
});

// PUT /api/v1/business/address
const upsertAddress = asyncHandler(async (req, res) => {
  const { sql } = require('../../config/database');
  const [existing] = await sql`SELECT id FROM business_addresses WHERE business_id = ${req.businessId}`;
  const address = existing
    ? await updateAddress(req.businessId, req.body)
    : await createAddress(req.businessId, req.body);
  res.json({ success: true, data: { address } });
});

// POST /api/v1/business/documents
// Body: { url, publicId, type, fileName? }
// Frontend uploads directly to Cloudinary using signed params from GET /cloudinary/sign?type=document
// then sends the resulting URL + publicId here.
const uploadDocument = asyncHandler(async (req, res) => {
  const { url, publicId, type, fileName } = req.body;
  if (!url) throw new AppError('url is required.', 422, 'VALIDATION_ERROR');
  if (!type) throw new AppError('type is required.', 422, 'VALIDATION_ERROR');

  const doc = await createDocument({
    businessId: req.businessId,
    type,
    fileUrl: url,
    filePublicId: publicId || '',
    fileName: fileName || null,
  });
  res.status(201).json({ success: true, data: { document: { id: doc.id, type: doc.type, status: doc.status } } });
});

// GET /api/v1/business/documents
const listDocumentsHandler = asyncHandler(async (req, res) => {
  const documents = await listDocuments(req.businessId);
  res.json({ success: true, data: { documents } });
});

// PUT /api/v1/business/brand-settings
const updateBrandSettings = asyncHandler(async (req, res) => {
  // Map camelCase to snake_case
  const fieldMap = {
    primaryColor: 'primary_color', secondaryColor: 'secondary_color', accentColor: 'accent_color',
    backgroundColor: 'background_color', textColor: 'text_color', fontHeading: 'font_heading',
    fontBody: 'font_body', baseFontSize: 'base_font_size', headingScale: 'heading_scale',
    buttonBorderRadius: 'button_border_radius', cardBorderRadius: 'card_border_radius',
    inputBorderRadius: 'input_border_radius', globalCss: 'global_css',
  };
  const fields = {};
  for (const [key, col] of Object.entries(fieldMap)) {
    if (req.body[key] !== undefined) fields[col] = req.body[key];
  }
  const brandSettings = await createOrUpdateBrandSettings(req.businessId, fields);
  res.json({ success: true, data: { brandSettings } });
});

// Social links
const listSocialLinksHandler = asyncHandler(async (req, res) => {
  const socialLinks = await listSocialLinks(req.businessId);
  res.json({ success: true, data: { socialLinks } });
});

const createSocialLinkHandler = asyncHandler(async (req, res) => {
  const link = await createSocialLink(req.businessId, req.body);
  res.status(201).json({ success: true, data: { socialLink: link } });
});

const updateSocialLinkHandler = asyncHandler(async (req, res) => {
  const link = await updateSocialLink(req.params.linkId, req.businessId, req.body);
  if (!link) throw new AppError('Social link not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { socialLink: link } });
});

const deleteSocialLinkHandler = asyncHandler(async (req, res) => {
  await deleteSocialLink(req.params.linkId, req.businessId);
  res.json({ success: true, data: { message: 'Deleted.' } });
});

const reorderSocialLinksHandler = asyncHandler(async (req, res) => {
  await reorderSocialLinks(req.businessId, req.body.links);
  res.json({ success: true, data: { message: 'Reordered.' } });
});

// PUT /api/v1/business/chatbot
const upsertChatbotHandler = asyncHandler(async (req, res) => {
  const chatbot = await upsertChatbot(req.businessId, req.body);
  res.json({ success: true, data: { chatbot } });
});

// POST /api/v1/business/bank-account/verify-account
const verifyBankAccount = asyncHandler(async (req, res) => {
  const { bankCode, accountNumber } = req.body;
  try {
    const result = await paystackConfig.resolveAccount(bankCode, accountNumber);
    res.json({ success: true, data: result });
  } catch (err) {
    throw new AppError('Account not found. Please check the bank code and account number.', 400, 'ACCOUNT_NOT_FOUND');
  }
});

// POST /api/v1/business/bank-account
const createBankAccountHandler = asyncHandler(async (req, res) => {
  const existing = await getBankAccount(req.businessId);
  if (existing) throw new AppError('Bank account already exists. Use PUT to update.', 409, 'CONFLICT');

  const business = await findBusinessById(req.businessId);
  const { bankCode, accountNumber, accountName, settlementSchedule } = req.body;

  let paystackSubaccountId = null;
  let paystackSubaccountCode = null;
  try {
    const result = await paystackConfig.createSubaccount({
      businessName: business.name,
      settlementBank: bankCode,
      accountNumber,
      percentageCharge: 5,
    });
    paystackSubaccountId = result.subaccountId;
    paystackSubaccountCode = result.subaccountCode;
  } catch (err) {
    throw new AppError(`Paystack error: ${err.message}`, 400, 'PAYSTACK_ERROR');
  }

  // Resolve bank name
  let bankName = bankCode;
  try {
    const banks = await paystackConfig.getBanks();
    const bank = banks.find((b) => b.code === bankCode);
    if (bank) bankName = bank.name;
  } catch {}

  const account = await createBankAccount(req.businessId, {
    bankName, bankCode, accountNumber, accountName,
    paystackSubaccountId, paystackSubaccountCode,
    settlementSchedule: settlementSchedule || 'auto',
  });

  res.status(201).json({
    success: true,
    data: {
      bankAccount: {
        bankName: account.bank_name,
        accountNumber: `****${accountNumber.slice(-4)}`,
        accountName: account.account_name,
        paystackSubaccountCode: account.paystack_subaccount_code,
        isActive: account.is_active,
      },
    },
  });
});

// GET /api/v1/business/bank-account
const getBankAccountHandler = asyncHandler(async (req, res) => {
  const account = await getBankAccount(req.businessId);
  if (!account) throw new AppError('No bank account registered.', 404, 'NOT_FOUND');
  res.json({
    success: true,
    data: {
      bankAccount: {
        bankName: account.bank_name,
        accountNumber: `****${account.account_number.slice(-4)}`,
        accountName: account.account_name,
        paystackSubaccountCode: account.paystack_subaccount_code,
        isActive: account.is_active,
      },
    },
  });
});

// PUT /api/v1/business/bank-account
const updateBankAccountHandler = asyncHandler(async (req, res) => {
  const business = await findBusinessById(req.businessId);
  const { bankCode, accountNumber, accountName } = req.body;

  let paystackSubaccountCode = null;
  try {
    const result = await paystackConfig.createSubaccount({
      businessName: business.name,
      settlementBank: bankCode,
      accountNumber,
      percentageCharge: 5,
    });
    paystackSubaccountCode = result.subaccountCode;
  } catch (err) {
    throw new AppError(`Paystack error: ${err.message}`, 400, 'PAYSTACK_ERROR');
  }

  let bankName = bankCode;
  try {
    const banks = await paystackConfig.getBanks();
    const bank = banks.find((b) => b.code === bankCode);
    if (bank) bankName = bank.name;
  } catch {}

  const account = await updateBankAccount(req.businessId, {
    bankName, bankCode, accountNumber, accountName, paystackSubaccountCode,
  });

  res.json({ success: true, data: { bankAccount: account } });
});

// DELETE /api/v1/business/bank-account
const deleteBankAccountHandler = asyncHandler(async (req, res) => {
  const account = await getBankAccount(req.businessId);
  if (!account) throw new AppError('No bank account registered.', 404, 'NOT_FOUND');
  
  const { deleteBankAccount } = require('../../db/queries/businesses.queries');
  await deleteBankAccount(req.businessId);
  
  res.json({ success: true, data: { message: 'Bank account deleted successfully.' } });
});

// GET /api/v1/business/domains/check-subdomain?subdomain=mystore
// Public — no auth. Returns { available: true|false }.
// subdomain: letters only, max 15 chars.
const checkSubdomainAvailability = asyncHandler(async (req, res) => {
  const { subdomain } = req.query;
  if (!subdomain) throw new AppError('subdomain query param is required.', 422, 'VALIDATION_ERROR');
  if (!/^[a-zA-Z]{1,15}$/.test(subdomain)) {
    throw new AppError('Subdomain must be letters only, max 15 characters.', 422, 'VALIDATION_ERROR');
  }

  const fullDomain = `${subdomain.toLowerCase()}.${config.baseDomain}`;
  const { sql } = require('../../config/database');
  const [existing] = await sql`SELECT id FROM domains WHERE full_domain = ${fullDomain} LIMIT 1`;

  res.json({ success: true, data: { available: !existing } });
});

// POST /api/v1/business/domains/subdomain
const claimSubdomain = asyncHandler(async (req, res) => {
  const { subdomain } = req.body;
  const fullDomain = `${subdomain}.${config.baseDomain}`;

  const { sql } = require('../../config/database');
  const [existing] = await sql`SELECT id FROM domains WHERE full_domain = ${fullDomain}`;
  if (existing) throw new AppError('Subdomain already taken.', 409, 'CONFLICT');

  const domain = await createDomain(req.businessId, {
    type: 'SUBDOMAIN',
    domain: subdomain,
    fullDomain,
    status: 'ACTIVE',
  });

  // Advance onboarding to COMPLETE on first domain claim (still in BUSINESS_SETUP)
  const user = await findUserById(req.userId);
  if (user && user.onboarding_step === 'BUSINESS_SETUP') {
    await updateOnboardingStep(req.userId, 'COMPLETE');
  }

  res.status(201).json({
    success: true,
    data: {
      domain: { id: domain.id, domain: domain.domain, fullDomain: domain.full_domain, status: domain.status },
      onboardingStep: user?.onboarding_step === 'BUSINESS_SETUP' ? 'COMPLETE' : user?.onboarding_step,
    },
  });
});

// POST /api/v1/business/domains/custom
const connectCustomDomain = asyncHandler(async (req, res) => {
  const { domain: domainName } = req.body;
  const fullDomain = domainName.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const dnsTxtRecord = `varanda-verify=${crypto.randomBytes(16).toString('hex')}`;

  const domain = await createDomain(req.businessId, {
    type: 'CUSTOM',
    domain: fullDomain,
    fullDomain,
    status: 'PENDING',
    dnsTxtRecord,
  });

  // Advance onboarding to COMPLETE on first domain connection (still in BUSINESS_SETUP).
  // Custom domains start as PENDING (DNS not yet verified) but the seller has completed
  // the onboarding step — they can verify DNS later from the dashboard.
  const user = await findUserById(req.userId);
  if (user && user.onboarding_step === 'BUSINESS_SETUP') {
    await updateOnboardingStep(req.userId, 'COMPLETE');
  }

  res.status(201).json({
    success: true,
    data: {
      domain: {
        id: domain.id, domain: domain.domain, fullDomain: domain.full_domain,
        status: 'PENDING', dnsTxtRecord,
        instructions: `Add a TXT record to your DNS: Name="_varanda-verify", Value="${dnsTxtRecord}"`,
      },
      onboardingStep: user?.onboarding_step === 'BUSINESS_SETUP' ? 'COMPLETE' : user?.onboarding_step,
    },
  });
});

// POST /api/v1/business/domains/:domainId/verify
const verifyDomain = asyncHandler(async (req, res) => {
  const { sql } = require('../../config/database');
  const [domain] = await sql`
    SELECT * FROM domains WHERE id = ${req.params.domainId} AND business_id = ${req.businessId}
  `;
  if (!domain) throw new AppError('Domain not found.', 404, 'NOT_FOUND');

  let verified = false;
  try {
    const records = await dns.resolveTxt(domain.full_domain);
    const flat = records.flat();
    verified = flat.some((r) => r === domain.dns_txt_record);
  } catch {}

  if (verified) {
    await updateDomainStatus(domain.id, 'ACTIVE', new Date());
    return res.json({ success: true, data: { domain: { status: 'ACTIVE', checkedAt: new Date() } } });
  }

  res.status(400).json({
    success: false,
    error: {
      code: 'DNS_NOT_VERIFIED',
      message: 'DNS TXT record not found.',
      details: { expectedRecord: domain.dns_txt_record, checkedAt: new Date() },
    },
  });
});

// DELETE /api/v1/business/domains/:domainId
const deleteDomainHandler = asyncHandler(async (req, res) => {
  await deleteDomain(req.params.domainId, req.businessId);
  res.json({ success: true, data: { message: 'Domain removed.' } });
});

// POST /api/v1/business/integrations/payment/connect
const connectPaymentGateway = asyncHandler(async (req, res) => {
  const { gateway, apiKey, apiSecret, webhookSecret } = req.body;
  const integration = await createPaymentIntegration(req.businessId, {
    gateway,
    apiKeyEncrypted: encrypt(apiKey),
    apiSecretEncrypted: apiSecret ? encrypt(apiSecret) : null,
    webhookSecretEncrypted: webhookSecret ? encrypt(webhookSecret) : null,
  });
  res.status(201).json({
    success: true,
    data: { gateway: integration.gateway, isActive: integration.is_active, connectedAt: integration.connected_at },
  });
});

// DELETE /api/v1/business/integrations/payment/:gateway/disconnect
const disconnectPaymentGateway = asyncHandler(async (req, res) => {
  await deletePaymentIntegration(req.businessId, req.params.gateway);
  res.json({ success: true, data: { message: 'Gateway disconnected. Reverted to Varanda Pay.' } });
});

module.exports = {
  getProfile, updateBusiness: updateBusinessHandler, updateSeo,
  uploadLogo, uploadFavicon, upsertAddress, uploadDocument, listDocuments: listDocumentsHandler,
  updateBrandSettings, listSocialLinks: listSocialLinksHandler, createSocialLink: createSocialLinkHandler,
  updateSocialLink: updateSocialLinkHandler, deleteSocialLink: deleteSocialLinkHandler,
  reorderSocialLinks: reorderSocialLinksHandler, upsertChatbot: upsertChatbotHandler,
  verifyBankAccount, createBankAccount: createBankAccountHandler, getBankAccount: getBankAccountHandler,
  updateBankAccount: updateBankAccountHandler, deleteBankAccount: deleteBankAccountHandler,
  claimSubdomain, connectCustomDomain, verifyDomain,
  deleteDomain: deleteDomainHandler, connectPaymentGateway, disconnectPaymentGateway,
  checkSubdomainAvailability,
};
