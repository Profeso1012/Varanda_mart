import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PageRenderer } from '@varanda/renderer';

import { StoreProvider, useStore } from './context/StoreContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import { getPage } from './api/storefrontApi';

import StorefrontHeader from './components/StorefrontHeader';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutVerifyPage from './pages/CheckoutVerifyPage';
import AccountPage from './pages/AccountPage';

import './App.css';

// ─── Schema-driven page renderer ─────────────────────────────────────────────
// pageTypeOrSlug: uppercase type (HOME, PRODUCTS, ABOUT…) or lowercase custom slug
function StorefrontPage({ pageTypeOrSlug }) {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { store } = useStore();

  useEffect(() => {
    if (!pageTypeOrSlug) return;
    setLoading(true);
    setError(null);
    setPageData(null);

    getPage(pageTypeOrSlug)
      .then(data => setPageData(data))
      .catch(err => {
        const code = err.response?.data?.error?.code || 'ERROR';
        setError(code);
      })
      .finally(() => setLoading(false));
  }, [pageTypeOrSlug]);

  if (loading) {
    return (
      <div className="storefront-loading">
        <div className="storefront-loading__spinner" />
      </div>
    );
  }

  if (error === 'STORE_NOT_PUBLISHED') {
    return (
      <div className="storefront-error storefront-error--unpublished">
        <h2>Store not published yet</h2>
        <p>This store is still being set up. Check back soon.</p>
      </div>
    );
  }

  if (error === 'FRONTEND_ONLY_PAGE') {
    // Should never happen — these routes are handled before reaching here
    return null;
  }

  if (error || !pageData) {
    return (
      <div className="storefront-error storefront-error--404">
        <h2>Page not found</h2>
        <p>The page you're looking for doesn't exist.</p>
      </div>
    );
  }

  // API returns snake_case — normalise for display
  const schema = pageData.schema;
  if (!schema || !schema.sections) {
    return (
      <div className="storefront-error storefront-error--empty">
        <p>This page has no content yet.</p>
      </div>
    );
  }

  const business = store?.business;
  const pageTitle = pageData.seo_title || pageData.title || business?.name || 'Store';
  const pageDesc  = pageData.seo_description;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        {pageDesc && <meta name="description" content={pageDesc} />}
        {business?.name && <meta property="og:site_name" content={business.name} />}
      </Helmet>

      <main className="storefront-main">
        <PageRenderer schema={schema} builderMode={false} />
      </main>
    </>
  );
}

// ─── Product detail page ──────────────────────────────────────────────────────
// Uses the PRODUCT_DETAIL schema but the actual product data is fetched
// by the PRODUCT_DETAIL section renderer using the slug from the URL.
function ProductDetailPage() {
  return <StorefrontPage pageTypeOrSlug="PRODUCT_DETAIL" />;
}

// ─── Dynamic route — resolves path → page type or slug ───────────────────────
function DynamicRoute() {
  const location = useLocation();
  const path = location.pathname;

  // Exact matches for standard page types
  const EXACT_MAP = {
    '/':         'HOME',
    '/products': 'PRODUCTS',
    '/about':    'ABOUT',
    '/contact':  'CONTACT',
  };

  if (EXACT_MAP[path]) {
    return <StorefrontPage pageTypeOrSlug={EXACT_MAP[path]} />;
  }

  // Policy pages: /policies/privacy-policy → slug = privacy-policy
  if (path.startsWith('/policies/')) {
    const slug = path.replace('/policies/', '');
    return <StorefrontPage pageTypeOrSlug={slug} />;
  }

  // Category pages: /category/:slug
  if (path.startsWith('/category/')) {
    return <StorefrontPage pageTypeOrSlug="CATEGORY" />;
  }

  // Custom pages: /our-story, /size-guide, /lookbook-2025, etc.
  // Strip the leading slash to get the slug
  const slug = path.replace(/^\//, '');
  if (slug) {
    return <StorefrontPage pageTypeOrSlug={slug} />;
  }

  return <StorefrontPage pageTypeOrSlug="HOME" />;
}

// ─── Root app ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <StoreProvider>
      <CartProvider>
        <AuthProvider>
          <StorefrontHeader />
          <Routes>
            {/* ── Frontend-only pages (no schema) ── */}
            <Route path="/cart"              element={<CartPage />} />
            <Route path="/checkout"          element={<CheckoutPage />} />
            <Route path="/checkout/verify"   element={<CheckoutVerifyPage />} />
            <Route path="/account"           element={<AccountPage />} />
            <Route path="/account/:tab"      element={<AccountPage />} />

            {/* ── Product detail — schema-driven layout, live product data ── */}
            <Route path="/products/:slug"    element={<ProductDetailPage />} />

            {/* ── All other paths resolved dynamically ── */}
            <Route path="*"                  element={<DynamicRoute />} />
          </Routes>
        </AuthProvider>
      </CartProvider>
    </StoreProvider>
  );
}

export default App;
