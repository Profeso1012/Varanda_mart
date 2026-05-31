import { useState, useEffect } from 'react';
import Sidebar        from '../../components/dashboard/Sidebar';
import GettingStarted from '../../components/dashboard/GettingStarted';
import { sellerApi }  from '../../lib/axios';
import { formatPrice, formatNumber } from '../../lib/formatters';
import { useRoleAdd } from '../../hooks/useRoleAdd';

const SUPPLIER_GETTING_STARTED = [
  { label: 'Add your first product',  path: '/supplier/products/new',     done: true  },
  { label: 'Set up shipping Regions', path: '/supplier/settings/shipping', done: false },
  { label: 'Connect Bank Account',    path: '/supplier/settings/bank',     done: false },
  { label: 'Publish Listings',        path: null,                          done: false },
];

const DEMO_PRODUCTS = [
  { name: 'Nike Air Force 1 Sneakers', revenue: 150000, imported: 120 },
  { name: "Women's Leather Handbag",   revenue: 120000, imported: 85  },
  { name: 'Bluetooth Headphones',      revenue: 75000,  imported: 64  },
  { name: 'Denim Jacket',              revenue: 180000, imported: 42  },
  { name: 'Fitness Watch',             revenue: 150000, imported: 30  },
];

export default function SupplierDashboardPage() {
  const { addRole, addingRole, roleAddError } = useRoleAdd();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [revenue,     setRevenue]     = useState(null);
  const [topProducts, setTopProducts] = useState(DEMO_PRODUCTS);
  const [storeName,   setStoreName]   = useState('WesFashion');

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, revenueRes] = await Promise.all([
          sellerApi.get('/auth/me'),
          sellerApi.get('/supplier/revenue?period=30d'),
        ]);
        setStoreName(meRes.data.data.business?.name || 'My Store');
        const rev = revenueRes.data.data;
        setRevenue(rev);
        if (rev.topProducts?.length) setTopProducts(rev.topProducts);
      } catch {
        // keep demo data
      }
    };
    load();
  }, []);

  const statCards = [
    { label: 'Wholesale Revenue',    value: formatPrice(revenue?.totalEarned   ?? 2450000) },
    { label: 'Active Listings',      value: formatNumber(revenue?.activeListings ?? 48)     },
    { label: 'Pending Fulfillments', value: formatNumber(revenue?.pendingOrders  ?? 12)     },
  ];

  const handleStartSelling = async () => {
    try {
      await addRole('SELLER');
    } catch {
      // The hook exposes the API message for inline display.
    }
  };

  return (
    // Outer wrapper — flex column so banner can stick to bottom
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        storeName={storeName}
        mode="supplier"
      />

      {/* Right side — flex col fills height */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* TopBar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-[#1F2A30]"
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6"  x2="21" y2="6"  />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-[#1F2A30]">Supplier Dashboard</h1>
          </div>
          <button className="relative text-[#1F2A30]">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#E32323]" />
          </button>
        </header>

        {/* Scrollable main */}
        <main className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-[#22925B] font-medium mb-4">Welcome Back</p>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-5">
                <p className="text-xs text-[#5C5D86] mb-2">{card.label}</p>
                <p className="text-2xl font-bold text-[#1F2A30]">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Top Products + Getting Started */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-[#1F2A30] mb-4">Top Performing Products</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#5C5D86] text-xs border-b border-gray-100">
                    <th className="text-left py-2 pr-4 font-medium">Product Name</th>
                    <th className="text-left py-2 pr-4 font-medium">Times Imported</th>
                    <th className="text-left py-2 font-medium">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map((p, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-3 pr-4 text-[#1F2A30]">{p.name}</td>
                      <td className="py-3 pr-4 text-[#1F2A30]">{formatPrice(p.revenue)}</td>
                      <td className="py-3 text-[#1F2A30]">{formatNumber(p.imported)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Getting Started — amber checkboxes for supplier */}
            <GettingStarted steps={SUPPLIER_GETTING_STARTED} checkColor="amber" />
          </div>
        </main>

        {/* ── Full-width bottom banner ── */}
        <div className="bg-green-50 border-t border-green-100 px-8 py-4 flex items-center justify-between gap-4 shrink-0">
          <p className="text-sm text-[#1F2A30]">
            Want to sell directly to customers?{' '}
            <span className="font-bold">Open a store.</span>
          </p>
          <div className="flex items-center gap-3 shrink-0">
            {roleAddError && (
              <p className="text-xs text-[#E32323]">{roleAddError}</p>
            )}
            <button
              onClick={handleStartSelling}
              disabled={addingRole}
              className="bg-[#22925B] text-white text-sm font-semibold px-6 py-2.5 rounded-full hover:bg-[#1a7a4a] transition-colors shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {addingRole ? 'Updating...' : 'Start Selling'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
