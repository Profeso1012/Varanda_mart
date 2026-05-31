// apps/storefront/src/components/StorefrontHeader.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import './StorefrontHeader.css';

export default function StorefrontHeader() {
  const { store } = useStore();
  const { itemCount } = useCart();
  const { isLoggedIn, customer, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navLinks = store?.navLinks || [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'About', href: '/about' },
  ];

  return (
    <>
      <header className="sf-header">
        <div className="container sf-header__inner">
          {/* Logo */}
          <Link to="/" className="sf-header__brand">
            {store?.logoUrl
              ? <img src={store.logoUrl} alt={store.name} className="sf-header__logo" />
              : <span className="sf-header__store-name">{store?.name || 'Store'}</span>
            }
          </Link>

          {/* Desktop nav */}
          <nav className="sf-header__nav">
            {navLinks.map(link => (
              <Link key={link.href} to={link.href} className="sf-header__nav-link">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="sf-header__actions">
            {/* Cart */}
            <Link to="/cart" className="sf-header__icon-btn" aria-label="Cart">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="sf-header__cart-badge">{itemCount > 9 ? '9+' : itemCount}</span>
              )}
            </Link>

            {/* Account */}
            {isLoggedIn ? (
              <div className="sf-header__user-wrapper">
                <button
                  className="sf-header__icon-btn sf-header__user-btn"
                  onClick={() => setShowUserMenu(v => !v)}
                  aria-label="Account"
                >
                  <User size={20} />
                  <span className="sf-header__user-name">
                    {customer?.firstName || 'Account'}
                  </span>
                </button>
                {showUserMenu && (
                  <div className="sf-header__user-dropdown">
                    <Link to="/account" onClick={() => setShowUserMenu(false)}>My Account</Link>
                    <Link to="/account/orders" onClick={() => setShowUserMenu(false)}>Orders</Link>
                    <button onClick={() => { logout(); setShowUserMenu(false); }}>
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="sf-header__icon-btn"
                onClick={() => setShowAuth(true)}
                aria-label="Sign in"
              >
                <User size={20} />
              </button>
            )}

            {/* Hamburger */}
            <button
              className="sf-header__hamburger"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="sf-header__mobile-nav">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="sf-header__mobile-link"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link to="/cart" className="sf-header__mobile-link" onClick={() => setMenuOpen(false)}>
              Cart {itemCount > 0 && `(${itemCount})`}
            </Link>
            {isLoggedIn
              ? <>
                  <Link to="/account" className="sf-header__mobile-link" onClick={() => setMenuOpen(false)}>Account</Link>
                  <button className="sf-header__mobile-link" onClick={() => { logout(); setMenuOpen(false); }}>Sign Out</button>
                </>
              : <button className="sf-header__mobile-link" onClick={() => { setShowAuth(true); setMenuOpen(false); }}>Sign In</button>
            }
          </div>
        )}
      </header>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} />}
    </>
  );
}
