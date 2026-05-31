const { v4: uuidv4 } = require('uuid');

/**
 * Pure schema mutation service for the website builder.
 * All functions take a schema object and return a NEW schema — never mutate in place.
 * 
 * SCHEMA HIERARCHY:
 * Page
 * └── Sections[]          (full-width horizontal bands)
 *     └── Components[]    (elements inside a section - can be leaf or container)
 *         └── children[]  (only on CONTAINER components - nested elements)
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Recursively copies a schema and replaces every `id` field with a fresh UUID.
 * Used when applying a template so each store gets unique section/component IDs.
 */
const deepCopyWithNewIds = (schema) => {
  const copy = deepCopy(schema);
  const replaceIds = (node) => {
    if (Array.isArray(node)) return node.map(replaceIds);
    if (node && typeof node === 'object') {
      const result = {};
      for (const [k, v] of Object.entries(node)) {
        result[k] = k === 'id' ? uuidv4() : replaceIds(v);
      }
      return result;
    }
    return node;
  };
  return replaceIds(copy);
};

/**
 * Deep merge utility for config objects
 */
const deepMerge = (target, source) => {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};

// ─── Section mutations ────────────────────────────────────────────────────────

/**
 * Inserts a new section after `afterSectionId` (or at the end if null).
 */
const addSection = (schema, sectionType, afterSectionId, config = {}) => {
  const copy = deepCopy(schema);
  const newSection = {
    id: uuidv4(),
    type: sectionType,
    config,
    components: [],
  };

  if (!afterSectionId) {
    copy.sections.push(newSection);
  } else {
    const idx = copy.sections.findIndex((s) => s.id === afterSectionId);
    if (idx === -1) {
      copy.sections.push(newSection);
    } else {
      copy.sections.splice(idx + 1, 0, newSection);
    }
  }
  return copy;
};

/**
 * Deep-merges `config` into the specified section's config.
 */
const updateSection = (schema, sectionId, config) => {
  const copy = deepCopy(schema);
  const section = copy.sections.find((s) => s.id === sectionId);
  if (!section) throw new Error(`Section ${sectionId} not found`);
  section.config = deepMerge(section.config, config);
  return copy;
};

const deleteSection = (schema, sectionId) => {
  const copy = deepCopy(schema);
  copy.sections = copy.sections.filter((s) => s.id !== sectionId);
  return copy;
};

/**
 * Reorders sections to match the provided array of IDs.
 * IDs not in the array are dropped; IDs not in the schema are ignored.
 */
const reorderSections = (schema, sectionIds) => {
  const copy = deepCopy(schema);
  const map = Object.fromEntries(copy.sections.map((s) => [s.id, s]));
  copy.sections = sectionIds.filter((id) => map[id]).map((id) => map[id]);
  return copy;
};

// ─── Component mutations ──────────────────────────────────────────────────────

const addComponent = (schema, sectionId, componentType, afterComponentId, config = {}) => {
  const copy = deepCopy(schema);
  const section = copy.sections.find((s) => s.id === sectionId);
  if (!section) throw new Error(`Section ${sectionId} not found`);

  const newComponent = { 
    id: uuidv4(), 
    type: componentType, 
    config,
    // Container components can have children
    ...(isContainerType(componentType) ? { children: [] } : {})
  };

  if (!afterComponentId) {
    section.components.push(newComponent);
  } else {
    const idx = section.components.findIndex((c) => c.id === afterComponentId);
    if (idx === -1) {
      section.components.push(newComponent);
    } else {
      section.components.splice(idx + 1, 0, newComponent);
    }
  }
  return copy;
};

const updateComponent = (schema, sectionId, componentId, config) => {
  const copy = deepCopy(schema);
  const section = copy.sections.find((s) => s.id === sectionId);
  if (!section) throw new Error(`Section ${sectionId} not found`);
  const component = section.components.find((c) => c.id === componentId);
  if (!component) throw new Error(`Component ${componentId} not found`);
  component.config = deepMerge(component.config, config);
  return copy;
};

const deleteComponent = (schema, sectionId, componentId) => {
  const copy = deepCopy(schema);
  const section = copy.sections.find((s) => s.id === sectionId);
  if (!section) throw new Error(`Section ${sectionId} not found`);
  section.components = section.components.filter((c) => c.id !== componentId);
  return copy;
};

// ─── Child Component mutations (for nested components in containers) ─────────

/**
 * Add a child component to a CONTAINER component
 */
const addChild = (schema, sectionId, componentId, childType, afterChildId, config = {}) => {
  const copy = deepCopy(schema);
  const section = copy.sections.find((s) => s.id === sectionId);
  if (!section) throw new Error(`Section ${sectionId} not found`);
  const component = section.components.find((c) => c.id === componentId);
  if (!component) throw new Error(`Component ${componentId} not found`);
  if (!component.children) {
    throw new Error(`Component ${componentId} is not a container type`);
  }

  const newChild = { id: uuidv4(), type: childType, config };

  if (!afterChildId) {
    component.children.push(newChild);
  } else {
    const idx = component.children.findIndex((c) => c.id === afterChildId);
    if (idx === -1) {
      component.children.push(newChild);
    } else {
      component.children.splice(idx + 1, 0, newChild);
    }
  }
  return copy;
};

/**
 * Update a child component's config
 */
const updateChild = (schema, sectionId, componentId, childId, config) => {
  const copy = deepCopy(schema);
  const section = copy.sections.find((s) => s.id === sectionId);
  if (!section) throw new Error(`Section ${sectionId} not found`);
  const component = section.components.find((c) => c.id === componentId);
  if (!component) throw new Error(`Component ${componentId} not found`);
  if (!component.children) throw new Error(`Component ${componentId} has no children`);
  const child = component.children.find((c) => c.id === childId);
  if (!child) throw new Error(`Child ${childId} not found`);
  child.config = deepMerge(child.config, config);
  return copy;
};

/**
 * Delete a child component
 */
const deleteChild = (schema, sectionId, componentId, childId) => {
  const copy = deepCopy(schema);
  const section = copy.sections.find((s) => s.id === sectionId);
  if (!section) throw new Error(`Section ${sectionId} not found`);
  const component = section.components.find((c) => c.id === componentId);
  if (!component) throw new Error(`Component ${componentId} not found`);
  if (!component.children) throw new Error(`Component ${componentId} has no children`);
  component.children = component.children.filter((c) => c.id !== childId);
  return copy;
};

/**
 * Reorder children within a container
 */
const reorderChildren = (schema, sectionId, componentId, childIds) => {
  const copy = deepCopy(schema);
  const section = copy.sections.find((s) => s.id === sectionId);
  if (!section) throw new Error(`Section ${sectionId} not found`);
  const component = section.components.find((c) => c.id === componentId);
  if (!component) throw new Error(`Component ${componentId} not found`);
  if (!component.children) throw new Error(`Component ${componentId} has no children`);
  
  const map = Object.fromEntries(component.children.map((c) => [c.id, c]));
  component.children = childIds.filter((id) => map[id]).map((id) => map[id]);
  return copy;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Check if a component type is a container (can have children)
 */
const isContainerType = (type) => {
  const containerTypes = ['CONTAINER', 'CARD', 'FLEX_ROW', 'FLEX_COLUMN', 'GRID'];
  return containerTypes.includes(type);
};

module.exports = {
  deepCopyWithNewIds,
  deepMerge,
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
  isContainerType,
};
