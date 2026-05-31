

// Default configs per section type when inserting a new section
const DEFAULT_SECTION_CONFIGS = {
  HERO: { minHeight: 500, backgroundColor: '#1A2E1A', padding: { top: 80, right: 0, bottom: 80, left: 0 } },
  PRODUCT_GRID: { heading: 'Our Products', productCount: 8, layout: 'grid', columnsDesktop: 4, columnsTablet: 3, columnsMobile: 2, dataSource: 'featured', backgroundColor: '#FFFFFF', padding: { top: 60, right: 0, bottom: 60, left: 0 } },
  FEATURED_PRODUCTS: { heading: 'Featured Products', productCount: 4, layout: 'grid', columnsDesktop: 4, columnsTablet: 2, columnsMobile: 1, backgroundColor: '#FFFFFF', padding: { top: 60, right: 0, bottom: 60, left: 0 } },
  RICH_TEXT: { backgroundColor: '#FFFFFF', padding: { top: 60, right: 0, bottom: 60, left: 0 } },
  TESTIMONIALS: { heading: 'What Our Customers Say', backgroundColor: '#F9FAFB', padding: { top: 60, right: 0, bottom: 60, left: 0 } },
  CALL_TO_ACTION: { heading: 'Ready to get started?', backgroundColor: '#22925B', padding: { top: 80, right: 0, bottom: 80, left: 0 } },
  FEATURES: { heading: 'Why Choose Us', backgroundColor: '#FFFFFF', padding: { top: 60, right: 0, bottom: 60, left: 0 } },
  GALLERY: { heading: 'Gallery', backgroundColor: '#FFFFFF', padding: { top: 60, right: 0, bottom: 60, left: 0 } },
  NEWSLETTER: { heading: 'Stay in the loop', backgroundColor: '#F3F4F6', padding: { top: 60, right: 0, bottom: 60, left: 0 } },
  CUSTOM: { backgroundColor: '#FFFFFF', padding: { top: 60, right: 0, bottom: 60, left: 0 } },
};

// Default configs per component type
const DEFAULT_COMPONENT_CONFIGS = {
  TEXT: { content: 'New text', tag: 'p', style: { fontSize: 16, fontWeight: '400', color: '#111111', textAlign: 'left' } },
  BUTTON: { label: 'Click me', link: '/products', style: { backgroundColor: '#22925B', color: '#FFFFFF', padding: { top: 12, right: 24, bottom: 12, left: 24 }, borderRadius: 6, fontSize: 14, fontWeight: '500' } },
  IMAGE: { imageSrc: '', altText: 'Image', width: '100%', height: 'auto', objectFit: 'Cover', shape: 'normal' },
  SPACER: { height: 32 },
  DIVIDER: { style: { color: '#E5E7EB', thickness: 1 } },
  PRODUCT_CARD: { showPrice: true, showRating: false, showButton: true },
};

function getRandId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID().split('-')[0];
    } catch (e) {}
  }
  return Math.random().toString(36).substring(2, 10);
}

// ── ADD SECTION ─────────────────────────────────────────────────────────────
export function addSectionToSchema(schema, sectionType, atIndex) {
  const defaultConfig = DEFAULT_SECTION_CONFIGS[sectionType] || {};

  const newSection = {
    id: `section-${Date.now()}-${getRandId()}`,
    type: sectionType,
    config: defaultConfig,
    components: []
  };

  const newSections = [
    ...schema.sections.slice(0, atIndex),
    newSection,
    ...schema.sections.slice(atIndex)
  ];

  return { ...schema, sections: newSections };
}

// ── DELETE SECTION ───────────────────────────────────────────────────────────
export function deleteSection(schema, sectionId) {
  return { ...schema, sections: schema.sections.filter(section => section.id !== sectionId) };
}

// ── MOVE SECTION (reorder) ───────────────────────────────────────────────────
export function moveSection(schema, fromIndex, toIndex) {
  const sections = [...schema.sections];
  const [movedSection] = sections.splice(fromIndex, 1);
  sections.splice(toIndex, 0, movedSection);
  return { ...schema, sections };
}

// ── DUPLICATE SECTION ────────────────────────────────────────────────────────
export function duplicateSection(schema, sectionId) {
  const sectionIndex = schema.sections.findIndex(s => s.id === sectionId);
  if (sectionIndex === -1) return schema;

  const originalSection = schema.sections[sectionIndex];
  const duplicatedSection = deepCopyWithNewIds(originalSection);

  const newSections = [
    ...schema.sections.slice(0, sectionIndex + 1),
    duplicatedSection,
    ...schema.sections.slice(sectionIndex + 1)
  ];

  return { ...schema, sections: newSections };
}

// ── UPDATE SECTION CONFIG ────────────────────────────────────────────────────
export function updateSectionConfig(schema, sectionId, newConfig) {
  return {
    ...schema,
    sections: schema.sections.map(section => {
      if (section.id !== sectionId) return section;
      return { ...section, config: deepMerge(section.config, newConfig) };
    })
  };
}

// ── ADD COMPONENT ────────────────────────────────────────────────────────────
export function addComponentToSection(schema, sectionId, componentType, afterComponentId = null) {
  const defaultConfig = DEFAULT_COMPONENT_CONFIGS[componentType] || {};

  const newComponent = {
    id: `comp-${Date.now()}-${getRandId()}`,
    type: componentType,
    config: defaultConfig,
    ...(componentType === 'CONTAINER' ? { children: [] } : {})
  };

  return {
    ...schema,
    sections: schema.sections.map(section => {
      if (section.id !== sectionId) return section;

      let newComponents;
      if (afterComponentId === null) {
        newComponents = [...(section.components || []), newComponent];
      } else {
        const components = section.components || [];
        const afterIndex = components.findIndex(c => c.id === afterComponentId);
        if (afterIndex === -1) {
          newComponents = [...components, newComponent];
        } else {
          newComponents = [
            ...components.slice(0, afterIndex + 1),
            newComponent,
            ...components.slice(afterIndex + 1)
          ];
        }
      }

      return { ...section, components: newComponents };
    })
  };
}

export function moveComponent(schema, sectionId, componentId, targetSectionId, toIndex) {
  let movedComponent = null;
  const newSections = schema.sections.map(section => {
    if (section.id === sectionId) {
      movedComponent = section.components.find(c => c.id === componentId);
      return {
        ...section,
        components: section.components.filter(c => c.id !== componentId)
      };
    }
    return section;
  });

  if (!movedComponent) return schema;

  return {
    ...schema,
    sections: newSections.map(section => {
      if (section.id === targetSectionId) {
        const components = [...(section.components || [])];
        components.splice(toIndex, 0, movedComponent);
        return { ...section, components };
      }
      return section;
    })
  };
}

// ── UPDATE COMPONENT CONFIG ──────────────────────────────────────────────────
export function updateComponentConfig(schema, sectionId, componentId, newConfig) {
  const updateInList = (components = []) => {
    return components.map(c => {
      if (c.id === componentId) {
        return { ...c, config: deepMerge(c.config, newConfig) };
      }
      if (c.children) {
        return { ...c, children: updateInList(c.children) };
      }
      return c;
    });
  };

  return {
    ...schema,
    sections: schema.sections.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        components: updateInList(section.components)
      };
    })
  };
}

// ── UPDATE CHILD COMPONENT CONFIG (nested) ───────────────────────────────────
export function updateChildConfig(schema, sectionId, componentId, childId, newConfig) {
  return {
    ...schema,
    sections: schema.sections.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        components: section.components.map(component => {
          if (component.id !== componentId) return component;
          if (!component.children) return component;
          return {
            ...component,
            children: component.children.map(child => {
              if (child.id !== childId) return child;
              return { ...child, config: deepMerge(child.config, newConfig) };
            })
          };
        })
      };
    })
  };
}

// ── DELETE COMPONENT ─────────────────────────────────────────────────────────
export function deleteComponent(schema, sectionId, componentId) {
  const deleteInList = (components = []) => {
    return components
      .filter(c => c.id !== componentId)
      .map(c => {
        if (c.children) {
          return { ...c, children: deleteInList(c.children) };
        }
        return c;
      });
  };

  return {
    ...schema,
    sections: schema.sections.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        components: deleteInList(section.components)
      };
    })
  };
}

// ── HELPER: deepCopyWithNewIds ───────────────────────────────────────────────
export function deepCopyWithNewIds(node) {
  if (Array.isArray(node)) {
    return node.map(item => deepCopyWithNewIds(item));
  }
  if (node !== null && typeof node === 'object') {
    const copy = {};
    for (const key in node) {
      if (key === 'id') {
        const prefix = node.type ? (node.components ? 'section' : 'comp') : 'node';
        copy.id = `${prefix}-${Date.now()}-${getRandId()}`;
      } else {
        copy[key] = deepCopyWithNewIds(node[key]);
      }
    }
    return copy;
  }
  return node;
}

// ── HELPER: deepMerge ────────────────────────────────────────────────────────
export function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] !== null &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
