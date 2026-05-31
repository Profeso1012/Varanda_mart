import React from 'react';
import PageSettingsPanel from './panels/PageSettingsPanel';
import SectionSettingsPanel from './panels/SectionSettingsPanel';
import ComponentSettingsPanel from './panels/ComponentSettingsPanel';
import './BuilderRightPanel.css';

export default function BuilderRightPanel({
  schema,
  selection,
  onUpdate,
  pageData,
  onPageUpdate,
  onBack,
}) {
  const selectedSection = selection.sectionId
    ? schema.sections?.find(s => s.id === selection.sectionId)
    : null;

  const findComponent = (components = [], id) => {
    for (const c of components) {
      if (c.id === id) return c;
      if (c.children) {
        const found = findComponent(c.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedComponent = selection.componentId && selectedSection
    ? findComponent(selectedSection.components, selection.componentId)
    : null;

  const contentType = selectedComponent
    ? 'component'
    : selectedSection
    ? 'section'
    : 'page';

  return (
    <aside className="builder-right-panel">
      <div className="builder-right-panel__container">
        {contentType === 'page' && (
          <PageSettingsPanel
            pageData={pageData}
            onUpdate={onPageUpdate}
          />
        )}

        {contentType === 'section' && selectedSection && (
          <SectionSettingsPanel
            section={selectedSection}
            onConfigUpdate={(config) => {
              import('./schema.mutations.js').then(({ updateSectionConfig }) => {
                onUpdate(updateSectionConfig(schema, selectedSection.id, config));
              });
            }}
            onBack={onBack}
          />
        )}

        {contentType === 'component' && selectedComponent && (
          <ComponentSettingsPanel
            component={selectedComponent}
            onConfigUpdate={(config) => {
              import('./schema.mutations.js').then(({ updateComponentConfig }) => {
                onUpdate(updateComponentConfig(schema, selectedSection.id, selectedComponent.id, config));
              });
            }}
            onBack={onBack}
          />
        )}
      </div>
    </aside>
  );
}
