import './CanvasRenderer.css';

export default function CanvasRenderer({
  section,
  selectedComponentId,
  onComponentSelect,
  onAddComponent,
  onDeleteComponent,
}) {
  const components = section.components || [];
  const config = section.config || {};

  return (
    <div
      className="canvas-renderer"
      style={{
        minHeight: config.minHeight || 'auto',
        backgroundColor: config.backgroundColor || '#FFFFFF',
        padding: config.padding
          ? `${config.padding.top || 0}px ${config.padding.right || 0}px ${config.padding.bottom || 0}px ${config.padding.left || 0}px`
          : '0',
      }}
    >
      <div className="canvas-renderer__content">
        {components.length === 0 ? (
          <div className="canvas-renderer__empty">
            <span>No components</span>
            <button onClick={onAddComponent} className="canvas-renderer__add-btn">
              + Add Component
            </button>
          </div>
        ) : (
          components.map((component, idx) => (
            <CanvasComponent
              key={component.id}
              component={component}
              isSelected={selectedComponentId === component.id}
              onSelect={() => onComponentSelect(component.id)}
              onDelete={() => onDeleteComponent(component.id)}
              isFirst={idx === 0}
              isLast={idx === components.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CanvasComponent({
  component,
  isSelected,
  onSelect,
  onDelete,
  isFirst,
  isLast,
}) {
  const config = component.config || {};
  const style = config.style || {};

  return (
    <div
      className={`canvas-component ${isSelected ? 'canvas-component--selected' : ''}`}
      onClick={onSelect}
    >
      {isSelected && (
        <div className="canvas-component__actions">
          <button
            className="canvas-component__action-btn canvas-component__action-btn--delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      )}

      {component.type === 'TEXT' && (
        <div
          className="canvas-component__text"
          style={{
            fontSize: `${style.fontSize || 16}px`,
            fontWeight: style.fontWeight || 'normal',
            color: style.color || '#4F507F',
            textAlign: style.textAlign || 'left',
          }}
        >
          {config.content || 'Text content'}
        </div>
      )}

      {component.type === 'BUTTON' && (
        <button
          className="canvas-component__button"
          style={{
            backgroundColor: style.backgroundColor || '#22925B',
            color: style.color || '#FFFFFF',
            padding: `${style.padding?.top || 10}px ${style.padding?.right || 20}px ${style.padding?.bottom || 10}px ${style.padding?.left || 20}px`,
            borderRadius: `${style.borderRadius || 6}px`,
            fontSize: `${style.fontSize || 14}px`,
            fontWeight: style.fontWeight || '500',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {config.label || 'Click me'}
        </button>
      )}

      {component.type === 'IMAGE' && (
        <img
          src={config.imageSrc || 'https://via.placeholder.com/400x300?text=Image'}
          alt={config.altText || 'Image'}
          className="canvas-component__image"
          style={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: `${style.borderRadius || 0}px`,
          }}
        />
      )}

      {component.type === 'SPACER' && (
        <div
          className="canvas-component__spacer"
          style={{
            height: `${config.height || 24}px`,
          }}
        />
      )}

      {component.type === 'DIVIDER' && (
        <hr
          className="canvas-component__divider"
          style={{
            borderColor: style.color || '#E5E7EB',
          }}
        />
      )}
    </div>
  );
}
