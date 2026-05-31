import { useState } from 'react';

export default function ComponentWrapper({
  component,
  sectionId,
  isSelected,
  schema,
  onSelect,
  onUpdate,
  children
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect({
      sectionId,
      componentId: component.id,
      childId: null
    });
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/x-varanda-component', JSON.stringify({ sectionId, componentId: component.id }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/x-varanda-component'));
      if (data && data.componentId && data.componentId !== component.id) {
        import('./schema.mutations.js').then(({ moveComponent }) => {
          const sectionIndex = schema.sections.findIndex(s => s.id === sectionId);
          if (sectionIndex !== -1) {
            const toIndex = schema.sections[sectionIndex].components.findIndex(c => c.id === component.id);
            if (toIndex !== -1) {
              onUpdate(moveComponent(schema, data.sectionId, data.componentId, sectionId, toIndex));
            }
          }
        });
      }
    } catch {
      // Not a component drop
    }
  };

  return (
    <div
      className={`component-wrapper ${isSelected ? 'component-selected' : ''}`}
      style={{
        position: 'relative',
        outline: isSelected
          ? '2px solid #F59E0B' // Amber outline for components
          : isHovered
            ? '1px dashed #FCD34D'
            : 'none',
        transition: 'outline 0.2s ease',
        cursor: isHovered ? 'pointer' : 'default',
        minHeight: '24px' // ensure it's droppable even if empty
      }}
      onClick={handleClick}
      onMouseEnter={(e) => { e.stopPropagation(); setIsHovered(true); }}
      onMouseLeave={(e) => { e.stopPropagation(); setIsHovered(false); }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {(isHovered || isSelected) && (
        <div
          className="component-action-bar"
          style={{
            position: 'absolute',
            top: '-24px',
            right: '0',
            zIndex: 101,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#F59E0B',
            borderRadius: '4px 4px 0 0',
            padding: '2px 6px'
          }}
          onClick={e => e.stopPropagation()}
        >
          <span style={{ color: '#fff', fontSize: '10px', fontWeight: 600, marginRight: '4px' }}>
            {component.type}
          </span>
          <button 
            className="action-btn" 
            title="Drag to reorder"
            draggable
            onDragStart={handleDragStart}
            style={{ cursor: 'grab', background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', padding: '0 4px' }}
          >
            ⠿
          </button>
          <button 
            className="action-btn" 
            title="Delete component"
            onClick={(e) => {
              e.stopPropagation();
              import('./schema.mutations.js').then(({ deleteComponent }) => {
                onUpdate(deleteComponent(schema, sectionId, component.id));
                if (isSelected) {
                  onSelect({ sectionId, componentId: null, childId: null });
                }
              });
            }}
            style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', padding: '0 4px' }}
          >
            ✕
          </button>
        </div>
      )}
      {children}
    </div>
  );
}
