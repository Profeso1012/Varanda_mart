import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className={`site-header${scrolled ? ' site-header--scrolled' : ''}`}>
      <div className="site-header__inner">

        <Link to="/" className="site-header__logo" onClick={closeMobile}>
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F934f466d54e44638814059cefea847fc%2F4a5008d5bbe1481ba5490e229fffb701?format=webp&width=268&height=100"
            alt="Varanda Mart"
            className="logo-img"
            width="134"
            height="50"
          />
        </Link>

        <nav className={`site-header__nav${mobileOpen ? ' site-header__nav--open' : ''}`}>
          <Link to="/" className={`nav-link${location.pathname === '/' ? ' nav-link--active' : ''}`} onClick={closeMobile}>Home</Link>
          <a href="#about" className="nav-link" onClick={closeMobile}>About us</a>
          <a href="#features" className="nav-link" onClick={closeMobile}>Features</a>
          <a href="#contact" className="nav-link" onClick={closeMobile}>Contact</a>
        </nav>

        <div className="site-header__actions">
          <Link to="/login" className="header-btn-login">Login</Link>
          <Link to="/signup" className="header-btn-cta">Get Started</Link>
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
