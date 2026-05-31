import { useState } from 'react';
import '../SettingsPanels.css';

const SHAPE_PRESETS = [
  { id: 'rect', label: 'Rectangle', path: 'M 0 0 h 100 v 100 h -100 z' },
  { id: 'rounded', label: 'Rounded', path: 'M 10 0 h 80 a 10 10 0 0 1 10 10 v 80 a 10 10 0 0 1 -10 10 h -80 a 10 10 0 0 1 -10 -10 v -80 a 10 10 0 0 1 10 -10' },
  { id: 'pill', label: 'Pill', path: 'M 0 50 v -40 a 10 10 0 0 1 10 -10 h 80 a 10 10 0 0 1 10 10 v 80 a 10 10 0 0 1 -10 10 h -80 a 10 10 0 0 1 -10 -10 v -40' },
  { id: 'circle', label: 'Circle', path: 'M 50 0 a 50 50 0 1 1 0 100 a 50 50 0 1 1 0 -100' },
];

export default function ButtonComponentPanel({ config, onConfigUpdate }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHoverState, setShowHoverState] = useState(false);

  const style = config.style || {};

  return (
    <div className="component-panel">
      {/* Label */}
      <div className="settings-group">
        <label className="settings-label">Button Label</label>
        <input
          type="text"
          className="settings-input"
          value={config.label || 'Click me'}
          onChange={(e) => onConfigUpdate({ label: e.target.value })}
          placeholder="Button text"
        />
      </div>

      {/* Link URL */}
      <div className="settings-group">
        <label className="settings-label">Link Destination</label>
        <select 
          className="settings-input"
          value={['/', '/products', '/categories', '/cart', '/contact'].includes(config.link) ? config.link : (config.link ? 'custom' : '')}
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'custom') {
              onConfigUpdate({ link: 'https://' });
            } else {
              onConfigUpdate({ link: val });
            }
          }}
        >
          <option value="">Select link destination</option>
          <option value="/">Home Page</option>
          <option value="/products">Products Page</option>
          <option value="/categories">Categories Page</option>
          <option value="/cart">Cart Page</option>
          <option value="/contact">Contact Page</option>
          <option value="custom">Custom URL...</option>
        </select>

        {(!['/', '/products', '/categories', '/cart', '/contact'].includes(config.link) && config.link !== undefined && config.link !== '') && (
          <div style={{ marginTop: '8px' }}>
            <label className="settings-label" style={{ fontSize: '11px', color: '#6B7280' }}>Custom URL</label>
            <input
              type="text"
              className="settings-input"
              value={config.link || ''}
              onChange={(e) => onConfigUpdate({ link: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
        )}
      </div>

      {/* Open in New Tab */}
      <div className="settings-group">
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={config.openInNewTab || false}
            onChange={(e) => onConfigUpdate({ openInNewTab: e.target.checked })}
          />
          <span>Open in new tab</span>
        </label>
      </div>

      {/* Background Color */}
      <div className="settings-group">
        <label className="settings-label">Background Color</label>
        <div className="color-picker">
          <input
            type="color"
            className="color-picker__input"
            value={style.backgroundColor || '#22925B'}
            onChange={(e) => onConfigUpdate({ style: { ...style, backgroundColor: e.target.value } })}
          />
          <span className="color-picker__label">{style.backgroundColor || '#22925B'}</span>
        </div>
      </div>

      {/* Text Color */}
      <div className="settings-group">
        <label className="settings-label">Text Color</label>
        <div className="color-picker">
          <input
            type="color"
            className="color-picker__input"
            value={style.color || '#FFFFFF'}
            onChange={(e) => onConfigUpdate({ style: { ...style, color: e.target.value } })}
          />
          <span className="color-picker__label">{style.color || '#FFFFFF'}</span>
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
            max="50"
            step="2"
            value={style.borderRadius || 6}
            onChange={(e) => onConfigUpdate({ style: { ...style, borderRadius: parseInt(e.target.value) } })}
          />
          <div className="slider-value">{style.borderRadius || 6}px</div>
        </div>
      </div>

      {/* Border Width */}
      <div className="settings-group">
        <label className="settings-label">Border Width (px)</label>
        <input
          type="number"
          className="settings-input"
          value={style.borderWidth || 0}
          onChange={(e) => onConfigUpdate({ style: { ...style, borderWidth: parseInt(e.target.value) || 0 } })}
          min="0"
          max="5"
        />
      </div>

      {/* Border Color */}
      {style.borderWidth > 0 && (
        <div className="settings-group">
          <label className="settings-label">Border Color</label>
          <div className="color-picker">
            <input
              type="color"
              className="color-picker__input"
              value={style.borderColor || '#E5E7EB'}
              onChange={(e) => onConfigUpdate({ style: { ...style, borderColor: e.target.value } })}
            />
            <span className="color-picker__label">{style.borderColor || '#E5E7EB'}</span>
          </div>
        </div>
      )}

      {/* Font Size */}
      <div className="settings-group">
        <label className="settings-label">Font Size (px)</label>
        <div className="stepper-input">
          <button
            className="stepper-btn"
            onClick={() => {
              const current = style.fontSize || 14;
              if (current > 10) onConfigUpdate({ style: { ...style, fontSize: current - 1 } });
            }}
          >
            −
          </button>
          <input
            type="number"
            className="stepper-value"
            value={style.fontSize || 14}
            onChange={(e) => onConfigUpdate({ style: { ...style, fontSize: parseInt(e.target.value) || 14 } })}
            min="10"
            max="32"
          />
          <button
            className="stepper-btn"
            onClick={() => {
              const current = style.fontSize || 14;
              if (current < 32) onConfigUpdate({ style: { ...style, fontSize: current + 1 } });
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
          value={style.fontWeight || '500'}
          onChange={(e) => onConfigUpdate({ style: { ...style, fontWeight: e.target.value } })}
        >
          <option value="400">Regular</option>
          <option value="500">Medium</option>
          <option value="600">Semibold</option>
          <option value="700">Bold</option>
        </select>
      </div>

      {/* Padding */}
      <div className="settings-group">
        <label className="settings-label">Padding (px)</label>
        <div className="padding-inputs">
          <div className="padding-input">
            <label>V</label>
            <input
              type="number"
              className="settings-input"
              value={style.padding?.top || 10}
              onChange={(e) => onConfigUpdate({
                style: {
                  ...style,
                  padding: {
                    ...style.padding,
                    top: parseInt(e.target.value) || 10,
                    bottom: parseInt(e.target.value) || 10,
                  }
                }
              })}
            />
          </div>
          <div className="padding-input">
            <label>H</label>
            <input
              type="number"
              className="settings-input"
              value={style.padding?.right || 20}
              onChange={(e) => onConfigUpdate({
                style: {
                  ...style,
                  padding: {
                    ...style.padding,
                    right: parseInt(e.target.value) || 20,
                    left: parseInt(e.target.value) || 20,
                  }
                }
              })}
            />
          </div>
          <button className="link-all-btn" title="Link all">⛓</button>
        </div>
      </div>

      {/* Shape Presets */}
      <div className="settings-group">
        <label className="settings-label">Shape Presets</label>
        <div className="shape-presets-grid">
          {SHAPE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`shape-preset ${config.shape === preset.id ? 'shape-preset--active' : ''}`}
              onClick={() => onConfigUpdate({ shape: preset.id })}
              title={preset.label}
            >
              <svg width="40" height="40" viewBox="0 0 100 100">
                <path d={preset.path} fill="currentColor" />
              </svg>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Advanced */}
      <div className="settings-group">
        <button
          className="responsive-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points={showAdvanced ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
          </svg>
          Advanced
        </button>
        {showAdvanced && (
          <div className="responsive-settings">
            <div className="settings-group">
              <label className="settings-label">Custom Clip Path</label>
              <textarea
                className="settings-textarea"
                value={config.clipPath || ''}
                onChange={(e) => onConfigUpdate({ clipPath: e.target.value })}
                placeholder="polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"
                rows="3"
              />
            </div>
          </div>
        )}
      </div>

      {/* Hover State */}
      <div className="settings-group">
        <button
          className="responsive-toggle"
          onClick={() => setShowHoverState(!showHoverState)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points={showHoverState ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
          </svg>
          Hover State
        </button>
        {showHoverState && (
          <div className="responsive-settings">
            <div className="settings-group">
              <label className="settings-label">Hover Background Color</label>
              <div className="color-picker">
                <input
                  type="color"
                  className="color-picker__input"
                  value={config.hoverStyle?.backgroundColor || '#1B6B38'}
                  onChange={(e) => {
                    const newConfig = { ...config };
                    newConfig.hoverStyle = newConfig.hoverStyle || {};
                    newConfig.hoverStyle.backgroundColor = e.target.value;
                    onConfigUpdate(newConfig);
                  }}
                />
                <span className="color-picker__label">{config.hoverStyle?.backgroundColor || '#1B6B38'}</span>
              </div>
            </div>

            <div className="settings-group">
              <label className="settings-label">Hover Text Color</label>
              <div className="color-picker">
                <input
                  type="color"
                  className="color-picker__input"
                  value={config.hoverStyle?.color || '#FFFFFF'}
                  onChange={(e) => {
                    const newConfig = { ...config };
                    newConfig.hoverStyle = newConfig.hoverStyle || {};
                    newConfig.hoverStyle.color = e.target.value;
                    onConfigUpdate(newConfig);
                  }}
                />
                <span className="color-picker__label">{config.hoverStyle?.color || '#FFFFFF'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
