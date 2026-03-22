import { Link } from 'react-router-dom';
import './AuthLayout.css';

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-page">
      <div className="auth-bg-overlay" />

      <div className="auth-top-bar">
        <Link to="/" className="auth-back-link">
          <svg width="10" height="20" viewBox="0 0 10 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8.33337 16.1984L7.46253 17.0834L1.0742 10.5917C0.920453 10.4332 0.834473 10.221 0.834473 10.0001C0.834473 9.7792 0.920453 9.567 1.0742 9.40841L7.46253 2.91675L8.33337 3.80258L2.23504 10.0001L8.33337 16.1984Z"
              fill="black"
            />
          </svg>
          <span>Home Page</span>
        </Link>

        <Link to="/" className="auth-logo-link">
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2F934f466d54e44638814059cefea847fc%2F4a5008d5bbe1481ba5490e229fffb701?format=webp&width=268&height=100"
            alt="Varanda Mart"
            className="auth-logo-img"
            width="134"
            height="50"
          />
        </Link>
      </div>

      <div className="auth-content">
        <div className="auth-card">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
