import { useState } from 'react';
import { SectionRenderer } from '@varanda/renderer';
import ComponentWrapper from './ComponentWrapper';
import SectionActionBar from './SectionActionBar';

export default function SectionWrapper({
  section,
  index,
  isSelected,
  selection,
  schema,
  onSelect,
  onUpdate,
  prefetchedData
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect({
      sectionId: section.id,
      componentId: null,
      childId: null
    });
  };

  // Basic Drag and Drop support
  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/x-varanda-section', section.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
    e.dataTransfer.dropEffect = 'move';
    // Visual cue for drop target could be added here
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const draggedSectionId = e.dataTransfer.getData('application/x-varanda-section');
    if (draggedSectionId && draggedSectionId !== section.id) {
      const fromIndex = schema.sections.findIndex(s => s.id === draggedSectionId);
      if (fromIndex !== -1) {
        import('./schema.mutations.js').then(({ moveSection }) => {
          onUpdate(moveSection(schema, fromIndex, index));
        });
      }
    }
  };

  return (
    <div
      className={`section-wrapper ${isSelected ? 'section-selected' : ''} ${isHovered ? 'section-hovered' : ''}`}
      style={{
        position: 'relative',
        outline: isSelected
          ? '2px solid #2563EB'
          : isHovered
            ? '1px dashed #93C5FD'
            : 'none',
        transition: 'outline 0.2s ease',
        cursor: isHovered ? 'pointer' : 'default'
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {(isHovered || isSelected) && (
        <SectionActionBar
          section={section}
          index={index}
          schema={schema}
          onUpdate={onUpdate}
          onSelect={onSelect}
          onDragStart={handleDragStart}
        />
      )}

      <SectionRenderer
        section={section}
        builderMode={true}
        prefetchedData={prefetchedData}
        ComponentWrapper={({ component, children }) => (
          <ComponentWrapper
            component={component}
            sectionId={section.id}
            isSelected={selection.componentId === component.id}
            selection={selection}
            schema={schema}
            onSelect={onSelect}
            onUpdate={onUpdate}
          >
            {children}
          </ComponentWrapper>
        )}
      />

      {/* Empty section state — only for component-based sections */}
      {(() => {
        // Section types that are meant to hold components
        const COMPONENT_BASED_SECTIONS = ['HERO', 'RICH_TEXT', 'CALL_TO_ACTION', 'FEATURES', 'TESTIMONIALS', 'GALLERY', 'CUSTOM', 'BANNER'];
        const shouldShowEmptyState = COMPONENT_BASED_SECTIONS.includes(section.type) && (!section.components || section.components.length === 0);
        
        return shouldShowEmptyState && (
          <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed #ccc', margin: '20px' }}>
            <p style={{ color: '#666', marginBottom: '12px' }}>This section has no components.</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                import('./schema.mutations.js').then(({ addComponentToSection }) => {
                  onUpdate(addComponentToSection(schema, section.id, 'TEXT'));
                });
              }}
              style={{ padding: '8px 16px', background: '#2563EB', color: '#fff', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
            >
              + Add Component
            </button>
          </div>
        );
      })()}
    </div>
  );
}
