const PRODUCT_KEY = 'varandaLocalProducts';
const BUNDLE_KEY = 'varandaLocalBundles';

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};

const write = (key, rows) => localStorage.setItem(key, JSON.stringify(rows));

export const getLocalProducts = () => read(PRODUCT_KEY);

export const upsertLocalProduct = (product) => {
  const rows = getLocalProducts();
  const now = new Date().toISOString();
  const id = product.id || `local-product-${Date.now()}`;
  const nextProduct = { ...product, id, updatedAt: now, createdAt: product.createdAt || now, _local: true };
  const next = rows.some((row) => row.id === id)
    ? rows.map((row) => row.id === id ? { ...row, ...nextProduct } : row)
    : [nextProduct, ...rows];
  write(PRODUCT_KEY, next);
  return nextProduct;
};

export const deleteLocalProduct = (id) => {
  write(PRODUCT_KEY, getLocalProducts().filter((row) => row.id !== id));
};

export const duplicateLocalProduct = (product) =>
  upsertLocalProduct({
    ...product,
    id: `local-product-${Date.now()}`,
    name: `${product.name || 'Product'} Copy`,
    status: 'DRAFT',
  });

export const getLocalBundles = () => read(BUNDLE_KEY);

export const upsertLocalBundle = (bundle) => {
  const rows = getLocalBundles();
  const id = bundle.id || `local-bundle-${Date.now()}`;
  const nextBundle = { ...bundle, id, _local: true };
  const next = rows.some((row) => row.id === id)
    ? rows.map((row) => row.id === id ? { ...row, ...nextBundle } : row)
    : [nextBundle, ...rows];
  write(BUNDLE_KEY, next);
  return nextBundle;
};

export const deleteLocalBundle = (id) => {
  write(BUNDLE_KEY, getLocalBundles().filter((row) => row.id !== id));
};
