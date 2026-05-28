import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Check, ChevronDown, Loader, Package, Plus, Search, Truck, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRoleAdd } from '../../hooks/useRoleAdd';
import { sellerApi } from '../../lib/axios';
import { hasSupplierProfile } from '../../lib/authRoutes';
import { WORLD_COUNTRIES, getCountryName } from '../../data/worldLocations';

const BENEFITS = [
  'List products for sellers to import.',
  'Receive dropship orders from verified sellers.',
  'Control supplier prices and processing time.',
  'Track revenue, fulfillment, and withdrawals.',
];

const inputClass = (hasError) =>
  `w-full rounded-lg border px-4 py-3 text-sm text-[#1F2A30] outline-none transition-colors ${
    hasError ? 'border-[#E32323]' : 'border-gray-200 focus:border-[#22925B]'
  }`;

function CountryMultiSelect({ value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const selectedLabels = useMemo(
    () => value.map((item) => getCountryName(item)),
    [value]
  );
  const filtered = useMemo(
    () => WORLD_COUNTRIES.filter((country) => country.label.toLowerCase().includes(normalizedQuery)).slice(0, 80),
    [normalizedQuery]
  );
  const hasExact = WORLD_COUNTRIES.some((country) =>
    country.label.toLowerCase() === normalizedQuery || country.code.toLowerCase() === normalizedQuery
  );
  const canAddCustom = query.trim() && !hasExact;

  const toggle = (code) => {
    onChange(value.includes(code) ? value.filter((item) => item !== code) : [...value, code]);
  };

  const remove = (code) => onChange(value.filter((item) => item !== code));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border bg-white px-4 py-2 text-left text-sm ${
          error ? 'border-[#E32323]' : 'border-gray-200 focus:border-[#22925B]'
        }`}
      >
        <span className={value.length ? 'text-[#1F2A30]' : 'text-gray-400'}>
          {value.length ? `${value.length} ${value.length === 1 ? 'country' : 'countries'} selected` : 'Select shipping countries'}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {selectedLabels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((code, index) => (
            <span key={`${code}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-[#1F2A30]">
              {getCountryName(code)}
              <button type="button" onClick={() => remove(code)} className="text-[#5C5D86] hover:text-[#E32323]" aria-label={`Remove ${getCountryName(code)}`}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
            <Search size={15} className="text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search or type a country"
              className="w-full py-2 text-sm outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.map((country) => {
              const selected = value.includes(country.code);
              return (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => toggle(country.code)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-green-50"
                >
                  <span>{country.label}</span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full ${selected ? 'bg-[#22925B] text-white' : 'bg-gray-100 text-transparent'}`}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                </button>
              );
            })}
            {canAddCustom && (
              <button
                type="button"
                onClick={() => {
                  onChange([...value, query.trim()]);
                  setQuery('');
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-[#22925B] hover:bg-green-50"
              >
                <Plus size={15} />
                Add "{query.trim()}"
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupplierActivationPage() {
  const navigate = useNavigate();
  const { user, supplierProfile, applyAuthPayload } = useAuth();
  const { addRole, addingRole, roleAddError } = useRoleAdd();
  const [form, setForm] = useState({
    displayName: supplierProfile?.displayName || '',
    description: supplierProfile?.description || '',
    processingTimeDays: supplierProfile?.processingTimeDays || 2,
    shipsTo: supplierProfile?.shipsTo?.length ? supplierProfile.shipsTo : ['NG'],
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.displayName.trim()) nextErrors.displayName = 'Display name is required';
    if (!form.description.trim()) nextErrors.description = 'Description is required';
    if (!form.processingTimeDays || Number(form.processingTimeDays) < 1) nextErrors.processingTimeDays = 'Enter a processing time from 1 to 7 days';
    if (Number(form.processingTimeDays) > 7) nextErrors.processingTimeDays = 'Processing time cannot exceed 7 days';
    if (!form.shipsTo.length) nextErrors.shipsTo = 'Choose at least one shipping country';
    return nextErrors;
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      if (!hasSupplierProfile(user)) {
        await addRole('SUPPLIER', { nextRoute: '/supplier/profile' });
      }

      await sellerApi.put('/supplier/profile', {
        displayName: form.displayName.trim(),
        description: form.description.trim(),
        processingTimeDays: Number(form.processingTimeDays),
        shipsTo: form.shipsTo,
      });

      const { data } = await sellerApi.get('/auth/me');
      applyAuthPayload(data.data);
      navigate('/supplier');
    } catch (err) {
      const message = err.response?.data?.error?.message || roleAddError || 'Could not activate supplier account.';
      setErrors({ general: message });
    } finally {
      setSaving(false);
    }
  };

  const isSubmitting = saving || addingRole;

  return (
    <div className="min-h-screen bg-[#F7F9F6]">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 lg:grid-cols-[minmax(280px,0.58fr)_minmax(0,1.42fr)]">
        <section className="bg-[#22925B] px-6 py-7 text-white sm:px-8 lg:sticky lg:top-0 lg:h-screen lg:px-7">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-11 w-fit items-center rounded-lg bg-white px-4">
                  <img src="/varanda-logo.png" alt="Varanda Mart" className="h-8 object-contain" />
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#F59E0B]">
                  <Package size={23} />
                </div>
              </div>

              <div className="mt-9">
                <h1 className="text-2xl font-bold leading-tight lg:text-3xl">
                  Build a supplier catalog sellers can trust.
                </h1>
                <p className="mt-4 text-sm leading-6 text-white/90">
                  Set up your profile, choose where you ship, and start receiving dropship orders from sellers.
                </p>

                <div className="mt-6 grid gap-3">
                  {BENEFITS.map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3 text-sm text-white">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[#22925B]">
                        <Check size={12} strokeWidth={3} />
                      </span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-white">
              <div className="rounded-lg border border-white/20 bg-white/10 p-3">
                <BadgeCheck size={17} className="mb-2 text-white" />
                No subscription fees for supplier activation.
              </div>
              <div className="rounded-lg border border-white/20 bg-white/10 p-3">
                <Truck size={17} className="mb-2 text-white" />
                Sellers import your listings into their stores.
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-start justify-center overflow-y-auto px-4 py-8 sm:px-7 lg:h-screen lg:px-10">
          <div className="w-full max-w-3xl rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100 sm:p-8">
            <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#22925B]">Supplier Activation</p>
                <h2 className="mt-1 text-2xl font-bold text-[#1F2A30]">Create your supplier profile</h2>
              </div>
              <p className="max-w-xs text-sm text-[#5C5D86]">
                This helps sellers understand your catalog and delivery reach.
              </p>
            </div>

            {errors.general && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-[#E32323]">{errors.general}</p>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-[#1F2A30]">Display Name</label>
                <input value={form.displayName} onChange={(e) => updateField('displayName', e.target.value)} className={inputClass(!!errors.displayName)} placeholder="Lagos Wholesale" />
                {errors.displayName && <p className="mt-1 text-xs text-[#E32323]">{errors.displayName}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#1F2A30]">Processing Time</label>
                <div className="flex items-center gap-3">
                  <input type="number" min="1" max="7" value={form.processingTimeDays} onChange={(e) => updateField('processingTimeDays', e.target.value)} className={inputClass(!!errors.processingTimeDays)} />
                  <span className="shrink-0 text-sm text-[#5C5D86]">days</span>
                </div>
                {errors.processingTimeDays && <p className="mt-1 text-xs text-[#E32323]">{errors.processingTimeDays}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#1F2A30]">Description</label>
                <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} className={`${inputClass(!!errors.description)} min-h-28 resize-y`} placeholder="Tell sellers what you supply and how you fulfill orders." />
                {errors.description && <p className="mt-1 text-xs text-[#E32323]">{errors.description}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Ship to Countries</label>
                <CountryMultiSelect
                  value={form.shipsTo}
                  onChange={(shipsTo) => updateField('shipsTo', shipsTo)}
                  error={errors.shipsTo}
                />
                {errors.shipsTo && <p className="mt-1 text-xs text-[#E32323]">{errors.shipsTo}</p>}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#22925B] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#1a7a4a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader size={16} className="animate-spin" />}
              {isSubmitting ? 'Activating...' : 'Activate Supplier Account'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
