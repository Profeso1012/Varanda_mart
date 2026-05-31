import { sellerApi } from '../lib/axios';

// ─── Templates ────────────────────────────────────────────────────────────────

export const getTemplates = () =>
  sellerApi.get('/builder/templates').then(r => r.data.data);

export const applyTemplate = (templateId, confirm = false) =>
  sellerApi.post('/builder/apply-template', { templateId, confirm }).then(r => r.data.data);

// ─── Pages ────────────────────────────────────────────────────────────────────

/** Returns all pages (schema excluded) */
export const getPages = () =>
  sellerApi.get('/builder/pages').then(r => r.data.data);

/** Returns a single page with full schema */
export const getPage = (pageType) =>
  sellerApi.get(`/builder/pages/${pageType}`).then(r => r.data.data);

/** Replaces the entire page schema */
export const savePageSchema = (pageType, schema) =>
  sellerApi.put(`/builder/pages/${pageType}/schema`, { schema }).then(r => r.data.data);

/** Updates SEO / title fields only */
export const savePageSeo = (pageType, fields) =>
  sellerApi.put(`/builder/pages/${pageType}/seo`, fields).then(r => r.data.data);

/** Creates a new custom page */
export const createCustomPage = (fields) =>
  sellerApi.post('/builder/pages/custom', fields).then(r => r.data.data);

// ─── Sections ─────────────────────────────────────────────────────────────────

/** Adds a section. afterSectionId = null → append at end */
export const addSection = (pageType, sectionType, afterSectionId, config = {}) =>
  sellerApi
    .post(`/builder/pages/${pageType}/sections`, { sectionType, afterSectionId, config })
    .then(r => r.data.data);

/** Deep-merges config into the section */
export const updateSection = (pageType, sectionId, config) =>
  sellerApi
    .put(`/builder/pages/${pageType}/sections/${sectionId}`, { config })
    .then(r => r.data.data);

/** Deletes a section and all its components */
export const deleteSection = (pageType, sectionId) =>
  sellerApi
    .delete(`/builder/pages/${pageType}/sections/${sectionId}`)
    .then(r => r.data.data);

/** Reorders sections */
export const reorderSections = (pageType, sectionIds) =>
  sellerApi
    .put(`/builder/pages/${pageType}/sections/reorder`, { sectionIds })
    .then(r => r.data.data);

// ─── Components ───────────────────────────────────────────────────────────────

/** Adds a component inside a section */
export const addComponent = (pageType, sectionId, componentType, afterComponentId, config = {}) =>
  sellerApi
    .post(`/builder/pages/${pageType}/sections/${sectionId}/components`, {
      componentType,
      afterComponentId,
      config,
    })
    .then(r => r.data.data);

/** Deep-merges config into the component */
export const updateComponent = (pageType, sectionId, componentId, config) =>
  sellerApi
    .put(`/builder/pages/${pageType}/sections/${sectionId}/components/${componentId}`, { config })
    .then(r => r.data.data);

/** Deletes a component */
export const deleteComponent = (pageType, sectionId, componentId) =>
  sellerApi
    .delete(`/builder/pages/${pageType}/sections/${sectionId}/components/${componentId}`)
    .then(r => r.data.data);

// ─── Publish ──────────────────────────────────────────────────────────────────

export const publishStore = () =>
  sellerApi.post('/builder/publish').then(r => r.data.data);

export const unpublishStore = () =>
  sellerApi.post('/builder/unpublish').then(r => r.data.data);
