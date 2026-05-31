import { useState } from 'react';
import '../SettingsPanels.css';

const FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Playfair Display',
  'Lora',
  'Montserrat',
];

const HTML_TAGS = ['H1', 'H2', 'H3', 'H4', 'P', 'Span'];
const FONT_WEIGHTS = ['300', '400', '500', '600', '700', '800'];

export default function TextComponentPanel({ config, onConfigUpdate }) {
  const [showMobileStyles, setShowMobileStyles] = useState(false);
  const [showTabletStyles, setShowTabletStyles] = useState(false);

  const style = config.style || {};

  return (
    <div className="component-panel">
      {/* Content */}
      <div className="settings-group">
        <label className="settings-label">Content</label>
        <textarea
          className="settings-textarea"
          value={config.content || ''}
          onChange={(e) => onConfigUpdate({ content: e.target.value })}
          placeholder="Enter text content..."
          rows="4"
        />
      </div>

      {/* HTML Tag */}
      <div className="settings-group">
        <label className="settings-label">HTML Tag</label>
        <select
          className="settings-input"
          value={config.tag || 'p'}
          onChange={(e) => onConfigUpdate({ tag: e.target.value })}
        >
          {HTML_TAGS.map((tag) => (
            <option key={tag} value={tag.toLowerCase()}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {/* Font Family */}
      <div className="settings-group">
        <label className="settings-label">Font Family</label>
        <select
          className="settings-input"
          value={style.fontFamily || 'Inter'}
          onChange={(e) => onConfigUpdate({
            style: { ...style, fontFamily: e.target.value }
          })}
        >
          {FONT_FAMILIES.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div className="settings-group">
        <label className="settings-label">Font Size (px)</label>
        <div className="stepper-input">
          <button
            className="stepper-btn"
            onClick={() => {
              const current = style.fontSize || 16;
              if (current > 8) onConfigUpdate({ style: { ...style, fontSize: current - 1 } });
            }}
          >
            −
          </button>
          <input
            type="number"
            className="stepper-value"
            value={style.fontSize || 16}
            onChange={(e) => onConfigUpdate({ style: { ...style, fontSize: parseInt(e.target.value) || 16 } })}
            min="8"
            max="72"
          />
          <button
            className="stepper-btn"
            onClick={() => {
              const current = style.fontSize || 16;
              if (current < 72) onConfigUpdate({ style: { ...style, fontSize: current + 1 } });
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Font Weight */}
      <div className="settings-group">
        <label className="settings-label">Font Weight</label>
        <select
          className="settings-input"
          value={style.fontWeight || '400'}
          onChange={(e) => onConfigUpdate({ style: { ...style, fontWeight: e.target.value } })}
        >
          {FONT_WEIGHTS.map((weight) => (
            <option key={weight} value={weight}>
              {weight}
            </option>
          ))}
        </select>
      </div>

      {/* Color */}
      <div className="settings-group">
        <label className="settings-label">Color</label>
        <div className="color-picker">
          <input
            type="color"
            className="color-picker__input"
            value={style.color || '#4F507F'}
            onChange={(e) => onConfigUpdate({ style: { ...style, color: e.target.value } })}
          />
          <span className="color-picker__label">{style.color || '#4F507F'}</span>
        </div>
      </div>

      {/* Text Alignment */}
      <div className="settings-group">
        <label className="settings-label">Text Alignment</label>
        <div className="alignment-buttons">
          {[
            { value: 'left', label: '⬅' },
            { value: 'center', label: '⬍' },
            { value: 'right', label: '➡' },
            { value: 'justify', label: '☰' },
          ].map((align) => (
            <button
              key={align.value}
              className={`alignment-btn ${style.textAlign === align.value ? 'alignment-btn--active' : ''}`}
              onClick={() => onConfigUpdate({ style: { ...style, textAlign: align.value } })}
              title={align.value}
            >
              {align.label}
            </button>
          ))}
        </div>
      </div>

      {/* Line Height */}
      <div className="settings-group">
        <label className="settings-label">Line Height</label>
        <div className="slider-group">
          <input
            type="range"
            className="slider-input"
            min="1"
            max="2.5"
            step="0.1"
            value={style.lineHeight || 1.5}
            onChange={(e) => onConfigUpdate({ style: { ...style, lineHeight: parseFloat(e.target.value) } })}
          />
          <div className="slider-value">{(style.lineHeight || 1.5).toFixed(1)}</div>
        </div>
      </div>

      {/* Letter Spacing */}
      <div className="settings-group">
        <label className="settings-label">Letter Spacing (px)</label>
        <div className="slider-group">
          <input
            type="range"
            className="slider-input"
            min="-2"
            max="4"
            step="0.5"
            value={style.letterSpacing || 0}
            onChange={(e) => onConfigUpdate({ style: { ...style, letterSpacing: parseFloat(e.target.value) } })}
          />
          <div className="slider-value">{(style.letterSpacing || 0).toFixed(1)}px</div>
        </div>
      </div>

      {/* Max Width */}
      <div className="settings-group">
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={style.maxWidth !== 'auto'}
            onChange={(e) => {
              if (e.target.checked) {
                onConfigUpdate({ style: { ...style, maxWidth: '600px' } });
              } else {
                onConfigUpdate({ style: { ...style, maxWidth: 'auto' } });
              }
            }}
          />
          <span>Set Max Width</span>
        </label>
      </div>

      {style.maxWidth !== 'auto' && (
        <div className="settings-group">
          <input
            type="text"
            className="settings-input"
            value={style.maxWidth || '600px'}
            onChange={(e) => onConfigUpdate({ style: { ...style, maxWidth: e.target.value } })}
            placeholder="e.g., 600px, 100%"
          />
        </div>
      )}

      {/* Mobile Styles */}
      <div className="settings-group">
        <button
          className="responsive-toggle"
          onClick={() => setShowMobileStyles(!showMobileStyles)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points={showMobileStyles ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
          </svg>
          Mobile Styles
        </button>
        {showMobileStyles && (
          <div className="responsive-settings">
            <p className="responsive-hint">Overrides for mobile devices</p>
            {/* Mobile-specific overrides would go here */}
            <div className="settings-group">
              <label className="settings-label">Font Size (Mobile)</label>
              <input
                type="number"
                className="settings-input"
                value={config.responsiveStyle?.mobile?.fontSize || style.fontSize || 16}
                onChange={(e) => {
                  const newConfig = { ...config };
                  newConfig.responsiveStyle = newConfig.responsiveStyle || {};
                  newConfig.responsiveStyle.mobile = newConfig.responsiveStyle.mobile || {};
                  newConfig.responsiveStyle.mobile.fontSize = parseInt(e.target.value);
                  onConfigUpdate(newConfig);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tablet Styles */}
      <div className="settings-group">
        <button
          className="responsive-toggle"
          onClick={() => setShowTabletStyles(!showTabletStyles)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points={showTabletStyles ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
          </svg>
          Tablet Styles
        </button>
        {showTabletStyles && (
          <div className="responsive-settings">
            <p className="responsive-hint">Overrides for tablet devices</p>
            {/* Tablet-specific overrides would go here */}
            <div className="settings-group">
              <label className="settings-label">Font Size (Tablet)</label>
              <input
                type="number"
                className="settings-input"
                value={config.responsiveStyle?.tablet?.fontSize || style.fontSize || 16}
                onChange={(e) => {
                  const newConfig = { ...config };
                  newConfig.responsiveStyle = newConfig.responsiveStyle || {};
                  newConfig.responsiveStyle.tablet = newConfig.responsiveStyle.tablet || {};
                  newConfig.responsiveStyle.tablet.fontSize = parseInt(e.target.value);
                  onConfigUpdate(newConfig);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
