import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BuilderHeader from '../../components/builder/BuilderHeader';
import BuilderLeftPanel from '../../components/builder/BuilderLeftPanel';
import BuilderCanvas from '../../components/builder/BuilderCanvas';
import BuilderRightPanel from '../../components/builder/BuilderRightPanel';
import AddPageModal from '../../components/builder/modals/AddPageModal';
import * as builderApi from '../../api/builder';
import { sellerApi } from '../../lib/axios';
import './WebsiteBuilderPage.css';

const EMPTY_SCHEMA = { version: '1.0', sections: [] };

const PAGE_TYPE_LABELS = {
  HOME: 'Home',
  PRODUCTS: 'Products',
  PRODUCT_DETAIL: 'Product Detail',
  ABOUT: 'About Us',
  CONTACT: 'Contact',
  POLICIES: 'Policies',
};

export default function WebsiteBuilderPage() {
  const navigate = useNavigate();
  const { business } = useAuth();

  // ── DATA STATE ──────────────────────────────────────────────────────────────
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null); // pageType string e.g. 'HOME'
  const [activePageData, setActivePageData] = useState(null);
  const [storeUrl, setStoreUrl] = useState(null);
  const [isPublished, setIsPublished] = useState(false);

  // ── SCHEMA STATE ──────────────────────────────────────────────────────────
  const [schema, setSchema] = useState(EMPTY_SCHEMA);

  // ── UNDO/REDO HISTORY ──────────────────────────────────────────────────────
  const [history, setHistory] = useState({ past: [], future: [] });

  // ── SELECTION STATE ────────────────────────────────────────────────────────
  const [selection, setSelection] = useState({
    sectionId: null,
    componentId: null,
    childId: null
  });

  // ── UI STATE ────────────────────────────────────────────────────────────────
  const [device, setDevice] = useState('Desktop');
  const [saveStatus, setSaveStatus] = useState('saved'); // saved, unsaved, saving, error
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);
  const [pageExpanded, setPageExpanded] = useState({});
  const [showAddPageModal, setShowAddPageModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [prefetchedData, setPrefetchedData] = useState({});

  // A ref to hold the debounce timer ID
  const saveTimerRef = useRef(null);

  // ── LOAD PAGES ON MOUNT ─────────────────────────────────────────────────────
  const loadPages = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await builderApi.getPages();
      const pageList = Array.isArray(data) ? data : (data.pages || []);

      if (pageList.length === 0) {
        navigate('/templates');
        return;
      }

      setPages(pageList);
      const firstPage = pageList[0];
      const firstPageType = firstPage.pageType || firstPage.page_type || firstPage.type || 'HOME';
      const firstPageIdentifier = firstPageType === 'CUSTOM' ? (firstPage.id || firstPage.slug) : firstPageType;
      setActivePage(firstPageIdentifier);
      await loadPageSchema(firstPageIdentifier);
      
      // Prefetch products for product grids preview
      try {
        const prodRes = await sellerApi.get('/catalog/products').catch(() => ({ data: { data: [] } }));
        const products = prodRes.data?.data?.products || prodRes.data?.data || [];
        setPrefetchedData(prev => ({ ...prev, products }));
      } catch (e) {
        console.error('Failed to prefetch products', e);
      }
    } catch (err) {
      console.error('Failed to load pages:', err);
      if (err.response?.status === 404 || err.response?.status === 400) {
        navigate('/templates');
        return;
      }
      setLoadError('Failed to load pages. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPageSchema(pageType) {
    if (!pageType || pageType === 'undefined') return;
    try {
      const data = await builderApi.getPage(pageType);
      setActivePageData(data);
      setSchema(data.schema || EMPTY_SCHEMA);
      setHistory({ past: [], future: [] });
      setSelection({ sectionId: null, componentId: null, childId: null });
      setSaveStatus('saved');
      setIsPublished(data.isPublished || false);
      if (data.domain || business?.slug) {
        setStoreUrl(data.domain || `${business?.slug}.varanda.com`);
      }
    } catch (err) {
      console.error(`Failed to load page schema for ${pageType}:`, err);
      setActivePageData({ pageType, schema: EMPTY_SCHEMA, seoTitle: '', seoDescription: '', isActive: true });
      setSchema(EMPTY_SCHEMA);
      setHistory({ past: [], future: [] });
      setSelection({ sectionId: null, componentId: null, childId: null });
    }
  };

  // ── THE SCHEMA UPDATE FUNCTION ────────────────────────────────────────────
  const updateSchema = useCallback((newSchema) => {
    setHistory(prev => ({
      past: [...prev.past.slice(-49), schema],
      future: []
    }));

    setSchema(newSchema);
    setSaveStatus('unsaved');

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      if (!activePage) return;
      setSaveStatus('saving');
      try {
        await builderApi.savePageSchema(activePage, newSchema);
        setSaveStatus('saved');
        // Optionally update activePageData schema quietly
        setActivePageData(prev => prev ? { ...prev, schema: newSchema } : prev);
      } catch (err) {
        setSaveStatus('error');
        console.error('Auto-save failed:', err);
      }
    }, 1500);
  }, [schema, activePage]);

  // ── UNDO / REDO ───────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    if (history.past.length === 0) return;
    const previousSchema = history.past[history.past.length - 1];
    setHistory(prev => ({
      past: prev.past.slice(0, -1),
      future: [schema, ...prev.future]
    }));
    setSchema(previousSchema);
    setSaveStatus('unsaved');
  }, [history, schema]);

  const redo = useCallback(() => {
    if (history.future.length === 0) return;
    const nextSchema = history.future[0];
    setHistory(prev => ({
      past: [...prev.past, schema],
      future: prev.future.slice(1)
    }));
    setSchema(nextSchema);
    setSaveStatus('unsaved');
  }, [history, schema]);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) redo();
        else undo();
        e.preventDefault();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // ── PAGE SELECTION ──────────────────────────────────────────────────────────
  const handlePageSelect = async (pageType) => {
    if (pageType === activePage) return;
    setActivePage(pageType);
    await loadPageSchema(pageType);
  };

  // ── ADD CUSTOM PAGE ─────────────────────────────────────────────────────────
  const handleAddPage = async (fields) => {
    try {
      const newPage = await builderApi.createCustomPage(fields);
      setPages(prev => [...prev, newPage]);
      setShowAddPageModal(false);
      const newPageIdentifier = newPage.id || newPage.slug || 'CUSTOM';
      setActivePage(newPageIdentifier);
      await loadPageSchema(newPageIdentifier);
    } catch (err) {
      console.error('Failed to create page:', err);
      throw err;
    }
  };

  const handlePageUpdate = async (updates) => {
    setActivePageData(prev => ({ ...prev, ...updates }));
    const seoFields = {};
    if ('seoTitle' in updates) seoFields.seoTitle = updates.seoTitle;
    if ('seoDescription' in updates) seoFields.seoDescription = updates.seoDescription;
    if ('title' in updates) seoFields.title = updates.title;
    if ('isActive' in updates) seoFields.isActive = updates.isActive;
    if (Object.keys(seoFields).length > 0) {
      try {
        await builderApi.savePageSeo(activePage, seoFields);
      } catch (err) {
        console.error('Failed to save page SEO:', err);
      }
    }
  };

  // ── PUBLISH / UNPUBLISH ─────────────────────────────────────────────────────
  const handlePublish = async () => {
    setIsPublishing(true);
    setPublishStatus(null);
    try {
      const data = await builderApi.publishStore();
      setIsPublished(true);
      setStoreUrl(data.storeUrl);
      setPublishStatus({ type: 'success', storeUrl: data.storeUrl });
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 'NO_DOMAIN') {
        setPublishStatus({ type: 'error', reason: 'no_domain', message: 'Connect a domain before publishing.' });
      } else if (code === 'EMPTY_HOME_PAGE') {
        setPublishStatus({ type: 'error', reason: 'empty_home', message: 'Add at least one section to your home page.' });
      } else {
        setPublishStatus({ type: 'error', message: err.response?.data?.error?.message || 'Failed to publish.' });
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      await builderApi.unpublishStore();
      setIsPublished(false);
      setPublishStatus(null);
    } catch (err) {
      console.error('Failed to unpublish:', err);
    }
  };

  const activePageName = (() => {
    const p = pages.find(p => {
      const pageType = p.pageType || p.page_type || p.type || 'CUSTOM';
      const ident = pageType === 'CUSTOM' ? (p.id || p.slug) : pageType;
      return ident === activePage;
    });
    const pageType = p?.pageType || p?.page_type || p?.type || 'CUSTOM';
    return p?.title || p?.name || PAGE_TYPE_LABELS[pageType] || activePage || 'Home';
  })();

  if (isLoading) {
    return (
      <div className="builder-loading">
        <div className="builder-loading__spinner" />
        <p>Loading your store builder…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="builder-error">
        <p>{loadError}</p>
        <button onClick={loadPages}>Retry</button>
      </div>
    );
  }

  return (
    <div className="builder-layout">
      <BuilderHeader
        pageName={activePageName}
        device={device}
        onDeviceChange={setDevice}
        autoSaveStatus={saveStatus}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        isPublishing={isPublishing}
        isPublished={isPublished}
        publishStatus={publishStatus}
        storeUrl={storeUrl}
        onDismissPublishStatus={() => setPublishStatus(null)}
        onUndo={undo}
        onRedo={redo}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        onBack={() => navigate('/dashboard')}
      />

      <div className="builder-main">
        <BuilderLeftPanel
          pages={pages}
          activePage={activePage}
          onPageSelect={handlePageSelect}
          pageExpanded={pageExpanded}
          onPageExpandChange={setPageExpanded}
          schema={schema}
          selection={selection}
          onSelect={setSelection}
          onAddPage={() => setShowAddPageModal(true)}
          onSectionScrollTo={(sectionId) => {
            const el = document.getElementById(`section-${sectionId}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />

        <BuilderCanvas
          schema={schema}
          selection={selection}
          device={device}
          onSelect={setSelection}
          onUpdate={updateSchema}
          prefetchedData={prefetchedData}
        />

        <BuilderRightPanel
          schema={schema}
          selection={selection}
          onUpdate={updateSchema}
          pageData={activePageData}
          onPageUpdate={handlePageUpdate}
          onBack={() => {
            if (selection.componentId) {
              setSelection(prev => ({ ...prev, componentId: null, childId: null }));
            } else {
              setSelection({ sectionId: null, componentId: null, childId: null });
            }
          }}
        />
      </div>

      {showAddPageModal && (
        <AddPageModal
          onAdd={handleAddPage}
          onClose={() => setShowAddPageModal(false)}
        />
      )}
    </div>
  );
}
