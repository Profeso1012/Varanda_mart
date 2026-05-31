// apps/storefront/src/pages/AccountPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  User, MapPin, Package, LogOut, Plus, Edit2, Trash2,
  ChevronRight, ArrowLeft, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import {
  getProfile, updateProfile,
  getAddresses, createAddress, updateAddress, deleteAddress,
  getCustomerOrders, getCustomerOrder,
} from '../api/storefrontApi';
import './AccountPage.css';

const formatPrice = (n) => `₦${Number(n || 0).toLocaleString()}`;
const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_BADGE = {
  PENDING:    { label: 'Pending',    cls: 'badge--yellow' },
  CONFIRMED:  { label: 'Confirmed',  cls: 'badge--blue' },
  PROCESSING: { label: 'Processing', cls: 'badge--blue' },
  SHIPPED:    { label: 'Shipped',    cls: 'badge--blue' },
  DELIVERED:  { label: 'Delivered',  cls: 'badge--green' },
  CANCELLED:  { label: 'Cancelled',  cls: 'badge--red' },
};

export default function AccountPage() {
  const { tab = 'profile' } = useParams();
  const { customer, logout, isLoggedIn } = useAuth();
  const { store } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) navigate('/');
  }, [isLoggedIn, navigate]);

  const tabs = [
    { id: 'profile',   label: 'Profile',   icon: <User size={16} /> },
    { id: 'addresses', label: 'Addresses',  icon: <MapPin size={16} /> },
    { id: 'orders',    label: 'Orders',     icon: <Package size={16} /> },
  ];

  return (
    <div className="account-page">
      <div className="container">
        <div className="account-page__layout">
          {/* Sidebar */}
          <aside className="account-sidebar">
            <div className="account-sidebar__profile">
              <div className="account-sidebar__avatar">
                {customer?.firstName?.[0]?.toUpperCase() || <User size={24} />}
              </div>
              <div>
                <p className="account-sidebar__name">
                  {customer ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer' : 'Customer'}
                </p>
                <p className="account-sidebar__email">{customer?.email}</p>
              </div>
            </div>

            <nav className="account-sidebar__nav">
              {tabs.map(t => (
                <Link
                  key={t.id}
                  to={`/account/${t.id}`}
                  className={`account-sidebar__link ${tab === t.id ? 'account-sidebar__link--active' : ''}`}
                >
                  {t.icon} {t.label} <ChevronRight size={14} className="account-sidebar__chevron" />
                </Link>
              ))}
              <button className="account-sidebar__logout" onClick={logout}>
                <LogOut size={16} /> Sign Out
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div className="account-content">
            {tab === 'profile'   && <ProfileTab customer={customer} />}
            {tab === 'addresses' && <AddressesTab />}
            {tab === 'orders'    && <OrdersTab />}
            {tab === 'orders' && <OrderDetailView />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab({ customer }) {
  const [form, setForm] = useState({
    firstName: customer?.firstName || '',
    lastName:  customer?.lastName  || '',
    phone:     customer?.phone     || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(null); setSaved(false);
    try {
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <h2 className="account-content__title">Profile Details</h2>
      <form onSubmit={handleSave} className="account-form">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="form-input" value={form.firstName}
              onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-input" value={form.lastName}
              onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={customer?.email || ''} disabled />
          <span className="form-hint">Email cannot be changed</span>
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" type="tel" value={form.phone}
            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
            placeholder="+2348012345678" />
        </div>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? <span className="spinner" /> : saved ? <><Check size={16} /> Saved</> : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

// ── Addresses Tab ────────────────────────────────────────────────────────────
function AddressesTab() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [editingId, setEditingId] = useState(null); // null = list, 'new' = new form, uuid = edit
  const [deleting, setDeleting]   = useState(null);

  useEffect(() => {
    getAddresses().then(setAddresses).finally(() => setLoading(false));
  }, []);

  const handleSaved = (saved) => {
    if (editingId === 'new') {
      setAddresses(prev => [...prev, saved]);
    } else {
      setAddresses(prev => prev.map(a => a.id === saved.id ? saved : a));
    }
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteAddress(id);
      setAddresses(prev => prev.filter(a => a.id !== id));
    } catch {}
    setDeleting(null);
  };

  if (editingId) {
    const existing = editingId === 'new' ? null : addresses.find(a => a.id === editingId);
    return (
      <div className="card">
        <button className="btn btn--ghost btn--sm" onClick={() => setEditingId(null)} style={{ marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back
        </button>
        <h2 className="account-content__title">{editingId === 'new' ? 'Add Address' : 'Edit Address'}</h2>
        <AddressForm initial={existing} onSaved={handleSaved} />
      </div>
    );
  }

  return (
    <div className="card">
      <div className="account-content__header">
        <h2 className="account-content__title">Saved Addresses</h2>
        <button className="btn btn--primary btn--sm" onClick={() => setEditingId('new')}>
          <Plus size={15} /> Add Address
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center' }}><span className="spinner spinner--lg" /></div>
      ) : addresses.length === 0 ? (
        <div className="account-empty">
          <MapPin size={40} />
          <p>No saved addresses yet</p>
          <button className="btn btn--outline btn--sm" onClick={() => setEditingId('new')}>Add your first address</button>
        </div>
      ) : (
        <div className="addresses-grid">
          {addresses.map(addr => (
            <div key={addr.id} className={`address-card ${addr.isDefault ? 'address-card--default' : ''}`}>
              {addr.isDefault && <span className="badge badge--green address-card__default-badge">Default</span>}
              <p className="address-card__label">{addr.label}</p>
              <p className="address-card__name">{addr.recipientName}</p>
              <p className="address-card__line">{addr.streetLine1}</p>
              <p className="address-card__line">{addr.city}, {addr.state}</p>
              <p className="address-card__line">{addr.country}</p>
              {addr.phone && <p className="address-card__phone">{addr.phone}</p>}
              <div className="address-card__actions">
                <button className="btn btn--ghost btn--sm" onClick={() => setEditingId(addr.id)}>
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  className="btn btn--ghost btn--sm"
                  style={{ color: '#ef4444' }}
                  onClick={() => handleDelete(addr.id)}
                  disabled={deleting === addr.id}
                >
                  {deleting === addr.id ? <span className="spinner" /> : <><Trash2 size={13} /> Delete</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddressForm({ initial, onSaved }) {
  const [form, setForm] = useState({
    label: initial?.label || 'Home',
    recipientName: initial?.recipientName || '',
    phone: initial?.phone || '',
    streetLine1: initial?.streetLine1 || '',
    city: initial?.city || '',
    state: initial?.state || '',
    country: initial?.country || 'Nigeria',
    isDefault: initial?.isDefault || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      const result = initial
        ? await updateAddress(initial.id, form)
        : await createAddress(form);
      onSaved(result);
    } catch {
      setError('Failed to save address');
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="account-form">
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Label</label>
          <input className="form-input" value={form.label}
            onChange={e => setForm(p => ({ ...p, label: e.target.value }))} placeholder="Home, Work…" />
        </div>
        <div className="form-group">
          <label className="form-label">Recipient Name *</label>
          <input className="form-input" required value={form.recipientName}
            onChange={e => setForm(p => ({ ...p, recipientName: e.target.value }))} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Phone</label>
        <input className="form-input" type="tel" value={form.phone}
          onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
      </div>
      <div className="form-group">
        <label className="form-label">Street Address *</label>
        <input className="form-input" required value={form.streetLine1}
          onChange={e => setForm(p => ({ ...p, streetLine1: e.target.value }))} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">City *</label>
          <input className="form-input" required value={form.city}
            onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">State *</label>
          <input className="form-input" required value={form.state}
            onChange={e => setForm(p => ({ ...p, state: e.target.value }))} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Country</label>
        <input className="form-input" value={form.country}
          onChange={e => setForm(p => ({ ...p, country: e.target.value }))} />
      </div>
      <label className="account-checkbox">
        <input type="checkbox" checked={form.isDefault}
          onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} />
        Set as default address
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn--primary" disabled={saving}>
        {saving ? <span className="spinner" /> : 'Save Address'}
      </button>
    </form>
  );
}

// ── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    getCustomerOrders().then(r => setOrders(r.data || [])).finally(() => setLoading(false));
  }, []);

  if (selectedId) {
    return <OrderDetail orderId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="card">
      <h2 className="account-content__title">Your Orders</h2>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center' }}><span className="spinner spinner--lg" /></div>
      ) : orders.length === 0 ? (
        <div className="account-empty">
          <Package size={40} />
          <p>No orders yet</p>
          <Link to="/products" className="btn btn--outline btn--sm">Start Shopping</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => {
            const badge = STATUS_BADGE[order.status] || STATUS_BADGE.PENDING;
            return (
              <div
                key={order.id}
                className="order-row"
                onClick={() => setSelectedId(order.id)}
                role="button"
                tabIndex={0}
              >
                <div className="order-row__main">
                  <p className="order-row__num">#{order.orderNumber}</p>
                  <p className="order-row__date">{formatDate(order.createdAt)}</p>
                </div>
                <div className="order-row__right">
                  <span className={`badge ${badge.cls}`}>{badge.label}</span>
                  <span className="order-row__total">{formatPrice(order.total)}</span>
                  <ChevronRight size={16} className="order-row__chevron" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderDetail({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomerOrder(orderId).then(setOrder).finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}><span className="spinner spinner--lg" /></div>;
  if (!order) return <p className="form-error">Order not found</p>;

  const badge = STATUS_BADGE[order.status] || STATUS_BADGE.PENDING;

  return (
    <div className="card">
      <button className="btn btn--ghost btn--sm" onClick={onBack} style={{ marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to Orders
      </button>
      <div className="order-detail__header">
        <div>
          <h2 className="account-content__title" style={{ marginBottom: 4 }}>Order #{order.orderNumber}</h2>
          <p style={{ color: 'var(--brand-muted)', fontSize: '0.875rem' }}>{formatDate(order.createdAt)}</p>
        </div>
        <span className={`badge ${badge.cls}`} style={{ fontSize: '0.875rem', padding: '5px 14px' }}>{badge.label}</span>
      </div>

      {/* Tracking */}
      {order.trackingNumber && (
        <div className="order-detail__tracking">
          <Package size={16} />
          <span>Tracking: <strong>{order.trackingNumber}</strong></span>
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="btn btn--outline btn--sm">
              Track Shipment
            </a>
          )}
        </div>
      )}

      {/* Items */}
      <div className="order-detail__items">
        {order.items?.map(item => (
          <div key={item.id} className="cart-item" style={{ padding: '16px 0' }}>
            <div className="cart-item__img">
              {item.productImage
                ? <img src={item.productImage} alt={item.productName} />
                : <div className="cart-item__img-placeholder"><Package size={20} /></div>
              }
            </div>
            <div className="cart-item__details">
              <span className="cart-item__name">{item.productName}</span>
              {item.variantSku && <span className="cart-item__sku">SKU: {item.variantSku}</span>}
            </div>
            <div className="cart-item__right">
              <span className="cart-item__qty-val" style={{ fontSize: '0.875rem', color: 'var(--brand-muted)' }}>
                × {item.quantity}
              </span>
              <span className="cart-item__price">{formatPrice(item.totalPrice)}</span>
            </div>
          </div>
        ))}
      </div>

      <hr className="divider" />
      <div className="cart-summary__row"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
      {order.shippingFee > 0 && <div className="cart-summary__row"><span>Shipping</span><span>{formatPrice(order.shippingFee)}</span></div>}
      {order.discountAmount > 0 && <div className="cart-summary__row" style={{ color: '#16a34a' }}><span>Discount</span><span>−{formatPrice(order.discountAmount)}</span></div>}
      <div className="cart-summary__row cart-summary__row--total"><span>Total</span><span>{formatPrice(order.total)}</span></div>
    </div>
  );
}
