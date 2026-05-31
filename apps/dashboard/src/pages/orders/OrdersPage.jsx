import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, ChevronRight, AlertCircle, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { getOrders, getOrderStats } from '../../api/orders';
import './OrdersPage.css';

const STATUS_BADGE = {
  PENDING:    { label: 'Pending',    cls: 'badge--yellow' },
  CONFIRMED:  { label: 'Confirmed',  cls: 'badge--blue' },
  PROCESSING: { label: 'Processing', cls: 'badge--blue' },
  SHIPPED:    { label: 'Shipped',    cls: 'badge--blue' },
  DELIVERED:  { label: 'Delivered',  cls: 'badge--green' },
  CANCELLED:  { label: 'Cancelled',  cls: 'badge--red' },
};

const formatPrice = (n) => `₦${Number(n || 0).toLocaleString()}`;
const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function OrdersPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    getOrderStats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getOrders({
      page,
      perPage: 15,
      ...(status !== 'ALL' && { status }),
      ...(search.trim() && { search })
    })
      .then(res => {
        setOrders(res.data?.orders || []);
        setTotalPages(res.meta?.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, status, search]);

  return (
    <DashboardLayout title="Orders" mode="seller">
      <div className="dashboard-page">

      {/* Stats row */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card__icon" style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}><TrendingUp size={20} /></div>
            <div className="stat-card__content">
              <span className="stat-card__label">Total Revenue</span>
              <span className="stat-card__value">{formatPrice(stats.totalRevenue)}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}><Clock size={20} /></div>
            <div className="stat-card__content">
              <span className="stat-card__label">Pending Orders</span>
              <span className="stat-card__value">{stats.pending || 0}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon" style={{ backgroundColor: '#dcfce7', color: '#15803d' }}><CheckCircle size={20} /></div>
            <div className="stat-card__content">
              <span className="stat-card__label">Delivered</span>
              <span className="stat-card__value">{stats.delivered || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card dashboard-table-container">
        <div className="table-filters">
          <div className="search-input">
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by order #, name, or email..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          
          <select 
            className="filter-select"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="table-loading"><span className="spinner spinner--lg" /></div>
        ) : orders.length === 0 ? (
          <div className="table-empty">
            <AlertCircle size={40} className="text-muted" style={{ marginBottom: 16 }} />
            <h3>No orders found</h3>
            <p className="text-muted">No orders match your current filters.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const b = STATUS_BADGE[order.status] || STATUS_BADGE.PENDING;
                  return (
                    <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="cursor-pointer">
                      <td className="font-medium">{order.orderNumber}</td>
                      <td className="text-muted">{formatDate(order.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="font-medium">{order.customerName}</span>
                          <span className="text-muted" style={{ fontSize: '0.8rem' }}>{order.customerEmail}</span>
                        </div>
                      </td>
                      <td className="font-medium">{formatPrice(order.total)}</td>
                      <td><span className={`badge ${b.cls}`}>{b.label}</span></td>
                      <td className="text-right"><ChevronRight size={16} className="text-muted" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="table-pagination">
            <button 
              className="btn btn--ghost btn--sm" 
              disabled={page <= 1} 
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>
              Page {page} of {totalPages}
            </span>
            <button 
              className="btn btn--ghost btn--sm" 
              disabled={page >= totalPages} 
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}
