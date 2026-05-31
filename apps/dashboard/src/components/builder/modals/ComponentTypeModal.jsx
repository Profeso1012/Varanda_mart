import './ComponentTypeModal.css';

const COMPONENT_TYPES = [
  { id: 'TEXT',         name: 'Text',         description: 'Heading, paragraph, or any text block.' },
  { id: 'BUTTON',       name: 'Button',       description: 'Clickable action button with custom link and style.' },
  { id: 'IMAGE',        name: 'Image',        description: 'Single image with alt text, sizing, and shape options.' },
  { id: 'SPACER',       name: 'Spacer',       description: 'Adds vertical whitespace between components.' },
  { id: 'DIVIDER',      name: 'Divider',      description: 'Horizontal rule to visually separate content.' },
  { id: 'PRODUCT_CARD', name: 'Product Card', description: 'Showcase a single product with price and CTA.' },
];

export default function ComponentTypeModal({ onSelect, onClose }) {
  return (
    <div className="component-type-modal-overlay" onClick={onClose}>
      <div className="component-type-modal" onClick={e => e.stopPropagation()}>
        <div className="component-type-modal__header">
          <h2 className="component-type-modal__title">Add Component</h2>
          <button className="component-type-modal__close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="component-type-modal__list">
          {COMPONENT_TYPES.map(type => (
            <button
              key={type.id}
              className="component-type-row"
              onClick={() => onSelect(type.id)}
            >
              <div className="component-type-row__info">
                <span className="component-type-row__name">{type.name}</span>
                <span className="component-type-row__desc">{type.description}</span>
              </div>
              <svg className="component-type-row__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
