import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sellerApi } from '../../lib/axios';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import './StoreSettingsPage.css';

const BUSINESS_SECTORS = [
  'FASHION_APPAREL', 'ELECTRONICS', 'FOOD_BEVERAGE', 'HEALTH_BEAUTY',
  'HOME_LIVING', 'BOOKS_STATIONERY', 'SPORTS_FITNESS', 'TOYS_GAMES',
  'AUTOMOTIVE', 'JEWELRY_ACCESSORIES', 'ART_CRAFTS', 'DIGITAL_PRODUCTS',
  'SERVICES', 'GENERAL_MERCHANDISE', 'OTHER'
];

const CURRENCIES = ['NGN', 'USD', 'GBP', 'EUR', 'ZAR', 'KES'];

const TIMEZONES = [
  'Africa/Lagos', 'Africa/Johannesburg', 'Africa/Cairo', 'Africa/Nairobi',
  'UTC', 'Europe/London'
];

export default function StoreSettingsPage() {
  const navigate = useNavigate();
  const { business, setBusiness } = useAuth();

  const [form, setForm] = useState({
    name: '',
    sector: '',
    tagline: '',
    description: '',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || '',
        sector: business.sector || '',
        tagline: business.tagline || '',
        description: business.description || '',
        currency: business.currency || 'NGN',
        timezone: business.timezone || 'Africa/Lagos',
      });
    }
  }, [business]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const { data } = await sellerApi.put('/business', {
        name: form.name,
        sector: form.sector,
        tagline: form.tagline,
        description: form.description,
        currency: form.currency,
        timezone: form.timezone,
      });

      setBusiness(data.data.business);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="store-settings-page">
        <div className="store-settings-container">
          <div className="store-settings-header">
            <div>
              <h1 className="store-settings-title">Store Settings</h1>
              <p className="store-settings-subtitle">Manage your business information and preferences</p>
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
                Settings saved successfully!
              </div>
            )}

            {/* Store Name */}
            <div className="form-section">
              <h2 className="form-section-title">Basic Information</h2>
              <div className="form-group">
                <label className="form-label">Store Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter your store name"
                />
              </div>

              {/* Sector */}
              <div className="form-group">
                <label className="form-label">Business Sector</label>
                <select
                  name="sector"
                  value={form.sector}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="">Select a sector</option>
                  {BUSINESS_SECTORS.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tagline */}
              <div className="form-group">
                <label className="form-label">Store Tagline</label>
                <input
                  type="text"
                  name="tagline"
                  value={form.tagline}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Your store's tagline"
                  maxLength="60"
                />
                <p className="form-hint">{form.tagline.length}/60</p>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Store Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="form-input form-textarea"
                  placeholder="Tell us about your store..."
                  rows="4"
                  maxLength="500"
                />
                <p className="form-hint">{form.description.length}/500</p>
              </div>
            </div>

            {/* Settings Section */}
            <div className="form-section">
              <h2 className="form-section-title">Preferences</h2>

              {/* Currency */}
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  className="form-input"
                >
                  {CURRENCIES.map((curr) => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>

              {/* Timezone */}
              <div className="form-group">
                <label className="form-label">Timezone</label>
                <select
                  name="timezone"
                  value={form.timezone}
                  onChange={handleChange}
                  className="form-input"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
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
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
