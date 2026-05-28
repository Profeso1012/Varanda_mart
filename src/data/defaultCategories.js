export const DEFAULT_CATEGORY_TREE = [
  {
    id: 'electronics',
    name: 'Electronics',
    children: [
      { id: 'phones', name: 'Phones', children: [] },
      { id: 'laptops', name: 'Laptops', children: [] },
      { id: 'headphones', name: 'Headphones', children: [] },
      { id: 'earbuds', name: 'Earbuds', children: [] },
      { id: 'ring-lights', name: 'Ring Lights', children: [] },
    ],
  },
  {
    id: 'fashion',
    name: 'Fashion',
    children: [
      { id: 'shoes', name: 'Shoes', children: [] },
      { id: 'bags', name: 'Bags', children: [] },
      { id: 'skirts', name: 'Skirts', children: [] },
      { id: 'tops', name: 'Tops', children: [] },
      { id: 'jewelries', name: 'Jewelries', children: [] },
    ],
  },
];

export const flattenCategories = (categories = []) =>
  categories.flatMap((category) => [
    category,
    ...(category.children || []).map((child) => ({
      ...child,
      parentId: child.parentId || category.id,
      parentName: category.name,
    })),
  ]);

export const getCategoryOptions = (categories = []) =>
  flattenCategories(categories.length ? categories : DEFAULT_CATEGORY_TREE);
