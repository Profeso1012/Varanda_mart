import { useState } from 'react';
import CardStylerPanel from './CardStylerPanel';
import './SettingsPanels.css';

export default function SectionSettingsPanel({
  section,
  onConfigUpdate,
  onBack,
}) {
  const config = section.config || {};
  const [showCardStyler, setShowCardStyler] = useState(false);

  if (showCardStyler) {
    return (
      <CardStylerPanel
        config={config}
        onConfigUpdate={onConfigUpdate}
        onBack={() => setShowCardStyler(false)}
      />
    );
  }

  return (
    <div className="settings-panel">
      <div className="settings-panel__header">
        <button className="settings-panel__back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h3 className="settings-panel__title">
          {section.type || 'Section'} Settings
        </h3>
      </div>

      {/* Section Title */}
      <div className="settings-group">
        <label className="settings-label">Section Title</label>
        <input
          type="text"
          className="settings-input"
          placeholder="Enter section title"
          value={config.sectionTitle || ''}
          onChange={(e) => onConfigUpdate({ sectionTitle: e.target.value })}
        />
      </div>

      {/* Show Section Title Toggle */}
      <div className="settings-group">
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={config.showSectionTitle !== false}
            onChange={(e) => onConfigUpdate({ showSectionTitle: e.target.checked })}
          />
          <span>Show section title</span>
        </label>
      </div>

      {/* Data Source for Product Grids */}
      {(section.type === 'PRODUCT_GRID' || section.type === 'FEATURED_PRODUCTS') && (
        <>
          <div className="settings-group">
            <label className="settings-label">Data Source</label>
            <div className="radio-group">
              {[
                { value: 'featured', label: 'Featured Products' },
                { value: 'category', label: 'By Category' },
                { value: 'tag', label: 'By Tag' },
                { value: 'manual', label: 'Manual Selection' },
              ].map((option) => (
                <label key={option.value} className="radio-option">
                  <input
                    type="radio"
                    name="dataSource"
                    value={option.value}
                    checked={config.dataSource === option.value}
                    onChange={(e) => onConfigUpdate({ dataSource: e.target.value })}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional Inputs */}
          {config.dataSource === 'category' && (
            <div className="settings-group">
              <label className="settings-label">Category</label>
              <select className="settings-input">
                <option>Select a category</option>
                <option>Electronics</option>
                <option>Fashion</option>
                <option>Home & Garden</option>
              </select>
            </div>
          )}

          {config.dataSource === 'tag' && (
            <div className="settings-group">
              <label className="settings-label">Tag</label>
              <select className="settings-input">
                <option>Select a tag</option>
                <option>New Arrival</option>
                <option>Best Seller</option>
                <option>On Sale</option>
              </select>
            </div>
          )}

          {config.dataSource === 'manual' && (
            <div className="settings-group">
              <label className="settings-label">Search Products</label>
              <input
                type="text"
                className="settings-input"
                placeholder="Search and add products..."
              />
            </div>
          )}

          {/* Number of Products */}
          <div className="settings-group">
            <label className="settings-label">Number of Products</label>
            <div className="stepper-input">
              <button
                className="stepper-btn"
                onClick={() => {
                  const current = config.numProducts || 12;
                  if (current > 1) onConfigUpdate({ numProducts: current - 1 });
                }}
              >
                −
              </button>
              <input
                type="number"
                className="stepper-value"
                value={config.numProducts || 12}
                onChange={(e) => onConfigUpdate({ numProducts: parseInt(e.target.value) || 12 })}
                min="1"
                max="100"
              />
              <button
                className="stepper-btn"
                onClick={() => {
                  const current = config.numProducts || 12;
                  if (current < 100) onConfigUpdate({ numProducts: current + 1 });
                }}
              >
                +
              </button>
            </div>
          </div>

          {/* Columns Layout */}
          <div className="settings-group">
            <label className="settings-label">Columns</label>
            <div className="columns-grid">
              <div className="column-input">
                <label>Desktop</label>
                <input
                  type="number"
                  className="settings-input"
                  value={config.columnsDesktop || 4}
                  onChange={(e) => onConfigUpdate({ columnsDesktop: parseInt(e.target.value) || 4 })}
                  min="1"
                  max="6"
                />
              </div>
              <div className="column-input">
                <label>Tablet</label>
                <input
                  type="number"
                  className="settings-input"
                  value={config.columnsTablet || 3}
                  onChange={(e) => onConfigUpdate({ columnsTablet: parseInt(e.target.value) || 3 })}
                  min="1"
                  max="6"
                />
              </div>
              <div className="column-input">
                <label>Mobile</label>
                <input
                  type="number"
                  className="settings-input"
                  value={config.columnsMobile || 2}
                  onChange={(e) => onConfigUpdate({ columnsMobile: parseInt(e.target.value) || 2 })}
                  min="1"
                  max="6"
                />
              </div>
            </div>
          </div>

          {/* Card Styler Button */}
          <div className="settings-group">
            <button
              className="card-styler-btn"
              onClick={() => setShowCardStyler(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              </svg>
              Card Styling
            </button>
          </div>
        </>
      )}

      {/* General Section Settings */}
      <div className="settings-group">
        <label className="settings-label">Background Color</label>
        <div className="color-picker">
          <input
            type="color"
            className="color-picker__input"
            value={config.backgroundColor || '#FFFFFF'}
            onChange={(e) => onConfigUpdate({ backgroundColor: e.target.value })}
          />
          <span className="color-picker__label">{config.backgroundColor || '#FFFFFF'}</span>
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">Min Height (px)</label>
        <div className="slider-group">
          <input
            type="range"
            className="slider-input"
            min="400"
            max="1000"
            step="50"
            value={config.minHeight || 600}
            onChange={(e) => onConfigUpdate({ minHeight: parseInt(e.target.value) })}
          />
          <div className="slider-value">{config.minHeight || 600}px</div>
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">Padding (px)</label>
        <div className="padding-inputs">
          <div className="padding-input">
            <label>Top</label>
            <input
              type="number"
              className="settings-input"
              value={config.padding?.top || 60}
              onChange={(e) => onConfigUpdate({
                padding: { ...config.padding, top: parseInt(e.target.value) || 0 }
              })}
            />
          </div>
          <div className="padding-input">
            <label>Right</label>
            <input
              type="number"
              className="settings-input"
              value={config.padding?.right || 0}
              onChange={(e) => onConfigUpdate({
                padding: { ...config.padding, right: parseInt(e.target.value) || 0 }
              })}
            />
          </div>
          <div className="padding-input">
            <label>Bottom</label>
            <input
              type="number"
              className="settings-input"
              value={config.padding?.bottom || 60}
              onChange={(e) => onConfigUpdate({
                padding: { ...config.padding, bottom: parseInt(e.target.value) || 0 }
              })}
            />
          </div>
          <div className="padding-input">
            <label>Left</label>
            <input
              type="number"
              className="settings-input"
              value={config.padding?.left || 0}
              onChange={(e) => onConfigUpdate({
                padding: { ...config.padding, left: parseInt(e.target.value) || 0 }
              })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
