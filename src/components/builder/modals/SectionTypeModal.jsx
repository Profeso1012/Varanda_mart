import './SectionTypeModal.css';

const SECTION_TYPES = [
  {
    id: 'HERO',
    name: 'Hero',
    description: 'Full-width hero section with image',
    icon: '⭐',
  },
  {
    id: 'PRODUCT_GRID',
    name: 'Product Grid',
    description: 'Showcase products in a grid',
    icon: '📊',
  },
  {
    id: 'TESTIMONIALS',
    name: 'Testimonials',
    description: 'Display customer testimonials',
    icon: '💬',
  },
  {
    id: 'CALL_TO_ACTION',
    name: 'Call to Action',
    description: 'CTA section with button',
    icon: '🎯',
  },
  {
    id: 'FEATURES',
    name: 'Features',
    description: 'Highlight key features',
    icon: '✨',
  },
  {
    id: 'CUSTOM',
    name: 'Blank',
    description: 'Start with a blank section',
    icon: '◻️',
  },
];

export default function SectionTypeModal({ onSelect, onClose }) {
  return (
    <div className="section-type-modal-overlay">
      <div className="section-type-modal">
        <div className="section-type-modal__header">
          <h2 className="section-type-modal__title">Add Section</h2>
          <button
            className="section-type-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="section-type-modal__grid">
          {SECTION_TYPES.map((type) => (
            <button
              key={type.id}
              className="section-type-card"
              onClick={() => onSelect(type.id)}
            >
              <div className="section-type-card__icon">{type.icon}</div>
              <h3 className="section-type-card__name">{type.name}</h3>
              <p className="section-type-card__description">{type.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
