const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  businessName: z.string().min(1).max(255),
  contactName: z.string().min(1).max(200),
  websiteUrl: z.string().url().optional(),
  description: z.string().min(10).max(2000),
});

const credentialsSchema = z.object({});

module.exports = { registerSchema, credentialsSchema };
