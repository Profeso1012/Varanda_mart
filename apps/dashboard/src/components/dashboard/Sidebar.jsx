import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, X, RefreshCw } from 'lucide-react';
import { sellerApi } from '../../lib/axios';
import { useRoleAdd } from '../../hooks/useRoleAdd';
import { useRoleToggle } from '../../hooks/useRoleToggle';
import { useAuth } from '../../context/AuthContext';
import BrandAvatar from './BrandAvatar';

const SELLER_NAV = [
  {
    group: null,
    items: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Analytics', path: '/analytics' }, // badge: { text: 'Coming Soon', color: 'orange' } },
    ],
  },
  {
    group: 'Store Building',
    items: [
      { label: 'Website Builder', path: '/builder'   },
      { label: 'Pages',           path: '/pages'     },
      { label: 'Templates',       path: '/templates' },
    ],
  },
  {
    group: 'Catalog',
    items: [
      { label: 'Products',    path: '/products'    },
      { label: 'Categories',  path: '/categories'  },
      { label: 'Bundles',     path: '/bundles'     },
      { label: 'Discounts',   path: '/discounts'   },
      { label: 'Brand Tags',  path: '/' },
    ],
  },
  {
    group: 'Orders & Sales',
    items: [
      { label: 'Orders',             path: '/orders'             },
      { label: 'Customers',          path: '/customers'          },
      { label: 'Payments & Payouts', path: '/settings/payment'   },
    ],
  },
  {
    group: 'Ads & Marketing',
    items: [
      { label: 'Ads Manager',       path: '/ads',              badge: null },
      { label: 'Promoted Listings', path: '/promoted-listings', badge: { text: 'Coming Soon', color: 'orange' }, secondBadge: { text: 'NEW', color: 'green' } },
    ],
  },
  {
    group: 'Store Settings',
    items: [
      { label: 'Store Settings',    path: '/settings/store'    },
      { label: 'Payment Settings',  path: '/settings/payment'  },
      { label: 'Branding',          path: '/settings/branding' },
      { label: 'Domain',            path: '/settings/domain'   },
      { label: 'Shipping',          path: '/settings/shipping' },
      { label: 'Policies',          path: '/settings/policies' },
      { label: 'Staff',             path: '/settings/staff'    },
      { label: 'Integrations',      path: '/settings/integrations' },
    ],
  },
];

const SUPPLIER_NAV = [
  {
    group: null,
    items: [{ label: 'Home', path: '/supplier' }],
  },
  {
    group: 'Catalog',
    items: [
      { label: 'My Supplier Products', path: '/supplier/products'  },
      { label: 'Inventory Management', path: '/supplier/inventory' },
    ],
  },
  {
    group: 'Fulfillment',
    items: [
      { label: 'Dropship Orders', path: '/supplier/orders' },
    ],
  },
  {
    group: 'Earnings',
    items: [
      { label: 'Revenue & Withdrawals', path: '/supplier/earnings' },
    ],
  },
  {
    group: 'Settings',
    items: [
      { label: 'Supplier Profile', path: '/settings/supplier-profile' },
      { label: 'Payout Settings',  path: '/settings/payout'           },
      { label: 'Shipping Regions', path: '/supplier/settings/shipping' },
    ],
  },
];

// Badge renderer
function NavBadge({ badge }) {
  if (!badge) return null;
  if (badge.color === 'green') {
    return (
      <span className="text-[9px] font-bold text-white bg-[#22925B] px-1.5 py-0.5 rounded">
        {badge.text}
      </span>
    );
  }
  return (
    <span className="text-[9px] font-semibold text-[#F59E0B] bg-orange-50 px-1.5 py-0.5 rounded">
      {badge.text}
    </span>
  );
}

export default function Sidebar({
  isOpen,
  onClose,
  storeName = 'WesFashion',
  logoUrl = null,
  mode = 'seller',
}) {
  const location = useLocation();
  const navigate  = useNavigate();
  const nav       = mode === 'supplier' ? SUPPLIER_NAV : SELLER_NAV;
  const { addRole, addingRole } = useRoleAdd();
  const { logout } = useAuth();
  const { hasSellerRole, hasSupplierRole, isHybrid, toggleView, enableSupplier, enableSeller, loading: roleLoading } = useRoleToggle();

  const isActive = (path) => location.pathname === path;

  const handlePublish = async () => {
    try {
      await sellerApi.post('/builder/publish');
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 'NO_DOMAIN') alert('Please connect a domain first.');
      if (code === 'EMPTY_HOME_PAGE') alert('Please add sections to your home page first.');
    }
  };

  const handleAddRole = async () => {
    try {
      await addRole('SELLER');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Could not update your account role.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-57.5 bg-white border-r border-gray-100
        flex flex-col z-40 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo + close */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <img src="/varanda-logo.png" alt="Varanda Mart" className="h-10 object-contain" />
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Store avatar + name */}
        <div className="flex items-center gap-3 px-5 py-3">
          <BrandAvatar logoUrl={logoUrl} name={storeName} />
          <span className="text-sm font-semibold text-[#1F2A30] truncate">{storeName}</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {nav.map((section, si) => (
            <div key={si} className="mb-3">
              {section.group && (
                <p className="text-[10px] font-semibold text-[#5C5D86] uppercase tracking-wider px-2 mb-1">
                  {section.group}
                </p>
              )}
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-lg text-sm mb-0.5
                    transition-colors
                    ${isActive(item.path)
                      ? 'bg-green-50 text-[#22925B] font-semibold'
                      : 'text-[#1F2A30] hover:bg-gray-50'}
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isActive(item.path) ? 'bg-[#22925B]' : 'bg-gray-300'
                    }`} />
                    {item.label}
                  </span>

                  {/* Badges */}
                  <span className="flex items-center gap-1">
                    <NavBadge badge={item.badge} />
                    <NavBadge badge={item.secondBadge} />
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Role Toggle for Hybrid Users */}
        {isHybrid && (
          <div className="px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => toggleView(mode)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-[#1F2A30] hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={14} />
              Switch to {mode === 'seller' ? 'Supplier' : 'Seller'} View
            </button>
          </div>
        )}

        {/* Bottom action */}
        <div className="p-4 border-t border-gray-100">
          {mode === 'seller' ? (
            <>
              {!hasSupplierRole && (
                <button
                  onClick={enableSupplier}
                  disabled={roleLoading}
                  className="w-full py-3 mb-2 rounded-full border-2 border-[#22925B] text-[#22925B] text-sm font-semibold hover:bg-green-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {roleLoading ? 'Loading...' : 'Enable Supplier'}
                </button>
              )}
              <button
                onClick={handlePublish}
                className="w-full py-3 rounded-full bg-[#22925B] text-white text-sm font-semibold hover:bg-[#1a7a4a] transition-colors"
              >
                Publish Store
              </button>
            </>
          ) : (
            <>
              {!hasSellerRole && (
                <button
                  onClick={enableSeller}
                  disabled={roleLoading}
                  className="w-full py-3 mb-2 rounded-full border-2 border-[#22925B] text-[#22925B] text-sm font-semibold hover:bg-green-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {roleLoading ? 'Loading...' : 'Start Selling'}
                </button>
              )}
              <button
                onClick={handleAddRole}
                disabled={addingRole}
                className="w-full py-3 rounded-full bg-[#22925B] text-white text-sm font-semibold hover:bg-[#1a7a4a] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {addingRole ? 'Updating...' : 'Supplier Dashboard'}
              </button>
            </>
          )}
          <button
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="flex items-center justify-center gap-1.5 w-full mt-2 py-2 text-xs text-[#5C5D86] hover:text-[#E32323] transition-colors"
          >
            <LogOut size={14} />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
