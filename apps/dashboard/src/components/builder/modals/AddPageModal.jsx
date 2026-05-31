import { useState } from 'react';
import './AddPageModal.css';

export default function AddPageModal({ onAdd, onClose }) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Auto-generate slug from title
  const handleTitleChange = (val) => {
    setTitle(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Page title is required.'); return; }
    if (!slug.trim()) { setError('Slug is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      await onAdd({ title: title.trim(), slug: slug.trim(), seoTitle, seoDescription });
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to create page.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="add-page-modal-overlay" onClick={onClose}>
      <div className="add-page-modal" onClick={e => e.stopPropagation()}>
        <div className="add-page-modal__header">
          <h2>Add Custom Page</h2>
          <button className="add-page-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="add-page-modal__form">
          <div className="apm-group">
            <label>Page Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="e.g. About Us"
              autoFocus
            />
          </div>

          <div className="apm-group">
            <label>Slug *</label>
            <div className="apm-slug-row">
              <span className="apm-slug-prefix">/</span>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="about-us"
              />
            </div>
            <span className="apm-hint">Lowercase letters, numbers, and hyphens only.</span>
          </div>

          <div className="apm-group">
            <label>SEO Title</label>
            <input type="text" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="Optional" maxLength={60} />
          </div>

          <div className="apm-group">
            <label>SEO Description</label>
            <textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder="Optional" rows={2} maxLength={160} />
          </div>

          {error && <p className="apm-error">{error}</p>}

          <div className="apm-actions">
            <button type="button" className="apm-btn apm-btn--cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="apm-btn apm-btn--create" disabled={saving}>
              {saving ? 'Creating…' : 'Create Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
