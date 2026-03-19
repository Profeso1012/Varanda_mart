import { useState, useEffect } from 'react';
import './Header.css';

const VarandaLogo = () => (
  <div className="logo-wrapper">
    <svg className="logo-icon" width="38" height="48" viewBox="0 0 38 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left leaf */}
      <path d="M19 22C19 13 10 6 4 10C9 17 14 22 19 22Z" fill="#22925B"/>
      {/* Right leaf */}
      <path d="M19 22C19 13 28 6 34 10C29 17 24 22 19 22Z" fill="#196d44"/>
      {/* Center stem */}
      <line x1="19" y1="22" x2="19" y2="27" stroke="#22925B" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Cart handle */}
      <path d="M2 20L6 27" stroke="#22925B" strokeWidth="2" strokeLinecap="round"/>
      <path d="M2 20L1.5 15" stroke="#22925B" strokeWidth="2" strokeLinecap="round"/>
      {/* Cart body */}
      <path d="M6 27L32 27L28 39L10 39Z" fill="none" stroke="#22925B" strokeWidth="2" strokeLinejoin="round"/>
      {/* Left wheel */}
      <circle cx="13" cy="43.5" r="2.5" fill="#22925B"/>
      {/* Right wheel */}
      <circle cx="26" cy="43.5" r="2.5" fill="#22925B"/>
    </svg>
    <div className="logo-text">
      <span className="logo-brand">Varanda</span>
      <span className="logo-sub">— Mart —</span>
    </div>
  </div>
);

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
      <div className="site-header__inner">
        <a href="/" className="site-header__logo" onClick={closeMobile}>
          <VarandaLogo />
        </a>

        <nav className={`site-header__nav${mobileOpen ? ' site-header__nav--open' : ''}`}>
          <a href="/" className="nav-link nav-link--active" onClick={closeMobile}>Home</a>
          <a href="#about" className="nav-link" onClick={closeMobile}>About us</a>
          <a href="#features" className="nav-link" onClick={closeMobile}>Features</a>
          <a href="#contact" className="nav-link" onClick={closeMobile}>Contact</a>
        </nav>

        <div className="site-header__actions">
          <button className="header-btn-login">Login</button>
          <button className="header-btn-cta">Get Started</button>
        </div>

        <button
          className={`hamburger-btn${mobileOpen ? ' hamburger-btn--open' : ''}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </div>
    </header>
  );
};

export default Header;
