import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Monitor, Package, ShoppingBag, Users,
  CreditCard, Megaphone, Tag, ShoppingCart,
} from 'lucide-react';
import Sidebar        from '../../components/dashboard/Sidebar';
import BrandAvatar    from '../../components/dashboard/BrandAvatar';
import StatCard       from '../../components/dashboard/StatCard';
import GettingStarted from '../../components/dashboard/GettingStarted';
import { sellerApi }  from '../../lib/axios';
import { formatPrice, formatNumber, ORDER_STATUS_CONFIG } from '../../lib/formatters';

const SPARK = [10, 18, 14, 22, 19, 28, 24, 32, 28, 36];

const GETTING_STARTED_STEPS = [
  { label: 'Add your first product',    path: '/products/new',        done: true  },
  { label: 'Set up shipping Zones',     path: '/settings/shipping',   done: false },
  { label: 'Customize your storefront', path: '/builder',             done: false },
  { label: 'Connect a domain',          path: '/settings/domain',     done: false },
  { label: 'Publish your store',        path: null,                   done: false },
];

const QUICK_ACCESS = [
  {
    label: 'Website Builder',
    desc:  'Design your store',
    path:  '/builder',
    icon:  Monitor,
  },
  {
    label: 'Products',
    desc:  'Manage your products',
    path:  '/products',
    icon:  Package,
  },
  {
    label: 'Orders',
    desc:  'View & manage orders',
    path:  '/orders',
    icon:  ShoppingBag,
  },
  {
    label: 'Customers',
    desc:  'Manage your customers',
    path:  '/customers',
    icon:  Users,
  },
  {
    label:  'Payments & Payouts',
    desc:   'Track earnings & payouts',
    path:   '/payments',
    icon:   CreditCard,
  },
  {
    label:  'Ads Manager',
    desc:   'Create & manage ads',
    path:   '/ads',
    icon:   Megaphone,
    badge:  { text: 'NEW', color: 'green' },
  },
  {
    label:  'Promoted Listings',
    desc:   'Boost your products',
    path:   '/promoted-listings',
    icon:   Tag,
    badge:  { text: 'Coming Soon', color: 'orange' },
  },
  {
    label:  'Dropship Marketplace',
    desc:   'Discover trending products',
    path:   '/marketplace',
    icon:   ShoppingCart,
  },
];

export default function SellerDashboardPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats,  setStats]  = useState(null);
  const [orders, setOrders] = useState([]);
  const [storeName, setStoreName] = useState('My Store');
  const [logoUrl, setLogoUrl] = useState(null);
  const [userInitials, setUserInitials] = useState('W3');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [meRes, statsRes, ordersRes] = await Promise.all([
          sellerApi.get('/auth/me'),
          sellerApi.get('/orders/stats?period=30d'),
          sellerApi.get('/orders?perPage=5'),
        ]);
        const { user, business } = meRes.data.data;
        setStoreName(business?.name || 'My Store');
        setLogoUrl(business?.logoUrl || null);
        setUserInitials(
          `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'W3'
        );
        setStats(statsRes.data.data);
        setOrders(ordersRes.data.data.orders || []);
      } catch (err) {
        if (err.response?.status === 401) navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statCards = [
    { label: 'Total Orders',    value: formatNumber(stats?.totalOrders ?? 0), change: '+0%', changeColor: 'green', sparkData: SPARK },
    { label: 'Total Revenue',   value: formatPrice(stats?.totalRevenue ?? 0), change: '+0%', changeColor: 'green', sparkData: SPARK },
    { label: 'Pending Orders',  value: formatNumber(stats?.pendingOrders ?? 0), change: '+0%', changeColor: 'green', sparkData: SPARK },
    { label: 'Products Listed', value: formatNumber(stats?.productsListed ?? stats?.totalProducts ?? 0), change: '+0%', changeColor: 'green', sparkData: SPARK },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        storeName={storeName}
        logoUrl={logoUrl}
        mode="seller"
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar with user avatar */}
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
            <h1 className="text-lg font-semibold text-[#1F2A30]">Seller Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-[#1F2A30]">
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"
                viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#E32323]" />
            </button>
            {/* User avatar */}
            {logoUrl ? (
              <BrandAvatar logoUrl={logoUrl} name={storeName} size="sm" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#22925B] flex items-center justify-center text-white text-xs font-bold">
                {userInitials}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          {/* Recent Orders + Getting Started */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 mb-6">

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h2 className="text-sm font-bold text-[#1F2A30] mb-4">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#5C5D86] text-xs border-b border-gray-100">
                      <th className="text-left py-2 pr-4 font-medium">Order Number</th>
                      <th className="text-left py-2 pr-4 font-medium">Customer Name</th>
                      <th className="text-left py-2 pr-4 font-medium">Total Amount</th>
                      <th className="text-left py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array(5).fill('').map((_, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            {Array(4).fill('').map((_, j) => (
                              <td key={j} className="py-3 pr-4">
                                <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
                              </td>
                            ))}
                          </tr>
                        ))
                      : orders.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-10 text-center text-sm text-[#5C5D86]">
                              No orders yet.
                            </td>
                          </tr>
                        )
                      : orders.map((row) => {
                          const cfg = ORDER_STATUS_CONFIG[row.status] || ORDER_STATUS_CONFIG.PENDING;
                          const orderNum  = row.id   || `#${row.orderNumber}`;
                          const custName  = row.name || `${row.customer?.firstName || ''} ${row.customer?.lastName || ''}`.trim();
                          const amount    = row.amount ?? row.total;
                          return (
                            <tr key={orderNum}
                              className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => row.id && navigate(`/orders/${row.id}`)}>
                              <td className="py-3 pr-4 text-[#1F2A30]">{orderNum}</td>
                              <td className="py-3 pr-4 text-[#1F2A30]">{custName}</td>
                              <td className="py-3 pr-4 text-[#1F2A30]">{formatPrice(amount)}</td>
                              <td className="py-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                                  {cfg.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                    }
                  </tbody>
                </table>
              </div>
            </div>

            {/* Getting Started — green checkboxes */}
            <GettingStarted steps={GETTING_STARTED_STEPS} checkColor="green" />
          </div>

          {/* Quick Access */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-[#1F2A30] mb-4">Quick Access</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {QUICK_ACCESS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all text-left group"
                  >
                    {/* Icon circle */}
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                      <Icon size={16} className="sm:w-[18px] sm:h-[18px] text-[#22925B]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <p className="text-xs font-semibold text-[#1F2A30] leading-tight">
                          {item.label}
                        </p>
                        {item.badge && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded leading-tight ${
                            item.badge.color === 'green'
                              ? 'bg-[#22925B] text-white'
                              : 'bg-orange-50 text-[#F59E0B]'
                          }`}>
                            {item.badge.text}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-[12px] text-[#5C5D86] mt-0.5 leading-tight">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
