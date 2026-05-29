import './SettingsPanels.css';

export default function PageSettingsPanel({ pageData, onUpdate }) {
  return (
    <div className="settings-panel">
      <h3 className="settings-panel__title">Page Settings</h3>

      <div className="settings-group">
        <label className="settings-label">Page Title</label>
        <input
          type="text"
          className="settings-input"
          value={pageData?.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
      </div>

      <div className="settings-group">
        <label className="settings-label">SEO Title</label>
        <input
          type="text"
          className="settings-input"
          placeholder="Page title for search engines"
          value={pageData?.seoTitle || ''}
          onChange={(e) => onUpdate({ seoTitle: e.target.value })}
          maxLength="60"
        />
        <span className="settings-hint">
          {(pageData?.seoTitle || '').length}/60
        </span>
      </div>

      <div className="settings-group">
        <label className="settings-label">SEO Description</label>
        <textarea
          className="settings-textarea"
          placeholder="Brief description for search engines"
          value={pageData?.seoDescription || ''}
          onChange={(e) => onUpdate({ seoDescription: e.target.value })}
          maxLength="160"
          rows="3"
        />
        <span className="settings-hint">
          {(pageData?.seoDescription || '').length}/160
        </span>
      </div>

      <div className="settings-group">
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={pageData?.isActive || false}
            onChange={(e) => onUpdate({ isActive: e.target.checked })}
          />
          <span>Page is active</span>
        </label>
      </div>
    </div>
  );
}
