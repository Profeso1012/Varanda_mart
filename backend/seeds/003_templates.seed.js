const sql = require('../src/config/database').sql;

// ─── Template definitions ─────────────────────────────────────────────────────

const templates = [
  {
    name: 'Classic',
    slug: 'classic',
    description: 'Clean and structured. Centered navigation, card-based product grid, warm neutrals.',
    preview_url: 'https://picsum.photos/seed/classic-preview/800/600',
    sort_order: 0,
  },
  {
    name: 'Bold',
    slug: 'bold',
    description: 'High-impact and editorial. Left-aligned hero text, edge-to-edge imagery, dark accents.',
    preview_url: 'https://picsum.photos/seed/bold-preview/800/600',
    sort_order: 1,
  },
  {
    name: 'Minimal',
    slug: 'minimal',
    description: 'Typography-first and airy. Generous whitespace, light palette, no visual noise.',
    preview_url: 'https://picsum.photos/seed/minimal-preview/800/600',
    sort_order: 2,
  },
];

// ─── Picsum helpers ───────────────────────────────────────────────────────────
const pic = (seed, w, h) => `https://picsum.photos/seed/${seed}/${w}/${h}`;


// ═══════════════════════════════════════════════════════════════════════════════
// CLASSIC TEMPLATE
// Design language: centered nav, card grid, warm off-white backgrounds,
// rounded corners, soft shadows, serif headings.
// ═══════════════════════════════════════════════════════════════════════════════

// ── CLASSIC HEADER ────────────────────────────────────────────────────────────
// Centered logo, horizontal nav links, cart + search icons on right.
// Sticky on scroll. Thin announcement bar above it.
const classicHeader = {
  id: 'classic-header',
  type: 'HEADER',
  config: {
    layout: 'centered-logo',        // logo centered, nav below it
    sticky: true,
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E8E2DA',
    logoMaxHeight: 48,
    announcementBar: {
      enabled: true,
      text: 'Free delivery on orders over ₦20,000',
      backgroundColor: '#2C2C2C',
      textColor: '#FFFFFF',
      fontSize: 13,
    },
    nav: {
      links: [
        { label: 'Home', href: '/' },
        { label: 'Shop', href: '/products' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
      fontSize: 14,
      fontWeight: '500',
      color: '#2C2C2C',
      hoverColor: '#8B6F47',
      letterSpacing: 0.5,
    },
    actions: {
      showSearch: true,
      showCart: true,
      showAccount: true,
      iconColor: '#2C2C2C',
    },
    mobileMenu: {
      type: 'slide-in',
      backgroundColor: '#FFFFFF',
    },
  },
  components: [],
};

// ── CLASSIC FOOTER ────────────────────────────────────────────────────────────
// Four-column layout: logo + tagline, nav links, contact info, newsletter.
const classicFooter = {
  id: 'classic-footer',
  type: 'FOOTER',
  config: {
    layout: 'four-column',
    backgroundColor: '#2C2C2C',
    textColor: '#CCCCCC',
    linkColor: '#FFFFFF',
    borderTop: 'none',
    padding: { top: 64, right: 40, bottom: 40, left: 40 },
    columns: [
      {
        type: 'brand',
        logoMaxHeight: 40,
        tagline: 'Quality products delivered to your door.',
        socialLinks: true,
      },
      {
        type: 'links',
        heading: 'Shop',
        links: [
          { label: 'All Products', href: '/products' },
          { label: 'New Arrivals', href: '/products?tag=new-arrival' },
          { label: 'Best Sellers', href: '/products?tag=best-seller' },
          { label: 'Sale', href: '/products?tag=sale' },
        ],
      },
      {
        type: 'links',
        heading: 'Info',
        links: [
          { label: 'About Us', href: '/about' },
          { label: 'Contact', href: '/contact' },
          { label: 'Shipping Policy', href: '/policies/shipping' },
          { label: 'Return Policy', href: '/policies/returns' },
        ],
      },
      {
        type: 'newsletter',
        heading: 'Stay Updated',
        placeholder: 'Your email address',
        buttonLabel: 'Subscribe',
        buttonStyle: { backgroundColor: '#8B6F47', color: '#FFFFFF', borderRadius: 4 },
      },
    ],
    bottomBar: {
      text: '© {year} {businessName}. All rights reserved.',
      backgroundColor: '#1A1A1A',
      textColor: '#888888',
      fontSize: 12,
    },
  },
  components: [],
};


// ── CLASSIC HOME ──────────────────────────────────────────────────────────────
const classicHomeSchema = {
  version: '1.0',
  sections: [
    classicHeader,
    {
      id: 'classic-home-hero',
      type: 'HERO',
      config: {
        minHeight: 560,
        backgroundImage: pic('classic-hero', 1400, 700),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overlay: true,
        overlayColor: 'rgba(44,44,44,0.42)',
        contentAlignment: 'CENTER',
        padding: { top: 80, right: 40, bottom: 80, left: 40 },
      },
      components: [
        {
          id: 'classic-hero-h1',
          type: 'TEXT',
          config: {
            content: 'Welcome to Our Store',
            tag: 'h1',
            style: { fontSize: 52, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', lineHeight: 1.15 },
          },
        },
        {
          id: 'classic-hero-sub',
          type: 'TEXT',
          config: {
            content: 'Discover quality products curated just for you.',
            tag: 'p',
            style: { fontSize: 18, color: '#F0EDE8', textAlign: 'center', lineHeight: 1.6, margin: { top: 16, right: 0, bottom: 32, left: 0 } },
          },
        },
        {
          id: 'classic-hero-cta',
          type: 'BUTTON',
          config: {
            label: 'Shop Now',
            link: '/products',
            style: { backgroundColor: '#FFFFFF', color: '#2C2C2C', fontSize: 15, fontWeight: '600', borderRadius: 4, padding: { top: 14, right: 36, bottom: 14, left: 36 } },
            hoverStyle: { backgroundColor: '#F0EDE8' },
          },
        },
      ],
    },
    {
      id: 'classic-home-categories',
      type: 'CATEGORY_GRID',
      config: {
        heading: 'Shop by Category',
        headingStyle: { fontSize: 28, fontWeight: '700', color: '#2C2C2C', textAlign: 'center' },
        columns: { desktop: 3, tablet: 2, mobile: 1 },
        gap: 20,
        cardStyle: 'overlay-rounded',
        cardBorderRadius: 12,
        padding: { top: 64, right: 40, bottom: 64, left: 40 },
        backgroundColor: '#FAF8F5',
        placeholderCategories: [
          { image: pic('classic-cat1', 500, 400), name: 'Category One' },
          { image: pic('classic-cat2', 500, 400), name: 'Category Two' },
          { image: pic('classic-cat3', 500, 400), name: 'Category Three' },
        ],
      },
      components: [],
    },
    {
      id: 'classic-home-featured',
      type: 'FEATURED_PRODUCTS',
      config: {
        heading: 'Featured Products',
        subheading: 'Our most popular picks',
        headingStyle: { fontSize: 28, fontWeight: '700', color: '#2C2C2C', textAlign: 'center' },
        productCount: 4,
        columns: { desktop: 4, tablet: 2, mobile: 1 },
        gap: 24,
        cardStyle: 'rounded-shadow',
        cardBorderRadius: 10,
        showPrice: true,
        showAddToCart: true,
        padding: { top: 64, right: 40, bottom: 64, left: 40 },
        backgroundColor: '#FFFFFF',
        placeholderProducts: [
          { image: pic('classic-fp1', 400, 500), name: 'Product One', price: '₦12,500' },
          { image: pic('classic-fp2', 400, 500), name: 'Product Two', price: '₦8,000' },
          { image: pic('classic-fp3', 400, 500), name: 'Product Three', price: '₦15,000' },
          { image: pic('classic-fp4', 400, 500), name: 'Product Four', price: '₦6,500' },
        ],
      },
      components: [],
    },
    {
      id: 'classic-home-carousel',
      type: 'PRODUCT_CAROUSEL',
      config: {
        heading: 'New Arrivals',
        headingStyle: { fontSize: 28, fontWeight: '700', color: '#2C2C2C', textAlign: 'left' },
        tag: 'new-arrival',
        visibleCount: { desktop: 4, tablet: 2, mobile: 1 },
        gap: 20,
        cardStyle: 'rounded-shadow',
        showArrows: true,
        showDots: false,
        autoplay: false,
        padding: { top: 64, right: 40, bottom: 64, left: 40 },
        backgroundColor: '#FAF8F5',
        placeholderProducts: [
          { image: pic('classic-ca1', 400, 500), name: 'New Item 1', price: '₦9,000' },
          { image: pic('classic-ca2', 400, 500), name: 'New Item 2', price: '₦11,500' },
          { image: pic('classic-ca3', 400, 500), name: 'New Item 3', price: '₦7,200' },
          { image: pic('classic-ca4', 400, 500), name: 'New Item 4', price: '₦14,000' },
          { image: pic('classic-ca5', 400, 500), name: 'New Item 5', price: '₦5,500' },
          { image: pic('classic-ca6', 400, 500), name: 'New Item 6', price: '₦18,000' },
        ],
      },
      components: [],
    },
    {
      id: 'classic-home-banner',
      type: 'BANNER',
      config: {
        backgroundImage: pic('classic-promo', 1400, 400),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overlay: true,
        overlayColor: 'rgba(44,44,44,0.5)',
        minHeight: 300,
        contentAlignment: 'CENTER',
        padding: { top: 60, right: 40, bottom: 60, left: 40 },
      },
      components: [
        {
          id: 'classic-banner-h2',
          type: 'TEXT',
          config: {
            content: 'New Arrivals Every Week',
            tag: 'h2',
            style: { fontSize: 36, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
          },
        },
        {
          id: 'classic-banner-cta',
          type: 'BUTTON',
          config: {
            label: 'Explore New Arrivals',
            link: '/products',
            style: { backgroundColor: 'transparent', color: '#FFFFFF', fontSize: 14, fontWeight: '600', borderRadius: 4, borderWidth: 2, borderColor: '#FFFFFF', padding: { top: 12, right: 28, bottom: 12, left: 28 }, margin: { top: 20, right: 0, bottom: 0, left: 0 } },
            hoverStyle: { backgroundColor: '#FFFFFF', color: '#2C2C2C' },
          },
        },
      ],
    },
    {
      id: 'classic-home-newsletter',
      type: 'NEWSLETTER',
      config: {
        heading: 'Stay in the Loop',
        subheading: 'Get updates on new arrivals and exclusive offers.',
        buttonLabel: 'Subscribe',
        placeholder: 'Enter your email address',
        backgroundColor: '#2C2C2C',
        textColor: '#FFFFFF',
        padding: { top: 64, right: 40, bottom: 64, left: 40 },
        contentAlignment: 'CENTER',
      },
      components: [],
    },
    classicFooter,
  ],
};


// ── CLASSIC PRODUCTS PAGE ─────────────────────────────────────────────────────
// Sidebar with category tree (parent → subcategory drill-down) + paginated grid.
const classicProductsSchema = {
  version: '1.0',
  sections: [
    classicHeader,
    {
      id: 'classic-products-breadcrumb',
      type: 'BREADCRUMB',
      config: {
        backgroundColor: '#FAF8F5',
        padding: { top: 16, right: 40, bottom: 16, left: 40 },
        separator: '/',
        textColor: '#888888',
        activeColor: '#2C2C2C',
        fontSize: 13,
      },
      components: [],
    },
    {
      id: 'classic-products-layout',
      type: 'PRODUCT_LISTING',
      config: {
        layout: 'sidebar-left',
        backgroundColor: '#FFFFFF',
        padding: { top: 40, right: 40, bottom: 64, left: 40 },
        sidebar: {
          width: 240,
          backgroundColor: '#FFFFFF',
          filters: [
            {
              type: 'CATEGORY_TREE',
              heading: 'Categories',
              // Renders the full category tree with expand/collapse for subcategories.
              // Selecting a parent shows all products in that category and its children.
              // Selecting a subcategory narrows to just that subcategory.
              showProductCount: true,
            },
            {
              type: 'PRICE_RANGE',
              heading: 'Price',
              currency: 'NGN',
            },
            {
              type: 'AVAILABILITY',
              heading: 'Availability',
              options: ['In Stock', 'Out of Stock'],
            },
          ],
        },
        grid: {
          columns: { desktop: 3, tablet: 2, mobile: 1 },
          gap: 24,
          cardStyle: 'rounded-shadow',
          cardBorderRadius: 10,
          showPrice: true,
          showAddToCart: true,
        },
        pagination: {
          type: 'numbered',       // numbered page buttons
          perPage: 12,
          showPerPageSelector: true,
          perPageOptions: [12, 24, 48],
        },
        sorting: {
          enabled: true,
          options: [
            { label: 'Featured', value: 'featured' },
            { label: 'Newest', value: 'newest' },
            { label: 'Price: Low to High', value: 'price_asc' },
            { label: 'Price: High to Low', value: 'price_desc' },
          ],
          default: 'featured',
        },
        search: {
          enabled: true,
          placeholder: 'Search products...',
        },
        placeholderProducts: [
          { image: pic('classic-pg1', 400, 500), name: 'Product A', price: '₦9,000' },
          { image: pic('classic-pg2', 400, 500), name: 'Product B', price: '₦11,500' },
          { image: pic('classic-pg3', 400, 500), name: 'Product C', price: '₦7,200' },
          { image: pic('classic-pg4', 400, 500), name: 'Product D', price: '₦14,000' },
          { image: pic('classic-pg5', 400, 500), name: 'Product E', price: '₦5,500' },
          { image: pic('classic-pg6', 400, 500), name: 'Product F', price: '₦18,000' },
          { image: pic('classic-pg7', 400, 500), name: 'Product G', price: '₦3,800' },
          { image: pic('classic-pg8', 400, 500), name: 'Product H', price: '₦22,000' },
          { image: pic('classic-pg9', 400, 500), name: 'Product I', price: '₦9,500' },
          { image: pic('classic-pg10', 400, 500), name: 'Product J', price: '₦13,000' },
          { image: pic('classic-pg11', 400, 500), name: 'Product K', price: '₦6,800' },
          { image: pic('classic-pg12', 400, 500), name: 'Product L', price: '₦16,500' },
        ],
      },
      components: [],
    },
    classicFooter,
  ],
};

// ── CLASSIC PRODUCT DETAIL ────────────────────────────────────────────────────
const classicProductDetailSchema = {
  version: '1.0',
  sections: [
    classicHeader,
    {
      id: 'classic-pd-breadcrumb',
      type: 'BREADCRUMB',
      config: {
        backgroundColor: '#FAF8F5',
        padding: { top: 16, right: 40, bottom: 16, left: 40 },
        separator: '/',
        textColor: '#888888',
        activeColor: '#2C2C2C',
        fontSize: 13,
      },
      components: [],
    },
    {
      id: 'classic-pd-main',
      type: 'PRODUCT_DETAIL',
      config: {
        layout: 'two-column',
        imageAspectRatio: '3/4',
        imageBorderRadius: 10,
        thumbnailPosition: 'bottom',
        showBreadcrumb: false,
        showReviews: true,
        showRelated: false,
        padding: { top: 48, right: 40, bottom: 64, left: 40 },
        backgroundColor: '#FFFFFF',
        placeholderImages: [
          pic('classic-pd1', 600, 750),
          pic('classic-pd2', 600, 750),
          pic('classic-pd3', 600, 750),
        ],
      },
      components: [],
    },
    {
      id: 'classic-pd-related',
      type: 'PRODUCT_CAROUSEL',
      config: {
        heading: 'You May Also Like',
        headingStyle: { fontSize: 24, fontWeight: '700', color: '#2C2C2C', textAlign: 'left' },
        visibleCount: { desktop: 4, tablet: 2, mobile: 1 },
        gap: 20,
        cardStyle: 'rounded-shadow',
        showArrows: true,
        showDots: false,
        padding: { top: 48, right: 40, bottom: 64, left: 40 },
        backgroundColor: '#FAF8F5',
        placeholderProducts: [
          { image: pic('classic-rel1', 400, 500), name: 'Related One', price: '₦8,500' },
          { image: pic('classic-rel2', 400, 500), name: 'Related Two', price: '₦12,000' },
          { image: pic('classic-rel3', 400, 500), name: 'Related Three', price: '₦6,000' },
          { image: pic('classic-rel4', 400, 500), name: 'Related Four', price: '₦9,500' },
        ],
      },
      components: [],
    },
    classicFooter,
  ],
};

// ── CLASSIC ABOUT ─────────────────────────────────────────────────────────────
const classicAboutSchema = {
  version: '1.0',
  sections: [
    classicHeader,
    {
      id: 'classic-about-hero',
      type: 'HERO',
      config: {
        minHeight: 340,
        backgroundImage: pic('classic-about-hero', 1400, 500),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overlay: true,
        overlayColor: 'rgba(44,44,44,0.5)',
        contentAlignment: 'CENTER',
        padding: { top: 80, right: 40, bottom: 80, left: 40 },
      },
      components: [
        { id: 'classic-about-h1', type: 'TEXT', config: { content: 'About Us', tag: 'h1', style: { fontSize: 48, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' } } },
      ],
    },
    {
      id: 'classic-about-story',
      type: 'RICH_TEXT',
      config: {
        backgroundColor: '#FFFFFF',
        contentAlignment: 'CENTER',
        padding: { top: 72, right: 160, bottom: 72, left: 160 },
      },
      components: [
        { id: 'classic-about-h2', type: 'TEXT', config: { content: 'Our Story', tag: 'h2', style: { fontSize: 32, fontWeight: '700', color: '#2C2C2C', textAlign: 'center' } } },
        { id: 'classic-about-body', type: 'TEXT', config: { content: 'We started with a simple idea: make great products accessible to everyone. Today we serve thousands of happy customers across the country.', tag: 'p', style: { fontSize: 17, color: '#555555', textAlign: 'center', lineHeight: 1.8, margin: { top: 20, right: 0, bottom: 0, left: 0 } } } },
      ],
    },
    {
      id: 'classic-about-img',
      type: 'RICH_TEXT',
      config: { backgroundColor: '#FAF8F5', padding: { top: 0, right: 0, bottom: 0, left: 0 } },
      components: [
        { id: 'classic-about-photo', type: 'IMAGE', config: { src: pic('classic-about-team', 1400, 500), alt: 'Our team', style: { width: '100%', objectFit: 'cover', aspectRatio: '14/5' } } },
      ],
    },
    classicFooter,
  ],
};

// ── CLASSIC CONTACT ───────────────────────────────────────────────────────────
const classicContactSchema = {
  version: '1.0',
  sections: [
    classicHeader,
    {
      id: 'classic-contact-header',
      type: 'RICH_TEXT',
      config: { backgroundColor: '#FAF8F5', contentAlignment: 'CENTER', padding: { top: 64, right: 40, bottom: 48, left: 40 } },
      components: [
        { id: 'classic-contact-h1', type: 'TEXT', config: { content: 'Contact Us', tag: 'h1', style: { fontSize: 40, fontWeight: '700', color: '#2C2C2C', textAlign: 'center' } } },
        { id: 'classic-contact-sub', type: 'TEXT', config: { content: "We'd love to hear from you. Fill in the form and we'll get back to you shortly.", tag: 'p', style: { fontSize: 16, color: '#666666', textAlign: 'center', margin: { top: 12, right: 0, bottom: 0, left: 0 } } } },
      ],
    },
    {
      id: 'classic-contact-form',
      type: 'CONTACT_FORM',
      config: { fields: ['name', 'email', 'message'], submitLabel: 'Send Message', backgroundColor: '#FFFFFF', padding: { top: 48, right: 160, bottom: 72, left: 160 }, contentAlignment: 'CENTER' },
      components: [],
    },
    classicFooter,
  ],
};

// ── CLASSIC POLICY ────────────────────────────────────────────────────────────
const classicPolicySchema = {
  version: '1.0',
  sections: [
    classicHeader,
    {
      id: 'classic-policy-content',
      type: 'RICH_TEXT',
      config: { backgroundColor: '#FFFFFF', padding: { top: 64, right: 160, bottom: 80, left: 160 } },
      components: [
        { id: 'classic-policy-h1', type: 'TEXT', config: { content: 'Store Policy', tag: 'h1', style: { fontSize: 36, fontWeight: '700', color: '#2C2C2C' } } },
        { id: 'classic-policy-body', type: 'TEXT', config: { content: 'Update this page with your return policy, shipping policy, and terms of service.', tag: 'p', style: { fontSize: 16, color: '#555555', lineHeight: 1.8, margin: { top: 24, right: 0, bottom: 0, left: 0 } } } },
      ],
    },
    classicFooter,
  ],
};


// ═══════════════════════════════════════════════════════════════════════════════
// BOLD TEMPLATE
// Design language: full-bleed imagery, left-aligned editorial text, dark/black
// accents, zero border-radius, edge-to-edge product cards, uppercase labels.
// ═══════════════════════════════════════════════════════════════════════════════

// ── BOLD HEADER ───────────────────────────────────────────────────────────────
// Logo left, nav right, full-width dark bar. No announcement bar.
const boldHeader = {
  id: 'bold-header',
  type: 'HEADER',
  config: {
    layout: 'logo-left-nav-right',
    sticky: true,
    backgroundColor: '#111111',
    borderBottom: 'none',
    logoMaxHeight: 36,
    nav: {
      links: [
        { label: 'SHOP', href: '/products' },
        { label: 'NEW IN', href: '/products?tag=new-arrival' },
        { label: 'SALE', href: '/products?tag=sale' },
        { label: 'ABOUT', href: '/about' },
      ],
      fontSize: 12,
      fontWeight: '700',
      color: '#FFFFFF',
      hoverColor: '#AAAAAA',
      letterSpacing: 2,
    },
    actions: {
      showSearch: true,
      showCart: true,
      showAccount: false,
      iconColor: '#FFFFFF',
    },
    mobileMenu: {
      type: 'full-screen',
      backgroundColor: '#111111',
      textColor: '#FFFFFF',
    },
  },
  components: [],
};

// ── BOLD FOOTER ───────────────────────────────────────────────────────────────
// Two-column: brand left, links right. Stark black background.
const boldFooter = {
  id: 'bold-footer',
  type: 'FOOTER',
  config: {
    layout: 'two-column-split',
    backgroundColor: '#111111',
    textColor: '#888888',
    linkColor: '#FFFFFF',
    borderTop: '1px solid #333333',
    padding: { top: 64, right: 80, bottom: 48, left: 80 },
    columns: [
      {
        type: 'brand',
        logoMaxHeight: 32,
        tagline: null,
        socialLinks: true,
        socialIconColor: '#FFFFFF',
      },
      {
        type: 'multi-links',
        groups: [
          {
            heading: 'SHOP',
            links: [
              { label: 'All Products', href: '/products' },
              { label: 'New In', href: '/products?tag=new-arrival' },
              { label: 'Sale', href: '/products?tag=sale' },
            ],
          },
          {
            heading: 'HELP',
            links: [
              { label: 'Contact', href: '/contact' },
              { label: 'Shipping', href: '/policies/shipping' },
              { label: 'Returns', href: '/policies/returns' },
            ],
          },
        ],
      },
    ],
    bottomBar: {
      text: '© {year} {businessName}',
      backgroundColor: '#000000',
      textColor: '#555555',
      fontSize: 11,
      letterSpacing: 1,
    },
  },
  components: [],
};


// ── BOLD HOME ─────────────────────────────────────────────────────────────────
const boldHomeSchema = {
  version: '1.0',
  sections: [
    boldHeader,
    {
      id: 'bold-home-hero',
      type: 'HERO',
      config: {
        minHeight: 700,
        backgroundImage: pic('bold-hero', 1600, 900),
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        overlay: true,
        overlayColor: 'rgba(0,0,0,0.52)',
        contentAlignment: 'LEFT',
        padding: { top: 120, right: 80, bottom: 120, left: 80 },
      },
      components: [
        { id: 'bold-hero-eyebrow', type: 'TEXT', config: { content: 'NEW COLLECTION', tag: 'p', style: { fontSize: 11, fontWeight: '700', color: '#FFFFFF', letterSpacing: 5, margin: { top: 0, right: 0, bottom: 16, left: 0 } } } },
        { id: 'bold-hero-h1', type: 'TEXT', config: { content: 'Make a Statement', tag: 'h1', style: { fontSize: 76, fontWeight: '900', color: '#FFFFFF', lineHeight: 1.0, letterSpacing: -2 } } },
        { id: 'bold-hero-sub', type: 'TEXT', config: { content: 'Bold designs for bold people.', tag: 'p', style: { fontSize: 20, color: '#CCCCCC', lineHeight: 1.5, margin: { top: 20, right: 0, bottom: 40, left: 0 } } } },
        { id: 'bold-hero-cta', type: 'BUTTON', config: { label: 'SHOP THE COLLECTION', link: '/products', style: { backgroundColor: '#FFFFFF', color: '#000000', fontSize: 12, fontWeight: '700', borderRadius: 0, padding: { top: 16, right: 40, bottom: 16, left: 40 }, letterSpacing: 2 }, hoverStyle: { backgroundColor: '#DDDDDD' } } },
      ],
    },
    {
      id: 'bold-home-ticker',
      type: 'RICH_TEXT',
      config: { backgroundColor: '#FFFFFF', padding: { top: 18, right: 0, bottom: 18, left: 0 }, contentAlignment: 'CENTER' },
      components: [
        { id: 'bold-ticker-text', type: 'TEXT', config: { content: 'FREE SHIPPING OVER ₦20,000  ·  NEW DROPS WEEKLY  ·  QUALITY GUARANTEED  ·  FREE RETURNS', tag: 'p', style: { fontSize: 11, fontWeight: '700', color: '#111111', textAlign: 'center', letterSpacing: 3 } } },
      ],
    },
    {
      id: 'bold-home-featured',
      type: 'FEATURED_PRODUCTS',
      config: {
        heading: 'BEST SELLERS',
        headingStyle: { fontSize: 13, fontWeight: '700', color: '#111111', textAlign: 'left', letterSpacing: 3 },
        productCount: 4,
        columns: { desktop: 4, tablet: 2, mobile: 1 },
        gap: 2,
        cardStyle: 'edge-to-edge',
        cardBorderRadius: 0,
        showPrice: true,
        showAddToCart: false,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        headingPadding: { top: 56, right: 80, bottom: 24, left: 80 },
        backgroundColor: '#FFFFFF',
        placeholderProducts: [
          { image: pic('bold-fp1', 500, 620), name: 'ITEM ONE', price: '₦18,000' },
          { image: pic('bold-fp2', 500, 620), name: 'ITEM TWO', price: '₦24,500' },
          { image: pic('bold-fp3', 500, 620), name: 'ITEM THREE', price: '₦11,000' },
          { image: pic('bold-fp4', 500, 620), name: 'ITEM FOUR', price: '₦32,000' },
        ],
      },
      components: [],
    },
    {
      id: 'bold-home-carousel',
      type: 'PRODUCT_CAROUSEL',
      config: {
        heading: 'JUST DROPPED',
        headingStyle: { fontSize: 13, fontWeight: '700', color: '#111111', textAlign: 'left', letterSpacing: 3 },
        tag: 'new-arrival',
        visibleCount: { desktop: 3, tablet: 2, mobile: 1 },
        gap: 2,
        cardStyle: 'edge-to-edge',
        showArrows: true,
        arrowStyle: { backgroundColor: '#111111', color: '#FFFFFF', borderRadius: 0 },
        showDots: false,
        autoplay: false,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        headingPadding: { top: 56, right: 80, bottom: 24, left: 80 },
        backgroundColor: '#F5F0EB',
        placeholderProducts: [
          { image: pic('bold-ca1', 500, 620), name: 'DROP 1', price: '₦14,000' },
          { image: pic('bold-ca2', 500, 620), name: 'DROP 2', price: '₦9,500' },
          { image: pic('bold-ca3', 500, 620), name: 'DROP 3', price: '₦21,000' },
          { image: pic('bold-ca4', 500, 620), name: 'DROP 4', price: '₦7,800' },
          { image: pic('bold-ca5', 500, 620), name: 'DROP 5', price: '₦16,500' },
        ],
      },
      components: [],
    },
    {
      id: 'bold-home-split',
      type: 'BANNER',
      config: {
        layout: 'split',
        backgroundImage: pic('bold-split', 700, 700),
        backgroundColor: '#F5F0EB',
        minHeight: 500,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      },
      components: [
        { id: 'bold-split-eyebrow', type: 'TEXT', config: { content: 'LIMITED EDITION', tag: 'p', style: { fontSize: 10, fontWeight: '700', color: '#888888', letterSpacing: 4 } } },
        { id: 'bold-split-h2', type: 'TEXT', config: { content: "The Drop You've Been Waiting For", tag: 'h2', style: { fontSize: 40, fontWeight: '800', color: '#111111', lineHeight: 1.1, margin: { top: 16, right: 0, bottom: 24, left: 0 } } } },
        { id: 'bold-split-cta', type: 'BUTTON', config: { label: 'SHOP NOW', link: '/products', style: { backgroundColor: '#111111', color: '#FFFFFF', fontSize: 11, fontWeight: '700', borderRadius: 0, padding: { top: 14, right: 32, bottom: 14, left: 32 }, letterSpacing: 2 }, hoverStyle: { backgroundColor: '#333333' } } },
      ],
    },
    {
      id: 'bold-home-newsletter',
      type: 'NEWSLETTER',
      config: {
        heading: 'JOIN THE INNER CIRCLE',
        subheading: 'Be first to know about drops, exclusives, and offers.',
        buttonLabel: 'JOIN NOW',
        placeholder: 'Your email address',
        backgroundColor: '#111111',
        textColor: '#FFFFFF',
        padding: { top: 80, right: 80, bottom: 80, left: 80 },
        contentAlignment: 'CENTER',
        headingLetterSpacing: 3,
      },
      components: [],
    },
    boldFooter,
  ],
};


// ── BOLD PRODUCTS PAGE ────────────────────────────────────────────────────────
// Top filter bar (no sidebar), edge-to-edge grid, load-more pagination.
const boldProductsSchema = {
  version: '1.0',
  sections: [
    boldHeader,
    {
      id: 'bold-products-hero',
      type: 'HERO',
      config: {
        minHeight: 240,
        backgroundImage: pic('bold-products-hero', 1400, 400),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overlay: true,
        overlayColor: 'rgba(0,0,0,0.6)',
        contentAlignment: 'CENTER',
        padding: { top: 60, right: 40, bottom: 60, left: 40 },
      },
      components: [
        { id: 'bold-products-h1', type: 'TEXT', config: { content: 'SHOP ALL', tag: 'h1', style: { fontSize: 52, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', letterSpacing: -1 } } },
      ],
    },
    {
      id: 'bold-products-listing',
      type: 'PRODUCT_LISTING',
      config: {
        layout: 'top-filter-bar',
        backgroundColor: '#FFFFFF',
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        filterBar: {
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #EEEEEE',
          padding: { top: 16, right: 80, bottom: 16, left: 80 },
          filters: [
            {
              type: 'CATEGORY_DROPDOWN',
              label: 'CATEGORY',
              // Dropdown shows parent categories; selecting one reveals subcategory chips below.
              showSubcategoryChips: true,
            },
            {
              type: 'PRICE_RANGE',
              label: 'PRICE',
            },
            {
              type: 'AVAILABILITY',
              label: 'AVAILABILITY',
            },
          ],
          sorting: {
            enabled: true,
            options: [
              { label: 'NEWEST', value: 'newest' },
              { label: 'PRICE ↑', value: 'price_asc' },
              { label: 'PRICE ↓', value: 'price_desc' },
            ],
            default: 'newest',
          },
        },
        grid: {
          columns: { desktop: 3, tablet: 2, mobile: 1 },
          gap: 2,
          cardStyle: 'edge-to-edge',
          cardBorderRadius: 0,
          showPrice: true,
          showAddToCart: false,
        },
        pagination: {
          type: 'load-more',
          perPage: 9,
          buttonLabel: 'LOAD MORE',
          buttonStyle: { backgroundColor: '#111111', color: '#FFFFFF', borderRadius: 0, letterSpacing: 2, fontSize: 12 },
        },
        placeholderProducts: [
          { image: pic('bold-pg1', 500, 620), name: 'PRODUCT A', price: '₦14,000' },
          { image: pic('bold-pg2', 500, 620), name: 'PRODUCT B', price: '₦9,500' },
          { image: pic('bold-pg3', 500, 620), name: 'PRODUCT C', price: '₦21,000' },
          { image: pic('bold-pg4', 500, 620), name: 'PRODUCT D', price: '₦7,800' },
          { image: pic('bold-pg5', 500, 620), name: 'PRODUCT E', price: '₦16,500' },
          { image: pic('bold-pg6', 500, 620), name: 'PRODUCT F', price: '₦28,000' },
          { image: pic('bold-pg7', 500, 620), name: 'PRODUCT G', price: '₦11,000' },
          { image: pic('bold-pg8', 500, 620), name: 'PRODUCT H', price: '₦19,500' },
          { image: pic('bold-pg9', 500, 620), name: 'PRODUCT I', price: '₦8,200' },
        ],
      },
      components: [],
    },
    boldFooter,
  ],
};

// ── BOLD PRODUCT DETAIL ───────────────────────────────────────────────────────
const boldProductDetailSchema = {
  version: '1.0',
  sections: [
    boldHeader,
    {
      id: 'bold-pd-main',
      type: 'PRODUCT_DETAIL',
      config: {
        layout: 'two-column',
        imageAspectRatio: '4/5',
        imageBorderRadius: 0,
        thumbnailPosition: 'left',
        showBreadcrumb: false,
        showReviews: true,
        showRelated: false,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        backgroundColor: '#FFFFFF',
        placeholderImages: [
          pic('bold-pd1', 700, 875),
          pic('bold-pd2', 700, 875),
          pic('bold-pd3', 700, 875),
        ],
      },
      components: [],
    },
    {
      id: 'bold-pd-related',
      type: 'PRODUCT_CAROUSEL',
      config: {
        heading: 'COMPLETE THE LOOK',
        headingStyle: { fontSize: 12, fontWeight: '700', color: '#111111', textAlign: 'left', letterSpacing: 3 },
        visibleCount: { desktop: 3, tablet: 2, mobile: 1 },
        gap: 2,
        cardStyle: 'edge-to-edge',
        showArrows: true,
        arrowStyle: { backgroundColor: '#111111', color: '#FFFFFF', borderRadius: 0 },
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        headingPadding: { top: 56, right: 80, bottom: 24, left: 80 },
        backgroundColor: '#F5F0EB',
        placeholderProducts: [
          { image: pic('bold-rel1', 500, 620), name: 'RELATED ONE', price: '₦18,000' },
          { image: pic('bold-rel2', 500, 620), name: 'RELATED TWO', price: '₦12,000' },
          { image: pic('bold-rel3', 500, 620), name: 'RELATED THREE', price: '₦9,500' },
        ],
      },
      components: [],
    },
    boldFooter,
  ],
};

// ── BOLD ABOUT ────────────────────────────────────────────────────────────────
const boldAboutSchema = {
  version: '1.0',
  sections: [
    boldHeader,
    {
      id: 'bold-about-hero',
      type: 'HERO',
      config: {
        minHeight: 500,
        backgroundImage: pic('bold-about', 1600, 700),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overlay: true,
        overlayColor: 'rgba(0,0,0,0.6)',
        contentAlignment: 'LEFT',
        padding: { top: 120, right: 80, bottom: 120, left: 80 },
      },
      components: [
        { id: 'bold-about-h1', type: 'TEXT', config: { content: 'WHO WE ARE', tag: 'h1', style: { fontSize: 64, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2 } } },
      ],
    },
    {
      id: 'bold-about-body',
      type: 'RICH_TEXT',
      config: { backgroundColor: '#FFFFFF', padding: { top: 80, right: 80, bottom: 80, left: 80 } },
      components: [
        { id: 'bold-about-text', type: 'TEXT', config: { content: 'We are a brand built on passion, quality, and community. Every product we carry is chosen with intention.', tag: 'p', style: { fontSize: 22, color: '#111111', lineHeight: 1.7 } } },
      ],
    },
    boldFooter,
  ],
};

// ── BOLD CONTACT ──────────────────────────────────────────────────────────────
const boldContactSchema = {
  version: '1.0',
  sections: [
    boldHeader,
    {
      id: 'bold-contact-header',
      type: 'RICH_TEXT',
      config: { backgroundColor: '#111111', contentAlignment: 'LEFT', padding: { top: 80, right: 80, bottom: 80, left: 80 } },
      components: [
        { id: 'bold-contact-h1', type: 'TEXT', config: { content: 'GET IN TOUCH', tag: 'h1', style: { fontSize: 56, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2 } } },
      ],
    },
    {
      id: 'bold-contact-form',
      type: 'CONTACT_FORM',
      config: { fields: ['name', 'email', 'message'], submitLabel: 'SEND IT', backgroundColor: '#FFFFFF', padding: { top: 64, right: 80, bottom: 80, left: 80 }, contentAlignment: 'LEFT' },
      components: [],
    },
    boldFooter,
  ],
};

// ── BOLD POLICY ───────────────────────────────────────────────────────────────
const boldPolicySchema = {
  version: '1.0',
  sections: [
    boldHeader,
    {
      id: 'bold-policy-content',
      type: 'RICH_TEXT',
      config: { backgroundColor: '#FFFFFF', padding: { top: 80, right: 80, bottom: 80, left: 80 } },
      components: [
        { id: 'bold-policy-h1', type: 'TEXT', config: { content: 'STORE POLICY', tag: 'h1', style: { fontSize: 48, fontWeight: '900', color: '#111111', letterSpacing: -1 } } },
        { id: 'bold-policy-body', type: 'TEXT', config: { content: 'Update this page with your return policy, shipping policy, and terms of service.', tag: 'p', style: { fontSize: 17, color: '#444444', lineHeight: 1.8, margin: { top: 28, right: 0, bottom: 0, left: 0 } } } },
      ],
    },
    boldFooter,
  ],
};


// ═══════════════════════════════════════════════════════════════════════════════
// MINIMAL TEMPLATE
// Design language: light off-white background, thin typography, generous
// whitespace, no shadows, no border-radius, inline category pills for filtering,
// infinite scroll pagination.
// ═══════════════════════════════════════════════════════════════════════════════

// ── MINIMAL HEADER ────────────────────────────────────────────────────────────
// Logo centered, nav links below it as a thin line. Transparent on hero, white on scroll.
const minimalHeader = {
  id: 'minimal-header',
  type: 'HEADER',
  config: {
    layout: 'centered-logo-nav-below',
    sticky: true,
    transparentOnHero: true,
    backgroundColor: '#FAFAF8',
    scrolledBackgroundColor: '#FAFAF8',
    borderBottom: '1px solid #E8E8E4',
    logoMaxHeight: 32,
    nav: {
      links: [
        { label: 'Shop', href: '/products' },
        { label: 'Collections', href: '/products' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
      fontSize: 13,
      fontWeight: '400',
      color: '#1A1A1A',
      hoverColor: '#888888',
      letterSpacing: 1,
    },
    actions: {
      showSearch: false,
      showCart: true,
      showAccount: false,
      iconColor: '#1A1A1A',
    },
    mobileMenu: {
      type: 'slide-in',
      backgroundColor: '#FAFAF8',
      textColor: '#1A1A1A',
    },
  },
  components: [],
};

// ── MINIMAL FOOTER ────────────────────────────────────────────────────────────
// Single centered column. Minimal links, social icons, copyright.
const minimalFooter = {
  id: 'minimal-footer',
  type: 'FOOTER',
  config: {
    layout: 'centered-single-column',
    backgroundColor: '#1A1A1A',
    textColor: '#888888',
    linkColor: '#CCCCCC',
    borderTop: 'none',
    padding: { top: 64, right: 80, bottom: 48, left: 80 },
    columns: [
      {
        type: 'centered-brand',
        logoMaxHeight: 28,
        logoFilter: 'brightness(0) invert(1)',
        socialLinks: true,
        socialIconColor: '#CCCCCC',
        socialIconSize: 18,
      },
    ],
    navLinks: [
      { label: 'Shop', href: '/products' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Returns', href: '/policies/returns' },
    ],
    navFontSize: 12,
    navLetterSpacing: 1,
    bottomBar: {
      text: '© {year} {businessName}',
      backgroundColor: '#1A1A1A',
      textColor: '#555555',
      fontSize: 11,
    },
  },
  components: [],
};


// ── MINIMAL HOME ──────────────────────────────────────────────────────────────
const minimalHomeSchema = {
  version: '1.0',
  sections: [
    minimalHeader,
    {
      id: 'minimal-home-hero',
      type: 'HERO',
      config: {
        minHeight: 520,
        backgroundImage: null,
        backgroundColor: '#FAFAF8',
        overlay: false,
        contentAlignment: 'CENTER',
        padding: { top: 100, right: 80, bottom: 100, left: 80 },
      },
      components: [
        { id: 'minimal-hero-h1', type: 'TEXT', config: { content: 'Crafted with Care', tag: 'h1', style: { fontSize: 60, fontWeight: '300', color: '#1A1A1A', textAlign: 'center', lineHeight: 1.1, letterSpacing: -1 } } },
        { id: 'minimal-hero-sub', type: 'TEXT', config: { content: 'Premium products for the discerning customer.', tag: 'p', style: { fontSize: 17, color: '#888888', textAlign: 'center', lineHeight: 1.7, margin: { top: 20, right: 0, bottom: 40, left: 0 } } } },
        { id: 'minimal-hero-cta', type: 'BUTTON', config: { label: 'Explore', link: '/products', style: { backgroundColor: 'transparent', color: '#1A1A1A', fontSize: 13, fontWeight: '500', borderRadius: 0, borderWidth: 1, borderColor: '#1A1A1A', padding: { top: 12, right: 32, bottom: 12, left: 32 }, letterSpacing: 2 }, hoverStyle: { backgroundColor: '#1A1A1A', color: '#FFFFFF' } } },
      ],
    },
    {
      id: 'minimal-home-divider',
      type: 'RICH_TEXT',
      config: { backgroundColor: '#FFFFFF', padding: { top: 0, right: 80, bottom: 0, left: 80 } },
      components: [
        { id: 'minimal-divider', type: 'DIVIDER', config: { style: { borderColor: '#E8E8E4', borderWidth: 1 } } },
      ],
    },
    {
      id: 'minimal-home-featured',
      type: 'FEATURED_PRODUCTS',
      config: {
        heading: 'Selected Works',
        headingStyle: { fontSize: 13, fontWeight: '400', color: '#888888', textAlign: 'left', letterSpacing: 2 },
        productCount: 3,
        columns: { desktop: 3, tablet: 2, mobile: 1 },
        gap: 40,
        cardStyle: 'minimal',
        cardBorderRadius: 0,
        showPrice: true,
        showAddToCart: false,
        padding: { top: 80, right: 80, bottom: 80, left: 80 },
        backgroundColor: '#FFFFFF',
        placeholderProducts: [
          { image: pic('minimal-fp1', 500, 620), name: 'Piece One', price: '₦28,000' },
          { image: pic('minimal-fp2', 500, 620), name: 'Piece Two', price: '₦45,000' },
          { image: pic('minimal-fp3', 500, 620), name: 'Piece Three', price: '₦19,500' },
        ],
      },
      components: [],
    },
    {
      id: 'minimal-home-carousel',
      type: 'PRODUCT_CAROUSEL',
      config: {
        heading: 'New Arrivals',
        headingStyle: { fontSize: 13, fontWeight: '400', color: '#888888', textAlign: 'left', letterSpacing: 2 },
        tag: 'new-arrival',
        visibleCount: { desktop: 4, tablet: 2, mobile: 1 },
        gap: 32,
        cardStyle: 'minimal',
        showArrows: true,
        arrowStyle: { backgroundColor: 'transparent', color: '#1A1A1A', borderRadius: 0, border: '1px solid #1A1A1A' },
        showDots: true,
        dotStyle: { activeColor: '#1A1A1A', inactiveColor: '#CCCCCC' },
        autoplay: false,
        padding: { top: 80, right: 80, bottom: 80, left: 80 },
        backgroundColor: '#FAFAF8',
        placeholderProducts: [
          { image: pic('minimal-ca1', 400, 500), name: 'New One', price: '₦22,000' },
          { image: pic('minimal-ca2', 400, 500), name: 'New Two', price: '₦15,000' },
          { image: pic('minimal-ca3', 400, 500), name: 'New Three', price: '₦38,000' },
          { image: pic('minimal-ca4', 400, 500), name: 'New Four', price: '₦12,500' },
          { image: pic('minimal-ca5', 400, 500), name: 'New Five', price: '₦29,000' },
        ],
      },
      components: [],
    },
    {
      id: 'minimal-home-categories',
      type: 'CATEGORY_GRID',
      config: {
        heading: 'Collections',
        headingStyle: { fontSize: 13, fontWeight: '400', color: '#888888', textAlign: 'left', letterSpacing: 2 },
        columns: { desktop: 2, tablet: 2, mobile: 1 },
        gap: 2,
        cardStyle: 'minimal-overlay',
        cardBorderRadius: 0,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        headingPadding: { top: 80, right: 80, bottom: 24, left: 80 },
        backgroundColor: '#FFFFFF',
        placeholderCategories: [
          { image: pic('minimal-cat1', 700, 500), name: 'Collection One' },
          { image: pic('minimal-cat2', 700, 500), name: 'Collection Two' },
        ],
      },
      components: [],
    },
    {
      id: 'minimal-home-newsletter',
      type: 'NEWSLETTER',
      config: {
        heading: 'Stay Connected',
        subheading: 'Occasional updates. No noise.',
        buttonLabel: 'Subscribe',
        placeholder: 'Email address',
        backgroundColor: '#1A1A1A',
        textColor: '#FFFFFF',
        padding: { top: 80, right: 80, bottom: 80, left: 80 },
        contentAlignment: 'CENTER',
      },
      components: [],
    },
    minimalFooter,
  ],
};


// ── MINIMAL PRODUCTS PAGE ─────────────────────────────────────────────────────
// Category pills row at top, clean grid, infinite scroll.
const minimalProductsSchema = {
  version: '1.0',
  sections: [
    minimalHeader,
    {
      id: 'minimal-products-header',
      type: 'RICH_TEXT',
      config: { backgroundColor: '#FAFAF8', contentAlignment: 'CENTER', padding: { top: 72, right: 80, bottom: 40, left: 80 } },
      components: [
        { id: 'minimal-products-h1', type: 'TEXT', config: { content: 'All Products', tag: 'h1', style: { fontSize: 44, fontWeight: '300', color: '#1A1A1A', textAlign: 'center', letterSpacing: -1 } } },
      ],
    },
    {
      id: 'minimal-products-listing',
      type: 'PRODUCT_LISTING',
      config: {
        layout: 'pill-filter-top',
        backgroundColor: '#FAFAF8',
        padding: { top: 0, right: 80, bottom: 80, left: 80 },
        pillFilter: {
          // Horizontal scrollable row of category pills.
          // First pill is "All". Then parent categories. Clicking a parent
          // expands a second row of subcategory pills below it.
          showAllPill: true,
          allPillLabel: 'All',
          pillStyle: {
            backgroundColor: 'transparent',
            color: '#1A1A1A',
            borderRadius: 0,
            borderWidth: 1,
            borderColor: '#CCCCCC',
            fontSize: 12,
            letterSpacing: 1,
            padding: { top: 8, right: 20, bottom: 8, left: 20 },
          },
          activePillStyle: {
            backgroundColor: '#1A1A1A',
            color: '#FFFFFF',
            borderColor: '#1A1A1A',
          },
          subcategoryRow: {
            enabled: true,
            indented: false,
            pillStyle: {
              backgroundColor: 'transparent',
              color: '#888888',
              borderRadius: 0,
              borderWidth: 1,
              borderColor: '#E8E8E4',
              fontSize: 11,
              letterSpacing: 1,
            },
            activePillStyle: {
              color: '#1A1A1A',
              borderColor: '#1A1A1A',
            },
          },
        },
        grid: {
          columns: { desktop: 4, tablet: 2, mobile: 1 },
          gap: 32,
          cardStyle: 'minimal',
          cardBorderRadius: 0,
          showPrice: true,
          showAddToCart: false,
        },
        pagination: {
          type: 'infinite-scroll',
          perPage: 16,
          loadingIndicator: 'dots',
        },
        sorting: {
          enabled: true,
          style: 'dropdown-right',
          options: [
            { label: 'Newest', value: 'newest' },
            { label: 'Price: Low to High', value: 'price_asc' },
            { label: 'Price: High to Low', value: 'price_desc' },
          ],
          default: 'newest',
        },
        placeholderProducts: [
          { image: pic('minimal-pg1', 400, 500), name: 'Item One', price: '₦22,000' },
          { image: pic('minimal-pg2', 400, 500), name: 'Item Two', price: '₦15,000' },
          { image: pic('minimal-pg3', 400, 500), name: 'Item Three', price: '₦38,000' },
          { image: pic('minimal-pg4', 400, 500), name: 'Item Four', price: '₦12,500' },
          { image: pic('minimal-pg5', 400, 500), name: 'Item Five', price: '₦29,000' },
          { image: pic('minimal-pg6', 400, 500), name: 'Item Six', price: '₦8,000' },
          { image: pic('minimal-pg7', 400, 500), name: 'Item Seven', price: '₦44,000' },
          { image: pic('minimal-pg8', 400, 500), name: 'Item Eight', price: '₦17,500' },
          { image: pic('minimal-pg9', 400, 500), name: 'Item Nine', price: '₦33,000' },
          { image: pic('minimal-pg10', 400, 500), name: 'Item Ten', price: '₦9,800' },
          { image: pic('minimal-pg11', 400, 500), name: 'Item Eleven', price: '₦26,000' },
          { image: pic('minimal-pg12', 400, 500), name: 'Item Twelve', price: '₦14,500' },
          { image: pic('minimal-pg13', 400, 500), name: 'Item Thirteen', price: '₦41,000' },
          { image: pic('minimal-pg14', 400, 500), name: 'Item Fourteen', price: '₦7,500' },
          { image: pic('minimal-pg15', 400, 500), name: 'Item Fifteen', price: '₦19,000' },
          { image: pic('minimal-pg16', 400, 500), name: 'Item Sixteen', price: '₦31,500' },
        ],
      },
      components: [],
    },
    minimalFooter,
  ],
};

// ── MINIMAL PRODUCT DETAIL ────────────────────────────────────────────────────
const minimalProductDetailSchema = {
  version: '1.0',
  sections: [
    minimalHeader,
    {
      id: 'minimal-pd-main',
      type: 'PRODUCT_DETAIL',
      config: {
        layout: 'two-column',
        imageAspectRatio: '4/5',
        imageBorderRadius: 0,
        thumbnailPosition: 'left',
        showBreadcrumb: true,
        showReviews: false,
        showRelated: false,
        padding: { top: 64, right: 80, bottom: 80, left: 80 },
        backgroundColor: '#FFFFFF',
        placeholderImages: [
          pic('minimal-pd1', 600, 750),
          pic('minimal-pd2', 600, 750),
        ],
      },
      components: [],
    },
    {
      id: 'minimal-pd-related',
      type: 'PRODUCT_CAROUSEL',
      config: {
        heading: 'You Might Also Like',
        headingStyle: { fontSize: 13, fontWeight: '400', color: '#888888', textAlign: 'left', letterSpacing: 2 },
        visibleCount: { desktop: 4, tablet: 2, mobile: 1 },
        gap: 32,
        cardStyle: 'minimal',
        showArrows: true,
        arrowStyle: { backgroundColor: 'transparent', color: '#1A1A1A', borderRadius: 0, border: '1px solid #1A1A1A' },
        showDots: false,
        padding: { top: 80, right: 80, bottom: 80, left: 80 },
        backgroundColor: '#FAFAF8',
        placeholderProducts: [
          { image: pic('minimal-rel1', 400, 500), name: 'Related One', price: '₦28,000' },
          { image: pic('minimal-rel2', 400, 500), name: 'Related Two', price: '₦19,500' },
          { image: pic('minimal-rel3', 400, 500), name: 'Related Three', price: '₦35,000' },
          { image: pic('minimal-rel4', 400, 500), name: 'Related Four', price: '₦14,000' },
        ],
      },
      components: [],
    },
    minimalFooter,
  ],
};

// ── MINIMAL ABOUT ─────────────────────────────────────────────────────────────
const minimalAboutSchema = {
  version: '1.0',
  sections: [
    minimalHeader,
    {
      id: 'minimal-about-hero',
      type: 'RICH_TEXT',
      config: { backgroundColor: '#FAFAF8', contentAlignment: 'CENTER', padding: { top: 100, right: 160, bottom: 100, left: 160 } },
      components: [
        { id: 'minimal-about-h1', type: 'TEXT', config: { content: 'About', tag: 'h1', style: { fontSize: 56, fontWeight: '300', color: '#1A1A1A', textAlign: 'center', letterSpacing: -2 } } },
        { id: 'minimal-about-body', type: 'TEXT', config: { content: 'We believe in the beauty of simplicity. Every product we offer is chosen for its quality, craftsmanship, and lasting value.', tag: 'p', style: { fontSize: 18, color: '#666666', textAlign: 'center', lineHeight: 1.9, margin: { top: 28, right: 0, bottom: 0, left: 0 } } } },
      ],
    },
    {
      id: 'minimal-about-img',
      type: 'RICH_TEXT',
      config: { backgroundColor: '#FFFFFF', padding: { top: 0, right: 0, bottom: 0, left: 0 } },
      components: [
        { id: 'minimal-about-photo', type: 'IMAGE', config: { src: pic('minimal-about', 1400, 600), alt: 'Our studio', style: { width: '100%', objectFit: 'cover', aspectRatio: '7/3' } } },
      ],
    },
    minimalFooter,
  ],
};

// ── MINIMAL CONTACT ───────────────────────────────────────────────────────────
const minimalContactSchema = {
  version: '1.0',
  sections: [
    minimalHeader,
    {
      id: 'minimal-contact-header',
      type: 'RICH_TEXT',
      config: { backgroundColor: '#FAFAF8', contentAlignment: 'CENTER', padding: { top: 80, right: 160, bottom: 64, left: 160 } },
      components: [
        { id: 'minimal-contact-h1', type: 'TEXT', config: { content: 'Contact', tag: 'h1', style: { fontSize: 48, fontWeight: '300', color: '#1A1A1A', textAlign: 'center', letterSpacing: -1 } } },
        { id: 'minimal-contact-sub', type: 'TEXT', config: { content: 'Questions? We are here.', tag: 'p', style: { fontSize: 16, color: '#888888', textAlign: 'center', margin: { top: 12, right: 0, bottom: 0, left: 0 } } } },
      ],
    },
    {
      id: 'minimal-contact-form',
      type: 'CONTACT_FORM',
      config: { fields: ['name', 'email', 'message'], submitLabel: 'Send', backgroundColor: '#FFFFFF', padding: { top: 48, right: 160, bottom: 80, left: 160 }, contentAlignment: 'CENTER' },
      components: [],
    },
    minimalFooter,
  ],
};

// ── MINIMAL POLICY ────────────────────────────────────────────────────────────
const minimalPolicySchema = {
  version: '1.0',
  sections: [
    minimalHeader,
    {
      id: 'minimal-policy-content',
      type: 'RICH_TEXT',
      config: { backgroundColor: '#FFFFFF', padding: { top: 80, right: 160, bottom: 100, left: 160 } },
      components: [
        { id: 'minimal-policy-h1', type: 'TEXT', config: { content: 'Store Policy', tag: 'h1', style: { fontSize: 40, fontWeight: '300', color: '#1A1A1A', letterSpacing: -1 } } },
        { id: 'minimal-policy-body', type: 'TEXT', config: { content: 'Update this page with your return policy, shipping policy, and terms of service.', tag: 'p', style: { fontSize: 16, color: '#555555', lineHeight: 1.9, margin: { top: 28, right: 0, bottom: 0, left: 0 } } } },
      ],
    },
    minimalFooter,
  ],
};


// ─── Page defaults map ────────────────────────────────────────────────────────

const templatePageDefaults = {
  classic: [
    { page_type: 'HOME',           schema: classicHomeSchema },
    { page_type: 'PRODUCTS',       schema: classicProductsSchema },
    { page_type: 'PRODUCT_DETAIL', schema: classicProductDetailSchema },
    { page_type: 'ABOUT',          schema: classicAboutSchema },
    { page_type: 'CONTACT',        schema: classicContactSchema },
    { page_type: 'POLICY',         schema: classicPolicySchema },
  ],
  bold: [
    { page_type: 'HOME',           schema: boldHomeSchema },
    { page_type: 'PRODUCTS',       schema: boldProductsSchema },
    { page_type: 'PRODUCT_DETAIL', schema: boldProductDetailSchema },
    { page_type: 'ABOUT',          schema: boldAboutSchema },
    { page_type: 'CONTACT',        schema: boldContactSchema },
    { page_type: 'POLICY',         schema: boldPolicySchema },
  ],
  minimal: [
    { page_type: 'HOME',           schema: minimalHomeSchema },
    { page_type: 'PRODUCTS',       schema: minimalProductsSchema },
    { page_type: 'PRODUCT_DETAIL', schema: minimalProductDetailSchema },
    { page_type: 'ABOUT',          schema: minimalAboutSchema },
    { page_type: 'CONTACT',        schema: minimalContactSchema },
    { page_type: 'POLICY',         schema: minimalPolicySchema },
  ],
};

// ─── Seed function ────────────────────────────────────────────────────────────

async function seed() {
  console.log('Seeding templates...');

  for (const tmpl of templates) {
    const [template] = await sql`
      INSERT INTO templates (name, slug, description, preview_url, is_active, sort_order)
      VALUES (${tmpl.name}, ${tmpl.slug}, ${tmpl.description}, ${tmpl.preview_url}, true, ${tmpl.sort_order})
      ON CONFLICT (slug) DO UPDATE SET
        name        = EXCLUDED.name,
        description = EXCLUDED.description,
        preview_url = EXCLUDED.preview_url,
        sort_order  = EXCLUDED.sort_order
      RETURNING id
    `;

    const pages = templatePageDefaults[tmpl.slug] || [];
    for (const page of pages) {
      await sql`
        INSERT INTO template_page_defaults (template_id, page_type, schema)
        VALUES (${template.id}, ${page.page_type}, ${sql.json(page.schema)})
        ON CONFLICT (template_id, page_type) DO UPDATE SET schema = EXCLUDED.schema
      `;
    }

    console.log(`  ✅ ${tmpl.name} (${pages.length} page defaults)`);
  }

  console.log('templates seeded.\n');
}

module.exports = seed;
