const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().optional().default('varanda_jwt_secret_change_in_prod'),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().default(30),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  SMTP_HOST: z.string().optional().default('smtp-relay.brevo.com'),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default('noreply@varanda.com'),
  FROM_NAME: z.string().optional().default('Varanda'),
  BREVO_API_KEY: z.string().optional().default(''),

  PAYSTACK_SECRET_KEY: z.string().optional().default(''),
  PAYSTACK_PUBLIC_KEY: z.string().optional().default(''),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional().default(''),

  FLUTTERWAVE_SECRET_KEY: z.string().optional().default(''),
  FLUTTERWAVE_PUBLIC_KEY: z.string().optional().default(''),
  FLUTTERWAVE_WEBHOOK_HASH: z.string().optional().default(''),
  FLUTTERWAVE_MONTHLY_PRO_PLAN_ID: z.string().optional().default(''),
  FLUTTERWAVE_YEARLY_PRO_PLAN_ID: z.string().optional().default(''),
  FLUTTERWAVE_MONTHLY_GROWTH_PLAN_ID: z.string().optional().default(''),
  FLUTTERWAVE_YEARLY_GROWTH_PLAN_ID: z.string().optional().default(''),

  SHIPBUBBLE_API_URL: z.string().optional().default('https://api.shipbubble.com/v1'),
  SHIPBUBBLE_ENCRYPTION_KEY: z.string().optional().default(''),

  TERMII_API_KEY: z.string().optional().default(''),
  TERMII_SENDER_ID: z.string().optional().default('VARANDA'),

  PLATFORM_MARKUP_RATE: z.coerce.number().default(0.02),
  PLATFORM_SERVICE_FEE_RATE: z.coerce.number().default(0.0025),

  // Set to a fixed value (e.g. 654321) in development for easy testing.
  // Leave empty in production to use cryptographically random OTPs.
  OTP_FIXED_VALUE: z.string().optional().default(''),

  BASE_DOMAIN: z.string().default('varanda.com'),
  API_BASE_URL: z.string().default('http://localhost:4000'),
  SELLER_DASHBOARD_URL: z.string().default('http://localhost:3000'),
  DEVELOPER_PORTAL_URL: z.string().default('http://localhost:3001'),

  ENCRYPTION_KEY: z.string().optional().default('varanda_enc_key_32chars_change!!'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  parsed.error.errors.forEach((e) => {
    console.error(`  ${e.path.join('.')}: ${e.message}`);
  });
  process.exit(1);
}

const env = parsed.data;

const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,

  jwtSecret: env.JWT_ACCESS_SECRET || env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
  refreshTokenExpiresDays: env.REFRESH_TOKEN_EXPIRES_DAYS,

  cloudinaryCloudName: env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: env.CLOUDINARY_API_SECRET,

  smtpHost: env.SMTP_HOST,
  smtpPort: env.SMTP_PORT,
  smtpUser: env.SMTP_USER,
  smtpPass: env.SMTP_PASS,
  fromEmail: env.EMAIL_FROM,
  fromName: env.FROM_NAME,
  brevoApiKey: env.BREVO_API_KEY,

  paystackSecretKey: env.PAYSTACK_SECRET_KEY,
  paystackPublicKey: env.PAYSTACK_PUBLIC_KEY,
  paystackWebhookSecret: env.PAYSTACK_WEBHOOK_SECRET,

  flutterwaveSecretKey: env.FLUTTERWAVE_SECRET_KEY,
  flutterwavePublicKey: env.FLUTTERWAVE_PUBLIC_KEY,
  flutterwaveWebhookHash: env.FLUTTERWAVE_WEBHOOK_HASH,
  flutterwaveMonthlyProPlanId: env.FLUTTERWAVE_MONTHLY_PRO_PLAN_ID,
  flutterwaveYearlyProPlanId: env.FLUTTERWAVE_YEARLY_PRO_PLAN_ID,
  flutterwaveMonthlyGrowthPlanId: env.FLUTTERWAVE_MONTHLY_GROWTH_PLAN_ID,
  flutterwaveYearlyGrowthPlanId: env.FLUTTERWAVE_YEARLY_GROWTH_PLAN_ID,

  shipbubbleApiUrl: env.SHIPBUBBLE_API_URL,
  shipbubbleEncryptionKey: env.SHIPBUBBLE_ENCRYPTION_KEY,

  termiiApiKey: env.TERMII_API_KEY,
  termiiSenderId: env.TERMII_SENDER_ID,

  platformMarkupRate: env.PLATFORM_MARKUP_RATE,
  platformServiceFeeRate: env.PLATFORM_SERVICE_FEE_RATE,
  otpFixedValue: env.OTP_FIXED_VALUE,

  baseDomain: env.BASE_DOMAIN,
  apiBaseUrl: env.API_BASE_URL,
  sellerDashboardUrl: env.SELLER_DASHBOARD_URL,
  developerPortalUrl: env.DEVELOPER_PORTAL_URL,

  encryptionKey: env.ENCRYPTION_KEY,
};

module.exports = { config };
