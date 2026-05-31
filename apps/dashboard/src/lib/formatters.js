// Currency formatting
export const formatPrice = (amount, currency = 'NGN') => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Number with commas
export const formatNumber = (n) =>
  new Intl.NumberFormat('en-NG').format(n);

// Date formatting
export const formatDate = (isoString, options = {}) =>
  new Intl.DateTimeFormat('en-NG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(new Date(isoString));

// Percentage display
export const formatPercent = (value) => {
  const num = parseFloat(value);
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num}%`;
};

// Order status badge config
export const ORDER_STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    bg: 'bg-yellow-100', text: 'text-yellow-700' },
  CONFIRMED:  { label: 'Confirmed',  bg: 'bg-blue-100',   text: 'text-blue-700'   },
  PROCESSING: { label: 'Processing', bg: 'bg-blue-100',   text: 'text-blue-700'   },
  SHIPPED:    { label: 'Shipped',    bg: 'bg-purple-100', text: 'text-purple-700' },
  DELIVERED:  { label: 'Delivered',  bg: 'bg-green-100',  text: 'text-green-700'  },
  CANCELLED:  { label: 'Cancelled',  bg: 'bg-red-100',    text: 'text-red-700'    },
  REFUNDED:   { label: 'Refunded',   bg: 'bg-gray-100',   text: 'text-gray-600'   },
};
