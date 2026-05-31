import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
import * as builderApi from '../../api/builder';
import './TemplatesPage.css';

// ─── Colour palette for skeleton previews when no previewUrl ─────────────────
const PALETTE = [
  { nav: '#1A2E1A', hero: '#22925B', accent: '#fff' },
  { nav: '#1F2A30', hero: '#374151', accent: '#22925B' },
  { nav: '#1e1b4b', hero: '#4338ca', accent: '#a5b4fc' },
  { nav: '#7c2d12', hero: '#ea580c', accent: '#fed7aa' },
  { nav: '#134e4a', hero: '#0f766e', accent: '#99f6e4' },
  { nav: '#1e3a5f', hero: '#2563eb', accent: '#bfdbfe' },
];

// Skeleton preview shown when template has no previewUrl
function SkeletonPreview({ index }) {
  const colors = PALETTE[index % PALETTE.length];
  return (
    <div className="skeleton-preview">
      <div className="skeleton-preview__nav" style={{ background: colors.nav }}>
        <div className="skeleton-preview__logo" />
        <div className="skeleton-preview__nav-links">
          <div className="skeleton-preview__nav-link" />
          <div className="skeleton-preview__nav-link" />
          <div className="skeleton-preview__nav-link" />
        </div>
      </div>
      <div className="skeleton-preview__hero" style={{ background: colors.hero }}>
        <div className="skeleton-preview__hero-text">
          <div className="skeleton-preview__h1" />
          <div className="skeleton-preview__h2" />
          <div className="skeleton-preview__cta" style={{ background: colors.accent }} />
        </div>
      </div>
      <div className="skeleton-preview__products">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="skeleton-preview__card">
            <div className="skeleton-preview__card-img" />
            <div className="skeleton-preview__card-line" />
            <div className="skeleton-preview__card-line skeleton-preview__card-line--short" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ template, index, onPreview, onUse }) {
  return (
    <div className="template-card" onClick={onPreview}>
      <div className="template-card__preview-wrap">
        {template.previewUrl ? (
          <img
            src={template.previewUrl}
            alt={template.name}
            className="template-card__preview-img"
          />
        ) : (
          <div className="template-card__preview-skeleton">
            <SkeletonPreview template={template} index={index} />
          </div>
        )}
        <div className="template-card__hover-overlay">
          <button
            className="template-card__use-btn"
            onClick={e => { e.stopPropagation(); onUse(); }}
          >
            Use This Template
          </button>
          <button
            className="template-card__preview-btn"
            onClick={e => { e.stopPropagation(); onPreview(); }}
          >
            Preview
          </button>
        </div>
      </div>
      <div className="template-card__info">
        <h3 className="template-card__name">{template.name}</h3>
        {template.description && (
          <p className="template-card__desc">{template.description}</p>
        )}
      </div>
    </div>
  );
}

function TemplatePreviewModal({ template, index, onClose, onUse, applying }) {
  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={e => e.stopPropagation()}>
        <div className="preview-modal__topbar">
          <span className="preview-modal__template-name">{template.name}</span>
          <button
            className="preview-modal__use-btn"
            onClick={onUse}
            disabled={applying}
          >
            {applying ? 'Applying…' : 'Use this template'}
          </button>
        </div>
        <div className="preview-modal__stage">
          {template.previewUrl ? (
            <img src={template.previewUrl} alt={template.name} className="preview-modal__img" />
          ) : (
            <div className="preview-modal__skeleton">
              <SkeletonPreview template={template} index={index} />
            </div>
          )}
        </div>
      </div>
      <button className="preview-modal__close" onClick={onClose} aria-label="Close">
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
          <path d="M11.667 11.667L28.333 28.333M11.667 28.333L28.333 11.667"
            stroke="white" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

function ConfirmReplaceModal({ onCancel, onConfirm, confirming }) {
  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal">
        <h3 className="confirm-modal__title">Replace current design?</h3>
        <p className="confirm-modal__body">
          Applying this template will replace your current design. Your products and orders won't be affected.
        </p>
        <div className="confirm-modal__actions">
          <button className="confirm-modal__cancel-btn" onClick={onCancel} disabled={confirming}>
            Cancel
          </button>
          <button className="confirm-modal__confirm-btn" onClick={onConfirm} disabled={confirming}>
            {confirming ? 'Applying…' : 'Yes, replace it'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApplyingOverlay() {
  return (
    <div className="applying-overlay">
      <div className="applying-overlay__content">
        <div className="applying-overlay__spinner" />
        <p className="applying-overlay__text">Applying template…</p>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(null);
  const [applying, setApplying] = useState(false);
  const [showApplyingOverlay, setShowApplyingOverlay] = useState(false);
  const [applyError, setApplyError] = useState(null);

  // Load real templates from API on mount
  useEffect(() => {
    const load = async () => {
      try {
        const data = await builderApi.getTemplates();
        // API returns array directly or wrapped in data
        const list = Array.isArray(data) ? data : (data.templates || data || []);
        setTemplates(list);
      } catch (err) {
        console.error('Failed to load templates:', err);
        setLoadError('Failed to load templates. Please refresh.');
      } finally {
        setLoadingTemplates(false);
      }
    };
    load();
  }, []);

  const handleUseTemplate = (template) => {
    setPendingTemplate(template);
    setApplyError(null);
    // Check if store already has pages — if so, confirm before overwriting
    // We detect this by checking if the business already has a theme
    // The API will return 409 EXISTING_THEME if so; we handle that below
    applyTemplate(template, false);
  };

  const applyTemplate = async (template, confirm) => {
    setShowConfirm(false);
    setPreviewTemplate(null);
    setApplying(true);
    setShowApplyingOverlay(true);
    setApplyError(null);

    try {
      await builderApi.applyTemplate(template.id, confirm);
      // Success — go to builder
      navigate('/builder');
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 'EXISTING_THEME' && err.response?.data?.error?.requiresConfirm) {
        // Ask user to confirm overwrite
        setShowApplyingOverlay(false);
        setApplying(false);
        setShowConfirm(true);
      } else {
        const msg = err.response?.data?.error?.message || 'Failed to apply template. Please try again.';
        setApplyError(msg);
        setShowApplyingOverlay(false);
        setApplying(false);
      }
    }
  };

  return (
    <div className="templates-page">
      {showApplyingOverlay && <ApplyingOverlay />}

      <header className="templates-header">
        <Link to="/dashboard" className="templates-header__back">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Dashboard
        </Link>
        <img src="/varanda-logo.png" alt="Varanda Mart" className="templates-header__logo" />
        <div className="templates-header__right">
          <Link to="/builder" className="templates-header__builder-link">
            Go to Builder
          </Link>
        </div>
      </header>

      <div className="templates-intro">
        <h1 className="templates-intro__title">Choose a Template</h1>
        <p className="templates-intro__subtitle">
          Pick a design that fits your brand and start customising. Your products and orders will not be affected.
        </p>
        {applyError && <p className="templates-intro__error">{applyError}</p>}
      </div>

      <main className="templates-grid-wrapper">
        {loadingTemplates ? (
          <div className="templates-loading">
            <div className="templates-loading__spinner" />
            <p>Loading templates…</p>
          </div>
        ) : loadError ? (
          <div className="templates-error">
            <p>{loadError}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          <div className="templates-grid">
            {templates.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                onPreview={() => { setPreviewTemplate(template); setPreviewIndex(index); }}
                onUse={() => handleUseTemplate(template)}
              />
            ))}
          </div>
        )}
      </main>

      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          index={previewIndex}
          onClose={() => setPreviewTemplate(null)}
          onUse={() => handleUseTemplate(previewTemplate)}
          applying={applying}
        />
      )}

      {showConfirm && (
        <ConfirmReplaceModal
          onCancel={() => { setShowConfirm(false); setPendingTemplate(null); }}
          onConfirm={() => applyTemplate(pendingTemplate, true)}
          confirming={applying}
        />
      )}
    </div>
  );
}
