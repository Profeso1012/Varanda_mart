import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Check, X, Copy, Loader, BadgeCheck, Globe } from 'lucide-react';
import { sellerApi } from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { BUSINESS_SECTORS, CURRENCIES, TIMEZONES } from '../../data/nigerianStates';
import { WORLD_COUNTRIES, getCountryName, getSubdivisionsForCountry } from '../../data/worldLocations';
import { hasSupplierProfile } from '../../lib/authRoutes';

// ── Slugify helper
const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── Step indicator
function StepIndicator({ current, isSupplier }) {
  const steps = isSupplier
    ? ['Business Info', 'Address', 'Logo & Branding']
    : ['Business Info', 'Address', 'Logo & Branding', 'Domain Setup'];

  return (
    <div className="flex items-start justify-center gap-0 mb-8">
      {steps.map((label, i) => {
        const stepNum  = i + 1;
        const isActive = current === stepNum;
        const isDone   = current > stepNum;
        return (
          <div key={label} className="flex items-start">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                isActive
                  ? 'bg-[#F59E0B] border-[#F59E0B] text-white'
                  : isDone
                  ? 'border-gray-300 text-gray-400 bg-white'
                  : 'border-gray-300 text-gray-400 bg-white'
              }`}>
                {stepNum}
              </div>
              <p className={`text-xs mt-1 text-center max-w-17.5 ${
                isActive ? 'font-semibold text-[#1F2A30]' : 'text-[#5C5D86]'
              }`}>
                {label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div className="h-px w-16 bg-gray-200 mt-4 mx-1 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Reusable input
function Field({ label, error, children }) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-medium text-[#1F2A30] mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-[#E32323] mt-1">{error}</p>}
    </div>
  );
}

const inputCls = (err) =>
  `w-full border rounded-lg px-4 py-3 text-sm text-[#1F2A30] outline-none transition-colors ${
    err ? 'border-[#E32323]' : 'border-gray-200 focus:border-[#22925B]'
  }`;

// ── Custom dropdown
function CustomDropdown({ options, value, onChange, placeholder, allowCustom = false, customLabel = 'Use' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const getOptionValue = (option) => option.value ?? option.code ?? option;
  const getOptionLabel = (option) => option.label ?? option.name ?? option;
  const selected = options.find((option) => getOptionValue(option) === value);
  const displayValue = selected ? getOptionLabel(selected) : value;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => getOptionLabel(option).toLowerCase().includes(normalizedQuery))
    : options;
  const hasExactOption = options.some((option) =>
    getOptionLabel(option).toLowerCase() === normalizedQuery ||
    String(getOptionValue(option)).toLowerCase() === normalizedQuery
  );
  const canUseCustom = allowCustom && query.trim() && !hasExactOption;
  const choose = (nextValue) => {
    onChange(nextValue);
    setQuery('');
    setOpen(false);
  };
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setQuery(''); }}
        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-left flex items-center justify-between text-[#1F2A30] outline-none focus:border-[#22925B]"
      >
        <span className={displayValue ? 'text-[#1F2A30]' : 'text-gray-400'}>
          {displayValue || placeholder}
        </span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
          {allowCustom && (
            <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search or type your own"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#22925B]"
                autoFocus
              />
            </div>
          )}
          {filteredOptions.map((opt) => {
            const val = getOptionValue(opt);
            const lbl = getOptionLabel(opt);
            return (
              <button
                key={val}
                type="button"
                onClick={() => choose(val)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
                {lbl}
              </button>
            );
          })}
          {canUseCustom && (
            <button
              type="button"
              onClick={() => choose(query.trim())}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 text-[#22925B] font-medium"
            >
              {customLabel} "{query.trim()}"
            </button>
          )}
          {!filteredOptions.length && !canUseCustom && (
            <p className="px-4 py-3 text-sm text-[#5C5D86]">No matches found.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sector dropdown (2-column grid)
function SectorDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const selected = BUSINESS_SECTORS.find((s) => s.value === value);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-left flex items-center justify-between text-[#1F2A30] outline-none focus:border-[#22925B]"
      >
        <span className={selected ? 'text-[#1F2A30]' : 'text-gray-400'}>
          {selected ? selected.label : 'Select your business sector'}
        </span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg">
          <div className="grid grid-cols-2 gap-x-4 p-3">
            {BUSINESS_SECTORS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => { onChange(s.value); setOpen(false); }}
                className="text-left px-2 py-2 text-sm hover:text-[#22925B] flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── File upload box
function FileUploadBox({ label, accept, file, onSelect, onRemove, uploading }) {
  const ref = useRef();
  const isImage = file && file.type?.startsWith('image/');
  const isPdf   = file && file.type === 'application/pdf';
  const preview = file && isImage ? URL.createObjectURL(file) : null;

  return (
    <div className="flex flex-col items-center">
      <div
        className="w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden"
        style={{ minHeight: 140 }}
        onClick={() => !file && ref.current?.click()}
      >
        <input ref={ref} type="file" accept={accept} className="hidden"
          onChange={(e) => e.target.files?.[0] && onSelect(e.target.files[0])} />

        {file ? (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center z-10 hover:bg-red-100"
            >
              <X size={12} className="text-gray-600" />
            </button>
            {isImage && (
              <img src={preview} alt="preview" className="w-20 h-20 object-contain" />
            )}
            {isPdf && (
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-12 border border-gray-300 rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-500">PDF</span>
                </div>
              </div>
            )}
          </>
        ) : uploading ? (
          <Loader size={24} className="animate-spin text-[#22925B]" />
        ) : (
          <div className="flex flex-col items-center gap-2 py-4 px-4 text-center">
            <Upload size={22} className="text-gray-400" />
            <p className="text-sm text-gray-400">{label}</p>
            <p className="text-xs text-gray-400">JPG, PNG, PDF</p>
          </div>
        )}
      </div>
      <p className="text-xs text-[#5C5D86] text-center mt-2">
        Accepted formats: JPG, PNG, PDF.<br />Max file size 10MB
      </p>
    </div>
  );
}

// ── Color swatch picker
function ColorSwatch({ label, value, onChange }) {
  const inputRef = useRef(null);
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer hover:scale-105 transition-transform"
        style={{ backgroundColor: value }}
        aria-label={`Choose ${label}`}
      >
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
      </button>
      <p className="text-xs text-[#5C5D86] text-center">{label}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════
// MAIN WIZARD COMPONENT
// ════════════════════════════════════════════════════
export default function BusinessSetupPage() {
  const navigate = useNavigate();
  const { user, business, subscription, setBusiness, applyAuthPayload } = useAuth();
  const { upload } = useCloudinaryUpload();
  const isSupplier = hasSupplierProfile(user) && !user?.hasSellerProfile;

  const [step,    setStep]    = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  // ── Step 1: Business Info
  const [businessInfo, setBusinessInfo] = useState({
    name: '', sector: '', tagline: '', description: '', currency: 'NGN', timezone: 'Africa/Lagos',
  });
  const slug = slugify(businessInfo.name);

  // ── Step 2: Address
  const [addressType,  setAddressType]  = useState('PERSONAL');
  const [addressForm,  setAddressForm]  = useState({
    streetLine1: '', streetLine2: '', city: '', country: 'NG', state: '', postalCode: '',
  });
  const [savedAddress, setSavedAddress] = useState(null);

  // ── Step 2b: Document verification (only for BUSINESS address)
  const [showVerification, setShowVerification] = useState(false);
  const [addressProofFile, setAddressProofFile] = useState(null);
  const [docSubmitted,     setDocSubmitted]      = useState(false);
  const [docUploading,     setDocUploading]      = useState(false);

  // ── Step 3: Branding
  const [logoFile,    setLogoFile]    = useState(null);
  const [logoUrl,     setLogoUrl]     = useState(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [faviconFile, setFaviconFile] = useState(null);
  const [faviconUrl,  setFaviconUrl]  = useState(null);
  const [colors, setColors] = useState({
    primaryColor:    '#22925B',
    secondaryColor:  '#1F2A30',
    accentColor:     '#F59E0B',
    backgroundColor: '#FFFFFF',
  });
  const [brandSaved, setBrandSaved] = useState(false);

  // ── Step 4: Domain
  const [domainTab,    setDomainTab]    = useState('subdomain'); // 'subdomain' | 'custom'
  const [subdomain,    setSubdomain]    = useState('');
  const [subStatus,    setSubStatus]    = useState(null); // null | 'checking' | 'available' | 'taken'
  const [customDomain, setCustomDomain] = useState('');
  const [dnsRecords,   setDnsRecords]   = useState(null); // null | { dnsTxtRecord, domainId }
  const [domainId,     setDomainId]     = useState(null);
  const [verifyingDns, setVerifyingDns] = useState(false);
  const [domainPlanMessage, setDomainPlanMessage] = useState('');
  const checkTimer = useRef(null);
  const isStarterPlan = (subscription?.tier || '').toUpperCase() === 'STARTER';

  useEffect(() => {
    if (!business) return;
    setLogoUrl((current) => current || business.logoUrl || null);
    setBusinessInfo((prev) => ({
      ...prev,
      name: prev.name || business.name || '',
      currency: prev.currency || business.currency || 'NGN',
    }));
  }, [business]);

  // ── Input helpers
  const updateInfo  = (k, v) => setBusinessInfo((p) => ({ ...p, [k]: v }));
  const updateAddr  = (k, v) => setAddressForm((p) => ({ ...p, [k]: v }));
  const clearErr    = (k)    => setErrors((p) => ({ ...p, [k]: undefined }));
  const stateOptions = getSubdivisionsForCountry(addressForm.country);
  const countryName = getCountryName(addressForm.country);

  const updateCountry = (countryCode) => {
    setAddressForm((prev) => ({
      ...prev,
      country: countryCode,
      state: '',
    }));
    clearErr('country');
    clearErr('state');
  };

  // ════════════ STEP 1 SUBMIT ════════════
  const submitStep1 = async () => {
    const e = {};
    if (!businessInfo.name.trim())   e.name   = 'Business name is required';
    if (!businessInfo.sector)        e.sector = 'Please select a sector';
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const { data } = await sellerApi.put('/business', {
        name:        businessInfo.name,
        sector:      businessInfo.sector,
        tagline:     businessInfo.tagline     || undefined,
        description: businessInfo.description || undefined,
        currency:    businessInfo.currency  || 'NGN',
        timezone:    businessInfo.timezone  || 'Africa/Lagos',
      });
      setBusiness(data.data.business);
      setStep(2);
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 'CONFLICT') setErrors({ name: 'This business name is already taken' });
      else setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // ════════════ STEP 2 SUBMIT ════════════
  const submitStep2 = async () => {
    const e = {};
    if (!addressForm.streetLine1.trim()) e.streetLine1 = 'Street address is required';
    if (!addressForm.city.trim())        e.city        = 'City is required';
    if (!addressForm.country)            e.country     = 'Country is required';
    if (!addressForm.state)              e.state       = 'State is required';
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    try {
      const { data } = await sellerApi.put('/business/address', {
        type:        addressType,
        streetLine1: addressForm.streetLine1,
        streetLine2: addressForm.streetLine2 || undefined,
        city:        addressForm.city,
        state:       addressForm.state,
        country:     countryName,
        postalCode:  addressForm.postalCode || undefined,
      });
      setSavedAddress(data.data.address);
      setShowVerification(true);
    } catch {
      setErrors({ general: 'Failed to save address. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // ════════════ DOCUMENT SUBMIT ════════════
  const submitDocuments = async () => {
    if (!addressProofFile) return;
    setDocUploading(true);
    setErrors((prev) => ({ ...prev, docs: null }));
    try {
      const { url, publicId } = await upload(addressProofFile, 'document', 'national_id');
      await sellerApi.post('/business/documents', {
        url,
        publicId,
        type: 'NATIONAL_ID',
        fileName: addressProofFile.name,
      });
      setDocSubmitted(true);
      // After 2 seconds move to step 3
      setTimeout(() => { setShowVerification(false); setStep(3); }, 2000);
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        err.message ||
        'Upload failed. Please try again.';
      setErrors({ docs: message });
    } finally {
      setDocUploading(false);
    }
  };

  const skipAddressVerification = () => {
    setAddressProofFile(null);
    setDocSubmitted(false);
    setErrors((prev) => ({ ...prev, docs: null }));
    setShowVerification(false);
    setStep(3);
  };

  // ════════════ LOGO UPLOAD ════════════
  const handleLogoSelect = async (file) => {
    setLogoFile(file);
    setLogoLoading(true);
    try {
      const { url, publicId } = await upload(file, 'logo');
      const { data } = await sellerApi.post('/business/logo', { url, publicId });
      setLogoUrl(data.data.logoUrl);
      setBusiness((prev) => ({ ...(prev || {}), logoUrl: data.data.logoUrl }));
      setBrandSaved(false);
    } catch {
      setErrors({ logo: 'Logo upload failed.' });
    } finally {
      setLogoLoading(false);
    }
  };

  const handleFaviconSelect = async (file) => {
    setFaviconFile(file);
    try {
      const { url, publicId } = await upload(file, 'favicon');
      const { data } = await sellerApi.post('/business/favicon', { url, publicId });
      setFaviconUrl(data.data.faviconUrl || url);
    } catch {
      setErrors({ favicon: 'Favicon upload failed.' });
    }
  };

  // ════════════ STEP 3 SUBMIT ════════════
  const saveBranding = async () => {
    setLoading(true);
    try {
      await sellerApi.put('/business/brand-settings', {
        primaryColor:    colors.primaryColor,
        secondaryColor:  colors.secondaryColor,
        accentColor:     colors.accentColor,
        backgroundColor: colors.backgroundColor,
      });
      const { data } = await sellerApi.get('/auth/me');
      applyAuthPayload(data.data);
      setBrandSaved(true);
      setErrors((prev) => ({ ...prev, general: null }));
      return true;
    } catch {
      setErrors({ general: 'Failed to save brand settings.' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitStep3 = async () => {
    const saved = brandSaved || await saveBranding();
    if (!saved) return;
    try {
      if (isSupplier) {
        navigate('/supplier');
      } else {
        setStep(4);
      }
    } catch {
      setErrors({ general: 'Could not continue. Please try again.' });
    }
  };

  // ════════════ SUBDOMAIN CHECK (debounced) ════════════
  useEffect(() => {
    if (!subdomain.trim()) { setSubStatus(null); return; }
    setSubStatus('checking');
    clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(() => {
      const isValid = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(subdomain);
      setSubStatus(isValid ? 'available' : 'taken');
    }, 600);
    return () => clearTimeout(checkTimer.current);
  }, [subdomain]);

  // ════════════ CLAIM SUBDOMAIN ════════════
  const claimSubdomain = async () => {
    if (subStatus !== 'available') return;
    setLoading(true);
    try {
      await sellerApi.post('/business/domains/subdomain', { subdomain });
      navigate('/dashboard');
    } catch (err) {
      const code = err.response?.data?.error?.code;
      setErrors({
        subdomain: code === 'CONFLICT'
          ? 'This subdomain has already been claimed.'
          : 'Failed to claim subdomain.',
      });
    } finally {
      setLoading(false);
    }
  };

  // ════════════ REGISTER CUSTOM DOMAIN ════════════
  const addCustomDomain = async () => {
    if (isStarterPlan) {
      setDomainPlanMessage('Suscribe to Pro or Growth plan to register your custom domain');
      return;
    }
    if (!customDomain.trim()) return;
    setLoading(true);
    try {
      const { data } = await sellerApi.post('/business/domains/custom', { domain: customDomain });
      setDnsRecords({
        dnsTxtRecord: data.data.domain.dnsTxtRecord,
        domainId:     data.data.domain.id,
      });
      setDomainId(data.data.domain.id);
    } catch {
      setErrors({ customDomain: 'Invalid domain or already registered.' });
    } finally {
      setLoading(false);
    }
  };

  // ════════════ VERIFY DNS ════════════
  const verifyDns = async () => {
    if (!domainId) return;
    setVerifyingDns(true);
    try {
      await sellerApi.post(`/business/domains/${domainId}/verify`);
      navigate('/dashboard');
    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 'DNS_NOT_VERIFIED') {
        setErrors({ dns: 'DNS records not found yet. Changes can take up to 48 hours.' });
      }
    } finally {
      setVerifyingDns(false);
    }
  };

  // ════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-300 via-gray-200 to-green-100 flex flex-col">

      {/* Logo */}
      <div className="px-8 pt-6">
        <img src="/varanda-logo.png" alt="Varanda Mart" className="h-10 object-contain" />
      </div>

      {/* Step indicator */}
      <div className="mt-6 px-4">
        <StepIndicator current={showVerification ? 2 : step} isSupplier={isSupplier} />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-140 bg-white rounded-2xl shadow-sm px-10 py-8">

          {errors.general && (
            <p className="text-sm text-[#E32323] text-center mb-4">{errors.general}</p>
          )}

          {/* ══════════ STEP 1: BUSINESS INFO ══════════ */}
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-[#1F2A30] text-center mb-8">
                Tell us about your business
              </h1>

              <Field label="Business Name" error={errors.name}>
                <input
                  value={businessInfo.name}
                  onChange={(e) => { updateInfo('name', e.target.value); clearErr('name'); }}
                  placeholder="Enter your business name"
                  className={inputCls(errors.name)}
                />
                {businessInfo.name && (
                  <p className="text-xs text-blue-500 mt-1">
                    [{slug}].varanda.com
                  </p>
                )}
              </Field>

              <Field label="Business Sector" error={errors.sector}>
                <SectorDropdown
                  value={businessInfo.sector}
                  onChange={(v) => { updateInfo('sector', v); clearErr('sector'); }}
                />
              </Field>

              <Field label="Tagline">
                <input
                  value={businessInfo.tagline}
                  onChange={(e) => updateInfo('tagline', e.target.value.slice(0, 100))}
                  placeholder="e.g, Fresh styles for modern living"
                  className={inputCls(false)}
                />
                <p className="text-xs text-right text-[#5C5D86] mt-1">
                  {businessInfo.tagline.length}/100
                </p>
              </Field>

              <Field label="Business Description">
                <textarea
                  rows={3}
                  value={businessInfo.description}
                  onChange={(e) => updateInfo('description', e.target.value.slice(0, 1000))}
                  placeholder="Describe what you sell and who you serve"
                  className={`${inputCls(false)} resize-none`}
                />
                <p className="text-xs text-right text-[#5C5D86] mt-1">
                  {businessInfo.description.length}/1000
                </p>
              </Field>

              <Field label="Currency">
                <CustomDropdown
                  options={CURRENCIES}
                  value={businessInfo.currency}
                  onChange={(v) => updateInfo('currency', v)}
                  placeholder="Select currency"
                />
              </Field>

              <Field label="Timezone">
                <CustomDropdown
                  options={TIMEZONES}
                  value={businessInfo.timezone}
                  onChange={(v) => updateInfo('timezone', v)}
                  placeholder="Select timezone"
                />
              </Field>

              <button
                onClick={submitStep1}
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-[#22925B] text-white text-sm font-semibold hover:bg-[#1a7a4a] transition-colors disabled:opacity-60 mt-2"
              >
                {loading ? 'Saving...' : 'Continue'}
              </button>
            </>
          )}

          {/* ══════════ STEP 2: ADDRESS (with verification sub-step) ══════════ */}
          {step === 2 && !showVerification && (
            <>
              <h1 className="text-xl font-bold text-[#1F2A30] text-center mb-6">
                Where is your business located
              </h1>

              {/* Address type toggle */}
              <div className="flex items-center justify-center gap-2 mb-5">
                {['PERSONAL', 'BUSINESS'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setAddressType(type)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                      addressType === type
                        ? 'bg-[#22925B] text-white'
                        : 'bg-gray-100 text-[#5C5D86] hover:bg-gray-200'
                    }`}
                  >
                    {type === 'PERSONAL' ? 'Personal Address' : 'Business Address'}
                  </button>
                ))}
              </div>

              <div className="bg-blue-50 rounded-lg px-4 py-3 mb-5 text-xs text-[#5C5D86]">
                Address verification is optional for now. You can upload a document or skip to branding.
              </div>

              <Field label="Street Line 1" error={errors.streetLine1}>
                <input value={addressForm.streetLine1}
                  onChange={(e) => { updateAddr('streetLine1', e.target.value); clearErr('streetLine1'); }}
                  className={inputCls(errors.streetLine1)} />
              </Field>

              <Field label="Apartment">
                <input value={addressForm.streetLine2}
                  onChange={(e) => updateAddr('streetLine2', e.target.value)}
                  className={inputCls(false)} />
              </Field>

              <Field label="City" error={errors.city}>
                <input value={addressForm.city}
                  onChange={(e) => { updateAddr('city', e.target.value); clearErr('city'); }}
                  className={inputCls(errors.city)} />
              </Field>

              <Field label="Country" error={errors.country}>
                <CustomDropdown
                  options={WORLD_COUNTRIES}
                  value={addressForm.country}
                  onChange={updateCountry}
                  placeholder="Select country"
                  allowCustom
                  customLabel="Use country"
                />
              </Field>

              <Field label="State" error={errors.state}>
                <CustomDropdown
                  options={stateOptions}
                  value={addressForm.state}
                  onChange={(v) => { updateAddr('state', v); clearErr('state'); }}
                  allowCustom
                  customLabel="Use state"
                  placeholder={
                    stateOptions.length
                      ? `Select state in ${countryName}`
                      : `No states listed for ${countryName}`
                  }
                />
              </Field>

              <Field label="Postal Code">
                <input value={addressForm.postalCode}
                  onChange={(e) => updateAddr('postalCode', e.target.value)}
                  className={inputCls(false)} />
              </Field>

              <button
                onClick={submitStep2}
                disabled={loading}
                className="w-full py-3.5 rounded-full bg-[#22925B] text-white text-sm font-semibold hover:bg-[#1a7a4a] transition-colors disabled:opacity-60 mt-2"
              >
                {loading ? 'Saving...' : 'Continue'}
              </button>
            </>
          )}

          {/* ══════════ STEP 2b: ADDRESS VERIFICATION ══════════ */}
          {step === 2 && showVerification && (
            <>
              {docSubmitted ? (
                /* Success state */
                <div className="flex items-center justify-center min-h-75">
                  <div className="bg-green-50 rounded-2xl px-8 py-10 flex flex-col items-center text-center">
                    <BadgeCheck size={56} className="text-[#22925B] mb-4" strokeWidth={1.5} />
                    <p className="text-base font-bold text-[#1F2A30] mb-1">
                      Documents submitted for review.
                    </p>
                    <p className="text-sm text-[#5C5D86]">
                      We'll notify you by email within 24 hours
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-[#1F2A30] text-center mb-2">
                    Verify Your Address
                  </h1>
                  <p className="text-sm text-[#5C5D86] text-center mb-6">
                    Upload a document that confirms this address
                  </p>

                  {/* Saved address card */}
                  {savedAddress && (
                    <div className="border border-gray-200 rounded-xl px-5 py-4 mb-6 flex items-start justify-between">
                      <div className="text-sm text-[#1F2A30] space-y-0.5">
                        <p>{savedAddress.streetLine1}</p>
                        <p>{savedAddress.city}, {savedAddress.state}</p>
                        <p>{savedAddress.country}</p>
                      </div>
                      <button
                        onClick={() => setShowVerification(false)}
                        className="text-sm text-blue-500 hover:underline shrink-0"
                      >
                        Edit
                      </button>
                    </div>
                  )}

                  <p className="text-sm font-medium text-[#1F2A30] text-center mb-4">
                    Upload a document that confirms this address
                  </p>

                  {errors.docs && (
                    <p className="text-xs text-[#E32323] text-center mb-3">{errors.docs}</p>
                  )}

                  <div className="mx-auto mb-6 max-w-80">
                    <FileUploadBox
                      label="ID Card [NIN, driver's License, etc]"
                      accept="image/*,.pdf"
                      file={addressProofFile}
                      onSelect={(file) => {
                        setAddressProofFile(file);
                        setErrors((prev) => ({ ...prev, docs: null }));
                      }}
                      onRemove={() => setAddressProofFile(null)}
                      uploading={false}
                    />
                  </div>

                  <button
                    onClick={submitDocuments}
                    disabled={!addressProofFile || docUploading}
                    className={`w-full py-3.5 rounded-full text-sm font-semibold text-white transition-colors ${
                      addressProofFile && !docUploading
                        ? 'bg-[#22925B] hover:bg-[#1a7a4a]'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {docUploading ? 'Uploading...' : 'Submit Documents'}
                  </button>

                  <button
                    type="button"
                    onClick={skipAddressVerification}
                    disabled={docUploading}
                    className="w-full mt-3 py-3 rounded-full border border-gray-200 text-sm font-semibold text-[#5C5D86] hover:border-[#22925B] hover:text-[#22925B] transition-colors disabled:opacity-60"
                  >
                    Skip for now
                  </button>

                </>
              )}
            </>
          )}

          {/* ══════════ STEP 3: LOGO & BRANDING ══════════ */}
          {step === 3 && (
            <>
              <h1 className="text-2xl font-bold text-[#1F2A30] text-center mb-6">
                Make it yours
              </h1>

              {/* Logo upload */}
              <div
                className="w-full border-2 border-dashed border-gray-200 rounded-xl mb-6 flex flex-col items-center justify-center cursor-pointer relative"
                style={{ minHeight: 160 }}
                onClick={() => !logoUrl && document.getElementById('logo-input')?.click()}
              >
                <input id="logo-input" type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleLogoSelect(e.target.files[0])} />

                {logoLoading ? (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <Loader size={28} className="animate-spin text-[#22925B]" />
                    <p className="text-sm text-[#5C5D86]">
                      {logoFile?.name} · {(logoFile?.size / 1024 / 1024).toFixed(1)}MB
                    </p>
                  </div>
                ) : logoUrl ? (
                  <div className="flex flex-col items-center py-6 px-4">
                    <img src={logoUrl} alt="logo" className="max-h-24 object-contain mb-3" />
                    <p className="text-xs text-[#5C5D86]">
                      {logoFile?.name} · {(logoFile?.size / 1024 / 1024).toFixed(1)}MB
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); document.getElementById('logo-input')?.click(); }}
                      className="text-xs text-[#22925B] hover:underline mt-1"
                    >
                      Change Logo
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                    <Upload size={24} className="text-[#F59E0B]" />
                    <p className="text-sm text-[#5C5D86]">Upload your logo</p>
                    <p className="text-xs text-gray-400">PNG, JPG, SVG or WEBP. Max 10MB</p>
                  </div>
                )}
              </div>

              {/* Favicon */}
              <div className="flex items-center gap-2 mb-3">
                <Globe size={18} className="text-[#5C5D86]" />
                <p className="text-sm font-medium text-[#1F2A30]">Favicon</p>
              </div>
              <div
                className="w-36 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer py-4 px-3 mb-6 relative"
                onClick={() => document.getElementById('favicon-input')?.click()}
              >
                <input id="favicon-input" type="file" accept="image/*,.ico" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFaviconSelect(e.target.files[0])} />
                {faviconFile || faviconUrl ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFaviconFile(null); setFaviconUrl(null); }}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center"
                    >
                      <X size={10} />
                    </button>
                    {faviconUrl ? (
                      <img src={faviconUrl} alt="favicon" className="w-8 h-8 object-contain mb-1" />
                    ) : (
                      <div className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center mb-1">
                        <span className="text-[10px] font-bold text-blue-500">ICO</span>
                      </div>
                    )}
                    <button className="text-xs text-[#22925B]">Change Logo</button>
                  </>
                ) : (
                  <>
                    <Upload size={18} className="text-[#F59E0B] mb-1" />
                    <p className="text-xs text-[#5C5D86] text-center">Upload favicon</p>
                  </>
                )}
              </div>

              {/* Brand Colors */}
              <p className="text-sm font-semibold text-[#1F2A30] mb-3">Brand Colors</p>
              <div className="flex items-start gap-4 mb-6 relative">
                {[
                  { key: 'primaryColor',    label: 'Primary Color'    },
                  { key: 'secondaryColor',  label: 'Secondary Color'  },
                  { key: 'accentColor',     label: 'Accent Color'     },
                  { key: 'backgroundColor', label: 'Background Color' },
                ].map(({ key, label }) => (
                  <ColorSwatch
                    key={key}
                    label={label}
                    value={colors[key]}
                    onChange={(v) => {
                      setColors((p) => ({ ...p, [key]: v }));
                      setBrandSaved(false);
                    }}
                  />
                ))}
              </div>

              {/* Live Brand Preview */}
              <p className="text-sm font-semibold text-[#1F2A30] mb-3">Live Brand Preview</p>
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ backgroundColor: colors.primaryColor }}
                >
                  <span className="text-white font-bold text-sm">
                    {logoUrl ? (
                      <img src={logoUrl} alt={businessInfo.name || 'Store logo'} className="h-7 w-12 object-contain" />
                    ) : (
                      (businessInfo.name || business?.name || 'Store').slice(0, 2).toUpperCase()
                    )}
                  </span>
                  <div className="flex gap-4">
                    {['Home', 'Shop', 'Contact'].map((item) => (
                      <span key={item} className="text-white text-xs">{item}</span>
                    ))}
                  </div>
                </div>
                <div
                  className="h-20"
                  style={{ backgroundColor: colors.backgroundColor }}
                >
                  <div className="w-24 h-16 m-3 rounded" style={{ backgroundColor: colors.secondaryColor + '22' }} />
                  <div className="mx-3 -mt-6 w-24 rounded border border-gray-200 bg-white px-2 py-2 text-[10px] text-[#1F2A30]">
                    <p className="truncate">SampleProduct</p>
                    <button className="mt-1 rounded px-2 py-1 text-[10px] text-white" style={{ backgroundColor: colors.accentColor }}>
                      Add to cart
                    </button>
                  </div>
                </div>
              </div>

              {errors.general && (
                <p className="text-xs text-[#E32323] mb-3">{errors.general}</p>
              )}

              {brandSaved && (
                <p className="text-xs text-[#22925B] mb-3">Branding saved.</p>
              )}

              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={saveBranding}
                  disabled={loading}
                  className="min-w-28 py-3 rounded-full border border-gray-300 text-sm font-semibold text-[#1F2A30] hover:border-[#22925B] hover:text-[#22925B] transition-colors disabled:opacity-60"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={submitStep3}
                  disabled={loading}
                  className={`min-w-28 py-3 rounded-full text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
                    brandSaved ? 'bg-[#22925B] hover:bg-[#1a7a4a]' : 'bg-gray-300'
                  }`}
                >
                  {loading ? 'Saving...' : isSupplier ? 'Go to Dashboard' : 'Continue'}
                </button>
              </div>
            </>
          )}

          {/* ══════════ STEP 4: DOMAIN SETUP (seller only) ══════════ */}
          {step === 4 && (
            <>
              <h1 className="text-xl font-bold text-[#1F2A30] text-center mb-6">
                Your stores web address
              </h1>

              {/* Domain type cards */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { id: 'subdomain', title: 'Free Subdomain', desc: 'Use a free address like yourstore.varanda.com' },
                  { id: 'custom',    title: 'Custom Domain',  desc: 'Connect a domain you already own'             },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (opt.id === 'custom' && isStarterPlan) {
                        setDomainTab('subdomain');
                        setDomainPlanMessage('Suscribe to Pro or Growth plan to register your custom domain');
                        return;
                      }
                      setDomainPlanMessage('');
                      setDomainTab(opt.id);
                    }}
                    className={`text-left p-4 rounded-xl border-2 transition-colors ${
                      domainTab === opt.id
                        ? 'border-[#22925B] bg-white'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#1F2A30]">{opt.title}</p>
                    <p className="text-xs text-[#5C5D86] mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>

              {domainPlanMessage && (
                <p className="rounded-lg bg-orange-50 px-4 py-3 text-center text-xs font-medium text-[#F59E0B] mb-4">
                  {domainPlanMessage}
                </p>
              )}

              {/* Free subdomain */}
              {domainTab === 'subdomain' && (
                <>
                  <div className={`flex items-center border rounded-xl px-4 py-3 mb-1 ${
                    subStatus === 'taken' ? 'border-[#E32323]' : 'border-gray-200'
                  }`}>
                    <input
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="Store name"
                      className="flex-1 text-sm text-[#1F2A30] outline-none"
                    />
                    <span className="text-sm text-[#5C5D86]">.varanda.com</span>
                    <span className="ml-3 w-5 flex items-center justify-center">
                      {subStatus === 'checking'  && <Loader size={16} className="animate-spin text-gray-400" />}
                      {subStatus === 'available' && <Check  size={16} className="text-[#22925B]" />}
                      {subStatus === 'taken'     && <X      size={16} className="text-[#E32323]" />}
                    </span>
                  </div>
                  {subStatus === 'available' && (
                    <p className="text-xs text-[#22925B] text-center mb-4">Available</p>
                  )}
                  {subStatus === 'taken' && (
                    <p className="text-xs text-[#E32323] text-center mb-4">Not Available</p>
                  )}
                  {(!subStatus || subStatus === 'checking') && <div className="mb-4" />}

                  {errors.subdomain && (
                    <p className="text-xs text-[#E32323] text-center mb-3">{errors.subdomain}</p>
                  )}

                  <button
                    onClick={claimSubdomain}
                    disabled={subStatus !== 'available' || loading}
                    className={`w-full py-3.5 rounded-full text-sm font-semibold text-white transition-colors ${
                      subStatus === 'available' && !loading
                        ? 'bg-[#22925B] hover:bg-[#1a7a4a]'
                        : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    {loading ? 'Claiming...' : 'Claim This Address'}
                  </button>
                </>
              )}

              {/* Custom domain */}
              {domainTab === 'custom' && (
                <>
                  {!dnsRecords ? (
                    <>
                      <div className="border border-gray-200 rounded-xl px-4 py-3 mb-1">
                        <input
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value)}
                          placeholder="yourdomain.com"
                          className="w-full text-sm text-center text-[#1F2A30] outline-none"
                        />
                      </div>
                      <p className="text-xs text-[#5C5D86] text-center mb-5">
                        you must own this domain. We'll give you instructions to connect it
                      </p>
                      {errors.customDomain && (
                        <p className="text-xs text-[#E32323] text-center mb-3">{errors.customDomain}</p>
                      )}
                      <button
                        onClick={addCustomDomain}
                        disabled={!customDomain.trim() || loading}
                        className={`w-full py-3.5 rounded-full text-sm font-semibold text-white transition-colors ${
                          customDomain.trim() && !loading
                            ? 'bg-[#22925B] hover:bg-[#1a7a4a]'
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {loading ? 'Adding...' : 'Add Domain'}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-[#1F2A30] mb-3">Configure your domain</p>
                      <table className="w-full text-sm border border-gray-100 rounded-xl overflow-hidden mb-2">
                        <thead className="bg-gray-50">
                          <tr>
                            {['Type', 'Host', 'Value', 'Copy'].map((h) => (
                              <th key={h} className="text-left px-3 py-2 text-xs text-[#5C5D86] font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-gray-100">
                            <td className="px-3 py-2.5 text-xs">TXT</td>
                            <td className="px-3 py-2.5 text-xs">@</td>
                            <td className="px-3 py-2.5 text-xs truncate max-w-35">{dnsRecords.dnsTxtRecord || 'varanda-verification-code'}</td>
                            <td className="px-3 py-2.5">
                              <button
                                onClick={() => navigator.clipboard.writeText(dnsRecords.dnsTxtRecord || '')}
                                className="flex items-center gap-1 text-blue-500 text-xs"
                              >
                                <Copy size={12} /> Copy
                              </button>
                            </td>
                          </tr>
                          <tr className="border-t border-gray-100">
                            <td className="px-3 py-2.5 text-xs">CNAME</td>
                            <td className="px-3 py-2.5 text-xs">WWW</td>
                            <td className="px-3 py-2.5 text-xs">shops.varanda.com</td>
                            <td className="px-3 py-2.5">
                              <button
                                onClick={() => navigator.clipboard.writeText('shops.varanda.com')}
                                className="flex items-center gap-1 text-blue-500 text-xs"
                              >
                                <Copy size={12} /> Copy
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <p className="text-xs text-[#5C5D86] text-center mb-5">
                        Add these records in your domain provider's DNS settings
                      </p>
                      {errors.dns && (
                        <p className="text-xs text-[#E32323] text-center mb-3">{errors.dns}</p>
                      )}
                      <button
                        onClick={verifyDns}
                        disabled={verifyingDns}
                        className="w-full py-3 rounded-full border-2 border-[#22925B] text-[#22925B] text-sm font-semibold hover:bg-green-50 transition-colors mb-3 disabled:opacity-60"
                      >
                        {verifyingDns ? 'Verifying...' : 'Verify DNS'}
                      </button>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-3.5 rounded-full bg-[#22925B] text-white text-sm font-semibold hover:bg-[#1a7a4a] transition-colors"
                      >
                        Complete Setup
                      </button>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full mt-3 text-sm text-blue-500 hover:underline"
                      >
                        Skip for now
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Skip for subdomain tab */}
              {domainTab === 'subdomain' && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full mt-3 text-sm text-[#5C5D86] hover:underline"
                >
                  Skip for now
                </button>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
