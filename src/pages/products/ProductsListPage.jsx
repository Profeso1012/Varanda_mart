import { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Check,
  ChevronDown,
  Link2,
  MoreHorizontal,
  PackageOpen,
  PackagePlus,
  Plus,
  Search,
  ShieldCheck,
  Shirt,
  Truck,
  X,
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { sellerApi } from '../../lib/axios';
import { formatPrice } from '../../lib/formatters';

const STATUS_TABS = ['All', 'Active', 'Draft', 'Archived'];
const PER_PAGE_OPTIONS = [8, 16, 24, 48];

function AddProductModal({ onClose, onChoose }) {
  const choices = [
    {
      id: 'add',
      title: 'Add My Product',
      description: 'Create a new product and add it to your store.',
      button: 'Add My Product',
      hint: 'Create and manage your own products',
      icon: Shirt,
      color: '#22925B',
      bg: 'bg-green-50',
      benefits: [
        { icon: PackagePlus, text: 'Add product details, images, price & stock' },
        { icon: Check, text: 'Full control over inventory and pricing' },
        { icon: ShieldCheck, text: 'Manage and fulfill orders on your own' },
      ],
    },
    {
      id: 'dropship',
      title: 'Dropship a Product',
      description: 'Import products from our trusted suppliers and sell them.',
      button: 'Dropship a Product',
      hint: 'Find products to sell without inventory',
      icon: Truck,
      color: '#2F76D2',
      bg: 'bg-blue-50',
      benefits: [
        { icon: Box, text: 'Choose from millions of products' },
        { icon: PackagePlus, text: 'No need to keep inventory' },
        { icon: Truck, text: 'Supplier ships directly to your customers' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2A30]/20 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-4xl rounded-lg bg-white p-6 shadow-2xl sm:p-8" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-[#5C5D86] hover:bg-gray-100"
          aria-label="Close add product options"
        >
          <X size={18} />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-[#22925B]">
            <PackagePlus size={24} />
          </div>
          <h2 className="text-2xl font-bold text-[#1F2A30]">How do you want to add a product?</h2>
          <p className="mt-2 text-sm text-[#5C5D86]">Choose the best option to add products to your store.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {choices.map((choice) => {
            const Icon = choice.icon;
            return (
              <div key={choice.id} className="rounded-lg border border-gray-200 p-5">
                <div className="flex flex-col items-center text-center">
                  <div className={`mb-4 flex h-24 w-24 items-center justify-center rounded-full ${choice.bg}`}>
                    <Icon size={48} color={choice.color} strokeWidth={1.7} />
                    <span className="-ml-2 mt-12 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white shadow" style={{ color: choice.color }}>
                      {choice.id === 'add' ? <Plus size={18} /> : <Link2 size={15} />}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1F2A30]">{choice.title}</h3>
                  <p className="mt-2 text-sm text-[#5C5D86]">{choice.description}</p>
                </div>

                <div className="my-6 space-y-4">
                  {choice.benefits.map((benefit) => {
                    const BenefitIcon = benefit.icon;
                    return (
                      <div key={benefit.text} className="flex items-center gap-3 text-sm text-[#1F2A30]">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${choice.bg}`}>
                          <BenefitIcon size={15} color={choice.color} />
                        </span>
                        <span>{benefit.text}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => onChoose(choice.id)}
                  className={`w-full rounded-lg py-3 text-sm font-bold text-white transition-colors ${
                    choice.id === 'add' ? 'bg-[#22925B] hover:bg-[#1a7a4a]' : 'bg-[#2F76D2] hover:bg-[#245fb0]'
                  }`}
                >
                  {choice.button}
                </button>
                <p className="mt-3 text-center text-xs text-[#5C5D86]">{choice.hint}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 rounded-lg bg-green-50 px-5 py-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={24} className="shrink-0 text-[#22925B]" />
            <div>
              <p className="text-sm font-bold text-[#1F2A30]">Not sure which option is right for you?</p>
              <p className="text-xs text-[#5C5D86]">You can start with either option and switch or use both anytime.</p>
            </div>
          </div>
          <button type="button" className="hidden rounded-lg border border-[#22925B] px-5 py-2 text-sm font-medium text-[#22925B] sm:block">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionMenu({ product, onEdit, onDelete, onDuplicate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} className="p-1 rounded hover:bg-gray-100 text-[#5C5D86]">
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 w-40 z-20 overflow-hidden">
          <button onClick={() => { onEdit(product); setOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-[#1F2A30] hover:bg-gray-50">
            Edit
          </button>
          <button onClick={() => { onDuplicate(product); setOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-[#1F2A30] hover:bg-gray-50">
            Duplicate
          </button>
          <button onClick={() => { onDelete(product); setOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-[#E32323] hover:bg-red-50">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProductsListPage({ mode = 'seller' }) {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [perPage, setPerPage] = useState(8);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPerPage, setShowPerPage] = useState(false);

  const endpoint = mode === 'supplier' ? '/supplier/products' : '/catalog/products';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: 1, perPage });
      if (activeTab !== 'All') params.set('status', activeTab.toUpperCase());
      if (search) params.set('search', search);
      const { data } = await sellerApi.get(`${endpoint}?${params}`);
      setProducts(data.data.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, endpoint, perPage, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const t = setTimeout(() => fetchProducts(), 400);
    return () => clearTimeout(t);
  }, [fetchProducts]);

  const handleAddChoice = (choice) => {
    setShowAddModal(false);
    navigate(choice === 'add' ? '/products/new' : '/marketplace');
  };

  const handleEdit = (p) => navigate(mode === 'supplier' ? `/supplier/products/${p.id}/edit` : `/products/${p.id}/edit`);
  const handleDuplicate = async (p) => {
    try {
      await sellerApi.post(`/catalog/products/${p.id}/duplicate`);
      fetchProducts();
    } catch (err) {
      console.error('Could not duplicate product', err);
    }
  };
  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await sellerApi.delete(`${endpoint}/${p.id}`);
      fetchProducts();
    } catch (err) {
      console.error('Could not delete product', err);
    }
  };

  const getStatusStyle = (status) => {
    if (!status) return 'text-gray-400';
    const s = status.toLowerCase();
    if (s === 'active' || s === 'in_stock' || s === 'in stock') return 'text-[#22925B]';
    if (s === 'out_of_stock' || s === 'out of stock') return 'text-[#E32323]';
    return 'text-[#5C5D86]';
  };

  const getStatusLabel = (product) => {
    if (product.stockTotal === 0 || product.stockQuantity === 0) return 'Out of Stock';
    if (product.status === 'ACTIVE') return 'In Stock';
    return product.status || '-';
  };

  return (
    <DashboardLayout
      title={mode === 'supplier' ? 'Supplier Products' : ''}
      mode={mode}
      actions={
        <button
          onClick={() => {
            if (mode === 'supplier') {
              navigate('/supplier/products/new');
              return;
            }
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-[#22925B] text-white text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-[#1a7a4a] transition-colors"
        >
          <Plus size={16} />
          Add Product
        </button>
      }
    >
      {showAddModal && mode === 'seller' && (
        <AddProductModal onClose={() => setShowAddModal(false)} onChoose={handleAddChoice} />
      )}

      <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-3">
        <span className="text-lg font-bold text-[#1F2A30]">{mode === 'supplier' ? 'Supplier Products' : 'Products'}</span>
        <span className="text-sm text-[#5C5D86]">Showing</span>

        <div className="relative">
          <button onClick={() => setShowPerPage((v) => !v)} className="flex items-center gap-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-[#1F2A30] hover:border-gray-300 bg-white">
            {perPage} <ChevronDown size={14} />
          </button>
          {showPerPage && (
            <div className="absolute top-9 left-0 bg-white border border-gray-100 rounded-lg shadow-lg z-20 overflow-hidden w-20">
              {PER_PAGE_OPTIONS.map((n) => (
                <button key={n} onClick={() => { setPerPage(n); setShowPerPage(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-[#1F2A30]">
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-gray-50 min-h-full">
        <div className="relative mb-4">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Products" className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm text-[#1F2A30] outline-none focus:border-[#22925B] transition-colors" />
        </div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {STATUS_TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === tab ? 'bg-[#22925B] text-white' : 'bg-white border border-gray-200 text-[#5C5D86] hover:border-gray-300'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {['Category', 'Tag', 'Status'].map((f) => (
              <button key={f} className="flex items-center gap-1 border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm text-[#1F2A30] hover:border-gray-300">
                {f} <ChevronDown size={13} />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-6 text-xs font-medium text-[#5C5D86] w-32">Thumbnail</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-[#5C5D86]">Name</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-[#5C5D86]">Category</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-[#5C5D86]">Price</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-[#5C5D86]">Status</th>
                <th className="text-left py-4 px-4 text-xs font-medium text-[#5C5D86]">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(perPage).fill('').map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-4 px-6"><div className="w-12 h-12 bg-gray-100 rounded-lg animate-pulse" /></td>
                    {Array(4).fill('').map((_, j) => (
                      <td key={j} className="py-4 px-4"><div className="h-4 bg-gray-100 rounded animate-pulse w-24" /></td>
                    ))}
                    <td className="py-4 px-4"><div className="h-4 bg-gray-100 rounded animate-pulse w-8" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <img src="/empty_box.png" alt="Empty" className="h-50 w-100 object-contain" />
                      </div>
                      {/* <div className="mb-5 flex h-32 w-32 items-center justify-center rounded-full bg-orange-50 text-[#F59E0B]">
                        <PackageOpen size={68} strokeWidth={1.4} />
                      </div> */}
                      <p className="text-base font-bold text-[#1F2A30]">No Products Yet</p>
                      <p className="mt-2 text-sm text-[#5C5D86]">Start adding your first product</p>
                      <button
                        type="button"
                        onClick={() => mode === 'seller' ? setShowAddModal(true) : navigate('/supplier/products/new')}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#22925B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1a7a4a]"
                      >
                        <Plus size={16} />
                        Add Product
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {product.mainImageUrl ? <img src={product.mainImageUrl} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#1F2A30] font-medium">{product.name}</td>
                    <td className="py-3 px-4 text-[#5C5D86]">{product.category?.name || product.marketplaceCategory?.name || '-'}</td>
                    <td className="py-3 px-4 text-[#1F2A30]">{formatPrice(product.basePrice || product.supplierPrice || 0)}</td>
                    <td className="py-3 px-4"><span className={`font-medium ${getStatusStyle(getStatusLabel(product))}`}>{getStatusLabel(product)}</span></td>
                    <td className="py-3 px-4">
                      <ActionMenu product={product} onEdit={handleEdit} onDelete={handleDelete} onDuplicate={handleDuplicate} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
