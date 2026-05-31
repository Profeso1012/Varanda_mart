const { z } = require('zod');

// ─── Categories ───────────────────────────────────────────────────────────────

const createCategorySchema = z.object({
  name: z.string({ required_error: 'Category name is required.' }).min(1).max(100),
  parentId: z.string().uuid('parentId must be a valid UUID.').optional().nullable(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.string().uuid().optional().nullable(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const uploadImageSchema = z.object({
  url: z.string().url('Must be a valid URL.'),
  publicId: z.string().optional(),
});

// ─── Tags ─────────────────────────────────────────────────────────────────────

const createTagSchema = z.object({
  name: z.string({ required_error: 'Tag name is required.' }).min(1).max(100),
});

// ─── Variant option types ─────────────────────────────────────────────────────

const createOptionTypeSchema = z.object({
  name: z.string({ required_error: 'Option type name is required.' }).min(1).max(100),
  displayType: z.enum(['TEXT', 'COLOR_SWATCH', 'IMAGE', 'BUTTON']).default('TEXT'),
});

const createOptionValueSchema = z.object({
  value: z.string({ required_error: 'Value is required.' }).min(1).max(100),
  displayValue: z.string().max(100).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

// ─── Products ─────────────────────────────────────────────────────────────────

const createProductSchema = z.object({
  name: z.string({ required_error: 'Product name is required.' }).min(1).max(255),
  categoryId: z.string().uuid().optional().nullable(),
  basePrice: z.number({ required_error: 'Base price is required.' }).min(0),
  compareAtPrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  currency: z.string().max(10).default('NGN'),
  isVariable: z.boolean().default(false),
  trackInventory: z.boolean().default(true),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('DRAFT'),
  isFeatured: z.boolean().default(false),
  weight: z.number().positive().optional().nullable(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).default(0),
  tagIds: z.array(z.string().uuid()).optional(),
  stockQuantity: z.number().int().min(0).optional(),
});

const updateProductSchema = createProductSchema.partial();

const addImagesSchema = z.object({
  images: z.array(z.object({
    url: z.string().url('Each image must have a valid URL.'),
    publicId: z.string().optional(),
    altText: z.string().max(255).optional(),
    isMain: z.boolean().optional(),
  })).min(1, 'At least one image is required.'),
});

const reorderImagesSchema = z.object({
  images: z.array(z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int().min(0),
  })),
});

const createVariantSchema = z.object({
  sku: z.string().max(100).optional(),
  price: z.number({ required_error: 'Variant price is required.' }).min(0),
  compareAtPrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  stockQuantity: z.number().int().min(0).default(0),
  optionValueIds: z.array(z.string().uuid()).min(1, 'At least one option value is required.'),
  imageUrl: z.string().url().optional().nullable(),
  imagePublicId: z.string().max(255).optional().nullable(),
  weight: z.number().positive().optional().nullable(),
});

// PUT allows updating option value assignments too
const updateVariantSchema = z.object({
  sku: z.string().max(100).optional(),
  price: z.number().min(0).optional(),
  compareAtPrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  stockQuantity: z.number().int().min(0).optional(),
  optionValueIds: z.array(z.string().uuid()).min(1).optional(),
  imageUrl: z.string().url().optional().nullable(),
  imagePublicId: z.string().max(255).optional().nullable(),
  weight: z.number().positive().optional().nullable(),
  isActive: z.boolean().optional(),
});

// ─── Product option type assignments ─────────────────────────────────────────

const assignOptionTypeSchema = z.object({
  optionTypeId: z.string().uuid('optionTypeId must be a valid UUID.'),
  // null = all values enabled; array of UUIDs = only those values enabled
  enabledValueIds: z.array(z.string().uuid()).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

const updateProductOptionTypeSchema = z.object({
  // null = re-enable all values; array = restrict to these values
  enabledValueIds: z.array(z.string().uuid()).nullable(),
});

const bulkStockSchema = z.object({
  updates: z.array(z.object({
    variantId: z.string().uuid(),
    stockQuantity: z.number().int().min(0),
  })).min(1, 'At least one update is required.'),
});

// ─── Bundles ──────────────────────────────────────────────────────────────────

const createBundleSchema = z.object({
  name: z.string({ required_error: 'Bundle name is required.' }).min(1).max(255),
  price: z.number({ required_error: 'Bundle price is required.' }).min(0),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional().nullable(),
    quantity: z.number().int().min(1).default(1),
  })).min(1, 'A bundle must have at least one item.'),
});

const updateBundleSchema = createBundleSchema.partial();

// ─── Discounts ────────────────────────────────────────────────────────────────

const createDiscountSchema = z.object({
  code: z.string({ required_error: 'Discount code is required.' }).min(2).max(50)
    .regex(/^[A-Z0-9_-]+$/i, 'Code can only contain letters, numbers, hyphens, and underscores.'),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'], {
    errorMap: () => ({ message: 'Type must be PERCENTAGE, FIXED_AMOUNT, or FREE_SHIPPING.' }),
  }),
  value: z.number({ required_error: 'Discount value is required.' }).min(0),
  minimumOrder: z.number().min(0).optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  perCustomerLimit: z.number().int().min(1).default(1),
  startsAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
});

const updateDiscountSchema = createDiscountSchema.partial();

// ─── Inventory ────────────────────────────────────────────────────────────────

const adjustStockSchema = z.object({
  variantId: z.string().uuid('variantId must be a valid UUID.'),
  quantityChange: z.number().int({ message: 'quantityChange must be a whole number.' }),
  movementType: z.enum(['MANUAL_INCREASE', 'MANUAL_DECREASE', 'RETURN']).default('MANUAL_INCREASE'),
  note: z.string().max(255).optional(),
});

module.exports = {
  createCategorySchema, updateCategorySchema, uploadImageSchema,
  createTagSchema, createOptionTypeSchema, createOptionValueSchema,
  assignOptionTypeSchema, updateProductOptionTypeSchema,
  createProductSchema, updateProductSchema, addImagesSchema, reorderImagesSchema,
  createVariantSchema, updateVariantSchema, bulkStockSchema,
  createBundleSchema, updateBundleSchema,
  createDiscountSchema, updateDiscountSchema,
  adjustStockSchema,
};
