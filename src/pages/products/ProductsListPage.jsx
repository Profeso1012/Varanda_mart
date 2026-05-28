import { useCallback, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (
        open &&
        menuRef.current && !menuRef.current.contains(e.target) &&
        btnRef.current && !btnRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 8, left: rect.left - 115 });
    }
    setOpen((v) => !v);
  };

  const popup = open ? (
    <div ref={menuRef} className="action-menu-popup" style={{ top: menuPos.top, left: menuPos.left }}>
      <button onClick={() => { onEdit(product); setOpen(false); }} title="Edit">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.6 4.2C12.7591 4.2 12.9117 4.13679 13.0243 4.02426C13.1368 3.91174 13.2 3.75913 13.2 3.6C13.2 3.44087 13.1368 3.28826 13.0243 3.17574C12.9117 3.06321 12.7591 3 12.6 3V4.2ZM21 11.0736C21 10.9145 20.9368 10.7619 20.8243 10.6493C20.7117 10.5368 20.5591 10.4736 20.4 10.4736C20.2409 10.4736 20.0883 10.5368 19.9757 10.6493C19.8632 10.7619 19.8 10.9145 19.8 11.0736H21ZM3 12.6C3 12.7591 3.06321 12.9117 3.17574 13.0243C3.28826 13.1368 3.44087 13.2 3.6 13.2C3.75913 13.2 3.91174 13.1368 4.02426 13.0243C4.13679 12.9117 4.2 12.7591 4.2 12.6H3ZM11.0736 19.8C10.9145 19.8 10.7619 19.8632 10.6493 19.9757C10.5368 20.0883 10.4736 20.2409 10.4736 20.4C10.4736 20.5591 10.5368 20.7117 10.6493 20.8243C10.7619 20.9368 10.9145 21 11.0736 21V19.8ZM4.8 4.2H12.6V3H4.8V4.2ZM19.8 11.0736V19.2H21V11.0736H19.8ZM4.2 12.6V4.8H3V12.6H4.2ZM19.2 19.8H11.0736V21H19.2V19.8ZM19.8 19.2C19.8 19.3591 19.7368 19.5117 19.6243 19.6243C19.5117 19.7368 19.3591 19.8 19.2 19.8V21C19.6774 21 20.1352 20.8104 20.4728 20.4728C20.8104 20.1352 21 19.6774 21 19.2H19.8ZM4.8 3C4.32261 3 3.86477 3.18964 3.52721 3.52721C3.18964 3.86477 3 4.32261 3 4.8H4.2C4.2 4.64087 4.26321 4.48826 4.37574 4.37574C4.48826 4.26321 4.64087 4.2 4.8 4.2V3Z" fill="#6B390C"/>
          <path fillRule="evenodd" clipRule="evenodd" d="M20.5201 6.94156C20.7448 6.71676 20.8711 6.41192 20.8711 6.09406C20.8711 5.77621 20.7448 5.47137 20.5201 5.24656L18.8233 3.54916C18.7118 3.4376 18.5794 3.3491 18.4336 3.28872C18.2879 3.22834 18.1316 3.19727 17.9739 3.19727C17.8161 3.19727 17.6599 3.22834 17.5142 3.28872C17.3684 3.3491 17.236 3.4376 17.1244 3.54916L5.41693 15.257C5.03157 15.6424 4.78886 16.1475 4.72873 16.6892L4.48213 18.9071L4.43983 19.289C4.43479 19.3347 4.44011 19.3811 4.45537 19.4245C4.47064 19.468 4.49548 19.5075 4.52805 19.54C4.56062 19.5726 4.6001 19.5975 4.64356 19.6127C4.68701 19.628 4.73335 19.6333 4.77913 19.6283L5.16103 19.586L7.37893 19.3394C7.92052 19.2792 8.4255 19.0365 8.81083 18.6512L20.5201 6.94156Z" fill="#EB5757"/>
          <path d="M14.5811 6.0957L17.9729 9.4875" stroke="#F8C014" strokeLinejoin="round"/>
        </svg>
      </button>
      <button onClick={() => { onDuplicate(product); setOpen(false); }} title="Duplicate">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 7V15C8 15.5304 8.21071 16.0391 8.58579 16.4142C8.96086 16.7893 9.46957 17 10 17H16M8 7V5C8 4.46957 8.21071 3.96086 8.58579 3.58579C8.96086 3.21071 9.46957 3 10 3H14.586C14.8512 3.00006 15.1055 3.10545 15.293 3.293L19.707 7.707C19.8946 7.89449 19.9999 8.1488 20 8.414V15C20 15.5304 19.7893 16.0391 19.4142 16.4142C19.0391 16.7893 18.5304 17 18 17H16M8 7H6C5.46957 7 4.96086 7.21071 4.58579 7.58579C4.21071 7.96086 4 8.46957 4 9V19C4 19.5304 4.21071 20.0391 4.58579 20.4142C4.96086 20.7893 5.46957 21 6 21H14C14.5304 21 15.0391 20.7893 15.4142 20.4142C15.7893 20.0391 16 19.5304 16 19V17" stroke="#4304FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <button onClick={() => { onDelete(product); setOpen(false); }} title="Delete">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 5V22H19.5V5H4.5Z" fill="#2F88FF" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M10 10V16.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 10V16.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 5H22" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 5L9.6445 2H14.3885L16 5H8Z" fill="#2F88FF" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  ) : null;

  return (
    <>
      <button ref={btnRef} onClick={handleToggle} className="p-1 rounded hover:bg-gray-100 text-[#5C5D86]">
        <MoreHorizontal size={18} />
      </button>
      {typeof document !== 'undefined' && createPortal(popup, document.body)}
    </>
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
