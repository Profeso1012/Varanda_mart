import './BuilderLeftPanel.css';

const SECTION_TYPE_ICONS = {
  HERO: '🎨',
  PRODUCT_GRID: '🎯',
  FEATURED_PRODUCTS: '⭐',
  FEATURES: '✨',
  CALL_TO_ACTION: '🚀',
  TESTIMONIALS: '💬',
  FAQ: '❓',
  GALLERY: '🖼',
  CONTACT: '📧',
  NEWSLETTER: '📰',
  STATS: '📊',
  RICH_TEXT: '📝',
  CUSTOM: '◆',
  DEFAULT: '◆',
};

const PAGE_TYPE_ICONS = {
  HOME: '🏠',
  PRODUCTS: '🛍',
  PRODUCT_DETAIL: '📦',
  ABOUT: 'ℹ️',
  CONTACT: '📧',
  POLICIES: '📋',
  CUSTOM: '📄',
};

const PAGE_TYPE_LABELS = {
  HOME: 'Home',
  PRODUCTS: 'Products',
  PRODUCT_DETAIL: 'Product Detail',
  ABOUT: 'About Us',
  CONTACT: 'Contact',
  POLICIES: 'Policies',
};

function getSectionLabel(section, idx, allSections) {
  const type = section.type || 'DEFAULT';
  let count = 0;
  for (let i = 0; i <= idx; i++) {
    if ((allSections[i].type || 'DEFAULT') === type) count++;
  }
  const label = type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ');
  return count > 1 ? `${label} ${count}` : label;
}

export default function BuilderLeftPanel({
  pages,
  activePage,
  onPageSelect,
  pageExpanded,
  onPageExpandChange,
  schema,
  selection,
  onSelect,
  onAddPage,
  onSectionScrollTo,
}) {
  const handleToggleExpand = (pageIdentifier) => {
    onPageExpandChange({ ...pageExpanded, [pageIdentifier]: !pageExpanded[pageIdentifier] });
  };

  const sections = schema?.sections || [];

  return (
    <aside className="builder-left-panel">
      <div className="builder-left-panel__header">
        <h3 className="builder-left-panel__title">Pages</h3>
      </div>

      <nav className="builder-left-panel__pages">
        {pages.map((page) => {
          const pageType = page.pageType || page.page_type || page.type || 'CUSTOM';
          const pageIdentifier = pageType === 'CUSTOM' ? (page.id || page.slug) : pageType;
          const pageName = page.title || page.name || PAGE_TYPE_LABELS[pageType] || pageType || 'Custom Page';
          const isActive = activePage === pageIdentifier;
          const isExpanded = pageExpanded[pageIdentifier];

          return (
            <div key={pageIdentifier} className="page-item">
              <div className={`page-item__header ${isActive ? 'page-item__header--active' : ''}`}>
                <button
                  className="page-item__expand-btn"
                  onClick={() => handleToggleExpand(pageIdentifier)}
                  title={isExpanded ? 'Collapse' : 'Expand sections'}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                >
                  <svg
                    width="12" height="12" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                <button
                  className={`page-item__btn ${isActive ? 'page-item__btn--active' : ''}`}
                  onClick={() => onPageSelect(pageIdentifier)}
                  style={{ paddingLeft: '4px' }}
                >
                  {pageName}
                </button>
              </div>

              {isExpanded && isActive && (
                <div className="page-item__sections">
                  {sections.length > 0 ? (
                    sections.map((section, idx) => (
                      <button
                        key={section.id}
                        className={`section-list-item ${selection?.sectionId === section.id ? 'section-list-item--active' : ''}`}
                        onClick={() => {
                          onSelect({ sectionId: section.id, componentId: null, childId: null });
                          if (onSectionScrollTo) onSectionScrollTo(section.id);
                        }}
                        style={{
                          backgroundColor: selection?.sectionId === section.id ? '#EFF6FF' : 'transparent',
                          color: selection?.sectionId === section.id ? '#1D4ED8' : '#374151'
                        }}
                        title={`Scroll to ${getSectionLabel(section, idx, sections)}`}
                      >
                        <span className="section-list-item__icon">
                          {SECTION_TYPE_ICONS[section.type] || SECTION_TYPE_ICONS.DEFAULT}
                        </span>
                        <span className="section-list-item__name">
                          {getSectionLabel(section, idx, sections)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="page-item__empty">No sections yet</div>
                  )}
                </div>
              )}

              {isExpanded && !isActive && (
                <div className="page-item__sections">
                  <div className="page-item__empty">Select page to view sections</div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <button className="builder-left-panel__add-page" onClick={onAddPage}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Page
      </button>
    </aside>
  );
}
