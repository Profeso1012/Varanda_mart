import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Edit3, Plus, Search, Trash2, Upload } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { sellerApi } from '../../lib/axios';
import { DEFAULT_CATEGORY_TREE, getCategoryOptions } from '../../data/defaultCategories';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';

function ImageDrop({ label, file, previewUrl, onSelect }) {
  return (
    <label className="flex h-36 w-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-center text-xs text-[#5C5D86] hover:border-[#22925B] hover:bg-green-50">
      {previewUrl || file ? (
        <img src={previewUrl || URL.createObjectURL(file)} alt="" className="h-full w-full rounded-lg object-cover" />
      ) : (
        <>
          <Upload size={20} className="mb-2 text-gray-400" />
          Drag and drop images here<br />or<br />click to browse
        </>
      )}
      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onSelect(e.target.files[0])} />
    </label>
  );
}

export default function CategoriesPage() {
  const { upload } = useCloudinaryUpload();
  const [categories, setCategories] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const [form, setForm] = useState({ name: '', parentId: '', description: '', sortOrder: 1, isActive: true });
  const [imageFile, setImageFile] = useState(null);
  const [bundleFile, setBundleFile] = useState(null);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const categoryTree = categories.length ? categories : DEFAULT_CATEGORY_TREE;
  const flatOptions = useMemo(() => getCategoryOptions(categoryTree), [categoryTree]);
  const selected = flatOptions.find((cat) => cat.id === selectedId);

  const loadCategories = async () => {
    try {
      const { data } = await sellerApi.get('/catalog/categories?includeInactive=true');
      setCategories(data.data.categories || []);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => { loadCategories(); }, []);

  useEffect(() => {
    if (!selected) return;
    setForm({
      name: selected.name || '',
      parentId: selected.parentId || '',
      description: selected.description || '',
      sortOrder: selected.sortOrder ?? 1,
      isActive: selected.isActive ?? true,
    });
    setImageFile(null);
    setBundleFile(null);
  }, [selectedId]);

  const resetForNew = () => {
    setSelectedId(null);
    setForm({ name: '', parentId: '', description: '', sortOrder: 1, isActive: true });
    setImageFile(null);
    setBundleFile(null);
    setError('');
  };

  const saveCategory = async () => {
    if (!form.name.trim()) {
      setError('Category name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const body = {
        name: form.name.trim(),
        description: form.description || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        parentId: form.parentId || null,
        isActive: form.isActive,
      };
      const { data } = selectedId && !String(selectedId).includes('-')
        ? await sellerApi.put(`/catalog/categories/${selectedId}`, body)
        : await sellerApi.post('/catalog/categories', body);
      const categoryId = selectedId && !String(selectedId).includes('-')
        ? selectedId
        : data.data.category?.id;

      if (imageFile && categoryId) {
        const { url, publicId } = await upload(imageFile, 'category');
        await sellerApi.post(`/catalog/categories/${categoryId}/image`, { url, publicId });
      }

      await loadCategories();
      resetForNew();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not save category.');
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async () => {
    if (!selectedId || String(selectedId).includes('-')) return;
    if (!window.confirm(`Delete "${form.name}"?`)) return;
    try {
      await sellerApi.delete(`/catalog/categories/${selectedId}`, { data: { reassignTo: null } });
      await loadCategories();
      resetForNew();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not delete category.');
    }
  };

  const filteredTree = categoryTree.filter((cat) =>
    !query.trim() ||
    cat.name.toLowerCase().includes(query.trim().toLowerCase()) ||
    (cat.children || []).some((child) => child.name.toLowerCase().includes(query.trim().toLowerCase()))
  );

  return (
    <DashboardLayout
      title="Categories"
      mode="seller"
      actions={
        <button onClick={resetForNew} className="flex items-center gap-2 rounded-full bg-[#22925B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a7a4a]">
          <Plus size={16} />
          Add Category
        </button>
      }
    >
      <div className="grid min-h-full grid-cols-1 gap-5 bg-gray-50 p-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <h2 className="mb-4 text-lg font-bold text-[#1F2A30]">Categories</h2>
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search categories" className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#22925B]" />
          </div>

          <div className="max-h-[calc(100vh-220px)] space-y-3 overflow-y-auto pr-2">
            {filteredTree.map((category) => {
              const isExpanded = expandedIds.has(category.id);
              const isSelected = selectedId === category.id;
              const hasChildren = (category.children || []).length > 0;
              return (
                <div key={category.id} className={`rounded-lg p-3 transition-colors ${isSelected ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => toggleExpand(category.id)}
                        className="shrink-0 text-[#5C5D86] hover:text-[#22925B] transition-colors"
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        <ChevronDown
                          size={15}
                          className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <button onClick={() => setSelectedId(category.id)} className="text-left text-sm font-bold text-[#1F2A30] truncate">
                        {category.name}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setSelectedId(category.id)} className="text-[#F97316]" aria-label={`Edit ${category.name}`}>
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => { setSelectedId(category.id); setTimeout(deleteCategory, 0); }} className="text-[#1F2A30]" aria-label={`Delete ${category.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  {hasChildren && isExpanded && (
                    <div className="ml-7 mt-2 space-y-1">
                      {(category.children || []).map((child) => (
                        <button
                          key={child.id}
                          onClick={() => setSelectedId(child.id)}
                          className={`block w-full text-left text-sm px-2 py-1 rounded-md transition-colors ${
                            selectedId === child.id
                              ? 'text-[#22925B] font-medium bg-green-50'
                              : 'text-[#5C5D86] hover:text-[#22925B] hover:bg-green-50'
                          }`}
                        >
                          {child.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#1F2A30]">{selected ? 'Edit Category' : 'Add Category'}</h2>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#5C5D86]">ON (Active)</span>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${form.isActive ? 'bg-[#22925B]' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${form.isActive ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-[#E32323]">{error}</p>}

          <div className="grid gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Category Name</label>
              <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Parent Category</label>
              <select value={form.parentId} onChange={(e) => setForm((prev) => ({ ...prev, parentId: e.target.value }))} className="w-full max-w-xs rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]">
                <option value="">Select Parent</option>
                {categoryTree.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1F2A30]">Description</label>
              <p className="mb-2 text-xs text-[#5C5D86]">Visible internally for organization</p>
              <input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Images</label>
              <ImageDrop file={imageFile} previewUrl={selected?.imageUrl} onSelect={setImageFile} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))} className="w-14 rounded border border-gray-200 px-2 py-1 text-sm outline-none focus:border-[#22925B]" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Bundle Image</label>
              <ImageDrop file={bundleFile} onSelect={setBundleFile} />
            </div>
            <div className="rounded-lg border border-gray-200 p-5">
              <p className="mb-4 text-sm font-semibold text-[#1F2A30]">Bundle Items</p>
              <div className="relative max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input placeholder="Search products" className="w-full rounded-full border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#22925B]" />
              </div>
            </div>
          </div>

          <div className="mt-7 flex justify-end gap-3">
            <button onClick={resetForNew} className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-semibold text-[#5C5D86] hover:border-gray-300">
              Cancel
            </button>
            <button onClick={saveCategory} disabled={saving} className="rounded-full bg-[#22925B] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1a7a4a] disabled:opacity-60">
              {saving ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
