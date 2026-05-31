const { z } = require('zod');

const importSchema = z.object({
  supplierProductId: z.string().uuid(),
  retailPrice: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  customTitle: z.string().max(255).optional().nullable(),
  customDescription: z.string().optional().nullable(),
  variantPrices: z.array(z.object({
    supplierVariantId: z.string().uuid(),
    retailPrice: z.number().positive(),
  })).optional(),
});

module.exports = { importSchema };
