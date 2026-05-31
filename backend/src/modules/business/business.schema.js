const { z } = require('zod');

const updateBusinessSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sector: z.string().optional(),
  tagline: z.string().max(500).optional(),
  description: z.string().optional(),
  currency: z.string().max(10).optional(),
  timezone: z.string().max(100).optional(),
});

const seoSchema = z.object({
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.string().optional(),
  googleAnalyticsId: z.string().max(50).optional(),
  facebookPixelId: z.string().max(50).optional(),
});

const addressSchema = z.object({
  type: z.enum(['PERSONAL', 'BUSINESS']).default('BUSINESS'),
  streetLine1: z.string().min(1).max(255),
  streetLine2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  country: z.string().max(100).default('Nigeria'),
  postalCode: z.string().max(20).optional(),
});

const brandSettingsSchema = z.object({
  primaryColor: z.string().max(10).optional(),
  secondaryColor: z.string().max(10).optional(),
  accentColor: z.string().max(10).optional(),
  backgroundColor: z.string().max(10).optional(),
  textColor: z.string().max(10).optional(),
  fontHeading: z.string().max(100).optional(),
  fontBody: z.string().max(100).optional(),
  baseFontSize: z.number().int().min(10).max(24).optional(),
  headingScale: z.number().min(1).max(2).optional(),
  buttonBorderRadius: z.number().int().min(0).max(50).optional(),
  cardBorderRadius: z.number().int().min(0).max(50).optional(),
  inputBorderRadius: z.number().int().min(0).max(50).optional(),
  globalCss: z.string().optional(),
});

const socialLinkSchema = z.object({
  platform: z.string().min(1).max(50),
  url: z.string().url(),
  label: z.string().max(100).optional(),
  isVisible: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

const reorderSchema = z.object({
  links: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int() })),
});

const chatbotSchema = z.object({
  provider: z.enum(['WHATSAPP', 'TELEGRAM']),
  config: z.record(z.any()).default({}),
  isActive: z.boolean().default(false),
  position: z.enum(['BOTTOM_RIGHT', 'BOTTOM_LEFT']).default('BOTTOM_RIGHT'),
});

const verifyAccountSchema = z.object({
  bankCode: z.string().min(2).max(10),
  accountNumber: z.string().length(10, 'Account number must be 10 digits'),
});

const bankAccountSchema = z.object({
  bankCode: z.string().min(2).max(10),
  accountNumber: z.string().length(10),
  accountName: z.string().min(1).max(200),
  settlementSchedule: z.enum(['auto', 'manual']).default('auto'),
});

const subdomainSchema = z.object({
  subdomain: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Subdomain must be lowercase alphanumeric with hyphens only'),
});

const customDomainSchema = z.object({
  domain: z.string().min(4).max(255),
});

const paymentIntegrationSchema = z.object({
  gateway: z.enum(['FLUTTERWAVE_CUSTOM', 'STRIPE_CUSTOM']),
  apiKey: z.string().min(1),
  apiSecret: z.string().optional(),
  webhookSecret: z.string().optional(),
});

// Used by POST /business/logo and POST /business/favicon
// Frontend uploads to Cloudinary directly, then sends the URL here
const uploadUrlSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  publicId: z.string().optional(),
});

// Used by POST /business/documents
const uploadDocumentSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  publicId: z.string().optional(),
  type: z.enum(['NATIONAL_ID', 'PASSPORT', 'DRIVERS_LICENSE', 'UTILITY_BILL', 'BUSINESS_REGISTRATION', 'OTHER']),
  fileName: z.string().max(255).optional(),
});

module.exports = {
  updateBusinessSchema, seoSchema, addressSchema, brandSettingsSchema,
  socialLinkSchema, reorderSchema, chatbotSchema, verifyAccountSchema,
  bankAccountSchema, subdomainSchema, customDomainSchema, paymentIntegrationSchema,
  uploadUrlSchema, uploadDocumentSchema,
};
