import { useState, useEffect } from 'react';
import './Header.css';

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
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F934f466d54e44638814059cefea847fc%2F96cc8fbc2f80492c9f70fdbc995bb339?format=webp&width=268&height=100"
            alt="Varanda Mart"
            className="logo-img"
            width="134"
            height="50"
          />
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
