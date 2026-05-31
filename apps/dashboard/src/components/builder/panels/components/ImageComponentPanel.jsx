import { useState } from 'react';
import { useCloudinaryUpload } from '../../../../hooks/useCloudinaryUpload';
import '../SettingsPanels.css';

const SHAPE_OPTIONS = [
  { id: 'normal', label: 'Rectangle' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'circle', label: 'Circle' },
  { id: 'custom', label: 'Custom' },
];

const OBJECT_FIT_OPTIONS = ['Contain', 'Cover', 'Fill', 'Scale-down'];

export default function ImageComponentPanel({ config, onConfigUpdate }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPosition, setShowPosition] = useState(config.position === 'overlap');
  const { upload, uploading } = useCloudinaryUpload();

  const handleImageUpload = async (file) => {
    if (!file) return;
    try {
      const { url } = await upload(file, 'builder');
      onConfigUpdate({ imageSrc: url });
    } catch (err) {
      console.error('Failed to upload image', err);
      alert('Failed to upload image. Please try again.');
    }
  };

  return (
    <div className="component-panel">
      {/* Current Image */}
      <div className="settings-group">
        <label className="settings-label">Image</label>
        <div className="image-preview">
          {config.imageSrc && (
            <img src={config.imageSrc} alt={config.altText} className="preview-img" />
          )}
          {!config.imageSrc && (
            <div className="preview-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>No image selected</span>
            </div>
          )}
        </div>
      </div>

      {/* Change Image Button */}
      <div className="settings-group">
        <label htmlFor="image-upload-input" className="file-upload-btn" style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {uploading ? 'Uploading...' : 'Upload Image'}
        </label>
        <input
          id="image-upload-input"
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </div>

      {/* Alt Text */}
      <div className="settings-group">
        <label className="settings-label">Image Description (Alt Text)</label>
        <textarea
          className="settings-textarea"
          value={config.altText || ''}
          onChange={(e) => onConfigUpdate({ altText: e.target.value })}
          placeholder="Describe the image for accessibility and SEO..."
          rows="2"
        />
      </div>

      {/* Width */}
      <div className="settings-group">
        <label className="settings-label">Width</label>
        <div className="width-options">
          <label className="width-option">
            <input
              type="radio"
              name="width"
              value="auto"
              checked={!config.width || config.width === 'auto'}
              onChange={() => onConfigUpdate({ width: 'auto' })}
            />
            <span>Auto</span>
          </label>
          <label className="width-option">
            <input
              type="radio"
              name="width"
              value="percent"
              checked={config.width?.endsWith('%')}
              onChange={() => onConfigUpdate({ width: '100%' })}
            />
            <span>Percentage</span>
          </label>
          <label className="width-option">
            <input
              type="radio"
              name="width"
              value="pixel"
              checked={config.width?.endsWith('px')}
              onChange={() => onConfigUpdate({ width: '400px' })}
            />
            <span>Pixels</span>
          </label>
        </div>

        {config.width?.endsWith('%') && (
          <input
            type="number"
            className="settings-input"
            value={parseInt(config.width)}
            onChange={(e) => onConfigUpdate({ width: `${e.target.value}%` })}
            min="10"
            max="100"
          />
        )}
        {config.width?.endsWith('px') && (
          <input
            type="number"
            className="settings-input"
            value={parseInt(config.width)}
            onChange={(e) => onConfigUpdate({ width: `${e.target.value}px` })}
            min="50"
            max="2000"
          />
        )}
      </div>

      {/* Height */}
      <div className="settings-group">
        <label className="settings-label">Height</label>
        <div className="height-options">
          <label className="height-option">
            <input
              type="radio"
              name="height"
              value="auto"
              checked={!config.height || config.height === 'auto'}
              onChange={() => onConfigUpdate({ height: 'auto' })}
            />
            <span>Auto</span>
          </label>
          <label className="height-option">
            <input
              type="radio"
              name="height"
              value="pixel"
              checked={config.height?.endsWith('px')}
              onChange={() => onConfigUpdate({ height: '400px' })}
            />
            <span>Pixels</span>
          </label>
        </div>

        {config.height?.endsWith('px') && (
          <input
            type="number"
            className="settings-input"
            value={parseInt(config.height)}
            onChange={(e) => onConfigUpdate({ height: `${e.target.value}px` })}
            min="50"
            max="2000"
          />
        )}
      </div>

      {/* Object Fit */}
      <div className="settings-group">
        <label className="settings-label">Object Fit</label>
        <div className="object-fit-options">
          {OBJECT_FIT_OPTIONS.map((fit) => (
            <button
              key={fit}
              className={`fit-btn ${config.objectFit === fit ? 'fit-btn--active' : ''}`}
              onClick={() => onConfigUpdate({ objectFit: fit })}
            >
              {fit}
            </button>
          ))}
        </div>
      </div>

      {/* Shape */}
      <div className="settings-group">
        <label className="settings-label">Shape</label>
        <div className="shape-options">
          {SHAPE_OPTIONS.map((shape) => (
            <button
              key={shape.id}
              className={`shape-btn ${config.shape === shape.id ? 'shape-btn--active' : ''}`}
              onClick={() => onConfigUpdate({ shape: shape.id })}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius (for rounded shapes) */}
      {(config.shape === 'rounded' || config.shape === 'custom') && (
        <div className="settings-group">
          <label className="settings-label">Border Radius (px)</label>
          <div className="slider-group">
            <input
              type="range"
              className="slider-input"
              min="0"
              max="200"
              step="5"
              value={parseInt(config.borderRadius) || 8}
              onChange={(e) => onConfigUpdate({ borderRadius: `${e.target.value}px` })}
            />
            <div className="slider-value">{parseInt(config.borderRadius) || 8}px</div>
          </div>
        </div>
      )}

      {/* Box Shadow */}
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
              className={`shadow-btn ${config.boxShadow === option.value ? 'shadow-btn--active' : ''}`}
              onClick={() => onConfigUpdate({ boxShadow: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Position */}
      <div className="settings-group">
        <label className="settings-label">Position</label>
        <div className="position-options">
          <button
            className={`position-btn ${config.position === 'normal' ? 'position-btn--active' : ''}`}
            onClick={() => {
              onConfigUpdate({ position: 'normal' });
              setShowPosition(false);
            }}
          >
            Normal
          </button>
          <button
            className={`position-btn ${config.position === 'overlap' ? 'position-btn--active' : ''}`}
            onClick={() => {
              onConfigUpdate({ position: 'overlap' });
              setShowPosition(true);
            }}
          >
            Overlap
          </button>
        </div>
      </div>

      {/* Overlap Settings */}
      {showPosition && config.position === 'overlap' && (
        <div className="overlap-settings">
          <div className="settings-group">
            <label className="settings-label">Target Component</label>
            <select className="settings-input">
              <option>Select a component...</option>
              <option>Text - "Product Name"</option>
              <option>Button - "Add to Cart"</option>
              <option>Text - "Price"</option>
            </select>
          </div>

          <div className="settings-group">
            <label className="settings-label">Anchor Position</label>
            <div className="anchor-grid">
              {[
                [0, 0], [1, 0], [2, 0],
                [0, 1], [1, 1], [2, 1],
                [0, 2], [1, 2], [2, 2],
              ].map(([x, y]) => (
                <button
                  key={`${x}-${y}`}
                  className={`anchor-btn ${config.anchorPosition === `${x}-${y}` ? 'anchor-btn--active' : ''}`}
                  onClick={() => onConfigUpdate({ anchorPosition: `${x}-${y}` })}
                  title={`Position ${x},${y}`}
                />
              ))}
            </div>
          </div>

          <div className="settings-group">
            <label className="settings-label">X Offset (px)</label>
            <div className="slider-group">
              <input
                type="range"
                className="slider-input"
                min="-100"
                max="100"
                step="5"
                value={config.offsetX || 0}
                onChange={(e) => onConfigUpdate({ offsetX: parseInt(e.target.value) })}
              />
              <div className="slider-value">{config.offsetX || 0}px</div>
            </div>
          </div>

          <div className="settings-group">
            <label className="settings-label">Y Offset (px)</label>
            <div className="slider-group">
              <input
                type="range"
                className="slider-input"
                min="-100"
                max="100"
                step="5"
                value={config.offsetY || 0}
                onChange={(e) => onConfigUpdate({ offsetY: parseInt(e.target.value) })}
              />
              <div className="slider-value">{config.offsetY || 0}px</div>
            </div>
          </div>
        </div>
      )}

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
              <label className="settings-label">CSS Classes</label>
              <input
                type="text"
                className="settings-input"
                value={config.className || ''}
                onChange={(e) => onConfigUpdate({ className: e.target.value })}
                placeholder="e.g., image-hover-effect"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
