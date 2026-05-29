import { useState } from 'react';
import CanvasRenderer from './CanvasRenderer';
import SectionActionBar from './SectionActionBar';
import ComponentTypeModal from './modals/ComponentTypeModal';
import './BuilderCanvas.css';

const DEVICE_WIDTHS = {
  Desktop: '100%',
  Tablet: '768px',
  Mobile: '375px',
};

export default function BuilderCanvas({
  schema,
  selectedSectionId,
  selectedComponentId,
  device,
  onSectionSelect,
  onComponentSelect,
  onAddSection,
  onDeleteSection,
  onDeleteComponent,
  onAddComponent,
  onDuplicateSection,
  onMoveSectionUp,
  onMoveSectionDown,
}) {
  const [hoveredSectionId, setHoveredSectionId] = useState(null);
  const [insertPosition, setInsertPosition] = useState(null);
  const [showComponentTypeModal, setShowComponentTypeModal] = useState(false);
  const [pendingComponentSectionId, setPendingComponentSectionId] = useState(null);

  const sections = schema?.sections || [];

  const handleAddComponentClick = (sectionId) => {
    setPendingComponentSectionId(sectionId);
    setShowComponentTypeModal(true);
  };

  const handleComponentTypeSelect = (componentType) => {
    if (pendingComponentSectionId) {
      onAddComponent(pendingComponentSectionId, componentType);
      setShowComponentTypeModal(false);
      setPendingComponentSectionId(null);
    }
  };

  const getSelectedSectionIndex = () => {
    return sections.findIndex(s => s.id === selectedSectionId);
  };

  return (
    <div className="builder-canvas">
      <div
        className="builder-canvas__viewport"
        style={{ '--canvas-width': DEVICE_WIDTHS[device] }}
      >
        <div className="builder-canvas__stage">
          {sections.length === 0 ? (
            <div className="builder-canvas__empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <path d="M9 11h6M9 15h6" />
              </svg>
              <p>No sections yet. Add one to get started.</p>
              <button
                className="builder-canvas__empty-btn"
                onClick={() => onAddSection('bottom')}
              >
                + Add Section
              </button>
            </div>
          ) : (
            <>
              {/* Top insertion point */}
              <div className="section-insertion-point">
                <button
                  className="section-insertion-point__btn"
                  onClick={() => onAddSection('top')}
                >
                  + Add Section
                </button>
              </div>

              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  className={`canvas-section ${
                    selectedSectionId === section.id ? 'canvas-section--selected' : ''
                  } ${hoveredSectionId === section.id ? 'canvas-section--hovered' : ''}`}
                  onMouseEnter={() => setHoveredSectionId(section.id)}
                  onMouseLeave={() => setHoveredSectionId(null)}
                  onClick={() => onSectionSelect(section.id)}
                >
                  {(hoveredSectionId === section.id || selectedSectionId === section.id) && (
                    <SectionActionBar
                      section={section}
                      onDelete={() => onDeleteSection(section.id)}
                      onDuplicate={() => onDuplicateSection ? onDuplicateSection(section.id, idx) : null}
                      onMoveUp={() => onMoveSectionUp ? onMoveSectionUp(section.id, idx) : null}
                      onMoveDown={() => onMoveSectionDown ? onMoveSectionDown(section.id, idx) : null}
                      canMoveUp={idx > 0}
                      canMoveDown={idx < sections.length - 1}
                    />
                  )}

                  <CanvasRenderer
                    section={section}
                    selectedComponentId={selectedComponentId}
                    onComponentSelect={onComponentSelect}
                    onAddComponent={() => handleAddComponentClick(section.id)}
                    onDeleteComponent={(componentId) =>
                      onDeleteComponent(section.id, componentId)
                    }
                  />
                </div>
              ))}

              {/* Bottom insertion point */}
              <div className="section-insertion-point">
                <button
                  className="section-insertion-point__btn"
                  onClick={() => onAddSection('bottom')}
                >
                  + Add Section
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showComponentTypeModal && (
        <ComponentTypeModal
          onSelect={handleComponentTypeSelect}
          onClose={() => {
            setShowComponentTypeModal(false);
            setPendingComponentSectionId(null);
          }}
        />
      )}
    </div>
  );
}
