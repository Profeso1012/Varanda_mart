import './BuilderLeftPanel.css';

const SECTION_TYPE_ICONS = {
  HERO: '🎨',
  PRODUCT_GRID: '🎯',
  FEATURES: '⭐',
  CTA: '🚀',
  TESTIMONIALS: '💬',
  FAQ: '❓',
  GALLERY: '🖼',
  CONTACT: '📧',
  NEWSLETTER: '📰',
  STATS: '📊',
  DEFAULT: '◆',
};

function getSectionDisplayName(section, index, typeCounts) {
  const typeMap = {};
  let currentTypeIndex = 0;

  for (let s of (section._pageSchema?.sections || [])) {
    if (!typeMap[s.type]) {
      typeMap[s.type] = 0;
    }
    if (s.id === section.id) {
      currentTypeIndex = typeMap[s.type] + 1;
    }
    typeMap[s.type]++;
  }

  const sectionType = section.type || 'DEFAULT';
  const count = currentTypeIndex || index + 1;
  return `${sectionType}-${count}`;
}

export default function BuilderLeftPanel({
  pages,
  activePage,
  onPageSelect,
  pageExpanded,
  onPageExpandChange,
  schema,
}) {
  const handleToggleExpand = (pageType) => {
    onPageExpandChange({
      ...pageExpanded,
      [pageType]: !pageExpanded[pageType],
    });
  };

  const getSectionIcon = (sectionType) => {
    return SECTION_TYPE_ICONS[sectionType] || SECTION_TYPE_ICONS.DEFAULT;
  };

  const getSectionName = (section, idx) => {
    const type = section.type || 'DEFAULT';
    const typeCount = schema?.sections?.filter(s => (s.type || 'DEFAULT') === type).length || 1;
    const typeIndex = schema?.sections?.findIndex(s => s.id === section.id) || idx;

    let count = 1;
    if (schema?.sections) {
      for (let i = 0; i <= typeIndex; i++) {
        if (schema.sections[i].type === type) count++;
      }
    }

    return `${type}-${count - 1}`;
  };

  return (
    <aside className="builder-left-panel">
      <div className="builder-left-panel__header">
        <h3 className="builder-left-panel__title">Pages</h3>
      </div>

      <nav className="builder-left-panel__pages">
        {pages.map((page) => (
          <div key={page.type} className="page-item">
            <div className="page-item__header">
              <button
                className="page-item__expand-btn"
                onClick={() => handleToggleExpand(page.type)}
                title="Expand sections"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points={pageExpanded[page.type] ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
                </svg>
              </button>

              <button
                className={`page-item__btn ${activePage === page.type ? 'page-item__btn--active' : ''}`}
                onClick={() => onPageSelect(page.type)}
              >
                {page.name}
              </button>
            </div>

            {pageExpanded[page.type] && schema && (
              <div className="page-item__sections">
                {schema.sections && schema.sections.length > 0 ? (
                  schema.sections.map((section, idx) => (
                    <div key={section.id} className="section-list-item">
                      <span className="section-list-item__icon">
                        {getSectionIcon(section.type)}
                      </span>
                      <span className="section-list-item__name" title={getSectionName(section, idx)}>
                        {getSectionName(section, idx)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="page-item__empty">No sections</div>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>

      <button className="builder-left-panel__add-page">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Page
      </button>
    </aside>
  );
}
