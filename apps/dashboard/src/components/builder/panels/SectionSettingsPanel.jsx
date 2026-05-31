import React, { useState, useEffect } from 'react';
import { sellerApi } from '../../../lib/axios';
import CardStylerPanel from './CardStylerPanel';
import { useCloudinaryUpload } from '../../../hooks/useCloudinaryUpload';
import './SettingsPanels.css';

export default function SectionSettingsPanel({
  section,
  config = section.config || {},
  onConfigUpdate,
  onBack,
  builderMode
}) {
  const [showCardStyler, setShowCardStyler] = useState(false);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { upload, uploading } = useCloudinaryUpload();
  
  const handleBgImageUpload = async (file) => {
    if (!file) return;
    try {
      const { url } = await upload(file, 'builder');
      onConfigUpdate({ backgroundImage: url });
    } catch (err) {
      console.error('Failed to upload bg image', err);
    }
  };

  useEffect(() => {
    if (section.type === 'PRODUCT_GRID' || section.type === 'FEATURED_PRODUCTS') {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [catRes, tagRes, prodRes] = await Promise.all([
            sellerApi.get('/catalog/categories').catch(() => ({ data: { data: { categories: [] } } })),
            sellerApi.get('/catalog/product-tags').catch(() => ({ data: { data: [] } })),
            sellerApi.get('/catalog/products').catch(() => ({ data: { data: [] } }))
          ]);
          setCategories(catRes.data?.data?.categories || catRes.data?.data || []);
          setTags(tagRes.data?.data || tagRes.data || []);
          setProducts(prodRes.data?.data?.products || prodRes.data?.data || []);
        } catch (err) {
          console.error('Failed to load data for builder panel:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [section.type]);

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
              {loading ? (
                <div style={{ color: '#6B7280', fontSize: '13px' }}>Loading categories...</div>
              ) : (
                <select 
                  className="settings-input"
                  value={config.categoryId || ''}
                  onChange={(e) => onConfigUpdate({ categoryId: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {config.dataSource === 'tag' && (
            <div className="settings-group">
              <label className="settings-label">Tag</label>
              {loading ? (
                <div style={{ color: '#6B7280', fontSize: '13px' }}>Loading tags...</div>
              ) : (
                <select 
                  className="settings-input"
                  value={config.tagId || config.tag || ''}
                  onChange={(e) => onConfigUpdate({ tagId: e.target.value, tag: e.target.value })}
                >
                  <option value="">Select a tag</option>
                  {tags.map((t) => (
                    <option key={t.id || t} value={t.id || t}>{t.name || t}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {config.dataSource === 'manual' && (
            <div className="settings-group">
              <label className="settings-label">Select Products</label>
              {loading ? (
                <div style={{ color: '#6B7280', fontSize: '13px' }}>Loading products...</div>
              ) : (
                <div className="manual-products-selector" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <select 
                    className="settings-input"
                    value=""
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (!selectedId) return;
                      const selectedProd = products.find(p => p.id === selectedId);
                      const currentIds = config.productIds || [];
                      if (selectedProd && !currentIds.includes(selectedId)) {
                        onConfigUpdate({ 
                          productIds: [...currentIds, selectedId],
                          productNames: [...(config.productNames || []), selectedProd.name]
                        });
                      }
                    }}
                  >
                    <option value="">Choose a product to add...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  {/* Selected products pills */}
                  {config.productIds && config.productIds.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label className="settings-label" style={{ fontSize: '11px', color: '#6B7280', marginBottom: 0 }}>Selected:</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {config.productIds.map((id, index) => {
                          const prod = products.find(p => p.id === id);
                          const name = prod?.name || config.productNames?.[index] || 'Unknown Product';
                          return (
                            <span 
                              key={id} 
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '6px', 
                                padding: '3px 8px', 
                                background: '#F3F4F6', 
                                border: '1px solid #E5E7EB', 
                                borderRadius: '16px', 
                                fontSize: '11px',
                                color: '#374151'
                              }}
                            >
                              {name}
                              <button
                                type="button"
                                style={{ 
                                  border: 'none', 
                                  background: 'none', 
                                  color: '#9CA3AF', 
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  fontSize: '12px',
                                  padding: '0 2px',
                                  lineHeight: 1
                                }}
                                onClick={() => {
                                  const newIds = config.productIds.filter(pid => pid !== id);
                                  const newNames = (config.productNames || []).filter((_, i) => i !== index);
                                  onConfigUpdate({ productIds: newIds, productNames: newNames });
                                }}
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
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

      {/* HERO / BANNER specific */}
      {(section.type === 'HERO' || section.type === 'BANNER') && (
        <>
          <div className="settings-group">
            <label className="settings-label">Content Alignment</label>
            <div className="alignment-buttons" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              {['LEFT', 'CENTER', 'RIGHT'].map(a => (
                <button key={a}
                  className={`alignment-btn ${config.contentAlignment === a ? 'alignment-btn--active' : ''}`}
                  onClick={() => onConfigUpdate({ contentAlignment: a })}
                >{a}</button>
              ))}
            </div>
          </div>
          <div className="settings-group">
            <label className="settings-checkbox">
              <input type="checkbox" checked={!!config.overlay}
                onChange={e => onConfigUpdate({ overlay: e.target.checked })} />
              <span>Background overlay</span>
            </label>
          </div>
          {config.overlay && (
            <div className="settings-group">
              <label className="settings-label">Overlay Color</label>
              <div className="color-picker">
                <input type="color" className="color-picker__input"
                  value={config.overlayColor?.replace(/rgba?\([^)]+\)/, '#000000') || '#000000'}
                  onChange={e => onConfigUpdate({ overlayColor: e.target.value + '66' })} />
                <span className="color-picker__label">{config.overlayColor || 'rgba(0,0,0,0.4)'}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* NEWSLETTER specific */}
      {section.type === 'NEWSLETTER' && (
        <>
          <div className="settings-group">
            <label className="settings-label">Heading</label>
            <input type="text" className="settings-input" value={config.heading || ''} onChange={e => onConfigUpdate({ heading: e.target.value })} />
          </div>
          <div className="settings-group">
            <label className="settings-label">Subheading</label>
            <input type="text" className="settings-input" value={config.subheading || ''} onChange={e => onConfigUpdate({ subheading: e.target.value })} />
          </div>
          <div className="settings-group">
            <label className="settings-label">Button Label</label>
            <input type="text" className="settings-input" value={config.buttonLabel || 'Subscribe'} onChange={e => onConfigUpdate({ buttonLabel: e.target.value })} />
          </div>
          <div className="settings-group">
            <label className="settings-label">Placeholder Text</label>
            <input type="text" className="settings-input" value={config.placeholder || ''} onChange={e => onConfigUpdate({ placeholder: e.target.value })} />
          </div>
          <div className="settings-group">
            <label className="settings-label">Text Color</label>
            <div className="color-picker">
              <input type="color" className="color-picker__input" value={config.textColor || '#FFFFFF'} onChange={e => onConfigUpdate({ textColor: e.target.value })} />
              <span className="color-picker__label">{config.textColor || '#FFFFFF'}</span>
            </div>
          </div>
          <div className="settings-group">
            <label className="settings-label">Content Alignment</label>
            <div className="alignment-buttons" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              {['LEFT', 'CENTER', 'RIGHT'].map(a => (
                <button key={a} className={`alignment-btn ${config.contentAlignment === a ? 'alignment-btn--active' : ''}`}
                  onClick={() => onConfigUpdate({ contentAlignment: a })}>{a}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* CALL_TO_ACTION / FEATURES / TESTIMONIALS / RICH_TEXT heading */}
      {['CALL_TO_ACTION', 'FEATURES', 'TESTIMONIALS', 'RICH_TEXT', 'GALLERY'].includes(section.type) && (
        <>
          <div className="settings-group">
            <label className="settings-label">Heading</label>
            <input type="text" className="settings-input" value={config.heading || ''} onChange={e => onConfigUpdate({ heading: e.target.value })} />
          </div>
          <div className="settings-group">
            <label className="settings-label">Content Alignment</label>
            <div className="alignment-buttons" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              {['LEFT', 'CENTER', 'RIGHT'].map(a => (
                <button key={a} className={`alignment-btn ${config.contentAlignment === a ? 'alignment-btn--active' : ''}`}
                  onClick={() => onConfigUpdate({ contentAlignment: a })}>{a}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* General Section Settings */}
      <div className="settings-group">
        <label className="settings-label">Background Image</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {config.backgroundImage && (
             <img src={config.backgroundImage} alt="bg" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
          )}
          <input type="file" accept="image/*" onChange={(e) => handleBgImageUpload(e.target.files[0])} disabled={uploading} style={{ fontSize: '12px' }} />
          {config.backgroundImage && (
            <button onClick={() => onConfigUpdate({ backgroundImage: '' })} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}>✕</button>
          )}
        </div>
        {uploading && <p style={{ fontSize: '12px', color: '#22925B', marginTop: '4px' }}>Uploading...</p>}
      </div>

      <div className="settings-group">
        <label className="settings-label">Background Color</label>
        <div className="color-picker">
          <input
            type="color"
            className="color-picker__input"
            value={config.backgroundColor?.replace(/rgba?\([^)]+\)/, '') || '#FFFFFF'}
            onChange={(e) => onConfigUpdate({ backgroundColor: e.target.value })}
          />
          <span className="color-picker__label">{config.backgroundColor || '#FFFFFF'}</span>
        </div>
      </div>

      {/* Background Gradient */}
      <div className="settings-group">
        <label className="settings-checkbox">
          <input
            type="checkbox"
            checked={!!config.backgroundGradient}
            onChange={(e) => {
              if (e.target.checked) {
                onConfigUpdate({ 
                  backgroundGradient: {
                    enabled: true,
                    type: 'linear',
                    angle: 180,
                    colors: [
                      { color: config.backgroundColor || '#FFFFFF', stop: 0 },
                      { color: '#000000', stop: 100 }
                    ]
                  }
                });
              } else {
                onConfigUpdate({ backgroundGradient: null });
              }
            }}
          />
          <span>Enable gradient background</span>
        </label>
      </div>

      {config.backgroundGradient && (
        <>
          <div className="settings-group">
            <label className="settings-label">Gradient Type</label>
            <div className="radio-group">
              {['linear', 'radial'].map((type) => (
                <label key={type} className="radio-option">
                  <input
                    type="radio"
                    name="gradientType"
                    value={type}
                    checked={config.backgroundGradient.type === type}
                    onChange={(e) => onConfigUpdate({
                      backgroundGradient: { ...config.backgroundGradient, type: e.target.value }
                    })}
                  />
                  <span style={{ textTransform: 'capitalize' }}>{type}</span>
                </label>
              ))}
            </div>
          </div>

          {config.backgroundGradient.type === 'linear' && (
            <div className="settings-group">
              <label className="settings-label">Gradient Angle (deg)</label>
              <div className="slider-group">
                <input
                  type="range"
                  className="slider-input"
                  min="0"
                  max="360"
                  step="15"
                  value={config.backgroundGradient.angle || 180}
                  onChange={(e) => onConfigUpdate({
                    backgroundGradient: { ...config.backgroundGradient, angle: parseInt(e.target.value) }
                  })}
                />
                <div className="slider-value">{config.backgroundGradient.angle || 180}°</div>
              </div>
            </div>
          )}

          <div className="settings-group">
            <label className="settings-label">Gradient Colors</label>
            {config.backgroundGradient.colors?.map((colorStop, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <input
                  type="color"
                  value={colorStop.color}
                  onChange={(e) => {
                    const newColors = [...config.backgroundGradient.colors];
                    newColors[index] = { ...newColors[index], color: e.target.value };
                    onConfigUpdate({
                      backgroundGradient: { ...config.backgroundGradient, colors: newColors }
                    });
                  }}
                  style={{ width: '40px', height: '32px', border: '1px solid #E5E7EB', borderRadius: '4px' }}
                />
                <input
                  type="number"
                  value={colorStop.stop}
                  onChange={(e) => {
                    const newColors = [...config.backgroundGradient.colors];
                    newColors[index] = { ...newColors[index], stop: parseInt(e.target.value) || 0 };
                    onConfigUpdate({
                      backgroundGradient: { ...config.backgroundGradient, colors: newColors }
                    });
                  }}
                  min="0"
                  max="100"
                  style={{ width: '60px', padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: '4px' }}
                />
                <span style={{ fontSize: '12px', color: '#6B7280' }}>%</span>
                {config.backgroundGradient.colors.length > 2 && (
                  <button
                    onClick={() => {
                      const newColors = config.backgroundGradient.colors.filter((_, i) => i !== index);
                      onConfigUpdate({
                        backgroundGradient: { ...config.backgroundGradient, colors: newColors }
                      });
                    }}
                    style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '16px' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {config.backgroundGradient.colors?.length < 5 && (
              <button
                onClick={() => {
                  const newColors = [...(config.backgroundGradient.colors || []), { color: '#000000', stop: 100 }];
                  onConfigUpdate({
                    backgroundGradient: { ...config.backgroundGradient, colors: newColors }
                  });
                }}
                style={{ 
                  marginTop: '8px', 
                  padding: '6px 12px', 
                  fontSize: '12px', 
                  background: '#F3F4F6', 
                  border: '1px solid #E5E7EB', 
                  borderRadius: '4px', 
                  cursor: 'pointer' 
                }}
              >
                + Add Color Stop
              </button>
            )}
          </div>
        </>
      )}

      {/* Background Opacity */}
      {(config.backgroundImage || config.backgroundColor) && (
        <div className="settings-group">
          <label className="settings-label">Background Opacity</label>
          <div className="slider-group">
            <input
              type="range"
              className="slider-input"
              min="0"
              max="100"
              step="5"
              value={config.backgroundOpacity !== undefined ? config.backgroundOpacity : 100}
              onChange={(e) => onConfigUpdate({ backgroundOpacity: parseInt(e.target.value) })}
            />
            <div className="slider-value">{config.backgroundOpacity !== undefined ? config.backgroundOpacity : 100}%</div>
          </div>
        </div>
      )}

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
