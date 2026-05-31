const { z } = require('zod');

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  processingTimeDays: z.number().int().min(1).max(30).optional(),
  shipsTo: z.array(z.string().length(2)).optional(),
});

const verifyAccountSchema = z.object({
  bankCode: z.string().min(2).max(10),
  accountNumber: z.string().length(10),
});

const bankAccountSchema = z.object({
  bankCode: z.string().min(2).max(10),
  accountNumber: z.string().length(10),
  accountName: z.string().min(1).max(200),
});

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  marketplaceCategoryId: z.string().uuid(),
  description: z.string().optional(),
  supplierPrice: z.number().positive(),
  suggestedRetailPrice: z.number().positive().optional(),
  currency: z.string().max(10).default('NGN'),
  isVariable: z.boolean().default(false),
  trackInventory: z.boolean().default(true),
  processingTimeDays: z.number().int().min(1).optional(),
  weight: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(500).optional(),
});

const createVariantSchema = z.object({
  variantLabel: z.string().min(1).max(255),
  sku: z.string().max(100).optional(),
  supplierPrice: z.number().positive(),
  suggestedRetailPrice: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  optionValues: z.array(z.object({
    typeName: z.string(),
    value: z.string(),
    displayValue: z.string().optional(),
  })).default([]),
  weight: z.number().positive().optional(),
});

const shipOrderSchema = z.object({
  trackingNumber: z.string().min(1).max(255),
  carrierName: z.string().min(1).max(100),
  trackingUrl: z.string().url().optional(),
});

const withdrawalSchema = z.object({
  amount: z.number().positive(),
});

module.exports = {
  updateProfileSchema, verifyAccountSchema, bankAccountSchema,
  createProductSchema, createVariantSchema, shipOrderSchema, withdrawalSchema,
};
