import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Star, X } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { sellerApi }   from '../../lib/axios';
import { formatPrice } from '../../lib/formatters';
import { DEFAULT_CATEGORY_TREE } from '../../data/defaultCategories';

// Star rating display
function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map((s) => (
        <Star
          key={s}
          size={12}
          className={s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
      <span className="text-xs text-[#5C5D86] ml-1">{rating?.toFixed(1)}</span>
    </div>
  );
}

// Import modal (Image 2)
function ImportModal({ product, onClose, onConfirm }) {
  const [retailPrice, setRetailPrice] = useState('');
  const [importing,   setImporting]   = useState(false);

  const supplierCost  = product?.displayPrice || 0;
  const estimatedProfit = retailPrice
    ? Math.max(0, parseFloat(retailPrice) - supplierCost)
    : 0;

  const handleConfirm = async () => {
    if (!retailPrice) return;
    setImporting(true);
    try {
      await onConfirm(product, parseFloat(retailPrice));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm p-7 shadow-xl">
        <h2 className="text-lg font-bold text-[#1F2A30] mb-5">Import Product</h2>

        {/* Product preview */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
            {product?.mainImageUrl ? (
              <img src={product.mainImageUrl} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1F2A30]">{product?.name}</p>
            <p className="text-xs text-[#5C5D86]">Supplier: {formatPrice(supplierCost)}</p>
          </div>
        </div>

        {/* Retail price input */}
        <label className="block text-sm text-[#1F2A30] mb-2">Set your retail price</label>
        <div className="relative mb-3">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#1F2A30]">₦</span>
          <input
            type="number"
            value={retailPrice}
            onChange={(e) => setRetailPrice(e.target.value)}
            placeholder=""
            className="w-full border border-gray-200 rounded-lg pl-8 pr-4 py-3 text-sm text-[#1F2A30] outline-none focus:border-[#22925B]"
          />
        </div>

        {/* Estimated profit */}
        {retailPrice && (
          <p className="text-sm text-[#22925B] font-medium mb-5">
            Estimated Profit: {formatPrice(estimatedProfit)}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full bg-gray-100 text-[#5C5D86] text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!retailPrice || importing}
            className="flex-1 py-3 rounded-full bg-[#22925B] text-white text-sm font-semibold hover:bg-[#1a7a4a] transition-colors disabled:opacity-60"
          >
            {importing ? 'Importing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Category dropdown (Image 4)
function CategoryDropdown({ categories, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 border rounded-full px-4 py-2 text-sm transition-colors ${
          selected
            ? 'border-[#22925B] text-[#22925B] bg-green-50'
            : 'border-gray-200 text-[#1F2A30] bg-white hover:border-gray-300'
        }`}
      >
        Category <ChevronDown size={13} />
      </button>
      {open && (
        <div className="absolute top-10 left-0 bg-white rounded-xl shadow-lg border border-gray-100 w-44 z-30 py-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { onSelect(cat.id === selected ? '' : cat.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#1F2A30] hover:bg-gray-50 text-left"
            >
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  const navigate = useNavigate();
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [search,      setSearch]      = useState('');
  const [categoryId,  setCategoryId]  = useState('');
  const [loading,     setLoading]     = useState(true);
  const [importProduct, setImportProduct] = useState(null); // product being imported

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: 1, perPage: 12 });
      if (search)     params.set('search', search);
      if (categoryId) params.set('categoryId', categoryId);
      const { data } = await sellerApi.get(`/marketplace/products?${params}`);
      setProducts(data.data.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await sellerApi.get('/marketplace/categories');
        setCategories(data.data.categories || []);
      } catch {}
    };
    load();
    fetchProducts();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchProducts(), 400);
    return () => clearTimeout(t);
  }, [search, categoryId]);

  const handleImportConfirm = async (product, retailPrice) => {
    try {
      await sellerApi.post('/marketplace/import', {
        supplierProductId: product.id,
        retailPrice,
      });
      setImportProduct(null);
      fetchProducts();
      navigate('/products');
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 'ALREADY_IMPORTED') {
        alert('This product is already in your store.');
      } else if (code === 'PLAN_LIMIT') {
        alert('You\'ve reached your product limit. Upgrade your plan.');
      }
      setImportProduct(null);
    }
  };

  return (
    <DashboardLayout title="" mode="seller">
      {/* Import modal */}
      {importProduct && (
        <ImportModal
          product={importProduct}
          onClose={() => setImportProduct(null)}
          onConfirm={handleImportConfirm}
        />
      )}

      <div className="p-6 bg-gray-50 min-h-full">

        {/* Header card */}
        <div className="bg-white rounded-2xl px-6 py-5 mb-5">
          <h1 className="text-xl font-bold text-[#1F2A30]">Discover Products</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Products"
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm text-[#1F2A30] outline-none focus:border-[#22925B]"
          />
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <CategoryDropdown
            categories={categories.length ? categories : [
              ...DEFAULT_CATEGORY_TREE,
            ]}
            selected={categoryId}
            onSelect={setCategoryId}
          />
          {['Shipping', 'Price', 'Trust'].map((f) => (
            <button key={f}
              className="flex items-center gap-1 border border-gray-200 bg-white rounded-full px-4 py-2 text-sm text-[#1F2A30] hover:border-gray-300">
              {f} <ChevronDown size={13} />
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array(8).fill('').map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
                  <div className="aspect-3/4 bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                    <div className="h-8 bg-gray-100 rounded-full animate-pulse mt-3" />
                  </div>
                </div>
              ))
            : products.length === 0 ? (
                <div className="col-span-full rounded-2xl bg-white py-20 text-center text-sm text-[#5C5D86]">
                  No dropship products available yet.
                </div>
              )
            : products.map((product) => (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col">
                  {/* Image */}
                  <div className="aspect-3/4 bg-gray-100 overflow-hidden">
                    {product.mainImageUrl ? (
                      <img src={product.mainImageUrl} alt={product.name}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-gray-200 to-gray-100" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-sm font-semibold text-[#1F2A30] mb-1 leading-tight">
                      {product.name}
                    </p>
                    <p className="text-xs text-[#5C5D86] mb-1">
                      Supplier: {formatPrice(product.displayPrice || product.supplierPrice || 0)}
                    </p>
                    <p className="text-xs font-semibold text-[#22925B] mb-2">
                      Profit: {formatPrice(product.estimatedMargin || 0)}
                    </p>
                    <StarRating rating={product.avgRating || 5.0} />

                    <button
                      onClick={() => setImportProduct(product)}
                      disabled={product.alreadyImported}
                      className={`w-full mt-3 py-2.5 rounded-full text-sm font-semibold text-white transition-colors ${
                        product.alreadyImported
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-[#22925B] hover:bg-[#1a7a4a]'
                      }`}
                    >
                      {product.alreadyImported ? 'Imported' : 'Import'}
                    </button>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </DashboardLayout>
  );
}
