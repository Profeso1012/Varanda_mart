import '../SettingsPanels.css';

const LINE_STYLES = ['Solid', 'Dashed', 'Dotted', 'Double'];

export default function DividerComponentPanel({ config, onConfigUpdate }) {
  const style = config.style || {};

  return (
    <div className="component-panel">
      {/* Line Color */}
      <div className="settings-group">
        <label className="settings-label">Color</label>
        <div className="color-picker">
          <input
            type="color"
            className="color-picker__input"
            value={style.color || '#E5E7EB'}
            onChange={(e) => onConfigUpdate({
              style: { ...style, color: e.target.value }
            })}
          />
          <span className="color-picker__label">{style.color || '#E5E7EB'}</span>
        </div>
      </div>

      {/* Line Width */}
      <div className="settings-group">
        <label className="settings-label">Width (px)</label>
        <div className="stepper-input">
          <button
            className="stepper-btn"
            onClick={() => {
              const current = style.width || 1;
              if (current > 1) onConfigUpdate({ style: { ...style, width: current - 1 } });
            }}
          >
            −
          </button>
          <input
            type="number"
            className="stepper-value"
            value={style.width || 1}
            onChange={(e) => onConfigUpdate({
              style: { ...style, width: parseInt(e.target.value) || 1 }
            })}
            min="1"
            max="10"
          />
          <button
            className="stepper-btn"
            onClick={() => {
              const current = style.width || 1;
              if (current < 10) onConfigUpdate({ style: { ...style, width: current + 1 } });
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Line Style */}
      <div className="settings-group">
        <label className="settings-label">Style</label>
        <div className="line-style-options">
          {LINE_STYLES.map((lineStyle) => (
            <button
              key={lineStyle}
              className={`line-style-btn ${style.borderStyle === lineStyle.toLowerCase() ? 'line-style-btn--active' : ''}`}
              onClick={() => onConfigUpdate({
                style: { ...style, borderStyle: lineStyle.toLowerCase() }
              })}
            >
              {lineStyle}
            </button>
          ))}
        </div>
      </div>

      {/* Margin */}
      <div className="settings-group">
        <label className="settings-label">Vertical Margin (px)</label>
        <div className="stepper-input">
          <button
            className="stepper-btn"
            onClick={() => {
              const current = style.margin || 16;
              if (current > 0) onConfigUpdate({ style: { ...style, margin: current - 4 } });
            }}
          >
            −
          </button>
          <input
            type="number"
            className="stepper-value"
            value={style.margin || 16}
            onChange={(e) => onConfigUpdate({
              style: { ...style, margin: parseInt(e.target.value) || 16 }
            })}
            min="0"
            max="100"
          />
          <button
            className="stepper-btn"
            onClick={() => {
              const current = style.margin || 16;
              if (current < 100) onConfigUpdate({ style: { ...style, margin: current + 4 } });
            }}
          >
            +
          </button>
        </div>
      </div>

      <div className="settings-hint">
        This component creates a horizontal dividing line.
      </div>
    </div>
  );
}
