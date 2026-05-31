// apps/storefront/src/context/StoreContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { getBootstrap } from '../api/storefrontApi';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [store, setStore] = useState(null);   // full bootstrap data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getBootstrap()
      .then(data => {
        setStore(data);
        applyBrandStyles(data);
      })
      .catch(err => {
        console.error('Storefront bootstrap failed:', err);
        setError(err.response?.data?.error?.code || 'BOOTSTRAP_FAILED');
        setStore(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <StoreContext.Provider value={{ store, loading, error }}>
      {children}
    </StoreContext.Provider>
  );
}

// Apply brand CSS variables and load Google Fonts from bootstrap data.
// The API returns brandSettings with snake_case keys.
function applyBrandStyles(data) {
  const b = data?.brandSettings;
  if (!b) return;

  const root = document.documentElement;

  // Map snake_case API fields → CSS variables
  if (b.primary_color)    root.style.setProperty('--brand-primary',    b.primary_color);
  if (b.secondary_color)  root.style.setProperty('--brand-secondary',  b.secondary_color);
  if (b.accent_color)     root.style.setProperty('--brand-accent',     b.accent_color);
  if (b.text_color)       root.style.setProperty('--brand-text',       b.text_color);
  if (b.background_color) root.style.setProperty('--brand-bg',         b.background_color);
  if (b.font_heading)     root.style.setProperty('--font-heading',     `'${b.font_heading}', sans-serif`);
  if (b.font_body)        root.style.setProperty('--font-body',        `'${b.font_body}', sans-serif`);
  if (b.base_font_size)   root.style.setProperty('--font-size-base',   `${b.base_font_size}px`);
  if (b.button_border_radius !== undefined)
    root.style.setProperty('--btn-radius', `${b.button_border_radius}px`);
  if (b.card_border_radius !== undefined)
    root.style.setProperty('--card-radius', `${b.card_border_radius}px`);

  // Load Google Fonts
  const fontHeading = b.font_heading;
  const fontBody    = b.font_body;
  if (fontHeading || fontBody) {
    const families = [fontHeading, fontBody]
      .filter(Boolean)
      .map(f => f.replace(/ /g, '+'))
      .join('&family=');
    const link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${families}:wght@300;400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }

  // Set page title and favicon from business data
  const business = data?.business;
  if (business?.name) document.title = business.name;
  if (business?.faviconUrl) {
    let favicon = document.querySelector("link[rel~='icon']");
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = business.faviconUrl;
  }
}

export const useStore = () => useContext(StoreContext);
