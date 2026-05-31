const { Router } = require('express');
const { validate } = require('../../middleware/validate.middleware');
const {
  getTemplates,
  applyTemplate,
  getPages,
  getPage,
  updatePageSchema,
  updatePageSeo,
  createCustomPage,
  addSection,
  updateSection,
  deleteSection,
  reorderSections,
  addComponent,
  updateComponent,
  deleteComponent,
  addChild,
  updateChild,
  deleteChild,
  reorderChildren,
  publishStore,
  unpublishStore,
} = require('./builder.controller');
const {
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
} = require('./builder.schema');

const router = Router();

// Templates
router.get('/templates', getTemplates);
router.post('/apply-template', validate(applyTemplateSchema), applyTemplate);

// Pages
router.get('/pages', getPages);
// Custom page creation — must be before /:pageType to avoid conflict
router.post('/pages/custom', validate(createCustomPageSchema), createCustomPage);
router.get('/pages/:pageType', getPage);
router.put('/pages/:pageType/schema', validate(updatePageSchemaSchema), updatePageSchema);
router.put('/pages/:pageType/seo', validate(updatePageSeoSchema), updatePageSeo);

// Sections — reorder must be before /:sectionId
router.put('/pages/:pageType/sections/reorder', validate(reorderSectionsSchema), reorderSections);
router.post('/pages/:pageType/sections', validate(addSectionSchema), addSection);
router.put('/pages/:pageType/sections/:sectionId', validate(updateSectionSchema), updateSection);
router.delete('/pages/:pageType/sections/:sectionId', deleteSection);

// Components
router.post('/pages/:pageType/sections/:sectionId/components', validate(addComponentSchema), addComponent);
router.put('/pages/:pageType/sections/:sectionId/components/:componentId', validate(updateComponentSchema), updateComponent);
router.delete('/pages/:pageType/sections/:sectionId/components/:componentId', deleteComponent);

// Child Components (nested in containers) — reorder must be before /:childId
router.put('/pages/:pageType/sections/:sectionId/components/:componentId/children/reorder', validate(reorderChildrenSchema), reorderChildren);
router.post('/pages/:pageType/sections/:sectionId/components/:componentId/children', validate(addChildSchema), addChild);
router.put('/pages/:pageType/sections/:sectionId/components/:componentId/children/:childId', validate(updateChildSchema), updateChild);
router.delete('/pages/:pageType/sections/:sectionId/components/:componentId/children/:childId', deleteChild);

// Publish / Unpublish
router.post('/publish', publishStore);
router.post('/unpublish', unpublishStore);

module.exports = router;
