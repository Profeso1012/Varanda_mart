import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sellerApi } from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import BrandAvatar from '../../components/dashboard/BrandAvatar';
import './TemplatesPage.css';

const TEMPLATES = [
  {
    id: 'modern-fashion',
    name: 'Modern Fashion Store',
    category: 'Fashion',
    description: 'Sleek and modern fashion storefront with hero banner and product grid.',
    store: {
      name: 'WesFashion',
      navBg: '#C1D6F5',
      logoText: 'W3',
      logoBg: '#190E75',
      heroImage: 'https://api.builder.io/api/v1/image/assets/TEMP/81d96d1c79f932876863e4b8c695e99228387b02?width=1844',
      heroHeading: 'New Collection',
      heroCta: 'Shop Now',
      products: [
        { price: '₦30,000', image: 'https://api.builder.io/api/v1/image/assets/TEMP/1a6f632c579d5f7f9c387ebc4d599c097fcc3c90?width=470' },
        { price: '₦30,000', image: 'https://api.builder.io/api/v1/image/assets/TEMP/f696b035f31274a3930602421ff7a96939644c0b?width=470' },
        { price: '₦30,000', image: 'https://api.builder.io/api/v1/image/assets/TEMP/2c5523763f57e87606352bfee9dba87c228b2d9b?width=470' },
      ],
    },
  },
  {
    id: 'electronics-hub',
    name: 'Electronics Hub',
    category: 'Electronics',
    description: 'Clean tech-focused store with featured products and category navigation.',
    store: {
      name: 'TechPro Store',
      navBg: '#1F2A30',
      logoText: 'TP',
      logoBg: '#22925B',
      heroImage: 'https://api.builder.io/api/v1/image/assets/TEMP/81d96d1c79f932876863e4b8c695e99228387b02?width=1844',
      heroHeading: 'Best Tech Deals',
      heroCta: 'Explore Now',
      products: [
        { price: '₦45,000', image: 'https://api.builder.io/api/v1/image/assets/TEMP/2c5523763f57e87606352bfee9dba87c228b2d9b?width=470' },
        { price: '₦120,000', image: 'https://api.builder.io/api/v1/image/assets/TEMP/f696b035f31274a3930602421ff7a96939644c0b?width=470' },
        { price: '₦85,000', image: 'https://api.builder.io/api/v1/image/assets/TEMP/1a6f632c579d5f7f9c387ebc4d599c097fcc3c90?width=470' },
      ],
    },
  },
  {
    id: 'beauty-boutique',
    name: 'Beauty Boutique',
    category: 'Beauty',
    description: 'Elegant beauty and cosmetics store with soft aesthetics and collections.',
    store: {
      name: 'GlowUp Beauty',
      navBg: '#F9E8F0',
      logoText: 'GB',
      logoBg: '#C2185B',
      heroImage: 'https://api.builder.io/api/v1/image/assets/TEMP/81d96d1c79f932876863e4b8c695e99228387b02?width=1844',
      heroHeading: 'New Arrivals',
      heroCta: 'Shop Now',
      products: [
        { price: '₦8,500', image: 'https://api.builder.io/api/v1/image/assets/TEMP/1a6f632c579d5f7f9c387ebc4d599c097fcc3c90?width=470' },
        { price: '₦12,000', image: 'https://api.builder.io/api/v1/image/assets/TEMP/2c5523763f57e87606352bfee9dba87c228b2d9b?width=470' },
        { price: '₦6,000', image: 'https://api.builder.io/api/v1/image/assets/TEMP/f696b035f31274a3930602421ff7a96939644c0b?width=470' },
      ],
    },
  },
  {
    id: 'food-market',
    name: 'Fresh Food Market',
    category: 'Food & Grocery',
    description: 'Vibrant marketplace for fresh produce, groceries and food essentials.',
    store: {
      name: 'FreshMart',
      navBg: '#E8F5E9',
      logoText: 'FM',
      logoBg: '#388E3C',
      heroImage: 'https://api.builder.io/api/v1/image/assets/TEMP/81d96d1c79f932876863e4b8c695e99228387b02?width=1844',
      heroHeading: 'Farm Fresh Daily',
      heroCta: 'Order Now',
      products: [
        { price: '₦3,500', image: 'https://api.builder.io/api/v1/image/assets/TEMP/f696b035f31274a3930602421ff7a96939644c0b?width=470' },
        { price: '₦2,200', image: 'https://api.builder.io/api/v1/image/assets/TEMP/1a6f632c579d5f7f9c387ebc4d599c097fcc3c90?width=470' },
        { price: '₦5,800', image: 'https://api.builder.io/api/v1/image/assets/TEMP/2c5523763f57e87606352bfee9dba87c228b2d9b?width=470' },
      ],
    },
  },
  {
    id: 'home-decor',
    name: 'Home & Living',
    category: 'Home Decor',
    description: 'Stylish home décor and furnishings store with a warm, inviting look.',
    store: {
      name: 'CozyCasa',
      navBg: '#F5F0E8',
      logoText: 'CC',
      logoBg: '#795548',
      heroImage: 'https://api.builder.io/api/v1/image/assets/TEMP/81d96d1c79f932876863e4b8c695e99228387b02?width=1844',
      heroHeading: 'Transform Your Space',
      heroCta: 'Shop Décor',
      products: [
        { price: '₦55,000', image: 'https://api.builder.io/api/v1/image/assets/TEMP/2c5523763f57e87606352bfee9dba87c228b2d9b?width=470' },
        { price: '₦18,000', image: 'https://api.builder.io/api/v1/image/assets/TEMP/f696b035f31274a3930602421ff7a96939644c0b?width=470' },
        { price: '₦32,000', image: 'https://api.builder.io/api/v1/image/assets/TEMP/1a6f632c579d5f7f9c387ebc4d599c097fcc3c90?width=470' },
      ],
    },
  },
  {
    id: 'sports-active',
    name: 'Sports & Active',
    category: 'Sports',
    description: 'Dynamic sportswear and fitness gear store with bold, energetic styling.',
    store: {
      name: 'ActiveZone',
      navBg: '#E3F2FD',
      logoText: 'AZ',
      logoBg: '#1565C0',
      heroImage: 'https://api.builder.io/api/v1/image/assets/TEMP/81d96d1c79f932876863e4b8c695e99228387b02?width=1844',
      heroHeading: 'Gear Up to Win',
      heroCta: 'Shop Gear',
      products: [
        { price: '₦22,000', image: 'https://api.builder.io/api/v1/image/assets/TEMP/1a6f632c579d5f7f9c387ebc4d599c097fcc3c90?width=470' },
        { price: '₦15,000', image: 'https://api.builder.io/api/v1/image/assets/TEMP/2c5523763f57e87606352bfee9dba87c228b2d9b?width=470' },
        { price: '₦38,000', image: 'https://api.builder.io/api/v1/image/assets/TEMP/f696b035f31274a3930602421ff7a96939644c0b?width=470' },
      ],
    },
  },
];

const DEVICE_WIDTHS = { Desktop: '100%', Tablet: '768px', Mobile: '375px' };
const DEVICES = ['Desktop', 'Tablet', 'Mobile'];

function StorePreview({ template, device }) {
  const { store } = template;
  const isMobile = device === 'Mobile';
  const isTablet = device === 'Tablet';

  return (
    <div className="store-preview" style={{ '--nav-bg': store.navBg }}>
      <nav className="store-preview__nav">
        <div className="store-preview__brand">
          <div className="store-preview__logo" style={{ background: store.logoBg }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 5H1L6 21H6.5L9 12.5L12 21H12.5L16.5 8H18.5L16.5 11.5V13H18.5C20 13 20 15.5 20 16C20 16.5 20 18.5 18.5 18.5C17.3 18.5 16.667 17.167 16.5 16.5L14.5 17.5C14.5 18.5 16.5 21 18.5 21C20.5 21 23 20 23 16C23 12.8 21 11.333 20 11L23 6.5V5H14.5L12 13L10 5H7L8 8.5L6.5 13L4 5Z" fill="white"/>
            </svg>
          </div>
          <span className="store-preview__store-name">{store.name}</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
          <path d="M6 6.75H16M6 11H16M6 15.25H16" stroke="#1F2A30" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </nav>

      <div className="store-preview__hero" style={{ backgroundImage: `url(${store.heroImage})` }}>
        <div className="store-preview__hero-content">
          <h2 className="store-preview__hero-heading">{store.heroHeading}</h2>
          <button className="store-preview__hero-cta">{store.heroCta}</button>
        </div>
      </div>

      <div className={`store-preview__products ${isTablet ? 'store-preview__products--tablet' : ''} ${isMobile ? 'store-preview__products--mobile' : ''}`}>
        {store.products.slice(0, isMobile ? 2 : 3).map((product, i) => (
          <div key={i} className="store-preview__product-card">
            <img src={product.image} alt="" className="store-preview__product-img" />
            <p className="store-preview__product-price">{product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplatePreviewModal({ template, onClose, onUseTemplate, applying }) {
  const [device, setDevice] = useState('Desktop');

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-modal__topbar">
          <span className="preview-modal__template-name">{template.name}</span>

          <div className="preview-modal__device-toggle">
            {DEVICES.map((d) => (
              <button
                key={d}
                className={`device-toggle-btn${device === d ? ' device-toggle-btn--active' : ''}`}
                onClick={() => setDevice(d)}
              >
                {d}
              </button>
            ))}
          </div>

          <button
            className="preview-modal__use-btn"
            onClick={onUseTemplate}
            disabled={applying}
          >
            {applying ? 'Applying…' : 'Use this template'}
          </button>
        </div>

        <div className="preview-modal__stage">
          <div
            className="preview-modal__device-frame"
            style={{ width: DEVICE_WIDTHS[device], maxWidth: '100%' }}
          >
            <StorePreview template={template} device={device} />
          </div>
        </div>
      </div>

      <button className="preview-modal__close" onClick={onClose} aria-label="Close preview">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M11.667 11.667L28.333 28.333M11.667 28.333L28.333 11.667" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
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
            {confirming ? 'Applying…' : 'Continue'}
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
  const { business } = useAuth();

  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState(null);
  const [applying, setApplying] = useState(false);
  const [showApplyingOverlay, setShowApplyingOverlay] = useState(false);

  const hasExistingTheme = !!business?.theme;

  const handleUseTemplate = (template) => {
    setPendingTemplate(template);
    if (hasExistingTheme) {
      setPreviewTemplate(null);
      setShowConfirm(true);
    } else {
      applyTemplate(template, false);
    }
  };

  const applyTemplate = async (template, confirm) => {
    setShowConfirm(false);
    setPreviewTemplate(null);
    setApplying(true);
    setShowApplyingOverlay(true);

    try {
      await sellerApi.post('/builder/templates/apply', {
        templateId: template.id,
        confirm,
      });
    } catch (err) {
      console.error('Template apply error:', err);
    } finally {
      setTimeout(() => {
        setApplying(false);
        setShowApplyingOverlay(false);
        navigate('/builder');
      }, 2000);
    }
  };

  return (
    <div className="templates-page">
      {showApplyingOverlay && <ApplyingOverlay />}

      {/* Header */}
      <header className="templates-header">
        <Link to="/dashboard" className="templates-header__back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Dashboard
        </Link>

        <img
          src="/varanda-logo.png"
          alt="Varanda Mart"
          className="templates-header__logo"
        />

        <div className="templates-header__right">
          <Link to="/builder" className="templates-header__builder-link">
            Go to Builder
          </Link>
        </div>
      </header>

      {/* Page intro */}
      <div className="templates-intro">
        <h1 className="templates-intro__title">Choose a Template</h1>
        <p className="templates-intro__subtitle">
          Pick a design that fits your brand and start customising. Your products and orders will not be affected.
        </p>
      </div>

      {/* Template grid */}
      <main className="templates-grid-wrapper">
        <div className="templates-grid">
          {TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={() => setPreviewTemplate(template)}
              onUse={() => handleUseTemplate(template)}
            />
          ))}
        </div>
      </main>

      {/* Preview modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onUseTemplate={() => handleUseTemplate(previewTemplate)}
          applying={applying}
        />
      )}

      {/* Confirm replace modal */}
      {showConfirm && (
        <ConfirmReplaceModal
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => applyTemplate(pendingTemplate, true)}
          confirming={applying}
        />
      )}
    </div>
  );
}

function TemplateCard({ template, onPreview, onUse }) {
  return (
    <div className="template-card" onClick={onPreview}>
      <div className="template-card__preview-wrap">
        <div className="template-card__preview-mockup">
          <StorePreview template={template} device="Desktop" />
        </div>
        <div className="template-card__hover-overlay">
          <button
            className="template-card__use-btn"
            onClick={(e) => { e.stopPropagation(); onUse(); }}
          >
            Use This Template
          </button>
          <button
            className="template-card__preview-btn"
            onClick={(e) => { e.stopPropagation(); onPreview(); }}
          >
            Preview
          </button>
        </div>
      </div>
      <div className="template-card__info">
        <h3 className="template-card__name">{template.name}</h3>
        <span className="template-card__badge">{template.category}</span>
      </div>
    </div>
  );
}
