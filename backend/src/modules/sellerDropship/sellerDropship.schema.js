const { z } = require('zod');

const disputeSchema = z.object({
  reason: z.enum(['NOT_DELIVERED', 'WRONG_ITEM', 'DAMAGED', 'NOT_AS_DESCRIBED', 'OTHER']),
  description: z.string().min(10).max(2000),
  evidenceUrls: z.array(z.string().url()).optional(),
});

module.exports = { disputeSchema };
