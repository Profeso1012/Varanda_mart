import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sellerApi } from '../../lib/axios';
import { debounce } from '../../lib/debounce';
import BuilderHeader from '../../components/builder/BuilderHeader';
import BuilderLeftPanel from '../../components/builder/BuilderLeftPanel';
import BuilderCanvas from '../../components/builder/BuilderCanvas';
import BuilderRightPanel from '../../components/builder/BuilderRightPanel';
import './WebsiteBuilderPage.css';

const DEFAULT_PAGE_SCHEMA = {
  version: '1.0',
  sections: [],
};

const PAGES_CONFIG = [
  { type: 'HOME', name: 'Home', slug: '' },
  { type: 'PRODUCTS', name: 'Products', slug: 'products' },
  { type: 'PRODUCT_DETAIL', name: 'Product Detail', slug: 'product' },
  { type: 'ABOUT', name: 'About', slug: 'about' },
  { type: 'CONTACT', name: 'Contact', slug: 'contact' },
  { type: 'POLICIES', name: 'Policies', slug: 'policies' },
];

export default function WebsiteBuilderPage() {
  const navigate = useNavigate();
  const { user, business } = useAuth();

  // Page state
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [activePageData, setActivePageData] = useState(null);

  // Selection state
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedComponentId, setSelectedComponentId] = useState(null);

  // UI state
  const [device, setDevice] = useState('Desktop');
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);
  const [pageExpanded, setPageExpanded] = useState({});

  // Debounced save function
  const debouncedSave = useRef(
    debounce(async (pageType, pageData) => {
      setAutoSaveStatus('saving');
      try {
        await sellerApi.put(`/builder/pages/${pageType}`, {
          schema: pageData.schema,
          seoTitle: pageData.seoTitle,
          seoDescription: pageData.seoDescription,
          title: pageData.title,
        });
        setAutoSaveStatus('saved');
      } catch (err) {
        console.error('Failed to save page:', err);
        setAutoSaveStatus('saved');
      }
    }, 2000)
  ).current;

  // Load pages on mount
  useEffect(() => {
    loadPages();
  }, []);

  // Auto-save on schema changes
  useEffect(() => {
    if (activePageData && activePage) {
      debouncedSave(activePage, activePageData);
    }
  }, [activePageData, activePage, debouncedSave]);

  const loadPages = async () => {
    try {
      const response = await sellerApi.get('/builder/pages');
      const loadedPages = response.data?.pages || [];
      setPages(loadedPages);

      if (loadedPages.length === 0) {
        // Create default pages if none exist
        await createDefaultPages();
      } else {
        // Set first page as active
        setActivePage(loadedPages[0].type);
        setActivePageData(loadedPages[0]);
      }
    } catch (err) {
      console.error('Failed to load pages:', err);
      // Fallback to creating default pages on error
      await createDefaultPages();
    }
  };

  const createDefaultPages = async () => {
    try {
      const newPages = [];
      for (const pageConfig of PAGES_CONFIG) {
        const pageData = {
          type: pageConfig.type,
          name: pageConfig.name,
          slug: pageConfig.slug,
          title: pageConfig.name,
          schema: DEFAULT_PAGE_SCHEMA,
          seoTitle: '',
          seoDescription: '',
          isActive: pageConfig.type === 'HOME',
        };
        try {
          const response = await sellerApi.post('/builder/pages', pageData);
          newPages.push(response.data.page);
        } catch (err) {
          console.warn(`Failed to create page ${pageConfig.type}:`, err);
          // Add mock page locally if API fails
          newPages.push({ ...pageData, id: `page-${Date.now()}-${Math.random()}` });
        }
      }
      setPages(newPages);
      setActivePage(newPages[0].type);
      setActivePageData(newPages[0]);
    } catch (err) {
      console.error('Failed to create default pages:', err);
      // Create mock pages locally as fallback
      const mockPages = PAGES_CONFIG.map((pageConfig) => ({
        id: `page-${Date.now()}-${Math.random()}`,
        type: pageConfig.type,
        name: pageConfig.name,
        slug: pageConfig.slug,
        title: pageConfig.name,
        schema: DEFAULT_PAGE_SCHEMA,
        seoTitle: '',
        seoDescription: '',
        isActive: pageConfig.type === 'HOME',
      }));
      setPages(mockPages);
      setActivePage(mockPages[0].type);
      setActivePageData(mockPages[0]);
    }
  };


  const handlePageSelect = (pageType) => {
    const page = pages.find(p => p.type === pageType);
    if (page) {
      setActivePage(pageType);
      setActivePageData(page);
      setSelectedSectionId(null);
      setSelectedComponentId(null);
    }
  };

  const handleSectionSelect = (sectionId) => {
    setSelectedSectionId(sectionId);
    setSelectedComponentId(null);
  };

  const handleComponentSelect = (componentId) => {
    setSelectedComponentId(componentId);
  };

  const handleAddSection = (position) => {
    const newSection = {
      id: `section-${Date.now()}`,
      type: 'HERO',
      config: {
        minHeight: 600,
        backgroundColor: '#FFFFFF',
        padding: { top: 60, right: 0, bottom: 60, left: 0 },
      },
      components: [
        {
          id: `component-${Date.now()}`,
          type: 'TEXT',
          config: {
            content: 'New Section',
            tag: 'h2',
            style: { fontSize: 32, fontWeight: 'bold', color: '#1F2A30' },
          },
        },
      ],
    };

    const newSchema = { ...activePageData.schema };
    if (position === 'top') {
      newSchema.sections.unshift(newSection);
    } else if (position === 'bottom') {
      newSchema.sections.push(newSection);
    } else {
      newSchema.sections.splice(position + 1, 0, newSection);
    }

    setActivePageData({ ...activePageData, schema: newSchema });
  };

  const handleUpdateSectionConfig = (sectionId, configUpdate) => {
    const newSchema = { ...activePageData.schema };
    const sectionIndex = newSchema.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex >= 0) {
      newSchema.sections[sectionIndex] = {
        ...newSchema.sections[sectionIndex],
        config: {
          ...newSchema.sections[sectionIndex].config,
          ...configUpdate,
        },
      };
      setActivePageData({ ...activePageData, schema: newSchema });
    }
  };

  const handleAddComponent = (sectionId) => {
    const newComponent = {
      id: `component-${Date.now()}`,
      type: 'TEXT',
      config: {
        content: 'New component',
        tag: 'p',
        style: { fontSize: 16, fontWeight: 'normal', color: '#4F507F' },
      },
    };

    const newSchema = { ...activePageData.schema };
    const sectionIndex = newSchema.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex >= 0) {
      newSchema.sections[sectionIndex].components.push(newComponent);
      setActivePageData({ ...activePageData, schema: newSchema });
    }
  };

  const handleDeleteSection = (sectionId) => {
    const newSchema = { ...activePageData.schema };
    newSchema.sections = newSchema.sections.filter(s => s.id !== sectionId);
    setActivePageData({ ...activePageData, schema: newSchema });
    setSelectedSectionId(null);
  };

  const handleDeleteComponent = (sectionId, componentId) => {
    const newSchema = { ...activePageData.schema };
    const sectionIndex = newSchema.sections.findIndex(s => s.id === sectionId);
    if (sectionIndex >= 0) {
      newSchema.sections[sectionIndex].components = newSchema.sections[sectionIndex].components.filter(
        c => c.id !== componentId
      );
      setActivePageData({ ...activePageData, schema: newSchema });
    }
    setSelectedComponentId(null);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const response = await sellerApi.post('/builder/publish', {
        businessId: business?.id,
      });
      setPublishStatus({
        type: 'success',
        message: 'Your store is live!',
        storeUrl: response.data?.storeUrl,
      });
    } catch (err) {
      if (err.response?.data?.code === 'NO_DOMAIN') {
        setPublishStatus({
          type: 'error',
          message: 'Connect a domain before publishing.',
        });
      } else if (err.response?.data?.code === 'EMPTY_HOME') {
        setPublishStatus({
          type: 'error',
          message: 'Add at least one section to your home page.',
        });
      } else {
        setPublishStatus({
          type: 'error',
          message: 'Failed to publish. Try again.',
        });
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const rightPanelContent = selectedComponentId
    ? { type: 'component', id: selectedComponentId, sectionId: selectedSectionId }
    : selectedSectionId
    ? { type: 'section', id: selectedSectionId }
    : { type: 'page' };

  return (
    <div className="builder-layout">
      <BuilderHeader
        pageName={activePageData?.name || 'Home'}
        device={device}
        onDeviceChange={setDevice}
        autoSaveStatus={autoSaveStatus}
        onPublish={handlePublish}
        isPublishing={isPublishing}
        publishStatus={publishStatus}
      />

      <div className="builder-main">
        <BuilderLeftPanel
          pages={pages}
          activePage={activePage}
          onPageSelect={handlePageSelect}
          pageExpanded={pageExpanded}
          onPageExpandChange={setPageExpanded}
          schema={activePageData?.schema}
        />

        <BuilderCanvas
          schema={activePageData?.schema || DEFAULT_PAGE_SCHEMA}
          selectedSectionId={selectedSectionId}
          selectedComponentId={selectedComponentId}
          device={device}
          onSectionSelect={handleSectionSelect}
          onComponentSelect={handleComponentSelect}
          onAddSection={handleAddSection}
          onDeleteSection={handleDeleteSection}
          onDeleteComponent={handleDeleteComponent}
          onAddComponent={handleAddComponent}
        />

        <BuilderRightPanel
          content={rightPanelContent}
          selectedSection={selectedSectionId ? activePageData?.schema?.sections?.find(s => s.id === selectedSectionId) : null}
          selectedComponent={selectedComponentId && selectedSectionId
            ? activePageData?.schema?.sections?.find(s => s.id === selectedSectionId)?.components?.find(c => c.id === selectedComponentId)
            : null}
          pageData={activePageData}
          onPageUpdate={(updates) => setActivePageData({ ...activePageData, ...updates })}
          onSectionConfigUpdate={handleUpdateSectionConfig}
          onSectionSelect={() => setSelectedSectionId(null)}
        />
      </div>
    </div>
  );
}
