import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sellerApi } from '../../lib/axios';
import { getRouteForOnboarding } from '../../lib/authRoutes';

const REMEMBERED_EMAIL_KEY = 'varandaRememberedEmail';

const getRememberedEmail = () => localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';

const updateRememberedEmail = (rememberMe, email) => {
  if (rememberMe) {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    return;
  }
  localStorage.removeItem(REMEMBERED_EMAIL_KEY);
};

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { loginWithToken, user } = useAuth();

  const successMessage = location.state?.successMessage || null;
  const rememberedEmail = getRememberedEmail();

  const [form, setForm]                 = useState({ email: rememberedEmail, password: '' });
  const [rememberMe, setRememberMe]     = useState(Boolean(rememberedEmail));
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [errorType, setErrorType]       = useState(null);

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const isFormFilled = form.email.trim() && form.password.trim();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errorType) setErrorType(null);
  };

  const routeAfterLogin = (user) => navigate(getRouteForOnboarding(user));

  const handleSubmit = async () => {
    if (!isFormFilled || loading) return;
    setLoading(true);
    setErrorType(null);

    try {
      const { data } = await sellerApi.post('/auth/login', {
        email: form.email,
        password: form.password,
      });

      const { accessToken, user } = data.data;
      updateRememberedEmail(rememberMe, form.email);
      loginWithToken(accessToken, data.data);
      routeAfterLogin(user);

    } catch (err) {
      const code = err.response?.data?.error?.code;
      if (code === 'INVALID_CREDENTIALS') setErrorType('invalid_credentials');
      else if (code === 'EMAIL_NOT_VERIFIED') {
        updateRememberedEmail(rememberMe, form.email);
        navigate('/verify-email', { state: { email: form.email } });
      }
      else if (code === 'ACCOUNT_SUSPENDED') setErrorType('suspended');
      else setErrorType('invalid_credentials');
    } finally {
      setLoading(false);
    }
  };

  const emailHasError    = !!errorType;
  const passwordHasError = errorType === 'invalid_credentials' || errorType === 'suspended';

  const inputClass = (hasError) =>
    `w-full border rounded-lg px-4 py-3 text-sm text-[#1F2A30] outline-none transition-colors ${
      hasError
        ? 'border-[#E32323] focus:border-[#E32323]'
        : 'border-gray-200 focus:border-[#22925B]'
    }`;

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-linear-to-br from-gray-300 via-gray-200 to-green-100 px-4 sm:px-8">

      <div className="w-full pt-6">
        <Link to="/" className="inline-flex items-center gap-1 text-[#1F2A30] text-sm hover:opacity-70 transition-opacity">
          <ChevronLeft size={16} /> Home Page
        </Link>
      </div>

      <div className="mt-4 mb-6">
        <img src="/varanda-logo.png" alt="Varanda Mart" className="h-12 object-contain" />
      </div>

      <div className="w-full max-w-140 bg-white rounded-2xl shadow-sm px-4 sm:px-10 py-8 sm:py-10 mb-10">
        <h1 className="text-2xl font-bold text-[#1F2A30] text-center mb-1">Welcome Back</h1>
        <p className="text-sm text-[#5C5D86] text-center mb-6">Please enter your required details below</p>

        {successMessage && !errorType && (
          <div className="mb-5 flex justify-center">
            <div className="bg-white border border-gray-200 rounded-lg px-5 py-3 text-sm text-[#1F2A30] shadow-sm">
              {successMessage}
            </div>
          </div>
        )}

        {errorType === 'invalid_credentials' && (
          <div className="mb-5 flex justify-center">
            <div className="bg-red-100 text-[#E32323] text-sm font-medium px-6 py-3 rounded-lg">
              Invalid email or password
            </div>
          </div>
        )}

        {errorType === 'suspended' && (
          <div className="mb-2 flex flex-col items-center gap-2">
            <div className="bg-red-100 text-[#E32323] text-sm font-medium px-6 py-3 rounded-lg text-center">
              Your account has been suspended. Contact support
            </div>
            <button className="text-sm text-[#22925B] hover:underline">Contact Support</button>
          </div>
        )}

        <div className="mb-5">
          <label className="block text-sm font-medium text-[#1F2A30] mb-1">Email Address</label>
          <input
            name="email" type="email" value={form.email}
            onChange={handleChange}
            className={inputClass(emailHasError)}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[#1F2A30] mb-1">Password</label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              className={inputClass(passwordHasError)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-7">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setRememberMe((v) => !v)}
              className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center cursor-pointer transition-colors ${
                rememberMe ? 'bg-[#F59E0B] border-[#F59E0B]' : 'border-[#F59E0B] bg-white'
              }`}
            >
              {rememberMe && (
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className="text-sm text-[#1F2A30]">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-[#F59E0B] hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isFormFilled || loading}
          className={`w-full py-3.5 rounded-full text-sm font-semibold text-white transition-colors ${
            isFormFilled && !loading
              ? 'bg-[#22925B] hover:bg-[#1a7a4a] cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-[#5C5D86]">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="flex gap-3 mb-6">
          <button className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-full py-3 text-sm text-[#1F2A30] hover:bg-gray-50 transition-colors">
            <img src="/google-icon.svg" alt="Google" className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Continue with Google</span>
            <span className="sm:hidden">Google</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-full py-3 text-sm text-[#1F2A30] hover:bg-gray-50 transition-colors">
            <img src="/apple-icon.svg" alt="Apple" className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Continue with Apple</span>
            <span className="sm:hidden">Apple</span>
          </button>
        </div>

        <p className="text-center text-sm text-[#5C5D86]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#22925B] font-semibold hover:underline">SignUp</Link>
        </p>
      </div>
    </div>
  );
}
