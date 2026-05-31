import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, User, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { getOrder, updateOrderStatus, shipOrder } from '../../api/orders';
import './OrderDetailPage.css';

const STATUS_BADGE = {
  PENDING:    { label: 'Pending',    cls: 'badge--yellow' },
  CONFIRMED:  { label: 'Confirmed',  cls: 'badge--blue' },
  PROCESSING: { label: 'Processing', cls: 'badge--blue' },
  SHIPPED:    { label: 'Shipped',    cls: 'badge--blue' },
  DELIVERED:  { label: 'Delivered',  cls: 'badge--green' },
  CANCELLED:  { label: 'Cancelled',  cls: 'badge--red' },
};

const formatPrice = (n) => `₦${Number(n || 0).toLocaleString()}`;
const formatDate = (d) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Ship modal
  const [showShipModal, setShowShipModal] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  const fetchOrder = () => {
    setLoading(true);
    getOrder(id)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this order as ${newStatus}?`)) return;
    setActionLoading(true);
    try {
      await updateOrderStatus(id, { status: newStatus });
      fetchOrder();
    } catch {
      alert('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShip = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await shipOrder(id, { trackingNumber, trackingUrl });
      setShowShipModal(false);
      fetchOrder();
    } catch {
      alert('Failed to mark as shipped');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-page" style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><span className="spinner spinner--lg" /></div>;
  }
  if (!order) {
    return <div className="dashboard-page"><div className="card" style={{ padding: 48, textAlign: 'center' }}>Order not found</div></div>;
  }

  const badge = STATUS_BADGE[order.status] || STATUS_BADGE.PENDING;
  const isCancellable = !['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.status);
  const canShip = ['CONFIRMED', 'PROCESSING'].includes(order.status);

  return (
    <div className="dashboard-page order-detail-page">
      <div className="order-detail-header">
        <button className="btn btn--ghost btn--sm back-btn" onClick={() => navigate('/orders')}>
          <ArrowLeft size={16} /> Back to Orders
        </button>
        
        <div className="header-main">
          <div className="header-title">
            <h1>Order #{order.orderNumber}</h1>
            <span className={`badge ${badge.cls} badge--lg`}>{badge.label}</span>
          </div>
          <div className="header-actions">
            {order.status === 'PENDING' && (
              <button className="btn btn--primary" onClick={() => handleStatusChange('CONFIRMED')} disabled={actionLoading}>
                Confirm Order
              </button>
            )}
            {order.status === 'CONFIRMED' && (
              <button className="btn btn--outline" onClick={() => handleStatusChange('PROCESSING')} disabled={actionLoading}>
                Mark as Processing
              </button>
            )}
            {canShip && (
              <button className="btn btn--primary" onClick={() => setShowShipModal(true)} disabled={actionLoading}>
                <Truck size={16} /> Mark as Shipped
              </button>
            )}
            {order.status === 'SHIPPED' && (
              <button className="btn btn--primary" onClick={() => handleStatusChange('DELIVERED')} disabled={actionLoading}>
                <CheckCircle size={16} /> Mark as Delivered
              </button>
            )}
            {isCancellable && (
              <button className="btn btn--outline" style={{ color: '#ef4444', borderColor: '#fee2e2' }} onClick={() => handleStatusChange('CANCELLED')} disabled={actionLoading}>
                Cancel Order
              </button>
            )}
          </div>
        </div>
        <div className="header-date">{formatDate(order.createdAt)}</div>
      </div>

      <div className="order-grid">
        {/* Left Column - Items & Payment */}
        <div className="order-main">
          <div className="card">
            <h2 className="card-title"><Package size={18} /> Order Items</h2>
            <div className="order-items">
              {order.items?.map(item => (
                <div key={item.id} className="order-item">
                  <div className="item-img">
                    {item.productImage ? <img src={item.productImage} alt={item.productName} /> : <div className="item-placeholder"><Package size={20} /></div>}
                  </div>
                  <div className="item-info">
                    <p className="item-name">{item.productName}</p>
                    {item.variantSku && <p className="item-sku">SKU: {item.variantSku}</p>}
                    <p className="item-price">{formatPrice(item.unitPrice)} × {item.quantity}</p>
                  </div>
                  <div className="item-total">
                    {formatPrice(item.totalPrice)}
                  </div>
                </div>
              ))}
            </div>

            <div className="order-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="summary-row" style={{ color: '#16a34a' }}>
                  <span>Discount</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
            
            <div className="payment-status-banner">
              <div className="payment-status-banner__icon">
                {order.paymentStatus === 'PAID' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              </div>
              <div>
                <p className="payment-status-banner__title">Payment Status: {order.paymentStatus}</p>
                {order.paymentMethod && <p className="payment-status-banner__desc">Method: {order.paymentMethod}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Customer & Shipping */}
        <div className="order-sidebar">
          <div className="card">
            <h2 className="card-title"><User size={18} /> Customer</h2>
            <div className="customer-info">
              <p className="font-medium">{order.customerName}</p>
              <p className="text-muted">{order.customerEmail}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="card-title"><MapPin size={18} /> Shipping Address</h2>
            {order.shippingAddress ? (
              <div className="address-info">
                <p>{order.shippingAddress.streetLine1}</p>
                {order.shippingAddress.streetLine2 && <p>{order.shippingAddress.streetLine2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            ) : (
              <p className="text-muted">No shipping address provided.</p>
            )}
          </div>

          {order.customerNote && (
            <div className="card">
              <h2 className="card-title">Order Note</h2>
              <p className="order-note">{order.customerNote}</p>
            </div>
          )}

          {order.trackingNumber && (
            <div className="card tracking-card">
              <h2 className="card-title"><Truck size={18} /> Tracking</h2>
              <div className="tracking-info">
                <p className="font-medium">{order.trackingNumber}</p>
                {order.trackingUrl && (
                  <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="btn btn--outline btn--sm mt-2">
                    Track Package
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ship Modal */}
      {showShipModal && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShowShipModal(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h2>Ship Order #{order.orderNumber}</h2>
            </div>
            <form onSubmit={handleShip}>
              <div className="form-group">
                <label className="form-label">Tracking Number (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={trackingNumber} 
                  onChange={e => setTrackingNumber(e.target.value)} 
                  placeholder="e.g. TRK123456789"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tracking URL (Optional)</label>
                <input 
                  type="url" 
                  className="form-input" 
                  value={trackingUrl} 
                  onChange={e => setTrackingUrl(e.target.value)} 
                  placeholder="https://..."
                />
              </div>
              <div className="modal-footer" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn btn--ghost" onClick={() => setShowShipModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={actionLoading}>
                  {actionLoading ? <span className="spinner" /> : 'Mark as Shipped'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
