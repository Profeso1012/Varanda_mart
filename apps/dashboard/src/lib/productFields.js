const valueFrom = (source, keys, fallback = undefined) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return fallback;
};

export const getProductImageUrl = (product) =>
  valueFrom(product, ['mainImageUrl', 'main_image_url', 'imageUrl', 'image_url'], '');

export const getProductPrice = (product) =>
  Number(valueFrom(product, ['displayPrice', 'display_price', 'basePrice', 'base_price', 'supplierPrice', 'supplier_price', 'price'], 0)) || 0;

export const getSupplierCost = (product) =>
  Number(valueFrom(product, ['displayPrice', 'display_price', 'basePrice', 'base_price', 'supplierPrice', 'supplier_price'], 0)) || 0;

export const getSuggestedRetailPrice = (product) =>
  valueFrom(product, ['suggestedRetailPrice', 'suggested_retail_price'], '');

export const getCategoryName = (product) =>
  valueFrom(product, ['categoryName', 'category_name', 'marketplaceCategoryName', 'marketplace_category_name'])
  || product?.category?.name
  || product?.marketplaceCategory?.name
  || '-';

export const getStockTotal = (product) =>
  valueFrom(product, ['totalStock', 'total_stock', 'stockTotal', 'stock_total', 'stockQuantity', 'stock_quantity'], null);

export const normalizeProductForForm = (product = {}) => ({
  name: product.name || '',
  description: product.description || '',
  shortDescription: valueFrom(product, ['shortDescription', 'short_description'], ''),
  price: valueFrom(product, ['basePrice', 'base_price', 'displayPrice', 'display_price', 'price'], ''),
  compareAtPrice: valueFrom(product, ['compareAtPrice', 'compare_at_price'], ''),
  costPrice: valueFrom(product, ['costPrice', 'cost_price'], ''),
  weight: valueFrom(product, ['weight'], ''),
  stockQuantity: valueFrom(product, ['stockQuantity', 'stock_quantity', 'stockTotal', 'stock_total', 'totalStock', 'total_stock'], ''),
  trackQuantity: valueFrom(product, ['trackInventory', 'track_inventory'], false),
  hasVariants: valueFrom(product, ['isVariable', 'is_variable'], false),
  isFeatured: valueFrom(product, ['isFeatured', 'is_featured'], true),
  supplierPrice: valueFrom(product, ['supplierPrice', 'supplier_price', 'basePrice', 'base_price'], ''),
  suggestedRetailPrice: getSuggestedRetailPrice(product),
  processingTimeDays: valueFrom(product, ['processingTimeDays', 'processing_time_days'], ''),
  status: product.status === 'ACTIVE',
  categoryId: valueFrom(product, ['categoryId', 'category_id', 'marketplaceCategoryId', 'marketplace_category_id'], ''),
  brand: product.brand || '',
});

export const getValueFrom = valueFrom;
