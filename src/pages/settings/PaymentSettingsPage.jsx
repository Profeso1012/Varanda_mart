import { useState, useEffect } from 'react';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sellerApi } from '../../lib/axios';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import './StoreSettingsPage.css';

const NIGERIAN_BANKS = [
  { code: '057', name: 'Zenith Bank' },
  { code: '050', name: 'Guaranty Trust Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '044', name: 'Access Bank' },
  { code: '011', name: 'First Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '012', name: 'First City Monument Bank' },
  { code: '023', name: 'Citibank Nigeria' },
  { code: '035', name: 'Wema Bank' },
  { code: '040', name: 'Zenith Bank' },
];

export default function PaymentSettingsPage() {
  const { business } = useAuth();

  const [bankAccount, setBankAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    bankCode: '',
    accountNumber: '',
  });

  const [verified, setVerified] = useState(null);

  useEffect(() => {
    fetchBankAccount();
  }, []);

  const fetchBankAccount = async () => {
    try {
      const { data } = await sellerApi.get('/business/bank-account');
      setBankAccount(data.data.bankAccount || null);
    } catch (err) {
      // No bank account yet
      setBankAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    setVerified(null);

    try {
      const { data } = await sellerApi.post('/business/bank-account/verify-account', {
        bankCode: form.bankCode,
        accountNumber: form.accountNumber,
      });

      setVerified(data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Account verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    setError(null);
    setSuccess(false);

    try {
      const { data } = await sellerApi.post('/business/bank-account', {
        bankCode: form.bankCode,
        accountNumber: form.accountNumber,
        accountName: verified.accountName,
        settlementSchedule: 'auto',
      });

      setBankAccount(data.data.bankAccount);
      setForm({ bankCode: '', accountNumber: '' });
      setVerified(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to register bank account');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
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
    <DashboardLayout>
      <div className="store-settings-page">
        <div className="store-settings-container">
          <div className="store-settings-header">
            <div>
              <h1 className="store-settings-title">Payment Settings</h1>
              <p className="store-settings-subtitle">Manage your bank account for payouts</p>
            </div>
          </div>

          {error && (
            <div className="form-alert form-alert--error mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="form-alert form-alert--success mb-6">
              Bank account registered successfully!
            </div>
          )}

          {/* Current Bank Account */}
          {bankAccount && (
            <div className="form-section mb-8 p-6 bg-white border border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle size={24} className="text-green-600 mt-1" />
                <div>
                  <h3 className="form-section-title mb-2">Active Bank Account</h3>
                  <p className="text-sm text-gray-600 mb-3">Your account is registered and ready for payouts</p>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Bank:</span> {bankAccount.bankName}</p>
                    <p><span className="font-medium">Account:</span> {bankAccount.accountNumber}</p>
                    <p><span className="font-medium">Account Name:</span> {bankAccount.accountName}</p>
                    <p><span className="font-medium">Status:</span> <span className="text-green-600 font-medium">{bankAccount.isActive ? 'Active' : 'Inactive'}</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!bankAccount && (
            <div className="form-section">
              <h2 className="form-section-title">Add Bank Account</h2>

              <div className="form-group">
                <label className="form-label">Select Bank</label>
                <select
                  name="bankCode"
                  value={form.bankCode}
                  onChange={handleChange}
                  disabled={verified}
                  className="form-input"
                >
                  <option value="">Choose a bank</option>
                  {NIGERIAN_BANKS.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  disabled={verified}
                  className="form-input"
                  placeholder="10-digit account number"
                  maxLength="10"
                />
              </div>

              {!verified && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={!form.bankCode || !form.accountNumber || verifying}
                  className="btn-primary"
                >
                  {verifying ? (
                    <>
                      <Loader size={16} className="inline mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Account'
                  )}
                </button>
              )}

              {verified && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Account Verified</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        <span className="font-medium">Name:</span> {verified.accountName}<br />
                        <span className="font-medium">Bank:</span> {verified.bankName}<br />
                        <span className="font-medium">Account:</span> {verified.accountNumber}
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleRegister}
                          disabled={registering}
                          className="btn-primary"
                        >
                          {registering ? (
                            <>
                              <Loader size={16} className="inline mr-2 animate-spin" />
                              Registering...
                            </>
                          ) : (
                            'Confirm & Register'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVerified(null);
                            setForm({ bankCode: '', accountNumber: '' });
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
