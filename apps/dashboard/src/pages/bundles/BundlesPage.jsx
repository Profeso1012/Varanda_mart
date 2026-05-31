import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bold, Copy, Italic, List, ListOrdered, Minus, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { sellerApi } from '../../lib/axios';
import { formatPrice } from '../../lib/formatters';
import { getProductImageUrl, getProductPrice } from '../../lib/productFields';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { deleteLocalBundle, getLocalBundles, upsertLocalBundle } from '../../lib/localCatalog';

const SAMPLE_IMAGE = 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=120&q=80';
const SAMPLE_BUNDLES = Array.from({ length: 8 }, (_, index) => ({
  id: `sample-${index}`,
  name: 'Glow Essentials set',
  description: 'Cleanser,Toner,Serum',
  price: 42000,
  compareAtPrice: 55000,
  isActive: false,
  imageUrl: SAMPLE_IMAGE,
  items: [{ name: 'Cleanser' }, { name: 'Toner' }, { name: 'Serum' }],
}));

function Switch({ value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-[#22925B]' : 'bg-gray-300'}`}>
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${value ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

function ImageDrop({ file, previewUrl, onSelect }) {
  const inputRef = useRef(null);
  const src = file ? URL.createObjectURL(file) : previewUrl;
  const handleFiles = (files) => {
    const image = Array.from(files || []).find((item) => item.type.startsWith('image/'));
    if (image) onSelect(image);
  };

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
      onDragOver={(e) => e.preventDefault()}
      className="flex h-32 w-40 shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 text-center text-sm text-[#5C5D86] hover:border-[#22925B] hover:bg-green-50"
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <>
          <Upload size={20} className="mb-2 text-gray-400" />
          Drag and drop<br />image here
          <span className="mt-2 text-xs">PNG, JPG up to 5MB</span>
        </>
      )}
    </button>
  );
}

function getBundleImage(bundle) {
  return bundle.imageUrl || bundle.image_url || bundle.mainImageUrl || bundle.main_image_url || bundle.images?.[0]?.url || '';
}

function BundleForm({ initialBundle, products, onCancel, onSaved }) {
  const { upload } = useCloudinaryUpload();
  const [form, setForm] = useState({
    name: initialBundle?.name || '',
    description: initialBundle?.description || '',
    price: initialBundle?.price || initialBundle?.bundlePrice || '',
    compareAtPrice: initialBundle?.compareAtPrice || initialBundle?.compare_at_price || '',
    isActive: initialBundle?.isActive ?? initialBundle?.is_active ?? false,
  });
  const [items, setItems] = useState(initialBundle?.items || []);
  const [imageFile, setImageFile] = useState(null);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredProducts = products.filter((product) => product.name?.toLowerCase().includes(query.toLowerCase())).slice(0, 4);
  const individualTotal = items.reduce((sum, item) => sum + getProductPrice(item) * (Number(item.quantity) || 1), 0);
  const bundlePrice = Number(form.price) || 0;
  const savings = Math.max(0, individualTotal - bundlePrice);
  const savingsPercent = individualTotal ? Math.round((savings / individualTotal) * 100) : 0;

  const addItem = (product) => {
    setItems((prev) => [...prev, { ...product, quantity: 1 }]);
    setQuery('');
  };

  const updateQuantity = (index, delta) => {
    setItems((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Math.max(1, (Number(item.quantity) || 1) + delta) } : item));
  };

  const save = async () => {
    if (!form.name.trim() || !form.price) return;
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description || undefined,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        isActive: form.isActive,
        items: items.map((item) => ({ productId: item.id, variantId: item.variantId, quantity: Number(item.quantity) || 1 })),
      };
      const isPersisted = initialBundle?.id && !String(initialBundle.id).startsWith('sample-');
      const { data } = isPersisted
        ? await sellerApi.put(`/catalog/bundles/${initialBundle.id}`, body)
        : await sellerApi.post('/catalog/bundles', body);
      const bundleId = isPersisted ? initialBundle.id : data.data.bundle?.id;
      if (imageFile && bundleId) {
        const image = await upload(imageFile, 'bundle', bundleId);
        await sellerApi.post(`/catalog/bundles/${bundleId}/image`, image);
      }
      upsertLocalBundle({ ...body, id: bundleId, imageUrl: imageFile ? URL.createObjectURL(imageFile) : getBundleImage(initialBundle || {}) });
      onSaved();
    } catch {
      upsertLocalBundle({
        ...form,
        id: initialBundle?.id || `local-bundle-${Date.now()}`,
        price: Number(form.price),
        isActive: form.isActive,
        items,
        imageUrl: imageFile ? URL.createObjectURL(imageFile) : getBundleImage(initialBundle || {}),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <section className="rounded-lg bg-white p-5 ring-1 ring-gray-200">
        <div className="space-y-7">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Bundle Name</label>
            <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Description</label>
            <div className="mb-2 flex w-fit max-w-full items-center gap-5 overflow-x-auto rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <Bold size={18} /><Italic size={18} /><List size={18} /><ListOrdered size={18} /><span className="font-bold">H1</span><span className="font-bold">H2</span><span className="font-bold">H3</span>
            </div>
            <div className="relative">
              <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value.slice(0, 200) }))} rows={8} placeholder="Describe your bundle clearly." className="w-full resize-none rounded-lg border border-gray-200 px-4 py-5 text-sm outline-none focus:border-[#22925B]" />
              <span className="absolute bottom-3 right-3 text-sm text-[#5C5D86]">{form.description.length}/200</span>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Bundle Price</label>
              <input value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))} type="number" placeholder="N" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Compare at Price</label>
              <input value={form.compareAtPrice} onChange={(e) => setForm((prev) => ({ ...prev, compareAtPrice: e.target.value }))} type="number" placeholder="N" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#1F2A30]">Bundle Active</span>
            <div className="flex items-center gap-3"><span className="text-xs text-[#5C5D86]">{form.isActive ? 'ON (Active)' : 'OFF (Draft)'}</span><Switch value={form.isActive} onChange={(value) => setForm((prev) => ({ ...prev, isActive: value }))} /></div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Images</label>
            <ImageDrop file={imageFile} previewUrl={getBundleImage(initialBundle || {})} onSelect={setImageFile} />
          </div>
        </div>
      </section>

      <aside className="rounded-lg bg-white p-5 ring-1 ring-gray-200">
        <div className="relative mb-8">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#1F2A30]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Products to add" className="w-full rounded-full border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-[#22925B]" />
          {query && filteredProducts.length > 0 && (
            <div className="absolute z-10 mt-2 w-full rounded-lg border border-gray-100 bg-white shadow-lg">
              {filteredProducts.map((product) => (
                <button key={product.id} type="button" onClick={() => addItem(product)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50">
                  <span className="h-9 w-9 overflow-hidden rounded-lg bg-gray-100">{getProductImageUrl(product) && <img src={getProductImageUrl(product)} alt="" className="h-full w-full object-cover" />}</span>
                  {product.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          {items.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex items-center gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">{getProductImageUrl(item) && <img src={getProductImageUrl(item)} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1F2A30]">{item.name}</p>
                <p className="text-xs text-[#5C5D86]">Size: <span className="rounded-full bg-gray-100 px-2 py-1">Medium</span></p>
              </div>
              <div className="flex items-center rounded-lg border border-gray-200">
                <button type="button" onClick={() => updateQuantity(index, -1)} className="p-2"><Minus size={13} /></button>
                <span className="w-7 text-center text-sm">{item.quantity || 1}</span>
                <button type="button" onClick={() => updateQuantity(index, 1)} className="p-2"><Plus size={13} /></button>
              </div>
              <button type="button" onClick={() => setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index))} className="text-[#1F2A30] hover:text-[#E32323]"><Trash2 size={18} /></button>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex justify-between py-2 text-sm text-[#5C5D86]"><span>Individual Total</span><strong className="text-[#22925B]">{formatPrice(individualTotal)}</strong></div>
          <div className="flex justify-between py-2 text-sm text-[#5C5D86]"><span>Bundle Price</span><strong className="text-[#22925B]">{formatPrice(bundlePrice)}</strong></div>
          <div className="flex justify-between py-2 text-sm text-[#5C5D86]"><span>Customer Saves</span><strong className="text-[#22925B]">{formatPrice(savings)}({savingsPercent}%)</strong></div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-full bg-gray-200 px-8 py-3 text-sm font-semibold text-[#5C5D86] hover:bg-gray-300">Cancel</button>
          <button type="button" onClick={save} disabled={saving} className="rounded-full bg-[#22925B] px-8 py-3 text-sm font-semibold text-white hover:bg-[#1a7a4a] disabled:opacity-60">{saving ? 'Saving...' : 'Save Bundle'}</button>
        </div>
      </aside>
    </div>
  );
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBundle, setEditingBundle] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bundleRes, productRes] = await Promise.all([
        sellerApi.get('/catalog/bundles'),
        sellerApi.get('/catalog/products?page=1&perPage=50'),
      ]);
      const remoteBundles = bundleRes.data.data.bundles || [];
      const localBundles = getLocalBundles();
      setBundles([
        ...localBundles.filter((local) => !remoteBundles.some((remote) => remote.id === local.id)),
        ...remoteBundles,
      ]);
      setProducts(productRes.data.data.products || []);
    } catch {
      setBundles(getLocalBundles());
      setProducts([
        { id: 'p1', name: 'Glow Essentials set', basePrice: 55000, mainImageUrl: SAMPLE_IMAGE },
        { id: 'p2', name: 'Hydrating Toner', basePrice: 12000, mainImageUrl: SAMPLE_IMAGE },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const rows = useMemo(() => bundles.length ? bundles : SAMPLE_BUNDLES, [bundles]);
  const startCreate = () => { setEditingBundle(null); setShowForm(true); };
  const closeForm = () => { setEditingBundle(null); setShowForm(false); };

  const deleteBundle = async (bundle) => {
    if (!window.confirm(`Delete "${bundle.name}"?`)) return;
    setBundles((prev) => prev.filter((item) => item.id !== bundle.id));
    if (String(bundle.id).startsWith('sample-')) {
      return;
    }
    if (bundle._local || String(bundle.id).startsWith('local-bundle-')) {
      deleteLocalBundle(bundle.id);
      return;
    }
    try {
      await sellerApi.delete(`/catalog/bundles/${bundle.id}`);
    } catch (err) {
      loadData();
      alert(err.response?.data?.error?.message || 'Could not delete bundle.');
    }
  };

  const duplicateBundle = async (bundle) => {
    const body = {
      name: `${bundle.name} Copy`,
      description: bundle.description,
      price: Number(bundle.price || bundle.bundlePrice || 0),
      compareAtPrice: bundle.compareAtPrice,
      isActive: false,
      items: (bundle.items || []).map((item) => ({ productId: item.productId || item.id, variantId: item.variantId, quantity: item.quantity || 1 })),
    };
    try {
      await sellerApi.post('/catalog/bundles', body);
      loadData();
    } catch {
      const copy = upsertLocalBundle({ ...bundle, id: `local-bundle-${Date.now()}`, name: `${bundle.name} Copy`, isActive: false });
      setBundles((prev) => [copy, ...prev]);
    }
  };

  return (
    <DashboardLayout
      title=""
      mode="seller"
      actions={<button onClick={startCreate} className="flex items-center gap-2 rounded-full bg-[#22925B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a7a4a]"><Plus size={16} />Create Bundle</button>}
    >
      <div className="min-h-full bg-gray-50 p-4 sm:p-6">
        <div className="mb-6 rounded-lg bg-white px-5 py-5 shadow-sm">
          <h1 className="text-xl font-bold text-[#1F2A30]">Bundles</h1>
        </div>
        <div className="mb-8 flex items-center justify-between gap-4">
          <p className="text-sm text-[#5C5D86]">Create grouped product offers and discounts</p>
          {showForm && <button type="button" onClick={closeForm} className="text-sm font-semibold text-[#22925B]">Back</button>}
        </div>

        {showForm ? (
          <BundleForm initialBundle={editingBundle} products={products} onCancel={closeForm} onSaved={() => { closeForm(); loadData(); }} />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-[860px] w-full text-sm">
              <thead><tr className="border-b border-gray-200 text-xs font-medium text-[#5C5D86]"><th className="px-8 py-4 text-left">BUNDLE</th><th className="px-6 py-4 text-left">ITEMS</th><th className="px-6 py-4 text-left">BUNDLE PRICE</th><th className="px-6 py-4 text-left">STATUS</th><th className="px-6 py-4 text-left">ACTION</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="py-16 text-center text-[#5C5D86]">Loading bundles...</td></tr> : rows.map((bundle) => (
                  <tr key={bundle.id} className="border-b border-gray-100">
                    <td className="px-8 py-4"><div className="flex items-center gap-3"><div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">{getBundleImage(bundle) && <img src={getBundleImage(bundle)} alt="" className="h-full w-full object-cover" />}</div><div><p className="font-semibold text-[#1F2A30]">{bundle.name}</p><p className="text-xs text-[#5C5D86]">{bundle.description}</p></div></div></td>
                    <td className="px-6 py-4 text-[#1F2A30]">{bundle.items?.length || bundle.itemCount || 0} items</td>
                    <td className="px-6 py-4 font-bold text-[#374151]">{formatPrice(bundle.price || bundle.bundlePrice || 0)} {bundle.compareAtPrice && <span className="font-normal text-[#5C5D86] line-through">{formatPrice(bundle.compareAtPrice)}</span>}</td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><span className="text-[10px] text-[#5C5D86]">{bundle.isActive || bundle.is_active ? 'ON (Active)' : 'OFF (Draft)'}</span><Switch value={bundle.isActive || bundle.is_active} onChange={() => {}} /></div></td>
                    <td className="px-6 py-4"><div className="flex items-center gap-4"><button onClick={() => { setEditingBundle(bundle); setShowForm(true); }} className="text-[#D9573F]"><Pencil size={18} /></button><button onClick={() => duplicateBundle(bundle)} className="text-[#321CFF]"><Copy size={18} /></button><button onClick={() => deleteBundle(bundle)} className="text-[#1F2A30] hover:text-[#E32323]"><Trash2 size={18} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
