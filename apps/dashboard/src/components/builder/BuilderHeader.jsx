import { useState, useEffect, useRef } from 'react';
import './BuilderHeader.css';

const DEVICES = ['Desktop', 'Tablet', 'Mobile'];

export default function BuilderHeader({
  pageName,
  device,
  onDeviceChange,
  autoSaveStatus,
  onPublish,
  onUnpublish,
  isPublishing,
  isPublished,
  publishStatus,
  storeUrl,
  onDismissPublishStatus,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onBack,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const previewUrl = storeUrl
    ? (storeUrl.startsWith('http') ? storeUrl : `https://${storeUrl}`)
    : null;

  return (
    <>
      <header className="builder-header">
        {/* Left — breadcrumb with back button */}
        <div className="builder-header__left">
          {onBack && (
            <button
              onClick={onBack}
              className="builder-header__back-btn"
              title="Back to Dashboard"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                marginRight: '12px',
                display: 'flex',
                alignItems: 'center',
                color: '#6B7280',
                fontSize: '14px',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#22925B'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back
            </button>
          )}
          <span className="builder-header__breadcrumb">
            Website Builder
            <span className="builder-header__separator"> › </span>
            {pageName}
          </span>
        </div>

        {/* Center — device toggle */}
        <div className="builder-header__center">
          <div className="device-toggle">
            {DEVICES.map((d) => (
              <button
                key={d}
                className={`device-toggle__btn ${device === d ? 'device-toggle__btn--active' : ''}`}
                onClick={() => onDeviceChange(d)}
                title={d}
              >
                {d === 'Desktop' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                  </svg>
                )}
                {d === 'Tablet' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" /><circle cx="12" cy="18" r="1" />
                  </svg>
                )}
                {d === 'Mobile' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" /><circle cx="12" cy="18" r="1" />
                  </svg>
                )}
                <span>{d}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right — preview, save status, publish */}
        <div className="builder-header__right">
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="builder-header__preview-link"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Preview
            </a>
          )}

          <div className="undo-redo-controls" style={{ display: 'flex', gap: '4px', marginRight: '16px' }}>
            <button 
              onClick={onUndo} 
              disabled={!canUndo} 
              style={{ background: 'transparent', border: 'none', cursor: canUndo ? 'pointer' : 'not-allowed', opacity: canUndo ? 1 : 0.4 }}
              title="Undo (Ctrl+Z)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
            </button>
            <button 
              onClick={onRedo} 
              disabled={!canRedo} 
              style={{ background: 'transparent', border: 'none', cursor: canRedo ? 'pointer' : 'not-allowed', opacity: canRedo ? 1 : 0.4 }}
              title="Redo (Ctrl+Shift+Z)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
            </button>
          </div>

          <div className="auto-save-indicator">
            {autoSaveStatus === 'saving' && (
              <>
                <span className="auto-save-indicator__spinner" />
                <span className="auto-save-indicator__text">Saving…</span>
              </>
            )}
            {autoSaveStatus === 'saved' && (
              <>
                <span className="auto-save-indicator__dot auto-save-indicator__dot--saved" />
                <span className="auto-save-indicator__text">All changes saved</span>
              </>
            )}
            {autoSaveStatus === 'unsaved' && (
              <>
                <span className="auto-save-indicator__dot auto-save-indicator__dot--unsaved" />
                <span className="auto-save-indicator__text">Unsaved changes</span>
              </>
            )}
            {autoSaveStatus === 'error' && (
              <>
                <span className="auto-save-indicator__dot auto-save-indicator__dot--error" />
                <span className="auto-save-indicator__text">Save failed</span>
              </>
            )}
          </div>

          {/* Publish button / published dropdown */}
          <div className="publish-wrapper" ref={dropdownRef}>
            {isPublished ? (
              <>
                <button
                  className="publish-btn publish-btn--published"
                  onClick={() => setShowDropdown(v => !v)}
                >
                  Published ✓
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {showDropdown && (
                  <div className="publish-dropdown">
                    {previewUrl && (
                      <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="publish-dropdown__item">
                        View Store
                      </a>
                    )}
                    <button
                      className="publish-dropdown__item publish-dropdown__item--danger"
                      onClick={() => { setShowDropdown(false); setShowUnpublishConfirm(true); }}
                    >
                      Unpublish
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                className={`publish-btn ${isPublishing ? 'publish-btn--loading' : ''}`}
                onClick={onPublish}
                disabled={isPublishing}
              >
                {isPublishing ? 'Checking…' : 'Publish Store'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Publish result modal */}
      {publishStatus && (
        <div className="publish-modal-overlay" onClick={onDismissPublishStatus}>
          <div className="publish-modal" onClick={e => e.stopPropagation()}>
            {publishStatus.type === 'success' ? (
              <>
                <div className="publish-modal__icon publish-modal__icon--success">🎉</div>
                <h3 className="publish-modal__title">Your store is live!</h3>
                {publishStatus.storeUrl && (
                  <p className="publish-modal__url">{publishStatus.storeUrl}</p>
                )}
                <div className="publish-modal__actions">
                  {publishStatus.storeUrl && (
                    <a
                      href={publishStatus.storeUrl.startsWith('http') ? publishStatus.storeUrl : `https://${publishStatus.storeUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="publish-modal__btn publish-modal__btn--primary"
                    >
                      View My Store
                    </a>
                  )}
                  <button className="publish-modal__btn publish-modal__btn--secondary" onClick={onDismissPublishStatus}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="publish-modal__icon publish-modal__icon--error">⚠️</div>
                <h3 className="publish-modal__title">Publishing failed</h3>
                <p className="publish-modal__message">{publishStatus.message}</p>
                <div className="publish-modal__actions">
                  {publishStatus.reason === 'no_domain' && (
                    <a href="/settings/domain" className="publish-modal__btn publish-modal__btn--primary">
                      Go to Domain Settings →
                    </a>
                  )}
                  <button className="publish-modal__btn publish-modal__btn--secondary" onClick={onDismissPublishStatus}>
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Unpublish confirmation modal */}
      {showUnpublishConfirm && (
        <div className="publish-modal-overlay" onClick={() => setShowUnpublishConfirm(false)}>
          <div className="publish-modal" onClick={e => e.stopPropagation()}>
            <h3 className="publish-modal__title">Take store offline?</h3>
            <p className="publish-modal__message">Your store will go offline and customers won't be able to visit it.</p>
            <div className="publish-modal__actions">
              <button
                className="publish-modal__btn publish-modal__btn--danger"
                onClick={() => { setShowUnpublishConfirm(false); onUnpublish(); }}
              >
                Unpublish
              </button>
              <button
                className="publish-modal__btn publish-modal__btn--secondary"
                onClick={() => setShowUnpublishConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
