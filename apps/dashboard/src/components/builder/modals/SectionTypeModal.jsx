import './SectionTypeModal.css';

const SECTION_TYPES = [
  { id: 'HERO',             name: 'Hero',             description: 'Full-width banner with heading, subheading, and CTA button.' },
  { id: 'PRODUCT_GRID',     name: 'Product Grid',     description: 'Responsive grid of products with configurable columns and data source.' },
  { id: 'FEATURED_PRODUCTS',name: 'Featured Products',description: 'Highlight a curated set of products in a clean layout.' },
  { id: 'RICH_TEXT',        name: 'Rich Text',        description: 'Free-form text content area for headings, paragraphs, and lists.' },
  { id: 'CALL_TO_ACTION',   name: 'Call to Action',   description: 'Bold section with a headline and action button to drive conversions.' },
  { id: 'FEATURES',         name: 'Features',         description: 'Showcase key selling points or benefits in a column layout.' },
  { id: 'TESTIMONIALS',     name: 'Testimonials',     description: 'Display customer reviews and social proof.' },
  { id: 'NEWSLETTER',       name: 'Newsletter',       description: 'Email capture section with a headline and subscribe input.' },
  { id: 'GALLERY',          name: 'Gallery',          description: 'Image grid or masonry layout for photos and lookbooks.' },
  { id: 'CUSTOM',           name: 'Blank Section',    description: 'Start with an empty section and add your own components.' },
];

export default function SectionTypeModal({ onSelect, onClose }) {
  return (
    <div className="section-type-modal-overlay" onClick={onClose}>
      <div className="section-type-modal" onClick={e => e.stopPropagation()}>
        <div className="section-type-modal__header">
          <h2 className="section-type-modal__title">Add Section</h2>
          <button className="section-type-modal__close" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="section-type-modal__list">
          {SECTION_TYPES.map(type => (
            <button
              key={type.id}
              className="section-type-row"
              onClick={() => onSelect(type.id)}
            >
              <div className="section-type-row__info">
                <span className="section-type-row__name">{type.name}</span>
                <span className="section-type-row__desc">{type.description}</span>
              </div>
              <svg className="section-type-row__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
