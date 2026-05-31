import { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, Edit2, AlertCircle, CheckCircle, Search, Save } from 'lucide-react';
import { 
  getZones, createZone, deleteZone, 
  addRegionToZone, removeRegionFromZone, 
  addRateToZone, deleteRate,
  getShipbubbleStatus, connectShipbubble, disconnectShipbubble 
} from '../../api/shipping';
import './ShippingSettingsPage.css';

const formatPrice = (n) => `₦${Number(n || 0).toLocaleString()}`;

export default function ShippingSettingsPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Shipbubble
  const [shipbubble, setShipbubble] = useState(null);
  const [shipbubbleKey, setShipbubbleKey] = useState('');
  const [connecting, setConnecting] = useState(false);

  // Modals
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(null); // zone id
  const [showRateModal, setShowRateModal] = useState(null); // zone id

  const fetchData = async () => {
    setLoading(true);
    try {
      const [zonesData, sbData] = await Promise.all([
        getZones(),
        getShipbubbleStatus()
      ]);
      setZones(zonesData);
      setShipbubble(sbData);
    } catch {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleConnectShipbubble = async (e) => {
    e.preventDefault();
    if (!shipbubbleKey.trim()) return;
    setConnecting(true);
    try {
      const data = await connectShipbubble({ apiKey: shipbubbleKey });
      setShipbubble(data);
      setShipbubbleKey('');
    } catch {
      alert('Failed to connect Shipbubble. Check your API key.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectShipbubble = async () => {
    if (!window.confirm('Disconnect Shipbubble? This will remove live rates from your checkout.')) return;
    setConnecting(true);
    try {
      const data = await disconnectShipbubble();
      setShipbubble(data);
    } catch (err) {
      alert('Failed to disconnect');
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return <div className="dashboard-page" style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><span className="spinner spinner--lg" /></div>;
  }

  return (
    <div className="dashboard-page shipping-settings">
      <div className="dashboard-header">
        <h1>Shipping Settings</h1>
        <p className="text-muted">Manage your shipping zones, manual rates, and third-party integrations.</p>
      </div>

      <div className="shipping-grid">
        
        {/* Main Content: Manual Zones */}
        <div className="shipping-main">
          <div className="card-header-flex">
            <h2>Shipping Zones</h2>
            <button className="btn btn--primary btn--sm" onClick={() => setShowZoneModal(true)}>
              <Plus size={16} /> Add Zone
            </button>
          </div>

          {zones.length === 0 ? (
            <div className="card shipping-empty">
              <Truck size={40} className="text-muted" />
              <h3>No Shipping Zones</h3>
              <p className="text-muted">Create a shipping zone to start offering delivery to your customers.</p>
              <button className="btn btn--outline" onClick={() => setShowZoneModal(true)}>Create Zone</button>
            </div>
          ) : (
            <div className="zones-list">
              {zones.map(zone => (
                <div key={zone.id} className="card zone-card">
                  <div className="zone-header">
                    <div>
                      <h3 className="zone-name">{zone.name}</h3>
                      <p className="zone-regions">
                        {zone.regions?.length 
                          ? zone.regions.map(r => r.name).join(', ') 
                          : <span className="text-muted">No regions added</span>}
                      </p>
                    </div>
                    <div className="zone-actions">
                      <button className="btn btn--ghost btn--sm" onClick={() => setShowRegionModal(zone.id)}>Manage Regions</button>
                      <button className="btn btn--ghost btn--sm btn--danger" onClick={async () => {
                        if(window.confirm('Delete this zone?')) {
                          await deleteZone(zone.id);
                          fetchData();
                        }
                      }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="zone-rates">
                    <div className="zone-rates-header">
                      <h4>Manual Rates</h4>
                      <button className="btn btn--ghost btn--sm" onClick={() => setShowRateModal(zone.id)}>
                        <Plus size={14} /> Add Rate
                      </button>
                    </div>

                    {zone.rates?.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: '0.875rem' }}>No manual rates configured.</p>
                    ) : (
                      <table className="rates-table">
                        <tbody>
                          {zone.rates?.map(rate => (
                            <tr key={rate.id}>
                              <td>
                                <span className="font-medium">{rate.name}</span>
                                {rate.description && <span className="rate-desc">{rate.description}</span>}
                              </td>
                              <td>{rate.estimatedDays && `Est. ${rate.estimatedDays}`}</td>
                              <td className="font-medium">{rate.isFree || rate.rate === 0 ? 'FREE' : formatPrice(rate.rate)}</td>
                              <td className="text-right">
                                <button className="btn btn--ghost btn--sm btn--danger" onClick={async () => {
                                  if(window.confirm('Delete rate?')) {
                                    await deleteRate(rate.id);
                                    fetchData();
                                  }
                                }}><Trash2 size={14} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Shipbubble Integration */}
        <div className="shipping-sidebar">
          <div className="card shipbubble-card">
            <div className="shipbubble-header">
              <div className="shipbubble-logo">SB</div>
              <h3>Shipbubble</h3>
            </div>
            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 16 }}>
              Connect your Shipbubble account to offer live courier rates at checkout.
            </p>

            {shipbubble?.connected ? (
              <div className="shipbubble-status connected">
                <CheckCircle size={16} />
                <span>Connected</span>
                <button className="btn btn--outline btn--sm mt-3" onClick={handleDisconnectShipbubble} disabled={connecting}>
                  {connecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleConnectShipbubble} className="shipbubble-form">
                <div className="form-group">
                  <label className="form-label">API Key</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={shipbubbleKey} 
                    onChange={e => setShipbubbleKey(e.target.value)} 
                    placeholder="sb_live_..."
                    required
                  />
                </div>
                <button type="submit" className="btn btn--primary w-full" disabled={connecting}>
                  {connecting ? <span className="spinner" /> : 'Connect Shipbubble'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showZoneModal && (
        <ZoneModal onClose={() => setShowZoneModal(false)} onSaved={fetchData} />
      )}
      {showRegionModal && (
        <RegionModal 
          zoneId={showRegionModal} 
          currentRegions={zones.find(z => z.id === showRegionModal)?.regions || []} 
          onClose={() => setShowRegionModal(null)} 
          onSaved={fetchData} 
        />
      )}
      {showRateModal && (
        <RateModal 
          zoneId={showRateModal} 
          onClose={() => setShowRateModal(null)} 
          onSaved={fetchData} 
        />
      )}
    </div>
  );
}

// ── Modals ───────────────────────────────────────────────────────────────────

function ZoneModal({ onClose, onSaved }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createZone({ name });
      onSaved();
      onClose();
    } catch {
      alert('Failed to create zone');
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header"><h2>Create Shipping Zone</h2></div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Zone Name</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lagos Mainland" required />
          </div>
          <div className="modal-footer" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={loading}>Save Zone</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RegionModal({ zoneId, currentRegions, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState('');
  const [city, setCity] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addRegionToZone(zoneId, {
        country: 'Nigeria',
        state,
        city: city || null
      });
      onSaved();
      setState(''); setCity('');
    } catch {
      alert('Failed to add region');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (regionId) => {
    setLoading(true);
    try {
      await removeRegionFromZone(zoneId, regionId);
      onSaved();
    } catch {
      alert('Failed to remove region');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box modal-box--lg">
        <div className="modal-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <h2>Manage Regions</h2>
            <button className="btn btn--ghost" onClick={onClose}>Done</button>
          </div>
        </div>
        
        <form onSubmit={handleAdd} className="add-region-form" style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <input className="form-input" value={state} onChange={e => setState(e.target.value)} placeholder="State (e.g. Lagos)" required />
          </div>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <input className="form-input" value={city} onChange={e => setCity(e.target.value)} placeholder="City (optional)" />
          </div>
          <button type="submit" className="btn btn--primary" disabled={loading}>Add</button>
        </form>

        <div className="regions-list" style={{ border: '1px solid var(--border-color)', borderRadius: 8, maxHeight: 300, overflowY: 'auto' }}>
          {currentRegions.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No regions added yet.</div>
          ) : (
            currentRegions.map(r => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                <span>{r.name}</span>
                <button className="btn btn--ghost btn--sm btn--danger" onClick={() => handleRemove(r.id)} disabled={loading}>Remove</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function RateModal({ zoneId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    rate: '',
    description: '',
    estimatedDays: '',
    isFree: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addRateToZone(zoneId, {
        ...form,
        rate: form.isFree ? 0 : Number(form.rate)
      });
      onSaved();
      onClose();
    } catch {
      alert('Failed to add rate');
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header"><h2>Add Manual Rate</h2></div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Rate Name</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard Delivery" required />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem' }}>
              <input type="checkbox" checked={form.isFree} onChange={e => setForm(f => ({ ...f, isFree: e.target.checked }))} />
              Free Shipping
            </label>
          </div>

          {!form.isFree && (
            <div className="form-group">
              <label className="form-label">Cost (₦)</label>
              <input type="number" min="0" step="100" className="form-input" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: e.target.value }))} required />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Estimated Transit Time</label>
            <input className="form-input" value={form.estimatedDays} onChange={e => setForm(f => ({ ...f, estimatedDays: e.target.value }))} placeholder="e.g. 2-3 Business Days" />
          </div>

          <div className="modal-footer" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary" disabled={loading}>Save Rate</button>
          </div>
        </form>
      </div>
    </div>
  );
}
