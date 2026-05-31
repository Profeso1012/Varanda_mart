/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bold, GripVertical, ChevronDown, Heading1, Heading2, Heading3, Italic, List, ListOrdered, Plus, Upload, X } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { sellerApi } from '../../lib/axios';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { getCategoryOptions } from '../../data/defaultCategories';
import { normalizeProductForForm } from '../../lib/productFields';
import { getLocalProducts, upsertLocalProduct } from '../../lib/localCatalog';

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
  const targetSlotRef = useRef(null);

  const handleFiles = (files, slot = targetSlotRef.current) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (!imageFiles.length) return;
    onAdd(imageFiles, slot);
    targetSlotRef.current = null;
  };

  const handleDrop = (e, slot) => {
    e.preventDefault();
    handleFiles(Array.from(e.dataTransfer.files), slot);
  };

  const openPicker = (slot = null) => {
    targetSlotRef.current = slot;
    inputRef.current?.click();
  };

  const renderImage = (img) => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    if (img.url) return img.url;
    if (img.file) return URL.createObjectURL(img.file);
    if (img instanceof File) return URL.createObjectURL(img);
    return '';
  };

  const slots = [0, 1, 2, 3, 4];

  const setAsMain = (index) => {
    if (index === 0) return;
    onAdd([], index, true);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpg,image/jpeg,image/png,image/webp,image/svg+xml"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(Array.from(e.target.files || []));
          e.target.value = '';
        }}
      />
      <div className="flex items-end gap-4 overflow-x-auto pb-2">
        {slots.map((slot) => {
          const img = images[slot];
          const isMain = slot === 0;
          return img ? (
            <div
              key={slot}
              onDrop={(e) => handleDrop(e, slot)}
              onDragOver={(e) => e.preventDefault()}
              className={`group relative shrink-0 overflow-hidden rounded-lg border border-gray-200 ${isMain ? 'h-40 w-40' : 'h-20 w-20'}`}
            >
              <img src={renderImage(img)} alt="" className="h-full w-full object-cover" />
              <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-[#1F2A30]">
                {isMain ? 'MAIN' : `#${slot + 1}`}
              </span>
              <span className="absolute left-2 bottom-2 hidden h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[#5C5D86] group-hover:flex">
                <GripVertical size={14} />
              </span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(slot); }}
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow"
              >
                <X size={10} className="text-gray-600" />
              </button>
              {!isMain && (
                <button
                  type="button"
                  onClick={() => setAsMain(slot)}
                  className="absolute inset-x-2 bottom-2 hidden rounded-full bg-white/95 px-2 py-1 text-[10px] font-semibold text-[#22925B] group-hover:block"
                >
                  Set as Main
                </button>
              )}
            </div>
          ) : (
            <button
              key={slot}
              type="button"
              onDrop={(e) => handleDrop(e, slot)}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => openPicker(slot)}
              className={`flex shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-center text-xs text-[#5C5D86] hover:border-[#22925B] hover:bg-green-50 ${isMain ? 'h-40 w-40' : 'h-20 w-20'}`}
            >
              {isMain ? <Upload size={22} className="mb-2 text-gray-400" /> : <Plus size={22} />}
              <span>{isMain ? 'MAIN IMAGE' : 'Add photo'}</span>
              {isMain && <span className="mt-1">Drag or browse</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VariantImageModal({ images, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2A30]/20 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-5 top-5 text-[#5C5D86] hover:bg-gray-100 rounded-full p-1"><X size={18} /></button>
        <h2 className="mb-4 text-xl font-bold text-[#1F2A30]">Pick from Product Images</h2>
        {images.length === 0 ? (
           <p className="text-sm text-gray-500">No images uploaded for this product yet. Please add product images first.</p>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {images.map((img, i) => {
              const url = img.url || (img.file ? URL.createObjectURL(img.file) : (typeof img === 'string' ? img : ''));
              return (
                <div key={img.id || img.tempId || i} onClick={() => { onSelect(url); onClose(); }} className="cursor-pointer overflow-hidden rounded-lg border-2 border-transparent hover:border-[#22925B]">
                  <img src={url} alt="" className="h-24 w-24 object-cover" />
                </div>
              );
            })}
          </div>
        )}
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
    alertMeAt: '5',
    continueSelling: false,
    trackQuantity: false,
    hasVariants: false,
    isFeatured: true,
    supplierPrice: '',
    suggestedRetailPrice: '',
    processingTimeDays: '',
    status: true,
    categoryId: '',
    brand: '',
    tagIds: [],
    tags: [],
    seoTitle: '',
    seoDescription: '',
  });
  const [seoOpen, setSeoOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [globalOptionTypes, setGlobalOptionTypes] = useState([]);
  const [variantOptions, setVariantOptions] = useState([]);
  const [variantRows, setVariantRows] = useState([]);
  const [variantImageModalRowIndex, setVariantImageModalRowIndex] = useState(null);
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

      if (!isSupplier) {
        try {
          const { data } = await sellerApi.get('/catalog/product-tags');
          setAvailableTags(data.data.tags || []);
        } catch (err) {
          console.error('Could not load tags', err);
        }
        try {
          const { data: otData } = await sellerApi.get('/catalog/variant-option-types');
          setGlobalOptionTypes(otData.data?.optionTypes || []);
        } catch (err) {
          console.error('Could not load global option types', err);
        }
      }

      if (!isEditing) return;
      if (!isSupplier && String(id).startsWith('local-product-')) {
        const localProduct = getLocalProducts().find((product) => product.id === id);
        if (localProduct) {
          setForm((prev) => ({ ...prev, ...normalizeProductForForm(localProduct), hasVariants: localProduct.isVariable || false }));
          if (localProduct.images?.length) setImages(localProduct.images);
          else if (localProduct.mainImageUrl) setImages([{ url: localProduct.mainImageUrl }]);
        }
        return;
      }
      try {
        const endpoint = isSupplier ? `/supplier/products/${id}` : `/catalog/products/${id}`;
        const { data } = await sellerApi.get(endpoint);
        const p = data.data.product || data.data;
        setForm((prev) => ({ ...prev, ...normalizeProductForForm(p) }));
        if (p.images?.length) setImages(p.images);
        if (p.optionTypeAssignments) {
          setVariantOptions(p.optionTypeAssignments.map(assignment => ({
            id: assignment.option_type_id,
            name: assignment.option_type_name,
            displayType: assignment.display_type,
            values: assignment.enabled_values ? assignment.enabled_values.map(v => ({ value: v.value, displayValue: v.displayValue, enabled: true })) : []
          })));
        }
      } catch (err) {
        console.error('Could not load product', err);
      }
    };
    load();
  }, [id, isEditing, isSupplier]);

  useEffect(() => {
    const activeOptions = variantOptions.filter((option) => option.name && option.values.filter(v => v.enabled !== false).length);
    if (!activeOptions.length) {
      setVariantRows([]);
      return;
    }
    const combinations = activeOptions.reduce((rows, option) => rows.flatMap((row) => option.values.filter(v => v.enabled !== false).map((val) => [...row, val.value])), [[]])
      .map(parts => parts.join('/'));
    
    setVariantRows(prev => {
      const existingRowsMap = prev.reduce((acc, row) => ({...acc, [row.label]: row}), {});
      const newRows = combinations.map((label, index) => {
        if (existingRowsMap[label]) return existingRowsMap[label];
        const parts = label.split('/');
        return {
          label,
          price: Number(form.price || 0),
          compare: Number(form.compareAtPrice || 0),
          sku: `${parts.map((part) => part.slice(0, 3).toUpperCase()).join('-')}-${String(index + 1).padStart(3, '0')}`,
          stock: Math.max(0, Number(form.stockQuantity || 0)),
          active: true,
          imageUrl: null,
          imagePublicId: null
        };
      });
      const existingManualRows = prev.filter(r => !combinations.includes(r.label));
      return [...newRows, ...existingManualRows];
    });
  }, [variantOptions, form.price, form.compareAtPrice, form.stockQuantity]);

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

  const buildLocalProduct = (productId) => {
    const flatCategories = getCategoryOptions(categories);
    const selectedCategory = flatCategories.find((cat) => cat.id === form.categoryId);
    const cleanImages = images.map((img) => typeof img === 'string' ? img : URL.createObjectURL(img));
    return {
      id: productId || id,
      name: form.name,
      description: form.description,
      shortDescription: form.shortDescription,
      basePrice: Number(form.price || form.supplierPrice || 0),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      costPrice: form.costPrice ? Number(form.costPrice) : undefined,
      stockQuantity: form.hasVariants ? undefined : Number(form.stockQuantity || 0),
      totalStock: form.hasVariants ? variantRows.reduce((sum, row) => sum + Number(row.stock || 0), 0) : Number(form.stockQuantity || 0),
      status: form.status ? 'ACTIVE' : 'DRAFT',
      isFeatured: form.isFeatured,
      categoryId: form.categoryId,
      categoryName: selectedCategory?.parentName ? `${selectedCategory.parentName} / ${selectedCategory.name}` : selectedCategory?.name,
      category: selectedCategory ? { id: selectedCategory.id, name: selectedCategory.name } : undefined,
      mainImageUrl: cleanImages[0],
      images: cleanImages.map((url, index) => ({ url, isMain: index === 0 })),
      isVariable: form.hasVariants,
      variants: form.hasVariants ? variantRows : [],
    };
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      let productId = id;
      const cloudinaryType = isSupplier ? 'supplier_product' : 'product';
      let finalImages = [...images];
      const uploadedImages = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const fileToUpload = img.file || (img instanceof File ? img : null);
        if (fileToUpload) {
          try {
            const uploaded = await uploadToCloudinary(fileToUpload, cloudinaryType, productId || 'new');
            uploadedImages.push({ ...uploaded, originalIndex: i });
          } catch (err) {
            console.error('Image upload failed', err);
          }
        }
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
          status: form.status ? 'ACTIVE' : 'DRAFT',
          isVariable: form.hasVariants,
          weight: form.weight ? parseFloat(form.weight) : undefined,
          tags: form.tags,
        };
        const { data } = isEditing && !String(id).startsWith('local-product-') ? await sellerApi.put(`/supplier/products/${id}`, body) : await sellerApi.post('/supplier/products', body);
        productId = data.data.product?.id || data.data?.id || id;
        if (uploadedImages.length) {
          const { data: imgRes } = await sellerApi.post(`/supplier/products/${productId}/images`, {
            images: uploadedImages.map((image, index) => ({ url: image.url, publicId: image.publicId, isMain: index === 0 })),
          });
          const newBackendImages = imgRes.data.images || [];
          newBackendImages.forEach((newImg, idx) => {
            const origIndex = uploadedImages[idx].originalIndex;
            finalImages[origIndex] = { ...finalImages[origIndex], id: newImg.id, url: newImg.url };
          });
        }

        // Save Supplier Variants
        if (form.hasVariants && variantRows.length > 0) {
          const activeOptions = variantOptions.filter((opt) => opt.name && opt.values.length);
          for (const row of variantRows) {
            if (!row.active) continue;
            const parts = row.label.split('/');
            const optionValues = parts.map((part, i) => {
              const opt = activeOptions[i];
              if (!opt) return { typeName: `Option ${i+1}`, value: part };
              const valObj = opt.values.find(v => v.value === part);
              return { typeName: opt.name, value: part, displayValue: valObj?.displayValue };
            });
            
            try {
              const payload = {
                variantLabel: row.label,
                sku: row.sku,
                supplierPrice: row.price,
                stockQuantity: row.stock,
                optionValues: optionValues,
                weight: form.weight ? parseFloat(form.weight) : undefined
              };
              if (row.imageUrl) {
                 payload.imageUrl = row.imageUrl;
                 if (row.imagePublicId) payload.imagePublicId = row.imagePublicId;
              }
              await sellerApi.post(`/supplier/products/${productId}/variants`, payload).catch(() => { /* handle gracefully */ });
            } catch (err) {
              console.error('Failed to create supplier variant', err);
            }
          }
        }
      } else {
        const body = {
          name: form.name,
          description: form.description || undefined,
          shortDescription: form.shortDescription || undefined,
          basePrice: parseFloat(form.price),
          compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
          costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
          weight: form.weight ? parseFloat(form.weight) : undefined,
          stockQuantity: form.hasVariants ? undefined : (form.stockQuantity ? parseInt(form.stockQuantity) : undefined),
          trackInventory: form.trackQuantity,
          isFeatured: form.isFeatured,
          categoryId: form.categoryId || undefined,
          status: form.status ? 'ACTIVE' : 'DRAFT',
          isVariable: form.hasVariants,
          seoTitle: form.seoTitle || undefined,
          seoDescription: form.seoDescription || undefined,
          tagIds: form.tagIds,
        };
        const { data } = isEditing && !String(id).startsWith('local-product-') ? await sellerApi.put(`/catalog/products/${id}`, body) : await sellerApi.post('/catalog/products', body);
        productId = data.data.product?.id || data.data?.id || id;
        if (uploadedImages.length) {
          const { data: imgRes } = await sellerApi.post(`/catalog/products/${productId}/images`, {
            images: uploadedImages.map((image, index) => ({ url: image.url, publicId: image.publicId, isMain: index === 0 })),
          });
          const newBackendImages = imgRes.data.images || [];
          newBackendImages.forEach((newImg, idx) => {
            const origIndex = uploadedImages[idx].originalIndex;
            finalImages[origIndex] = { ...finalImages[origIndex], id: newImg.id, url: newImg.url };
          });
        }

        // Save Variants and Option Type Assignments
        if (form.hasVariants && variantRows.length > 0) {
          const { data: otData } = await sellerApi.get('/catalog/variant-option-types').catch(() => ({ data: { data: { optionTypes: [] } } }));
          const existingTypes = otData.data?.optionTypes || [];
          const activeOptions = variantOptions.filter((opt) => opt.name && opt.values.filter(v => v.enabled !== false).length);
          const optionIdMap = {}; 

          for (let i = 0; i < activeOptions.length; i++) {
            const opt = activeOptions[i];
            let typeId;
            const existing = existingTypes.find(t => t.name.toLowerCase() === opt.name.toLowerCase());
            if (existing) {
              typeId = existing.id;
            } else {
              const { data: newType } = await sellerApi.post('/catalog/variant-option-types', { name: opt.name, displayType: opt.displayType || 'TEXT' });
              typeId = newType.data?.optionType?.id || newType.data?.id;
            }

            const existingValues = existing ? existing.values : [];
            const enabledValueIds = [];

            for (const val of opt.values) {
              let valId;
              const exVal = existingValues.find(v => v.value.toLowerCase() === val.value.toLowerCase());
              if (exVal) {
                valId = exVal.id;
              } else {
                try {
                  const { data: newVal } = await sellerApi.post(`/catalog/variant-option-types/${typeId}/values`, { value: val.value, displayValue: val.displayValue });
                  valId = newVal.data?.optionValue?.id || newVal.data?.id;
                } catch (err) {
                  console.error('Failed to create option value', err);
                }
              }
              optionIdMap[`${i}_${val.value}`] = valId;
              
              if (val.enabled !== false && valId) {
                enabledValueIds.push(valId);
              }
            }

            // Assign the option type to this product
            try {
               await sellerApi.post(`/catalog/products/${productId}/option-types`, {
                 optionTypeId: typeId,
                 enabledValueIds: enabledValueIds.length > 0 ? enabledValueIds : null
               });
            } catch(e) {
               console.error('Failed to assign option type', e);
            }
          }

          for (const row of variantRows) {
            if (!row.active) continue;
            const parts = row.label.split('/');
            const optionValueIds = parts.map((part, i) => optionIdMap[`${i}_${part}`]).filter(Boolean);
            
            try {
              const payload = {
                sku: row.sku,
                price: row.price,
                compareAtPrice: row.compare || undefined,
                stockQuantity: row.stock,
                optionValueIds: optionValueIds,
                weight: form.weight ? parseFloat(form.weight) : undefined
              };
              if (row.imageUrl) {
                 payload.imageUrl = row.imageUrl;
                 if (row.imagePublicId) payload.imagePublicId = row.imagePublicId;
              }
              await sellerApi.post(`/catalog/products/${productId}/variants`, payload);
            } catch (err) {
              console.error('Failed to create variant', err);
            }
          }
        }
      }

      if (!isSupplier) upsertLocalProduct(buildLocalProduct(productId));
      navigate(isSupplier ? '/supplier/products' : '/products');
    } catch (err) {
      if (!isSupplier) {
        upsertLocalProduct(buildLocalProduct(id || `local-product-${Date.now()}`));
        navigate('/products');
        return;
      }
      const details = err.response?.data?.error?.details || [];
      const fieldErrors = {};
      details.forEach(({ field, message }) => { fieldErrors[field] = message; });
      setErrors(Object.keys(fieldErrors).length ? fieldErrors : { general: err.message || 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  const addOption = (existingType = null) => {
    if (existingType) {
      setVariantOptions(prev => {
        if (prev.some(o => o.id === existingType.id || o.name.toLowerCase() === existingType.name.toLowerCase())) return prev;
        return [
          ...prev,
          { 
             id: existingType.id, 
             name: existingType.name, 
             displayType: existingType.display_type,
             values: existingType.values.map(v => ({ value: v.value, displayValue: v.display_value, enabled: true })) 
          }
        ].slice(0, 3);
      });
    } else {
      setVariantOptions((prev) => [
        ...prev,
        { id: `option-${Date.now()}`, name: '', displayType: 'TEXT', values: [] },
      ].slice(0, 3));
    }
  };

  const updateOption = (index, patch) => {
    setVariantOptions((prev) => prev.map((option, optionIndex) => optionIndex === index ? { ...option, ...patch } : option));
  };

  const addOptionValue = (index, value) => {
    const clean = value.trim();
    if (!clean) return;
    setVariantOptions((prev) => prev.map((option, optionIndex) => {
      if (optionIndex === index && !option.values.some(v => v.value.toLowerCase() === clean.toLowerCase())) {
        return { ...option, values: [...option.values, { value: clean, displayValue: option.displayType === 'COLOR_SWATCH' ? '#000000' : '', enabled: true }] };
      } else if (optionIndex === index) {
        return { ...option, values: option.values.map(v => v.value.toLowerCase() === clean.toLowerCase() ? { ...v, enabled: true } : v) };
      }
      return option;
    }));
  };

  const toggleOptionValue = (optionIndex, value) => {
    setVariantOptions((prev) => prev.map((option, index) => (
      index === optionIndex ? { ...option, values: option.values.map((item) => item.value === value ? { ...item, enabled: item.enabled === false ? true : false } : item) } : option
    )));
  };

  const removeOption = (optionIndex) => {
    setVariantOptions(prev => prev.filter((_, i) => i !== optionIndex));
  };

  const updateOptionValue = (optionIndex, valueStr, patch) => {
    setVariantOptions((prev) => prev.map((option, index) => (
      index === optionIndex ? {
        ...option,
        values: option.values.map(item => item.value === valueStr ? { ...item, ...patch } : item)
      } : option
    )));
  };

  const updateVariantRow = (index, field, value) => {
    setVariantRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const applyToAll = (field) => {
    if (variantRows.length === 0) return;
    const firstVal = variantRows[0][field];
    setVariantRows(prev => prev.map(r => ({ ...r, [field]: firstVal })));
  };

  const removeVariantRow = (index) => {
    setVariantRows(prev => prev.filter((_, i) => i !== index));
  };

  const addVariantRow = () => {
    setVariantRows(prev => [...prev, {
      label: 'New Variant',
      price: Number(form.price || 0),
      compare: Number(form.compareAtPrice || 0),
      sku: '',
      stock: Number(form.stockQuantity || 0),
      active: true,
      imageUrl: null,
      imagePublicId: null
    }]);
  };

  const handleVariantImageUpload = async (file, rowIndex) => {
    if (!file) return;
    try {
      const { url, publicId } = await uploadToCloudinary(file, 'product', id || 'new');
      updateVariantRow(rowIndex, 'imageUrl', url);
      updateVariantRow(rowIndex, 'imagePublicId', publicId);
    } catch(err) {
      console.error('Variant image upload failed', err);
    }
  };

  return (
    <DashboardLayout
      title={isEditing ? (isSupplier ? 'Edit Supplier Product' : 'Edit Products') : (isSupplier ? 'Supplier Products' : 'Edit Products')}
      mode={isSupplier ? 'supplier' : 'seller'}
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="rounded-full bg-gray-300 px-4 py-2.5 text-sm font-semibold text-[#5C5D86] hover:bg-gray-200 disabled:opacity-60 sm:px-6"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="rounded-full bg-[#22925B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a7a4a] disabled:opacity-60 sm:px-6"
          >
            {saving ? 'Saving...' : 'Save & Activate'}
          </button>
        </div>
      }
    >
      <div className="min-h-full bg-gray-50 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6">
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
                <div className="mb-2 flex w-full max-w-full items-center gap-4 overflow-x-auto rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm sm:w-fit sm:gap-5">
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
                <ImageUpload
                  images={images}
                  onAdd={(files, slot, setMainOnly = false) => {
                    const newImageObjects = files.map(f => ({ tempId: `temp-${Math.random()}`, file: f, url: URL.createObjectURL(f) }));
                    setImages((prev) => {
                      const next = [...prev];
                      if (setMainOnly) {
                        const [picked] = next.splice(slot, 1);
                        return [picked, ...next];
                      }
                      if (slot !== null && slot !== undefined) {
                        next[slot] = newImageObjects[0];
                        if (newImageObjects.length > 1) next.push(...newImageObjects.slice(1));
                        return next.filter(Boolean);
                      }
                      return [...next, ...newImageObjects].filter(Boolean);
                    });
                  }}
                  onRemove={(index) => setImages((prev) => prev.filter((_, i) => i !== index))}
                />
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
                  <label className="mt-3 block text-sm text-[#5C5D86]">Alert me at</label>
                  <input value={form.alertMeAt} onChange={(e) => handleChange('alertMeAt', e.target.value)} type="number" className="mt-1 h-8 w-16 rounded border border-gray-200 px-2 text-sm outline-none" />
                  <label className="mt-3 flex items-center gap-2 text-sm text-[#5C5D86]">
                    <input type="checkbox" checked={form.continueSelling} onChange={(e) => handleChange('continueSelling', e.target.checked)} className="h-5 w-5 rounded border-gray-200" />
                    Continue selling when out of stock
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-[#1F2A30]">Variant</label>
                <div className="flex w-full max-w-xs items-center justify-between rounded-lg border border-gray-200 p-4">
                  <span className="text-sm text-[#1F2A30]">This Product has multiple options</span>
                  <Switch value={form.hasVariants} onChange={(value) => handleChange('hasVariants', value)} />
                </div>
                {form.hasVariants && (
                  <div className="mt-4 rounded-lg border border-gray-200 p-4">
                    <div className="space-y-5">
                      {variantOptions.map((option, optionIndex) => (
                        <div key={option.id} className="relative rounded-lg border border-gray-100 bg-gray-50 p-4">
                          <button type="button" onClick={() => removeOption(optionIndex)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                            <X size={16} />
                          </button>
                          <div className="flex flex-col gap-4 mb-4 sm:flex-row">
                            <div className="w-full sm:max-w-[200px]">
                              <label className="mb-2 block text-xs font-medium text-[#1F2A30]">Option Name</label>
                              <input
                                value={option.name}
                                onChange={(e) => updateOption(optionIndex, { name: e.target.value })}
                                placeholder="e.g. Size"
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#22925B]"
                              />
                            </div>
                            <div className="w-full sm:max-w-[200px]">
                              <label className="mb-2 block text-xs font-medium text-[#1F2A30]">Display Type</label>
                              <div className="relative">
                                <select
                                  value={option.displayType}
                                  onChange={(e) => updateOption(optionIndex, { displayType: e.target.value })}
                                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#22925B]"
                                >
                                  <option value="TEXT">Text Buttons</option>
                                  <option value="COLOR_SWATCH">Color Swatches</option>
                                  <option value="IMAGE">Image Swatches</option>
                                </select>
                                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              </div>
                            </div>
                          </div>
                          
                          <label className="mb-2 block text-xs font-medium text-[#1F2A30]">Values</label>
                          <div className="w-full rounded-lg border border-gray-200 bg-white p-3">
                            <input
                              placeholder="Type new value and press enter..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addOptionValue(optionIndex, e.currentTarget.value);
                                  e.currentTarget.value = '';
                                }
                              }}
                              className="mb-3 w-full border-b border-gray-100 bg-transparent pb-2 text-sm outline-none placeholder:text-gray-400"
                            />
                            <div className="flex flex-wrap gap-2">
                              {option.values.map((v) => {
                                const isEnabled = v.enabled !== false;
                                return (
                                  <div key={v.value} className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors ${isEnabled ? 'border-[#22925B] bg-green-50 text-[#1F2A30]' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                                    {isEnabled && option.displayType === 'COLOR_SWATCH' && (
                                      <input
                                        type="color"
                                        value={v.displayValue || '#000000'}
                                        onChange={(e) => updateOptionValue(optionIndex, v.value, { displayValue: e.target.value })}
                                        className="h-4 w-4 cursor-pointer border-none p-0 outline-none"
                                      />
                                    )}
                                    <span className={!isEnabled ? 'line-through opacity-70' : ''}>{v.value}</span>
                                    <button type="button" onClick={() => toggleOptionValue(optionIndex, v.value)} className="ml-1 rounded-full p-0.5 hover:bg-gray-200 text-gray-400">
                                      {isEnabled ? <X size={10} /> : <Plus size={10} />}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {variantOptions.length < 3 && (
                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        <div className="relative">
                          <select 
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val) {
                                const type = globalOptionTypes.find(t => t.id === val);
                                if (type) addOption(type);
                                e.target.value = "";
                              }
                            }}
                            className="appearance-none rounded-full border border-gray-200 bg-white pl-4 pr-10 py-2.5 text-sm font-medium text-[#1F2A30] outline-none hover:bg-gray-50 focus:border-[#22925B]"
                          >
                            <option value="">+ Add Existing Option Type</option>
                            {globalOptionTypes.filter(g => !variantOptions.some(v => v.name.toLowerCase() === g.name.toLowerCase())).map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                        <span className="text-sm text-gray-400">or</span>
                        <button type="button" onClick={() => addOption(null)} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-[#1F2A30] hover:bg-gray-50">
                          <Plus size={16} /> Create New Option Type
                        </button>
                      </div>
                    )}
                    <div className="mt-5 overflow-x-auto rounded-lg border border-gray-200">
                      <table className="min-w-150 w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 text-xs text-[#5C5D86]">
                            <th className="px-5 py-3 text-left">Variant</th>
                            <th className="px-5 py-3 text-left">
                              Price <button type="button" onClick={() => applyToAll('price')} className="text-[#321CFF] hover:underline ml-1">Apply to all</button>
                            </th>
                            <th className="px-5 py-3 text-left">Compare</th>
                            <th className="px-5 py-3 text-left">SKU</th>
                            <th className="px-5 py-3 text-left">
                              Stock <button type="button" onClick={() => applyToAll('stock')} className="text-[#321CFF] hover:underline ml-1">Apply to all</button>
                            </th>
                            <th className="px-5 py-3 text-left">Image</th>
                            <th className="px-5 py-3 text-left">Active</th>
                            <th className="px-5 py-3 text-left"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {variantRows.map((row, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="px-5 py-3">
                                <input value={row.label} onChange={(e) => updateVariantRow(index, 'label', e.target.value)} className="w-full bg-transparent outline-none" />
                              </td>
                              <td className="px-5 py-3">
                                <input type="number" value={row.price} onChange={(e) => updateVariantRow(index, 'price', Number(e.target.value))} className="w-20 rounded border border-gray-200 px-2 py-1 text-sm outline-none" />
                              </td>
                              <td className="px-5 py-3">
                                <input type="number" value={row.compare} onChange={(e) => updateVariantRow(index, 'compare', Number(e.target.value))} className="w-20 rounded border border-gray-200 px-2 py-1 text-sm outline-none" />
                              </td>
                              <td className="px-5 py-3">
                                <input value={row.sku} onChange={(e) => updateVariantRow(index, 'sku', e.target.value)} className="w-24 rounded border border-gray-200 px-2 py-1 text-sm outline-none" />
                              </td>
                              <td className="px-5 py-3">
                                <input type="number" value={row.stock} onChange={(e) => updateVariantRow(index, 'stock', Number(e.target.value))} className="w-16 rounded border border-gray-200 px-2 py-1 text-sm outline-none" />
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  {row.imageUrl ? (
                                    <div className="relative h-8 w-8 overflow-hidden rounded border border-gray-200 group">
                                      <img src={row.imageUrl} alt="Variant" className="h-full w-full object-cover" />
                                      <button type="button" onClick={() => { updateVariantRow(index, 'imageUrl', null); updateVariantRow(index, 'imagePublicId', null); }} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 text-white">
                                        <X size={12} />
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-dashed border-gray-300 hover:bg-gray-50 hover:border-[#22925B]">
                                      <Upload size={12} className="text-gray-400" />
                                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleVariantImageUpload(e.target.files[0], index)} />
                                    </label>
                                  )}
                                  <button type="button" title="Pick from product images" onClick={() => setVariantImageModalRowIndex(index)} className="flex h-8 w-8 items-center justify-center rounded border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-[#22925B]">
                                    <List size={12} />
                                  </button>
                                </div>
                              </td>
                              <td className="px-5 py-3">
                                <Switch value={row.active} onChange={(val) => updateVariantRow(index, 'active', val)} />
                              </td>
                              <td className="px-5 py-3 text-right">
                                <button type="button" onClick={() => removeVariantRow(index)} className="text-[#5C5D86] hover:text-[#E32323]">
                                  <X size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="p-3">
                        <button type="button" onClick={addVariantRow} className="text-sm font-semibold text-[#22925B] hover:text-[#1a7a4a]">+ Add Row</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── SEO ─────────────────────────────────────────────────── */}
              {!isSupplier && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#1F2A30]">SEO</label>
                  <p className="mb-3 text-xs text-[#5C5D86]">
                    Improve how your product appears in search engines
                  </p>

                  {/* Accordion toggle */}
                  <button
                    type="button"
                    onClick={() => setSeoOpen((v) => !v)}
                    className="flex w-full max-w-xs items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm text-[#1F2A30] hover:border-[#22925B] transition-colors"
                  >
                    SEO Optimization
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${seoOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {seoOpen && (
                    <div className="mt-4 space-y-4">
                      {/* SEO Title */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-[#1F2A30]">
                          SEO Title
                        </label>
                        <div className="relative">
                          <input
                            value={form.seoTitle}
                            onChange={(e) =>
                              handleChange('seoTitle', e.target.value.slice(0, 60))
                            }
                            placeholder={form.name || 'Product title'}
                            className="w-full rounded-lg border border-gray-200 px-4 py-3 pr-16 text-sm text-[#1F2A30] outline-none focus:border-[#22925B]"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5C5D86]">
                            {form.seoTitle.length}/60
                          </span>
                        </div>
                      </div>

                      {/* SEO Description */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-[#1F2A30]">
                          SEO Description
                        </label>
                        <div className="relative">
                          <textarea
                            rows={4}
                            value={form.seoDescription}
                            onChange={(e) =>
                              handleChange('seoDescription', e.target.value.slice(0, 160))
                            }
                            placeholder={form.shortDescription || form.description || 'Product description'}
                            className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-[#1F2A30] outline-none focus:border-[#22925B]"
                          />
                          <span className="absolute bottom-3 right-3 text-xs text-[#5C5D86]">
                            {form.seoDescription.length}/160
                          </span>
                        </div>
                      </div>

                      {/* Live Google preview */}
                      <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-4">
                        <p className="mb-2 text-xs font-medium text-[#5C5D86]">
                          Search preview
                        </p>
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {form.seoTitle || form.name || 'Product Title'}
                        </p>
                        <p className="text-xs text-green-700 truncate">
                          www.mystore.com/products/
                          {(form.name || 'product-name')
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/^-|-$/g, '')}
                        </p>
                        <p className="mt-1 text-xs text-[#5C5D86] line-clamp-2">
                          {form.seoDescription ||
                            form.shortDescription ||
                            form.description ||
                            'Product description will appear here.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <aside className="h-fit rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:p-6 lg:sticky lg:top-6">
            <div className="space-y-7">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#1F2A30]">Status</label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#5C5D86]">{form.status ? 'ON (Active)' : 'OFF (Draft)'}</span>
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
                {!isSupplier ? (
                  <>
                    <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Product Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.tagIds?.map(tagId => {
                        const t = availableTags.find(a => a.id === tagId);
                        return t ? (
                          <span key={tagId} className="bg-gray-100 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                            {t.name} <button type="button" onClick={() => handleChange('tagIds', form.tagIds.filter(id => id !== tagId))}><X size={12}/></button>
                          </span>
                        ) : null;
                      })}
                    </div>
                    <div className="relative mb-2">
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && !form.tagIds?.includes(val)) handleChange('tagIds', [...(form.tagIds || []), val]);
                          e.target.value = '';
                        }}
                        className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#22925B]"
                      >
                        <option value="">Select an existing tag...</option>
                        {availableTags.filter(t => !form.tagIds?.includes(t.id)).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <input
                      placeholder="Create new tag (press enter)"
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val) {
                            try {
                              const { data } = await sellerApi.post('/catalog/product-tags', { name: val });
                              const newTag = data.data.tag || data.data;
                              setAvailableTags(prev => [...prev, newTag]);
                              handleChange('tagIds', [...(form.tagIds || []), newTag.id]);
                              e.currentTarget.value = '';
                            } catch(err) {
                              if (err.response?.status === 409) alert('Tag already exists');
                            }
                          }
                        }
                      }}
                    />
                  </>
                ) : (
                  <>
                    <label className="mb-2 block text-sm font-medium text-[#1F2A30]">Tags</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {form.tags?.map(tag => (
                        <span key={tag} className="bg-gray-100 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                          {tag} <button type="button" onClick={() => handleChange('tags', form.tags.filter(t => t !== tag))}><X size={12}/></button>
                        </span>
                      ))}
                    </div>
                    <input
                      placeholder="Type and press enter to add tag"
                      className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#22925B]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (val && !form.tags?.includes(val)) {
                            handleChange('tags', [...(form.tags || []), val]);
                          }
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </>
                )}
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
      {variantImageModalRowIndex !== null && (
        <VariantImageModal
          images={images}
          onSelect={(url) => {
            updateVariantRow(variantImageModalRowIndex, 'imageUrl', url);
            updateVariantRow(variantImageModalRowIndex, 'imagePublicId', null);
          }}
          onClose={() => setVariantImageModalRowIndex(null)}
        />
      )}
    </DashboardLayout>
  );
}
