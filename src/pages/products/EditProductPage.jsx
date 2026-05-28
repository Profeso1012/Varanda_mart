import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlignLeft, Bold, ChevronDown, Heading1, Heading2, Heading3, Italic, List, ListOrdered, Plus, Upload, X } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { sellerApi } from '../../lib/axios';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { getCategoryOptions } from '../../data/defaultCategories';

function Switch({ value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-[#22925B]' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${value ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

function ImageUpload({ images, onAdd, onRemove }) {
  const inputRef = useRef(null);

  const handleFiles = (files) => {
    onAdd(files.filter((file) => file.type.startsWith('image/')));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpg,image/jpeg,image/png,image/webp,image/svg+xml"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(Array.from(e.target.files || []))}
      />
      <div className="flex items-end gap-5 overflow-x-auto pb-2">
        <button
          type="button"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex h-40 w-40 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-center text-sm text-[#5C5D86] hover:border-[#22925B] hover:bg-green-50"
        >
          <span className="mb-2 text-xs text-[#5C5D86]">Main</span>
          <Upload size={22} className="mb-2 text-gray-400" />
          Drag and drop<br />images here
        </button>
        {[0, 1, 2, 3].map((slot) => {
          const img = images[slot];
          return img ? (
            <div key={slot} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200">
              <img src={typeof img === 'string' ? img : URL.createObjectURL(img)} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(slot); }}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow"
              >
                <X size={10} className="text-gray-600" />
              </button>
            </div>
          ) : (
            <button
              key={slot}
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-[#5C5D86] hover:border-[#22925B] hover:bg-green-50"
            >
              <Plus size={22} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function EditProductPage({ mode = 'seller' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { upload: uploadToCloudinary } = useCloudinaryUpload();
  const isEditing = Boolean(id);
  const isSupplier = mode === 'supplier';

  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    compareAtPrice: '',
    costPrice: '',
    weight: '',
    stockQuantity: '',
    trackQuantity: false,
    hasVariants: false,
    isFeatured: true,
    supplierPrice: '',
    suggestedRetailPrice: '',
    processingTimeDays: '',
    status: true,
    categoryId: '',
    brand: '',
  });
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const catEndpoint = isSupplier ? '/marketplace/categories' : '/catalog/categories';
        const { data } = await sellerApi.get(catEndpoint);
        setCategories(data.data.categories || []);
      } catch (err) {
        console.error('Could not load categories', err);
      }

      if (!isEditing) return;
      try {
        const endpoint = isSupplier ? `/supplier/products/${id}` : `/catalog/products/${id}`;
        const { data } = await sellerApi.get(endpoint);
        const p = data.data.product || data.data;
        setForm((prev) => ({
          ...prev,
          name: p.name || '',
          description: p.description || '',
          shortDescription: p.shortDescription || '',
          price: p.basePrice || '',
          compareAtPrice: p.compareAtPrice || '',
          costPrice: p.costPrice || '',
          weight: p.weight || '',
          stockQuantity: p.stockQuantity || '',
          isFeatured: p.isFeatured ?? true,
          supplierPrice: p.supplierPrice || '',
          suggestedRetailPrice: p.suggestedRetailPrice || '',
          processingTimeDays: p.processingTimeDays || '',
          status: p.status === 'ACTIVE',
          categoryId: p.categoryId || p.marketplaceCategoryId || '',
          brand: p.brand || '',
        }));
        if (p.images?.length) setImages(p.images.map((img) => img.url));
      } catch (err) {
        console.error('Could not load product', err);
      }
    };
    load();
  }, [id, isEditing, isSupplier]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const inputClass = (field) =>
    `w-full rounded-lg border px-4 py-3 text-sm text-[#1F2A30] outline-none transition-colors ${
      errors[field] ? 'border-[#E32323]' : 'border-gray-200 focus:border-[#22925B]'
    }`;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!isSupplier && !form.price) e.price = 'Price is required';
    if (isSupplier && !form.supplierPrice) e.supplierPrice = 'Supplier price is required';
    return e;
  };

  const handleSave = async (statusOverride) => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      let productId = id;
      const cloudinaryType = isSupplier ? 'supplier_product' : 'product';
      const uploadedImages = [];
      for (const img of images) {
        if (img instanceof File) uploadedImages.push(await uploadToCloudinary(img, cloudinaryType, productId));
      }

      if (isSupplier) {
        const body = {
          name: form.name,
          description: form.description || undefined,
          shortDescription: form.shortDescription || undefined,
          supplierPrice: parseFloat(form.supplierPrice),
          suggestedRetailPrice: form.suggestedRetailPrice ? parseFloat(form.suggestedRetailPrice) : undefined,
          processingTimeDays: form.processingTimeDays ? parseInt(form.processingTimeDays) : undefined,
          marketplaceCategoryId: form.categoryId || undefined,
          status: statusOverride || (form.status ? 'ACTIVE' : 'DRAFT'),
        };
        const { data } = isEditing ? await sellerApi.put(`/supplier/products/${id}`, body) : await sellerApi.post('/supplier/products', body);
        productId = data.data.product?.id || id;
        for (const { url, publicId } of uploadedImages) await sellerApi.post(`/supplier/products/${productId}/images`, { url, publicId });
      } else {
        const body = {
          name: form.name,
          description: form.description || undefined,
          shortDescription: form.shortDescription || undefined,
          basePrice: parseFloat(form.price),
          compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
          costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
          weight: form.weight ? parseFloat(form.weight) : undefined,
          stockQuantity: form.stockQuantity ? parseInt(form.stockQuantity) : undefined,
          isFeatured: form.isFeatured,
          categoryId: form.categoryId || undefined,
          status: statusOverride || (form.status ? 'ACTIVE' : 'DRAFT'),
        };
        const { data } = isEditing ? await sellerApi.put(`/catalog/products/${id}`, body) : await sellerApi.post('/catalog/products', body);
        productId = data.data.product?.id || id;
        for (const { url, publicId } of uploadedImages) await sellerApi.post(`/catalog/products/${productId}/images`, { url, publicId });
      }

      navigate(isSupplier ? '/supplier/products' : '/products');
    } catch (err) {
      const details = err.response?.data?.error?.details || [];
      const fieldErrors = {};
      details.forEach(({ field, message }) => { fieldErrors[field] = message; });
      setErrors(Object.keys(fieldErrors).length ? fieldErrors : { general: err.message || 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout
      title={isEditing ? (isSupplier ? 'Edit Supplier Product' : 'Edit Products') : (isSupplier ? 'Supplier Products' : 'Edit Products')}
      mode={isSupplier ? 'supplier' : 'seller'}
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
            className="rounded-full bg-gray-300 px-6 py-2.5 text-sm font-semibold text-[#5C5D86] hover:bg-gray-200 disabled:opacity-60"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave('ACTIVE')}
            disabled={saving}
            className="rounded-full bg-[#22925B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1a7a4a] disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save & Activate'}
          </button>
        </div>
      }
    >
      <div className="h-full bg-gray-50 p-6">
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="overflow-y-auto rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100">
            {errors.general && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-[#E32323]">{errors.general}</p>}

            <div className="space-y-8">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Product Name</label>
                <input value={form.name} onChange={(e) => handleChange('name', e.target.value)} className={inputClass('name')} />
                <p className="mt-2 text-sm text-gray-300">/Products/product-name</p>
                {errors.name && <p className="mt-1 text-xs text-[#E32323]">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Description</label>
                <div className="mb-2 flex w-fit items-center gap-5 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <Bold size={18} />
                  <Italic size={18} />
                  <List size={18} />
                  <ListOrdered size={18} />
                  <Heading1 size={18} />
                  <Heading2 size={18} />
                  <Heading3 size={18} />
                </div>
                <div className="relative">
                  <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value.slice(0, 200))} rows={8} placeholder="Describe your product clearly." className="w-full resize-none rounded-lg border border-gray-200 px-4 py-5 text-sm outline-none focus:border-[#22925B]" />
                  <span className="absolute bottom-3 right-3 text-sm text-[#5C5D86]">{form.description.length}/200</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Short Description</label>
                <div className="relative">
                  <textarea value={form.shortDescription} onChange={(e) => handleChange('shortDescription', e.target.value.slice(0, 200))} rows={4} className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]" />
                  <span className="absolute bottom-3 right-3 text-sm text-[#5C5D86]">{form.shortDescription.length}/200</span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Images</label>
                <ImageUpload images={images} onAdd={(files) => setImages((prev) => [...prev, ...files])} onRemove={(index) => setImages((prev) => prev.filter((_, i) => i !== index))} />
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-[#1F2A30]">Pricing</label>
                <div className="space-y-2">
                  <input value={isSupplier ? form.supplierPrice : form.price} onChange={(e) => handleChange(isSupplier ? 'supplierPrice' : 'price', e.target.value)} placeholder={isSupplier ? 'Supplier Price' : 'Price'} type="number" className={inputClass(isSupplier ? 'supplierPrice' : 'price')} />
                  <input value={isSupplier ? form.suggestedRetailPrice : form.compareAtPrice} onChange={(e) => handleChange(isSupplier ? 'suggestedRetailPrice' : 'compareAtPrice', e.target.value)} placeholder={isSupplier ? 'Suggested Retail Price' : 'Compare at price'} type="number" className={inputClass('compareAtPrice')} />
                  {!isSupplier && (
                    <>
                      <input value={form.costPrice} onChange={(e) => handleChange('costPrice', e.target.value)} placeholder="Cost per Item" type="number" className={inputClass('costPrice')} />
                      <p className="text-xs text-[#5C5D86]">Not visible to customers</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#1F2A30]">Inventory</label>
                <p className="mb-4 text-xs text-[#5C5D86]">Track product availability and stock levels</p>
                <div className="w-full max-w-xs rounded-lg border border-gray-200 p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-sm text-[#1F2A30]">Track Quantity</span>
                    <Switch value={form.trackQuantity} onChange={(value) => handleChange('trackQuantity', value)} />
                  </div>
                  <label className="mb-1 block text-sm text-[#1F2A30]">Stock Quantity</label>
                  <input value={form.stockQuantity} onChange={(e) => handleChange('stockQuantity', e.target.value)} type="number" className="h-8 w-12 rounded border border-gray-200 px-2 text-sm outline-none" />
                  <p className="mt-2 text-xs text-[#5C5D86]">Stock will not automatically update after purchase</p>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-[#1F2A30]">Variant</label>
                <div className="flex w-full max-w-xs items-center justify-between rounded-lg border border-gray-200 p-4">
                  <span className="text-sm text-[#1F2A30]">This Product has multiple options</span>
                  <Switch value={form.hasVariants} onChange={(value) => handleChange('hasVariants', value)} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#1F2A30]">SEO</label>
                <p className="mb-3 text-xs text-[#5C5D86]">Improve how your products appears in search engines</p>
                <button className="flex w-full max-w-xs items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm text-[#1F2A30]">
                  SEO Optimization
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="space-y-7">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#1F2A30]">Status</label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#5C5D86]">ON (Active)</span>
                  <Switch value={form.status} onChange={(value) => handleChange('status', value)} />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Category</label>
                <div className="relative">
                  <select value={form.categoryId} onChange={(e) => handleChange('categoryId', e.target.value)} className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#22925B]">
                    <option value="">Select Category</option>
                    {getCategoryOptions(categories).map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.parentName ? `${cat.parentName} / ${cat.name}` : cat.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Brand</label>
                <input value={form.brand} onChange={(e) => handleChange('brand', e.target.value)} placeholder="Autocomplete" className={inputClass('brand')} />
                <input placeholder="Create new tag" className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]" />
              </div>

              {!isSupplier && (
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[#1F2A30]">Featured</label>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#5C5D86]">ON (Active)</span>
                    <Switch value={form.isFeatured} onChange={(value) => handleChange('isFeatured', value)} />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#1F2A30]">{isSupplier ? 'Fulfilment Time' : 'Weight (Kg)'}</label>
                <input value={isSupplier ? form.processingTimeDays : form.weight} onChange={(e) => handleChange(isSupplier ? 'processingTimeDays' : 'weight', e.target.value)} type="number" className={inputClass(isSupplier ? 'processingTimeDays' : 'weight')} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
