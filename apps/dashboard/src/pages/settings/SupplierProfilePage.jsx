import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sellerApi } from '../../lib/axios';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import './StoreSettingsPage.css';

const COUNTRY_CODES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'UG', name: 'Uganda' },
  { code: 'ET', name: 'Ethiopia' },
];

export default function SupplierProfilePage() {
  // const navigate = useNavigate();
  // const { supplierProfile, setSupplierProfile } = useAuth();

  const [form, setForm] = useState({
    displayName: '',
    description: '',
    processingTimeDays: 2,
    shipsTo: [],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const fetchProfile = async () => {
    try {
      const { data } = await sellerApi.get('/supplier/profile');
      const profile = data.data.supplier;
      setForm({
        displayName: profile.displayName || '',
        description: profile.description || '',
        processingTimeDays: profile.processingTimeDays || 2,
        shipsTo: profile.shipsTo || [],
      });
    } catch (err) {
      setError('Failed to load supplier profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
   
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const toggleCountry = (countryCode) => {
    setForm((prev) => ({
      ...prev,
      shipsTo: prev.shipsTo.includes(countryCode)
        ? prev.shipsTo.filter((c) => c !== countryCode)
        : [...prev.shipsTo, countryCode],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data } = await sellerApi.put('/supplier/profile', {
        displayName: form.displayName,
        description: form.description,
        processingTimeDays: form.processingTimeDays,
        shipsTo: form.shipsTo,
      });

      setSupplierProfile(data.data.supplier);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout mode="supplier">
        <div className="store-settings-page">
          <div className="store-settings-container">
            <div className="flex items-center justify-center h-64">
              <Loader size={32} className="animate-spin text-[#22925B]" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout mode="supplier">
      <div className="store-settings-page">
        <div className="store-settings-container">
          <div className="store-settings-header">
            <div>
              <h1 className="store-settings-title">Supplier Profile</h1>
              <p className="store-settings-subtitle">Manage your supplier information and shipping preferences</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="store-settings-form">
            {error && (
              <div className="form-alert form-alert--error">
                {error}
              </div>
            )}

            {success && (
              <div className="form-alert form-alert--success">
                Profile updated successfully!
              </div>
            )}

            {/* Display Name */}
            <div className="form-section">
              <h2 className="form-section-title">Profile Information</h2>

              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  name="displayName"
                  value={form.displayName}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Your supplier name"
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">About Your Business</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="form-input form-textarea"
                  placeholder="Tell buyers about your business..."
                  rows="4"
                  maxLength="500"
                />
                <p className="form-hint">{form.description.length}/500</p>
              </div>
            </div>

            {/* Shipping Settings */}
            <div className="form-section">
              <h2 className="form-section-title">Shipping Settings</h2>

              {/* Processing Time */}
              <div className="form-group">
                <label className="form-label">Processing Time (days)</label>
                <input
                  type="number"
                  name="processingTimeDays"
                  value={form.processingTimeDays}
                  onChange={handleChange}
                  min="1"
                  max="30"
                  className="form-input"
                />
                <p className="form-hint">How many days to process orders before shipping</p>
              </div>

              {/* Ships To */}
              <div className="form-group">
                <label className="form-label">Ships To</label>
                <div className="countries-grid">
                  {COUNTRY_CODES.map(({ code, name }) => (
                    <label key={code} className="country-checkbox">
                      <input
                        type="checkbox"
                        checked={form.shipsTo.includes(code)}
                        onChange={() => toggleCountry(code)}
                        className="country-checkbox__input"
                      />
                      <span className="country-checkbox__label">{name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="form-actions">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? (
                  <>
                    <Loader size={16} className="inline mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Update Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
