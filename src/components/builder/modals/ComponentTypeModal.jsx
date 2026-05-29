import './ComponentTypeModal.css';

const COMPONENT_TYPES = [
  {
    id: 'TEXT',
    name: 'Text',
    description: 'Heading, paragraph, or custom text',
    icon: '📝',
  },
  {
    id: 'BUTTON',
    name: 'Button',
    description: 'Clickable action button',
    icon: '🔘',
  },
  {
    id: 'IMAGE',
    name: 'Image',
    description: 'Single image with optional caption',
    icon: '🖼️',
  },
  {
    id: 'PRODUCT_CARD',
    name: 'Product Card',
    description: 'Showcase a single product',
    icon: '🛍️',
  },
  {
    id: 'SPACER',
    name: 'Spacer',
    description: 'Add vertical spacing',
    icon: '📏',
  },
  {
    id: 'DIVIDER',
    name: 'Divider',
    description: 'Horizontal line separator',
    icon: '━',
  },
];

export default function ComponentTypeModal({ onSelect, onClose }) {
  return (
    <div className="component-type-modal-overlay">
      <div className="component-type-modal">
        <div className="component-type-modal__header">
          <h2 className="component-type-modal__title">Add Component</h2>
          <button
            className="component-type-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="component-type-modal__grid">
          {COMPONENT_TYPES.map((type) => (
            <button
              key={type.id}
              className="component-type-card"
              onClick={() => onSelect(type.id)}
            >
              <div className="component-type-card__icon">{type.icon}</div>
              <h3 className="component-type-card__name">{type.name}</h3>
              <p className="component-type-card__description">{type.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
