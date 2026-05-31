const { z } = require('zod');

const selectPlanSchema = z.object({
  tier: z.enum(['STARTER', 'PRO', 'GROWTH']),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
});

const upgradePlanSchema = z.object({
  tier: z.enum(['PRO', 'GROWTH']),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
});

module.exports = { selectPlanSchema, upgradePlanSchema };
