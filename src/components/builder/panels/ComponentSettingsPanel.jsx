import './SettingsPanels.css';

export default function ComponentSettingsPanel({
  component,
  onBack,
}) {
  const config = component.config || {};
  const style = config.style || {};

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
        <h3 className="settings-panel__title">
          {component.type} Settings
        </h3>
      </div>

      {component.type === 'TEXT' && (
        <>
          <div className="settings-group">
            <label className="settings-label">Content</label>
            <textarea
              className="settings-textarea"
              value={config.content || ''}
              rows="4"
            />
          </div>

          <div className="settings-group">
            <label className="settings-label">HTML Tag</label>
            <select className="settings-input">
              {['H1', 'H2', 'H3', 'H4', 'P', 'Span'].map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-group">
            <label className="settings-label">Font Size</label>
            <div className="settings-number-group">
              <input
                type="number"
                className="settings-input"
                value={style.fontSize || 16}
                min="8"
              />
              <span className="settings-unit">px</span>
            </div>
          </div>

          <div className="settings-group">
            <label className="settings-label">Font Weight</label>
            <select className="settings-input">
              {['Normal', 'Bold', '500', '600', '700'].map((weight) => (
                <option key={weight} value={weight}>
                  {weight}
                </option>
              ))}
            </select>
          </div>

          <div className="settings-group">
            <label className="settings-label">Color</label>
            <div className="color-picker">
              <input
                type="color"
                className="color-picker__input"
                value={style.color || '#1F2A30'}
              />
              <span className="color-picker__value">
                {style.color || '#1F2A30'}
              </span>
            </div>
          </div>
        </>
      )}

      {component.type === 'BUTTON' && (
        <>
          <div className="settings-group">
            <label className="settings-label">Button Label</label>
            <input
              type="text"
              className="settings-input"
              value={config.label || ''}
            />
          </div>

          <div className="settings-group">
            <label className="settings-label">Link URL</label>
            <input
              type="text"
              className="settings-input"
              placeholder="https://example.com"
              value={config.link || ''}
            />
          </div>

          <div className="settings-group">
            <label className="settings-checkbox">
              <input type="checkbox" defaultChecked={config.openNewTab} />
              <span>Open in new tab</span>
            </label>
          </div>

          <div className="settings-divider" />

          <div className="settings-group">
            <label className="settings-label">Background Color</label>
            <div className="color-picker">
              <input
                type="color"
                className="color-picker__input"
                value={style.backgroundColor || '#22925B'}
              />
            </div>
          </div>

          <div className="settings-group">
            <label className="settings-label">Text Color</label>
            <div className="color-picker">
              <input
                type="color"
                className="color-picker__input"
                value={style.color || '#FFFFFF'}
              />
            </div>
          </div>

          <div className="settings-group">
            <label className="settings-label">Border Radius</label>
            <div className="settings-number-group">
              <input
                type="number"
                className="settings-input"
                value={style.borderRadius || 6}
                min="0"
              />
              <span className="settings-unit">px</span>
            </div>
          </div>

          <div className="settings-group">
            <label className="settings-label">Font Size</label>
            <div className="settings-number-group">
              <input
                type="number"
                className="settings-input"
                value={style.fontSize || 14}
                min="8"
              />
              <span className="settings-unit">px</span>
            </div>
          </div>
        </>
      )}

      {component.type === 'IMAGE' && (
        <>
          <div className="settings-group">
            <label className="settings-label">Image URL</label>
            <input
              type="text"
              className="settings-input"
              value={config.imageSrc || ''}
            />
          </div>

          <div className="settings-group">
            <label className="settings-label">Alt Text</label>
            <input
              type="text"
              className="settings-input"
              placeholder="Image description for accessibility"
              value={config.altText || ''}
            />
          </div>

          <div className="settings-group">
            <label className="settings-label">Border Radius</label>
            <div className="settings-number-group">
              <input
                type="number"
                className="settings-input"
                value={style.borderRadius || 0}
                min="0"
              />
              <span className="settings-unit">px</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
