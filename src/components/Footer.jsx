import './Footer.css';

const Footer = () => (
  <footer className="footer-section">
    <div className="footer-card">

      {/* Column 1 – Brand */}
      <div className="footer-brand">
        <img
          className="footer-logo"
          src="https://cdn.builder.io/api/v1/image/assets%2F934f466d54e44638814059cefea847fc%2F4a5008d5bbe1481ba5490e229fffb701?format=webp&width=268&height=100"
          alt="Varanda Mart"
          width="134"
          height="50"
        />
        <p className="footer-tagline">
          Create your online storefront in minutes. Sell anywhere in Africa
        </p>

        <div className="footer-store-buttons">
          {/* Google Play */}
          <a href="#" className="footer-store-btn">
            <svg width="22" height="24" viewBox="0 0 22 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#gplay-clip)">
                <path d="M10.2738 11.4417L0.0908203 21.9698C0.205174 22.3698 0.410672 22.7386 0.691605 23.0481C0.972537 23.3576 1.32147 23.5997 1.71172 23.7558C2.10197 23.9118 2.52322 23.9778 2.94326 23.9485C3.36329 23.9193 3.771 23.7957 4.13521 23.5872L15.593 17.1475L10.2738 11.4417Z" fill="#EA4335"/>
                <path d="M20.571 9.65206L15.6162 6.85144L10.0391 11.6811L15.6389 17.1324L20.5559 14.3618C20.9915 14.1367 21.3564 13.7983 21.6109 13.3832C21.8655 12.9681 22.0001 12.4921 22.0001 12.0069C22.0001 11.5217 21.8655 11.0457 21.6109 10.6306C21.3564 10.2155 20.9915 9.87706 20.5559 9.65198L20.571 9.65206Z" fill="#FBBC04"/>
                <path d="M0.0911203 1.99182C0.0296057 2.21638 -0.00103337 2.44808 2.6586e-05 2.6807V21.2809C0.000633999 21.5134 0.0312448 21.7449 0.0911203 21.9698L10.6232 11.7112L0.0911203 1.99182Z" fill="#4285F4"/>
                <path d="M10.3497 11.9808L15.6158 6.85154L4.17319 0.381885C3.74267 0.133083 3.25302 0.00131666 2.75411 5.20116e-06C1.51601 -0.00236936 0.427523 0.808542 0.0908203 1.98437L10.3497 11.9808Z" fill="#34A853"/>
              </g>
              <defs>
                <clipPath id="gplay-clip">
                  <rect width="22" height="24" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            <div className="footer-store-label">
              <span className="footer-store-subtext">GET IT ON</span>
              <span className="footer-store-name">Google Play</span>
            </div>
          </a>

          {/* App Store */}
          <a href="#" className="footer-store-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#apple-clip)">
                <path d="M11.6734 7.22198C10.7974 7.22198 9.44138 6.22598 8.01338 6.26198C6.12938 6.28598 4.40138 7.35397 3.42938 9.04597C1.47338 12.442 2.92538 17.458 4.83338 20.218C5.76938 21.562 6.87338 23.074 8.33738 23.026C9.74138 22.966 10.2694 22.114 11.9734 22.114C13.6654 22.114 14.1454 23.026 15.6334 22.99C17.1454 22.966 18.1054 21.622 19.0294 20.266C20.0974 18.706 20.5414 17.194 20.5654 17.11C20.5294 17.098 17.6254 15.982 17.5894 12.622C17.5654 9.81397 19.8814 8.46998 19.9894 8.40998C18.6694 6.47798 16.6414 6.26198 15.9334 6.21398C14.0854 6.06998 12.5374 7.22198 11.6734 7.22198ZM14.7934 4.38998C15.5734 3.45398 16.0894 2.14598 15.9454 0.849976C14.8294 0.897976 13.4854 1.59398 12.6814 2.52998C11.9614 3.35798 11.3374 4.68998 11.5054 5.96198C12.7414 6.05798 14.0134 5.32598 14.7934 4.38998Z" fill="black"/>
              </g>
              <defs>
                <clipPath id="apple-clip">
                  <rect width="24" height="24" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            <div className="footer-store-label">
              <span className="footer-store-subtext">Download on the</span>
              <span className="footer-store-name">App Store</span>
            </div>
          </a>
        </div>
      </div>

      {/* Column 2 – Company */}
      <div className="footer-links-col">
        <h4 className="footer-col-heading">Company</h4>
        <ul className="footer-link-list">
          <li><a href="#">About</a></li>
          <li><a href="#">Contact</a></li>
          <li><a href="#">Privacy Policy</a></li>
          <li><a href="#">Terms</a></li>
        </ul>
      </div>

      {/* Column 3 – Account */}
      <div className="footer-links-col">
        <h4 className="footer-col-heading">Account</h4>
        <ul className="footer-link-list">
          <li><a href="#">Login</a></li>
          <li><a href="#">Get Started</a></li>
        </ul>
      </div>

      {/* Column 4 – Legal */}
      <div className="footer-links-col">
        <h4 className="footer-col-heading">Legal</h4>
        <ul className="footer-link-list">
          <li><a href="#">Terms of service</a></li>
          <li><a href="#">Privacy Policy</a></li>
        </ul>
      </div>

    </div>
  </footer>
);

export default Footer;
