const { z } = require('zod');

const inviteSchema = z.object({
  email: z.string().email(),
  permissions: z.object({
    orders: z.object({
      view: z.boolean().default(false),
      update_status: z.boolean().default(false),
    }).default({}),
    payments: z.object({ view: z.boolean().default(false) }).default({}),
    customers: z.object({ view: z.boolean().default(false) }).default({}),
    products: z.object({
      view: z.boolean().default(true),
      create: z.boolean().default(false),
      update: z.boolean().default(false),
      delete: z.boolean().default(false),
    }).default({}),
    settings: z.object({
      view: z.boolean().default(false),
      update: z.boolean().default(false),
    }).default({}),
  }).optional(),
});

const acceptInviteSchema = z.object({
  token: z.string().min(1),
});

const updatePermissionsSchema = z.object({
  permissions: z.object({
    orders: z.object({
      view: z.boolean(),
      update_status: z.boolean(),
    }).optional(),
    payments: z.object({ view: z.boolean() }).optional(),
    customers: z.object({ view: z.boolean() }).optional(),
    products: z.object({
      view: z.boolean(),
      create: z.boolean(),
      update: z.boolean(),
      delete: z.boolean(),
    }).optional(),
    settings: z.object({
      view: z.boolean(),
      update: z.boolean(),
    }).optional(),
  }),
});

module.exports = { inviteSchema, acceptInviteSchema, updatePermissionsSchema };
