import PageSettingsPanel from './panels/PageSettingsPanel';
import SectionSettingsPanel from './panels/SectionSettingsPanel';
import ComponentSettingsPanel from './panels/ComponentSettingsPanel';
import './BuilderRightPanel.css';

export default function BuilderRightPanel({
  content,
  selectedSection,
  selectedComponent,
  pageData,
  onPageUpdate,
  onSectionConfigUpdate,
  onSectionSelect,
}) {
  return (
    <aside className="builder-right-panel">
      <div className="builder-right-panel__container">
        {content.type === 'page' && (
          <PageSettingsPanel
            pageData={pageData}
            onUpdate={onPageUpdate}
          />
        )}

        {content.type === 'section' && selectedSection && (
          <SectionSettingsPanel
            section={selectedSection}
            onConfigUpdate={(config) => onSectionConfigUpdate(selectedSection.id, config)}
            onBack={onSectionSelect}
          />
        )}

        {content.type === 'component' && selectedComponent && (
          <ComponentSettingsPanel
            component={selectedComponent}
            onBack={onSectionSelect}
          />
        )}
      </div>
    </aside>
  );
}
