import React, { useState } from 'react';
import ComponentTypeModal from './modals/ComponentTypeModal';

export default function SectionActionBar({ section, index, schema, onUpdate, onSelect, onDragStart }) {
  const [showAddComponent, setShowAddComponent] = useState(false);

  const handleMoveUp = async (e) => {
    e.stopPropagation();
    if (index === 0) return;
    const { moveSection } = await import('./schema.mutations.js');
    onUpdate(moveSection(schema, index, index - 1));
  };

  const handleMoveDown = async (e) => {
    e.stopPropagation();
    if (index === schema.sections.length - 1) return;
    const { moveSection } = await import('./schema.mutations.js');
    onUpdate(moveSection(schema, index, index + 1));
  };

  const handleDuplicate = async (e) => {
    e.stopPropagation();
    const { duplicateSection } = await import('./schema.mutations.js');
    onUpdate(duplicateSection(schema, section.id));
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this section?')) return;
    const { deleteSection } = await import('./schema.mutations.js');
    onUpdate(deleteSection(schema, section.id));
    onSelect({ sectionId: null, componentId: null, childId: null });
  };

  const handleAddComponent = async (componentType) => {
    const { addComponentToSection } = await import('./schema.mutations.js');
    onUpdate(addComponentToSection(schema, section.id, componentType));
    setShowAddComponent(false);
  };

  const btnStyle = {
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '13px',
    padding: '2px 6px',
    borderRadius: '3px',
    transition: 'background 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  };

  return (
    <>
      <div
        className="section-action-bar"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          backgroundColor: '#2563EB',
          borderRadius: '0 0 8px 8px',
          padding: '4px 10px',
          boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
          whiteSpace: 'nowrap',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Section type label */}
        <span style={{ color: '#fff', fontSize: '11px', fontWeight: 700, marginRight: '6px', letterSpacing: '0.5px', opacity: 0.9 }}>
          {section.type}
        </span>

        {/* Drag handle */}
        <button
          title="Drag to reorder"
          draggable
          onDragStart={onDragStart}
          style={{ ...btnStyle, cursor: 'grab' }}
        >
          ⠿
        </button>

        {/* Move up */}
        <button onClick={handleMoveUp} title="Move up" disabled={index === 0}
          style={{ ...btnStyle, opacity: index === 0 ? 0.4 : 1, cursor: index === 0 ? 'not-allowed' : 'pointer' }}>
          ↑
        </button>

        {/* Move down */}
        <button onClick={handleMoveDown} title="Move down" disabled={index === schema.sections.length - 1}
          style={{ ...btnStyle, opacity: index === schema.sections.length - 1 ? 0.4 : 1, cursor: index === schema.sections.length - 1 ? 'not-allowed' : 'pointer' }}>
          ↓
        </button>

        {/* Duplicate */}
        <button onClick={handleDuplicate} title="Duplicate section" style={btnStyle}>⧉</button>

        {/* Add component */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowAddComponent(true); }}
          title="Add component"
          style={{ ...btnStyle, background: 'rgba(255,255,255,0.15)', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', fontWeight: 600 }}
        >
          + Component
        </button>

        {/* Delete */}
        <button onClick={handleDelete} title="Delete section"
          style={{ ...btnStyle, color: '#FCA5A5' }}>
          ✕
        </button>
      </div>

      {showAddComponent && (
        <ComponentTypeModal
          onSelect={handleAddComponent}
          onClose={() => setShowAddComponent(false)}
        />
      )}
    </>
  );
}
