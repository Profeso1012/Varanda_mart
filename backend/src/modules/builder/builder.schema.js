const { z } = require('zod');

const applyTemplateSchema = z.object({
  templateId: z.string().uuid(),
  confirm: z.boolean().optional().default(false),
});

const updatePageSchemaSchema = z.object({
  schema: z.object({
    sections: z.array(z.any()),
  }),
});

const updatePageSeoSchema = z.object({
  title: z.string().max(255).optional(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(500).optional(),
});

const createCustomPageSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(500).optional(),
});

const addSectionSchema = z.object({
  sectionType: z.string().min(1),
  afterSectionId: z.string().uuid().nullable().optional(),
  config: z.record(z.any()).optional().default({}),
});

const updateSectionSchema = z.object({
  config: z.record(z.any()),
});

const reorderSectionsSchema = z.object({
  sectionIds: z.array(z.string().uuid()).min(1),
});

const addComponentSchema = z.object({
  componentType: z.string().min(1),
  afterComponentId: z.string().uuid().nullable().optional(),
  config: z.record(z.any()).optional().default({}),
});

const updateComponentSchema = z.object({
  config: z.record(z.any()),
});

const addChildSchema = z.object({
  childType: z.string().min(1),
  afterChildId: z.string().uuid().nullable().optional(),
  config: z.record(z.any()).optional().default({}),
});

const updateChildSchema = z.object({
  config: z.record(z.any()),
});

const reorderChildrenSchema = z.object({
  childIds: z.array(z.string().uuid()).min(1),
});

module.exports = {
  applyTemplateSchema,
  updatePageSchemaSchema,
  updatePageSeoSchema,
  createCustomPageSchema,
  addSectionSchema,
  updateSectionSchema,
  reorderSectionsSchema,
  addComponentSchema,
  updateComponentSchema,
  addChildSchema,
  updateChildSchema,
  reorderChildrenSchema,
};
