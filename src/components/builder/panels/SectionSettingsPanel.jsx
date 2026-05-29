import { useState } from 'react';
import './SettingsPanels.css';

export default function SectionSettingsPanel({
  section,
  onConfigUpdate,
  onBack,
}) {
  const [showCardStyler, setShowCardStyler] = useState(false);
  const config = section.config || {};

  return (
    <div className="settings-panel">
      <div className="settings-panel__header">
        <button
          className="settings-panel__back-btn"
          onClick={onBack}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h3 className="settings-panel__title">Section Config</h3>
      </div>

      <div className="settings-group">
        <label className="settings-label">Section Title</label>
        <input
          type="text"
          className="settings-input"
          placeholder="Optional section name"
          value={config.title || ''}
          onChange={(e) => onConfigUpdate({ title: e.target.value })}
        />
      </div>

      <div className="settings-group">
        <label className="settings-label">Minimum Height</label>
        <div className="settings-number-group">
          <input
            type="number"
            className="settings-input"
            value={config.minHeight || 400}
            onChange={(e) => onConfigUpdate({ minHeight: parseInt(e.target.value) })}
            min="100"
          />
          <span className="settings-unit">px</span>
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">Background Color</label>
        <div className="color-picker">
          <input
            type="color"
            className="color-picker__input"
            value={config.backgroundColor || '#FFFFFF'}
            onChange={(e) => onConfigUpdate({ backgroundColor: e.target.value })}
          />
          <span className="color-picker__value">
            {config.backgroundColor || '#FFFFFF'}
          </span>
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">Content Alignment</label>
        <div className="alignment-buttons">
          {['LEFT', 'CENTER', 'RIGHT'].map((align) => (
            <button
              key={align}
              className={`alignment-btn ${config.contentAlignment === align ? 'alignment-btn--active' : ''}`}
              onClick={() => onConfigUpdate({ contentAlignment: align })}
            >
              {align[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-divider" />

      <label className="settings-checkbox">
        <input
          type="checkbox"
          checked={config.showSectionTitle || false}
          onChange={(e) => onConfigUpdate({ showSectionTitle: e.target.checked })}
        />
        <span>Show section title</span>
      </label>

      <button
        className="settings-btn settings-btn--primary"
        onClick={() => setShowCardStyler(!showCardStyler)}
      >
        Card Styler
      </button>

      {showCardStyler && (
        <CardStylerPanel config={config} onConfigUpdate={onConfigUpdate} />
      )}
    </div>
  );
}

function CardStylerPanel({ config, onConfigUpdate }) {
  const cardConfig = config.cardConfig || {};

  return (
    <div className="card-styler-panel">
      <h4 className="card-styler__title">Card Styling</h4>

      <div className="settings-group">
        <label className="settings-label">Image Shape</label>
        <div className="shape-buttons">
          {['Square', 'Portrait', 'Circle', 'Rounded'].map((shape) => (
            <button
              key={shape}
              className={`shape-btn ${cardConfig.imageShape === shape ? 'shape-btn--active' : ''}`}
              onClick={() => onConfigUpdate({ cardConfig: { ...cardConfig, imageShape: shape } })}
            >
              {shape}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">Card Background</label>
        <div className="color-picker">
          <input
            type="color"
            className="color-picker__input"
            value={cardConfig.backgroundColor || '#FFFFFF'}
            onChange={(e) =>
              onConfigUpdate({ cardConfig: { ...cardConfig, backgroundColor: e.target.value } })
            }
          />
          <span className="color-picker__value">
            {cardConfig.backgroundColor || '#FFFFFF'}
          </span>
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={cardConfig.showPrice || false}
            onChange={(e) =>
              onConfigUpdate({ cardConfig: { ...cardConfig, showPrice: e.target.checked } })
            }
          />
          <span>Show price</span>
        </label>
      </div>

      <div className="settings-group">
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={cardConfig.showRating || false}
            onChange={(e) =>
              onConfigUpdate({ cardConfig: { ...cardConfig, showRating: e.target.checked } })
            }
          />
          <span>Show rating</span>
        </label>
      </div>

      <div className="settings-group">
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={cardConfig.showAddToCart || false}
            onChange={(e) =>
              onConfigUpdate({ cardConfig: { ...cardConfig, showAddToCart: e.target.checked } })
            }
          />
          <span>Show "Add to Cart" button</span>
        </label>
      </div>
    </div>
  );
}
