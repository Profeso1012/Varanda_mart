import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import './AuthPage.css';

const EyeIcon = ({ open }) =>
  open ? (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5ZM12 17.5C9.24 17.5 7 15.26 7 12.5C7 9.74 9.24 7.5 12 7.5C14.76 7.5 17 9.74 17 12.5C17 15.26 14.76 17.5 12 17.5ZM12 9.5C10.34 9.5 9 10.84 9 12.5C9 14.16 10.34 15.5 12 15.5C13.66 15.5 15 14.16 15 12.5C15 10.84 13.66 15.5 12 15.5Z" fill="#888"/>
      <path d="M12 9.5C10.34 9.5 9 10.84 9 12.5C9 14.16 10.34 15.5 12 15.5C13.66 15.5 15 14.16 15 12.5C15 10.84 13.66 15.5 12 15.5Z" fill="#888"/>
    </svg>
  ) : (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 6.5C15.79 6.5 19.17 8.63 20.82 12C19.17 15.37 15.79 17.5 12 17.5C8.21 17.5 4.83 15.37 3.18 12C4.83 8.63 8.21 6.5 12 6.5ZM12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 9.5C13.38 9.5 14.5 10.62 14.5 12C14.5 13.38 13.38 14.5 12 14.5C10.62 14.5 9.5 13.38 9.5 12C9.5 10.62 10.62 9.5 12 9.5ZM12 7.5C9.52 7.5 7.5 9.52 7.5 12C7.5 14.48 9.52 16.5 12 16.5C14.48 16.5 16.5 14.48 16.5 12C16.5 9.52 14.48 7.5 12 7.5Z" fill="#888"/>
    </svg>
  );

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.41c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.39-1.32 2.76-2.53 3.98zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="5" r="5" fill="#22925B"/>
    <path d="M2.5 5L4.2 6.8L7.5 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const passwordChecks = {
    length: formData.password.length >= 8,
    number: /\d/.test(formData.password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password),
  };

  const strengthCount = Object.values(passwordChecks).filter(Boolean).length;

  const getBarActive = (index) => {
    if (strengthCount === 0) return false;
    if (strengthCount === 1) return index === 0;
    if (strengthCount === 2) return index < 2;
    return true; // all 3 met = all 4 bars
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (strengthCount < 3) {
      newErrors.password = 'Password does not meet all requirements';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (submitted && errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    navigate('/verify', { state: { email: formData.email } });
  };

  const isFormFilled = Object.values(formData).every(v => v.trim() !== '');

  return (
    <AuthLayout>
      <div className="signup-inner">
        <div className="signup-header">
          <h2 className="signup-title">Sign Up</h2>
          <p className="signup-subtitle">Please enter your required details below</p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit} noValidate>

          <div className="signup-form__field">
            <label className="signup-form__label">First Name</label>
            <input
              type="text"
              name="firstName"
              className={`signup-form__input${errors.firstName ? ' signup-form__input--error' : ''}`}
              value={formData.firstName}
              onChange={handleChange}
              autoComplete="given-name"
            />
            {errors.firstName && <span className="signup-form__error">{errors.firstName}</span>}
          </div>

          <div className="signup-form__field">
            <label className="signup-form__label">Last Name</label>
            <input
              type="text"
              name="lastName"
              className={`signup-form__input${errors.lastName ? ' signup-form__input--error' : ''}`}
              value={formData.lastName}
              onChange={handleChange}
              autoComplete="family-name"
            />
            {errors.lastName && <span className="signup-form__error">{errors.lastName}</span>}
          </div>

          <div className="signup-form__field">
            <label className="signup-form__label">Email Address</label>
            <input
              type="email"
              name="email"
              className={`signup-form__input${errors.email ? ' signup-form__input--error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <span className="signup-form__error">{errors.email}</span>}
          </div>

          <div className="signup-form__field">
            <label className="signup-form__label">Password</label>
            <div className="signup-form__password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className={`signup-form__input signup-form__input--padded${errors.password ? ' signup-form__input--error' : ''}`}
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="signup-form__eye-btn"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>

            <div className="password-strength-bars">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`strength-bar${getBarActive(i) ? ' strength-bar--active' : ''}`}
                />
              ))}
            </div>

            <div className="password-requirements">
              <div className={`req-item${passwordChecks.length ? ' req-item--met' : ''}`}>
                {passwordChecks.length ? <CheckIcon /> : <span className="req-dot" />}
                <span>At least 8 characters</span>
              </div>
              <div className={`req-item${passwordChecks.number ? ' req-item--met' : ''}`}>
                {passwordChecks.number ? <CheckIcon /> : <span className="req-dot" />}
                <span>Contains a number</span>
              </div>
              <div className={`req-item${passwordChecks.special ? ' req-item--met' : ''}`}>
                {passwordChecks.special ? <CheckIcon /> : <span className="req-dot" />}
                <span>Contains a special character</span>
              </div>
            </div>
          </div>

          <div className="signup-form__field">
            <label className="signup-form__label">Confirm Password</label>
            <div className="signup-form__password-wrap">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                className={`signup-form__input signup-form__input--padded${errors.confirmPassword ? ' signup-form__input--error' : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="signup-form__eye-btn"
                onClick={() => setShowConfirmPassword(v => !v)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showConfirmPassword} />
              </button>
            </div>
            {errors.confirmPassword && <span className="signup-form__error">{errors.confirmPassword}</span>}
          </div>

          <button
            type="submit"
            className={`signup-form__submit${isFormFilled ? ' signup-form__submit--active' : ''}`}
          >
            Create Account
          </button>

          <div className="signup-or-divider">
            <span className="signup-or-divider__line" />
            <span className="signup-or-divider__text">OR</span>
            <span className="signup-or-divider__line" />
          </div>

          <div className="signup-social-btns">
            <button type="button" className="signup-social-btn">
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
            <button type="button" className="signup-social-btn">
              <AppleIcon />
              <span>Continue with Apple</span>
            </button>
          </div>
        </form>

        <p className="signup-login-prompt">
          Already have an account?{' '}
          <Link to="/login" className="signup-login-link">Login</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;
