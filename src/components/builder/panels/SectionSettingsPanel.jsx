import { useState } from 'react';
import './SettingsPanels.css';

export default function SectionSettingsPanel({
  section,
  onConfigUpdate,
  onBack,
}) {
  const config = section.config || {};
  const minHeight = config.minHeight || 400;
  const borderRadius = config.borderRadius || 0;

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
        <h3 className="settings-panel__title">Hero Section</h3>
      </div>

      <div className="settings-group">
        <label className="settings-label">Layout</label>
        <div className="layout-options">
          <button
            className={`layout-option ${config.layout === 'text-image' ? 'layout-option--active' : ''}`}
            onClick={() => onConfigUpdate({ layout: 'text-image' })}
            title="Text with Image"
          >
            <div className="layout-preview">
              <div className="layout-preview__text"></div>
              <div className="layout-preview__image"></div>
            </div>
            <span>Text</span>
          </button>

          <button
            className={`layout-option ${config.layout === 'text-only' ? 'layout-option--active' : ''}`}
            onClick={() => onConfigUpdate({ layout: 'text-only' })}
            title="Text Only"
          >
            <div className="layout-preview layout-preview--center">
              <div className="layout-preview__text"></div>
            </div>
            <span>Text</span>
          </button>

          <button
            className={`layout-option ${config.layout === 'image-only' ? 'layout-option--active' : ''}`}
            onClick={() => onConfigUpdate({ layout: 'image-only' })}
            title="Image Only"
          >
            <div className="layout-preview">
              <div className="layout-preview__image" style={{ flex: 1 }}></div>
            </div>
            <span>Text Only</span>
          </button>
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">Section Height</label>
        <div className="slider-group">
          <input
            type="range"
            className="slider-input"
            min="400"
            max="800"
            step="50"
            value={minHeight}
            onChange={(e) => onConfigUpdate({ minHeight: parseInt(e.target.value) })}
          />
          <div className="slider-labels">
            <span>400px</span>
            <span>800px</span>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">Background</label>
        <div className="color-picker">
          <input
            type="color"
            className="color-picker__input"
            value={config.backgroundColor || '#E2E8F0'}
            onChange={(e) => onConfigUpdate({ backgroundColor: e.target.value })}
          />
          <span className="color-picker__label">Choose color</span>
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">Alignment</label>
        <div className="alignment-buttons">
          {['L', 'C', 'R'].map((align) => (
            <button
              key={align}
              className={`alignment-btn ${config.contentAlignment === align ? 'alignment-btn--active' : ''}`}
              onClick={() => onConfigUpdate({ contentAlignment: align })}
            >
              {align}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">Label</label>
        <input
          type="text"
          className="settings-input"
          placeholder="Optional label"
          value={config.label || ''}
          onChange={(e) => onConfigUpdate({ label: e.target.value })}
        />
      </div>

      <div className="settings-group">
        <label className="settings-label">Link</label>
        <input
          type="text"
          className="settings-input"
          placeholder="Optional link"
          value={config.link || ''}
          onChange={(e) => onConfigUpdate({ link: e.target.value })}
        />
      </div>

      <div className="settings-group">
        <label className="settings-label">Background Color</label>
        <div className="color-picker">
          <input
            type="color"
            className="color-picker__input"
            value={config.backgroundColor || '#E2E8F0'}
            onChange={(e) => onConfigUpdate({ backgroundColor: e.target.value })}
          />
          <span className="color-picker__label">Choose color</span>
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">Text Color</label>
        <div className="color-picker">
          <input
            type="color"
            className="color-picker__input"
            value={config.textColor || '#1F2A30'}
            onChange={(e) => onConfigUpdate({ textColor: e.target.value })}
          />
          <span className="color-picker__label">Choose color</span>
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">Border Radius</label>
        <div className="slider-group">
          <input
            type="range"
            className="slider-input"
            min="0"
            max="40"
            step="5"
            value={borderRadius}
            onChange={(e) => onConfigUpdate({ borderRadius: parseInt(e.target.value) })}
          />
          <div className="slider-labels">
            <span>0px</span>
            <span>40px</span>
          </div>
        </div>
      </div>
    </div>
  );
}
