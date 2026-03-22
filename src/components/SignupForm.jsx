import { useState } from 'react';
import { Link } from 'react-router-dom';
import './SignupForm.css';

const EyeIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="1" y1="1" x2="23" y2="23" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.625 11.375c.025-2.025 1.075-3.9 2.85-5-.925-1.375-2.375-2.2-3.95-2.275-1.7-.175-3.3 1-4.15 1-.85 0-2.15-1-3.525-.975-1.825.05-3.5 1.075-4.425 2.7-1.9 3.3-.5 8.25 1.35 10.95.9 1.325 1.975 2.8 3.375 2.75 1.35-.05 1.875-.875 3.5-.875 1.625 0 2.1.875 3.525.85 1.45-.025 2.375-1.35 3.25-2.675.65-.975 1.15-2.05 1.475-3.175-1.65-.7-2.275-2.375-2.275-4.275z" fill="#1C1C1E"/>
    <path d="M12.075 2.975C12.85 2.05 13.275.875 13.2-.15c-1.1.075-2.075.6-2.775 1.475C9.7 2.25 9.3 3.375 9.35 4.4c1.15.025 2.075-.525 2.725-1.425z" fill="#1C1C1E"/>
  </svg>
);

const BulletIcon = ({ met }) => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="4" cy="4" r="4" fill={met ? '#22925B' : '#D1D5DB'}/>
  </svg>
);

const getPasswordStrength = (password) => {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  if (password.length >= 12 && /[A-Z]/.test(password)) strength++;
  return strength;
};

const strengthColors = ['', '#EF4444', '#F59E0B', '#3B82F6', '#22925B'];

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const strength = getPasswordStrength(form.password);
  const hasMinLength = form.password.length >= 8;
  const hasNumber = /[0-9]/.test(form.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(form.password);

  const isFormReady =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.password.length >= 8 &&
    form.confirmPassword === form.password;

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="signup-form">
      <h2 className="signup-form__title">Sign Up</h2>
      <p className="signup-form__subtitle">Please enter your required details below</p>

      <form className="signup-form__fields" onSubmit={handleSubmit} noValidate>

        <div className="signup-form__group">
          <label className="signup-form__label" htmlFor="firstName">First Name</label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            className="signup-form__input"
            value={form.firstName}
            onChange={handleChange}
            autoComplete="given-name"
          />
        </div>

        <div className="signup-form__group">
          <label className="signup-form__label" htmlFor="lastName">Last Name</label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            className="signup-form__input"
            value={form.lastName}
            onChange={handleChange}
            autoComplete="family-name"
          />
        </div>

        <div className="signup-form__group">
          <label className="signup-form__label" htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            className="signup-form__input"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />
        </div>

        <div className="signup-form__group">
          <label className="signup-form__label" htmlFor="password">Password</label>
          <div className="signup-form__input-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="signup-form__input signup-form__input--has-icon"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="signup-form__eye-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {form.password.length > 0 && (
            <>
              <div className="signup-form__strength-bars">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className="signup-form__strength-bar"
                    style={{ background: strength >= level ? strengthColors[strength] : '#E5E7EB' }}
                  />
                ))}
              </div>
              <ul className="signup-form__requirements">
                <li className={`signup-form__req${hasMinLength ? ' signup-form__req--met' : ''}`}>
                  <BulletIcon met={hasMinLength} />
                  At least 8 characters
                </li>
                <li className={`signup-form__req${hasNumber ? ' signup-form__req--met' : ''}`}>
                  <BulletIcon met={hasNumber} />
                  Contains a number
                </li>
                <li className={`signup-form__req${hasSpecial ? ' signup-form__req--met' : ''}`}>
                  <BulletIcon met={hasSpecial} />
                  Contains a special character
                </li>
              </ul>
            </>
          )}

          {form.password.length === 0 && (
            <>
              <div className="signup-form__strength-bars">
                {[1, 2, 3, 4].map((level) => (
                  <div key={level} className="signup-form__strength-bar" />
                ))}
              </div>
              <ul className="signup-form__requirements">
                <li className="signup-form__req">
                  <BulletIcon met={false} />
                  At least 8 characters
                </li>
                <li className="signup-form__req">
                  <BulletIcon met={false} />
                  Contains a number
                </li>
                <li className="signup-form__req">
                  <BulletIcon met={false} />
                  Contains a special character
                </li>
              </ul>
            </>
          )}
        </div>

        <div className="signup-form__group">
          <label className="signup-form__label" htmlFor="confirmPassword">Confirm Password</label>
          <div className="signup-form__input-wrapper">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              className="signup-form__input signup-form__input--has-icon"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="signup-form__eye-btn"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className={`signup-form__submit${isFormReady ? ' signup-form__submit--active' : ''}`}
        >
          Create Account
        </button>

        <div className="signup-form__divider">
          <span className="signup-form__divider-line" />
          <span className="signup-form__divider-text">OR</span>
          <span className="signup-form__divider-line" />
        </div>

        <div className="signup-form__social">
          <button type="button" className="signup-form__social-btn">
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>
          <button type="button" className="signup-form__social-btn">
            <AppleIcon />
            <span>Continue with Apple</span>
          </button>
        </div>

        <p className="signup-form__login-prompt">
          Already have an account?{' '}
          <Link to="/login" className="signup-form__login-link">Login</Link>
        </p>

      </form>
    </div>
  );
};

export default SignupForm;
