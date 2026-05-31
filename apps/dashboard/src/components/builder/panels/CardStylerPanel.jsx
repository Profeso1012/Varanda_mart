import './SettingsPanels.css';

const IMAGE_SHAPES = [
  { id: 'square', label: 'Square', icon: '■' },
  { id: 'portrait', label: 'Portrait', icon: '▌' },
  { id: 'circle', label: 'Circle', icon: '●' },
  { id: 'rounded', label: 'Rounded', icon: '◐' },
];

const IMAGE_POSITIONS = [
  { id: 'top', label: 'Top' },
  { id: 'left', label: 'Left' },
  { id: 'overlay', label: 'Overlay' },
];

export default function CardStylerPanel({ config, onConfigUpdate, onBack }) {
  const cardStyle = config.cardStyle || {};

  return (
    <div className="settings-panel">
      <div className="settings-panel__header">
        <button className="settings-panel__back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h3 className="settings-panel__title">Card Styling</h3>
      </div>

      {/* Live Preview */}
      <div className="settings-group">
        <label className="settings-label">Preview</label>
        <div className="card-preview">
          <div
            className="card-preview__card"
            style={{
              backgroundColor: cardStyle.backgroundColor || '#FFFFFF',
              borderRadius: `${cardStyle.borderRadius || 8}px`,
              boxShadow: cardStyle.boxShadow
                ? `0 ${cardStyle.boxShadow === 'sm' ? 1 : cardStyle.boxShadow === 'md' ? 4 : 8}px ${cardStyle.boxShadow === 'sm' ? 2 : cardStyle.boxShadow === 'md' ? 6 : 12}px rgba(0,0,0,0.1)`
                : 'none',
            }}
          >
            <div className="card-preview__image">
              <div style={{ background: '#E5E7EB', width: '100%', height: '160px', borderRadius: `${cardStyle.borderRadius || 8}px 8px 0 0` }} />
            </div>
            <div className="card-preview__content">
              <h4 style={{ fontSize: '14px', fontWeight: '500', margin: '8px 0 4px' }}>Sample Product</h4>
              <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 8px' }}>$29.99</p>
              <button style={{
                padding: '6px 12px',
                backgroundColor: cardStyle.buttonBackground || '#22925B',
                color: cardStyle.buttonText || '#FFFFFF',
                border: 'none',
                borderRadius: `${cardStyle.buttonBorderRadius || 4}px`,
                fontSize: '12px',
                cursor: 'pointer',
              }}>
                {cardStyle.buttonLabel || 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Shape */}
      <div className="settings-group">
        <label className="settings-label">Image Shape</label>
        <div className="shape-grid">
          {IMAGE_SHAPES.map((shape) => (
            <button
              key={shape.id}
              className={`shape-btn ${cardStyle.imageShape === shape.id ? 'shape-btn--active' : ''}`}
              onClick={() => onConfigUpdate({ cardStyle: { ...cardStyle, imageShape: shape.id } })}
              title={shape.label}
            >
              <span className="shape-icon">{shape.icon}</span>
              <span className="shape-label">{shape.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Image Position */}
      <div className="settings-group">
        <label className="settings-label">Image Position</label>
        <div className="position-grid">
          {IMAGE_POSITIONS.map((pos) => (
            <button
              key={pos.id}
              className={`position-btn ${cardStyle.imagePosition === pos.id ? 'position-btn--active' : ''}`}
              onClick={() => onConfigUpdate({ cardStyle: { ...cardStyle, imagePosition: pos.id } })}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card Background Color */}
      <div className="settings-group">
        <label className="settings-label">Card Background</label>
        <div className="color-picker">
          <input
            type="color"
            className="color-picker__input"
            value={cardStyle.backgroundColor || '#FFFFFF'}
            onChange={(e) => onConfigUpdate({ cardStyle: { ...cardStyle, backgroundColor: e.target.value } })}
          />
          <span className="color-picker__label">{cardStyle.backgroundColor || '#FFFFFF'}</span>
        </div>
      </div>

      {/* Border Radius */}
      <div className="settings-group">
        <label className="settings-label">Border Radius (px)</label>
        <div className="slider-group">
          <input
            type="range"
            className="slider-input"
            min="0"
            max="20"
            step="2"
            value={cardStyle.borderRadius || 8}
            onChange={(e) => onConfigUpdate({ cardStyle: { ...cardStyle, borderRadius: parseInt(e.target.value) } })}
          />
          <div className="slider-value">{cardStyle.borderRadius || 8}px</div>
        </div>
      </div>

      {/* Shadow */}
      <div className="settings-group">
        <label className="settings-label">Shadow</label>
        <div className="shadow-options">
          {[
            { value: 'none', label: 'None' },
            { value: 'sm', label: 'Small' },
            { value: 'md', label: 'Medium' },
            { value: 'lg', label: 'Large' },
          ].map((option) => (
            <button
              key={option.value}
              className={`shadow-btn ${cardStyle.boxShadow === option.value ? 'shadow-btn--active' : ''}`}
              onClick={() => onConfigUpdate({ cardStyle: { ...cardStyle, boxShadow: option.value } })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Show Price */}
      <div className="settings-group">
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={cardStyle.showPrice !== false}
            onChange={(e) => onConfigUpdate({ cardStyle: { ...cardStyle, showPrice: e.target.checked } })}
          />
          <span>Show Price</span>
        </label>
      </div>

      {/* Show Compare At Price */}
      <div className="settings-group">
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={cardStyle.showCompareAt || false}
            onChange={(e) => onConfigUpdate({ cardStyle: { ...cardStyle, showCompareAt: e.target.checked } })}
          />
          <span>Show Compare-at Price</span>
        </label>
      </div>

      {/* Show Rating */}
      <div className="settings-group">
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={cardStyle.showRating || false}
            onChange={(e) => onConfigUpdate({ cardStyle: { ...cardStyle, showRating: e.target.checked } })}
          />
          <span>Show Rating</span>
        </label>
      </div>

      {/* Show Add to Cart */}
      <div className="settings-group">
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={cardStyle.showAddToCart !== false}
            onChange={(e) => onConfigUpdate({ cardStyle: { ...cardStyle, showAddToCart: e.target.checked } })}
          />
          <span>Show Add to Cart Button</span>
        </label>
      </div>

      {/* Button Style (if Add to Cart is shown) */}
      {cardStyle.showAddToCart !== false && (
        <>
          <div className="settings-group">
            <label className="settings-label">Button Label</label>
            <input
              type="text"
              className="settings-input"
              value={cardStyle.buttonLabel || 'Add to Cart'}
              onChange={(e) => onConfigUpdate({ cardStyle: { ...cardStyle, buttonLabel: e.target.value } })}
            />
          </div>

          <div className="settings-group">
            <label className="settings-label">Button Background</label>
            <div className="color-picker">
              <input
                type="color"
                className="color-picker__input"
                value={cardStyle.buttonBackground || '#22925B'}
                onChange={(e) => onConfigUpdate({ cardStyle: { ...cardStyle, buttonBackground: e.target.value } })}
              />
              <span className="color-picker__label">{cardStyle.buttonBackground || '#22925B'}</span>
            </div>
          </div>

          <div className="settings-group">
            <label className="settings-label">Button Text Color</label>
            <div className="color-picker">
              <input
                type="color"
                className="color-picker__input"
                value={cardStyle.buttonText || '#FFFFFF'}
                onChange={(e) => onConfigUpdate({ cardStyle: { ...cardStyle, buttonText: e.target.value } })}
              />
              <span className="color-picker__label">{cardStyle.buttonText || '#FFFFFF'}</span>
            </div>
          </div>

          <div className="settings-group">
            <label className="settings-label">Button Border Radius (px)</label>
            <div className="slider-group">
              <input
                type="range"
                className="slider-input"
                min="0"
                max="20"
                step="2"
                value={cardStyle.buttonBorderRadius || 4}
                onChange={(e) => onConfigUpdate({ cardStyle: { ...cardStyle, buttonBorderRadius: parseInt(e.target.value) } })}
              />
              <div className="slider-value">{cardStyle.buttonBorderRadius || 4}px</div>
            </div>
          </div>
        </>
      )}

      {/* Text Alignment */}
      <div className="settings-group">
        <label className="settings-label">Text Alignment</label>
        <div className="alignment-buttons">
          {[
            { value: 'left', label: 'Left', icon: '⬅' },
            { value: 'center', label: 'Center', icon: '⬍' },
            { value: 'right', label: 'Right', icon: '➡' },
          ].map((align) => (
            <button
              key={align.value}
              className={`alignment-btn ${cardStyle.textAlignment === align.value ? 'alignment-btn--active' : ''}`}
              onClick={() => onConfigUpdate({ cardStyle: { ...cardStyle, textAlignment: align.value } })}
              title={align.label}
            >
              {align.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Hover Effect */}
      <div className="settings-group">
        <label className="settings-label">Hover Effect</label>
        <div className="hover-effects">
          {[
            { value: 'none', label: 'None' },
            { value: 'lift', label: 'Lift' },
            { value: 'shadow', label: 'Shadow' },
            { value: 'scale', label: 'Scale' },
          ].map((effect) => (
            <button
              key={effect.value}
              className={`effect-btn ${cardStyle.hoverEffect === effect.value ? 'effect-btn--active' : ''}`}
              onClick={() => onConfigUpdate({ cardStyle: { ...cardStyle, hoverEffect: effect.value } })}
            >
              {effect.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
