import { useState, useEffect } from 'react';
import './BuilderHeader.css';

const DEVICES = ['Desktop', 'Tablet', 'Mobile'];

export default function BuilderHeader({
  pageName,
  device,
  onDeviceChange,
  autoSaveStatus,
  onPublish,
  isPublishing,
  publishStatus,
}) {
  const [showPublishDropdown, setShowPublishDropdown] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(null);

  useEffect(() => {
    if (publishStatus) {
      setShowPublishModal(publishStatus);
    }
  }, [publishStatus]);

  const handlePublishClick = () => {
    onPublish();
  };

  return (
    <>
      <header className="builder-header">
        <div className="builder-header__left">
          <span className="builder-header__breadcrumb">
            Website Builder
            <span className="builder-header__separator">&gt;</span>
            {pageName}
          </span>
        </div>

        <div className="builder-header__center">
          <div className="device-toggle">
            {DEVICES.map((d) => (
              <button
                key={d}
                className={`device-toggle__btn ${device === d ? 'device-toggle__btn--active' : ''}`}
                onClick={() => onDeviceChange(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="builder-header__right">
          <a href="#" className="builder-header__preview-link">
            Preview
          </a>

          <div className="auto-save-indicator">
            {autoSaveStatus === 'saving' && (
              <>
                <span className="auto-save-indicator__spinner"></span>
                <span className="auto-save-indicator__text">Saving…</span>
              </>
            )}
            {autoSaveStatus === 'saved' && (
              <>
                <span className="auto-save-indicator__dot"></span>
                <span className="auto-save-indicator__text">All changes saved</span>
              </>
            )}
            {autoSaveStatus === 'error' && (
              <>
                <span className="auto-save-indicator__dot auto-save-indicator__dot--error"></span>
                <span className="auto-save-indicator__text">Save error</span>
              </>
            )}
          </div>

          <div className="publish-button-wrapper">
            <button
              className={`publish-btn ${isPublishing ? 'publish-btn--loading' : ''}`}
              onClick={handlePublishClick}
              disabled={isPublishing}
            >
              {isPublishing ? 'Publishing…' : 'Publish Store'}
            </button>

            {publishStatus?.type === 'success' && (
              <div className="publish-dropdown">
                <span className="publish-dropdown__status">Published ✓</span>
                <button className="publish-dropdown__item">View Store</button>
                <button className="publish-dropdown__item">Unpublish</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {publishStatus && (
        <div className="publish-modal-overlay" onClick={() => setShowPublishModal(null)}>
          <div className="publish-modal" onClick={(e) => e.stopPropagation()}>
            {publishStatus.type === 'success' ? (
              <>
                <h3 className="publish-modal__title">Your store is live! 🎉</h3>
                <p className="publish-modal__url">{publishStatus.storeUrl}</p>
                <button className="publish-modal__btn publish-modal__btn--primary">
                  View My Store
                </button>
              </>
            ) : (
              <>
                <h3 className="publish-modal__title">Publishing failed</h3>
                <p className="publish-modal__message">{publishStatus.message}</p>
                {publishStatus.message.includes('domain') && (
                  <button className="publish-modal__btn publish-modal__btn--primary">
                    Go to Domain Settings →
                  </button>
                )}
                <button
                  className="publish-modal__btn publish-modal__btn--secondary"
                  onClick={() => setShowPublishModal(null)}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
