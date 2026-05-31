import React from 'react';
import SectionWrapper from './SectionWrapper';
import AddSectionButton from './AddSectionButton';
import './BuilderCanvas.css';

const DEVICE_WIDTHS = {
  Desktop: '100%',
  Tablet: '768px',
  Mobile: '375px',
};

export default function BuilderCanvas({
  schema,
  selection,
  device,
  onSelect,
  onUpdate,
  prefetchedData
}) {
  const sections = schema?.sections || [];

  return (
    <div className="builder-canvas" onClick={() => onSelect({ sectionId: null, componentId: null, childId: null })}>
      <div
        className={`builder-canvas__viewport builder-canvas__viewport--${device.toLowerCase()}`}
        style={{ 
          width: DEVICE_WIDTHS[device],
          maxWidth: '100%',
          margin: '0 auto',
          transition: 'width 0.3s ease',
          backgroundColor: '#fff',
          minHeight: '100%',
          boxShadow: '0 0 20px rgba(0,0,0,0.05)'
        }}
      >
        <div className="builder-canvas__stage">
          
          <AddSectionButton
            position={0}
            onAdd={(sectionType) => {
              import('./schema.mutations.js').then(({ addSectionToSchema }) => {
                onUpdate(addSectionToSchema(schema, sectionType, 0));
              });
            }}
          />

          {sections.map((section, index) => (
            <React.Fragment key={section.id}>
              <SectionWrapper
                section={section}
                index={index}
                isSelected={selection.sectionId === section.id}
                selection={selection}
                schema={schema}
                onSelect={onSelect}
                onUpdate={onUpdate}
                prefetchedData={prefetchedData}
              />

              <AddSectionButton
                position={index + 1}
                onAdd={(sectionType) => {
                  import('./schema.mutations.js').then(({ addSectionToSchema }) => {
                    onUpdate(addSectionToSchema(schema, sectionType, index + 1));
                  });
                }}
              />
            </React.Fragment>
          ))}

          {sections.length === 0 && (
            <div className="builder-canvas__empty" style={{ textAlign: 'center', padding: '60px 20px', color: '#6B7280' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 16px', display: 'block' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 11h6M9 15h6" />
              </svg>
              <p>Your page is empty. Add a section to get started.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
