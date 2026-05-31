import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { sellerApi } from '../../lib/axios';
import { formatDate, formatPrice } from '../../lib/formatters';

const SAMPLE_DISCOUNTS = [
  { id: 'sample-d1', code: 'SUMMER20', type: 'PERCENTAGE', value: 20, usedCount: 14, usageLimit: 100, expiresAt: '2026-08-12T00:00:00Z', isActive: true },
  { id: 'sample-d2', code: 'SUMMER20', type: 'FIXED_AMOUNT', value: 5000, usedCount: 14, usageLimit: 100, expiresAt: '2026-08-12T00:00:00Z', isActive: false },
  { id: 'sample-d3', code: 'SUMMER20', type: 'FREE_SHIPPING', value: 0, usedCount: 14, usageLimit: 100, expiresAt: '2026-08-12T00:00:00Z', isActive: true },
  { id: 'sample-d4', code: 'SUMMER20', type: 'PERCENTAGE', value: 40, usedCount: 14, usageLimit: 100, expiresAt: '2026-08-12T00:00:00Z', isActive: true },
];

const TYPES = [
  { id: 'PERCENTAGE', label: '% Percentage Off' },
  { id: 'FIXED_AMOUNT', label: 'N Fixed Amount Off' },
  { id: 'FREE_SHIPPING', label: 'Free Shipping' },
];

function statusFor(discount) {
  if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) return 'Expired';
  return discount.isActive || discount.is_active ? 'Active' : 'Inactive';
}

function typeBadge(discount) {
  if (discount.type === 'PERCENTAGE') return { label: '% Percentage', className: 'bg-blue-100 text-blue-700' };
  if (discount.type === 'FIXED_AMOUNT') return { label: 'N Fixed', className: 'bg-green-100 text-green-700' };
  return { label: 'Shipping', className: 'bg-purple-100 text-purple-700' };
}

function DiscountModal({ discount, onClose, onSaved }) {
  const [form, setForm] = useState({
    code: discount?.code || '',
    description: discount?.description || '',
    type: discount?.type || 'PERCENTAGE',
    value: discount?.value || '',
    minimumOrder: discount?.minimumOrder || '',
    usageLimit: discount?.usageLimit || '',
    perCustomerLimit: discount?.perCustomerLimit || 1,
    startsAt: discount?.startsAt?.slice(0, 16) || '',
    expiresAt: discount?.expiresAt?.slice(0, 16) || '',
    isActive: discount?.isActive ?? discount?.is_active ?? true,
  });
  const [showConditions, setShowConditions] = useState(false);
  const [saving, setSaving] = useState(false);

  const generate = () => setForm((prev) => ({ ...prev, code: Math.random().toString(36).slice(2, 10).toUpperCase() }));

  const save = async () => {
    if (!form.code.trim()) return;
    setSaving(true);
    try {
      const body = {
        code: form.code.trim().toUpperCase(),
        description: form.description || undefined,
        type: form.type,
        value: form.type === 'FREE_SHIPPING' ? 0 : Number(form.value || 0),
        minimumOrder: form.minimumOrder ? Number(form.minimumOrder) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        perCustomerLimit: form.perCustomerLimit ? Number(form.perCustomerLimit) : undefined,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
        isActive: form.isActive,
      };
      const isPersisted = discount?.id && !String(discount.id).startsWith('sample-');
      if (isPersisted) await sellerApi.put(`/discounts/${discount.id}`, body);
      else await sellerApi.post('/discounts', body);
      onSaved();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Could not save discount.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#1F2A30]/30" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1F2A30]">{discount ? 'Edit Discount' : 'Add Discount Code'}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Code</label>
            <div className="flex gap-2">
              <input value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s/g, '') }))} className="min-w-0 flex-1 rounded-lg border border-gray-200 px-4 py-3 font-mono text-sm outline-none focus:border-[#22925B]" />
              <button onClick={generate} className="rounded-lg border border-[#22925B] px-4 py-2 text-sm font-semibold text-[#22925B]">Generate</button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Description</label>
            <input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]" />
          </div>
          <div>
            <p className="mb-3 text-sm font-medium text-[#1F2A30]">Discount Type</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {TYPES.map((type) => <button key={type.id} onClick={() => setForm((prev) => ({ ...prev, type: type.id }))} className={`rounded-lg border px-3 py-4 text-sm font-semibold ${form.type === type.id ? 'border-[#22925B] bg-green-50 text-[#22925B]' : 'border-gray-200 text-[#1F2A30]'}`}>{type.label}</button>)}
            </div>
          </div>
          {form.type !== 'FREE_SHIPPING' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A30]">{form.type === 'PERCENTAGE' ? 'Percentage Value' : 'Fixed Amount'}</label>
              <input type="number" value={form.value} onChange={(e) => setForm((prev) => ({ ...prev, value: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]" />
            </div>
          )}
          <button onClick={() => setShowConditions((prev) => !prev)} className="text-sm font-semibold text-[#22925B]">{showConditions ? 'Hide Conditions' : 'Show Conditions'}</button>
          {showConditions && (
            <div className="grid gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-2">
              <input type="number" placeholder="Minimum Order Value" value={form.minimumOrder} onChange={(e) => setForm((prev) => ({ ...prev, minimumOrder: e.target.value }))} className="rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]" />
              <input type="number" placeholder="Total Uses" value={form.usageLimit} onChange={(e) => setForm((prev) => ({ ...prev, usageLimit: e.target.value }))} className="rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]" />
              <input type="number" placeholder="Per Customer Limit" value={form.perCustomerLimit} onChange={(e) => setForm((prev) => ({ ...prev, perCustomerLimit: e.target.value }))} className="rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]" />
              <input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((prev) => ({ ...prev, startsAt: e.target.value }))} className="rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]" />
              <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))} className="rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]" />
            </div>
          )}
          <label className="flex items-center gap-3 text-sm font-medium text-[#1F2A30]"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} />Active</label>
          <button onClick={save} disabled={saving} className="w-full rounded-full bg-[#22925B] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1a7a4a] disabled:opacity-60">{saving ? 'Saving...' : 'Save Discount'}</button>
        </div>
      </div>
    </div>
  );
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState([]);
  const [query, setQuery] = useState('');
  const [modalDiscount, setModalDiscount] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadDiscounts = useCallback(async () => {
    try {
      const { data } = await sellerApi.get('/discounts');
      setDiscounts(data.data.discounts || []);
    } catch {
      setDiscounts(SAMPLE_DISCOUNTS);
    }
  }, []);

  useEffect(() => {
    sellerApi.get('/discounts')
      .then(({ data }) => setDiscounts(data.data.discounts || []))
      .catch(() => setDiscounts(SAMPLE_DISCOUNTS));
  }, []);

  const rows = useMemo(() => discounts.filter((discount) => discount.code?.toLowerCase().includes(query.toLowerCase())), [discounts, query]);

  const deleteDiscount = async (discount) => {
    if (!window.confirm(`Delete "${discount.code}"?`)) return;
    if (String(discount.id).startsWith('sample-')) {
      setDiscounts((prev) => prev.filter((item) => item.id !== discount.id));
      return;
    }
    try {
      await sellerApi.delete(`/discounts/${discount.id}`);
      loadDiscounts();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Could not delete discount.');
    }
  };

  return (
    <DashboardLayout title="" mode="seller" actions={<button onClick={() => { setModalDiscount(null); setModalOpen(true); }} className="flex items-center gap-2 rounded-full bg-[#22925B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a7a4a]"><Plus size={16} />Add Discount</button>}>
      {modalOpen && <DiscountModal discount={modalDiscount} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); loadDiscounts(); }} />}
      <div className="min-h-full bg-gray-50 p-4 sm:p-6">
        <div className="mb-5 rounded-lg bg-white px-5 py-5 shadow-sm"><h1 className="text-xl font-bold text-[#1F2A30]">Discount Codes</h1></div>
        <p className="mb-5 text-sm text-[#5C5D86]">Create and manage promotional discount codes</p>
        <div className="relative mb-8 max-w-xl">
          <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#1F2A30]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search discount codes" className="w-full rounded-full border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm outline-none focus:border-[#22925B]" />
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white p-2">
          <table className="min-w-[840px] w-full text-sm">
            <thead><tr className="text-xs font-medium text-[#5C5D86]"><th className="px-4 py-4 text-left">Code</th><th className="px-4 py-4 text-left">Type</th><th className="px-4 py-4 text-left">Value</th><th className="px-4 py-4 text-left">Used/Limit</th><th className="px-4 py-4 text-left">Expiry</th><th className="px-4 py-4 text-left">Status</th><th className="px-4 py-4 text-left">Actions</th></tr></thead>
            <tbody>
              {rows.map((discount) => {
                const badge = typeBadge(discount);
                const status = statusFor(discount);
                return (
                  <tr key={discount.id}>
                    <td className="px-4 py-4 font-mono font-bold text-[#1F2A30]">{discount.code}</td>
                    <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs ${badge.className}`}>{badge.label}</span></td>
                    <td className="px-4 py-4 font-bold text-[#1F2A30]">{discount.type === 'PERCENTAGE' ? `${discount.value}%` : discount.type === 'FIXED_AMOUNT' ? formatPrice(discount.value) : 'Free shipping'}</td>
                    <td className="px-4 py-4 text-[#5C5D86]">{discount.usedCount || discount.used_count || 0}{discount.usageLimit ? `/${discount.usageLimit}` : ''}</td>
                    <td className="px-4 py-4 font-semibold text-[#374151]">{discount.expiresAt ? formatDate(discount.expiresAt) : '-'}</td>
                    <td className="px-4 py-4"><span className={`rounded-full px-3 py-1 text-xs ${status === 'Active' ? 'bg-green-100 text-green-700' : status === 'Expired' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>{status}</span></td>
                    <td className="px-4 py-4"><div className="flex items-center gap-4"><button onClick={() => { setModalDiscount(discount); setModalOpen(true); }} className="text-[#D9573F]"><Pencil size={18} /></button><button onClick={() => navigator.clipboard?.writeText(discount.code)} className="text-[#321CFF]"><Copy size={18} /></button><button onClick={() => deleteDiscount(discount)} className="text-[#1F2A30] hover:text-[#E32323]"><Trash2 size={18} /></button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
