import '../SettingsPanels.css';

export default function SpacerComponentPanel({ config, onConfigUpdate }) {
  return (
    <div className="component-panel">
      <div className="settings-group">
        <label className="settings-label">Height (px)</label>
        <div className="stepper-input">
          <button
            className="stepper-btn"
            onClick={() => {
              const current = config.height || 24;
              if (current > 0) onConfigUpdate({ height: current - 4 });
            }}
          >
            −
          </button>
          <input
            type="number"
            className="stepper-value"
            value={config.height || 24}
            onChange={(e) => onConfigUpdate({ height: parseInt(e.target.value) || 24 })}
            min="0"
            max="500"
          />
          <button
            className="stepper-btn"
            onClick={() => {
              const current = config.height || 24;
              if (current < 500) onConfigUpdate({ height: current + 4 });
            }}
          >
            +
          </button>
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">Preset Sizes</label>
        <div className="preset-sizes">
          {[8, 16, 24, 32, 48, 64].map((size) => (
            <button
              key={size}
              className={`preset-btn ${config.height === size ? 'preset-btn--active' : ''}`}
              onClick={() => onConfigUpdate({ height: size })}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>

      <div className="settings-hint">
        This component creates vertical spacing between other elements.
      </div>
    </div>
  );
}
