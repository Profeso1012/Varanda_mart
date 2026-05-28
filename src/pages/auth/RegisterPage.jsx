import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sellerApi } from '../../lib/axios';

const REMEMBERED_EMAIL_KEY = 'varandaRememberedEmail';

const rules = [
  { label: 'At least 8 characters',      test: (p) => p.length >= 8 },
  { label: 'Contains an uppercase letter',test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains a number',           test: (p) => /\d/.test(p) },
  { label: 'Contains a special character',test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const getStrengthScore = (p) => rules.filter((r) => r.test(p)).length;

const getRememberedEmail = () => localStorage.getItem(REMEMBERED_EMAIL_KEY) || '';

const updateRememberedEmail = (rememberMe, email) => {
  if (rememberMe) {
    localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
    return;
  }
  localStorage.removeItem(REMEMBERED_EMAIL_KEY);
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const rememberedEmail = getRememberedEmail();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: rememberedEmail,
    password: '', confirmPassword: '', phone: '',
  });
  const [showPassword, setShowPassword]             = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  const strengthScore = getStrengthScore(form.password);

  const barColor = (i) => {
    if (!form.password) return 'bg-gray-300';
    if (strengthScore === 1) return i === 0 ? 'bg-red-500'    : 'bg-gray-300';
    if (strengthScore === 2) return i <= 1  ? 'bg-yellow-400' : 'bg-gray-300';
    if (strengthScore === 3) return i <= 2  ? 'bg-[#22925B]'  : 'bg-gray-300';
    if (strengthScore === rules.length) return 'bg-[#22925B]';
    return 'bg-gray-300';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required';
    if (!form.email.trim())     e.email     = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email address';
    if (!form.password)         e.password  = 'Password is required';
    else if (strengthScore < rules.length) e.password  = 'Password does not meet all requirements';
    if (!form.confirmPassword)
      e.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      // ✅ Send to the real API endpoint
      await sellerApi.post('/auth/register', {
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        password:  form.password,
        phone:     form.phone || undefined,
      });

      if (rememberedEmail) updateRememberedEmail(true, form.email);
      navigate('/verify-email', { state: { email: form.email } });

    } catch (err) {
      const code    = err.response?.data?.error?.code;
      const details = err.response?.data?.error?.details || [];

      if (code === 'CONFLICT') {
        setErrors({ email: 'conflict' });
      } else if (code === 'VALIDATION_ERROR') {
        const fieldErrors = {};
        details.forEach(({ field, message }) => { fieldErrors[field] = message; });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormFilled =
    form.firstName && form.lastName && form.email &&
    form.password && form.confirmPassword;

  const inputClass = (hasError) =>
    `w-full border rounded-lg px-4 py-3 text-sm text-[#1F2A30] outline-none transition-colors ${
      hasError
        ? 'border-[#E32323] focus:border-[#E32323]'
        : 'border-gray-200 focus:border-[#22925B]'
    }`;

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-linear-to-br from-gray-300 via-gray-200 to-green-100 px-4 sm:px-8">

      <div className="w-full pt-6">
        <Link to="/" className="inline-flex items-center gap-1 text-[#1F2A30] text-sm hover:opacity-70">
          <ChevronLeft size={16} /> Home Page
        </Link>
      </div>

      <div className="mt-4 mb-6">
        <img src="/varanda-logo.png" alt="Varanda Mart" className="h-12 object-contain" />
      </div>

      <div className="w-full max-w-140 bg-white rounded-2xl shadow-sm px-4 sm:px-10 py-8 sm:py-10 mb-10">
        <h1 className="text-2xl font-bold text-[#1F2A30] text-center mb-1">Sign Up</h1>
        <p className="text-sm text-[#5C5D86] text-center mb-8">Please enter your required details below</p>

        {errors.general && (
          <p className="text-sm text-[#E32323] text-center mb-4">{errors.general}</p>
        )}

        {/* First Name */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-[#1F2A30] mb-1">First Name</label>
          <input name="firstName" value={form.firstName} onChange={handleChange}
            className={inputClass(!!errors.firstName)} />
          {errors.firstName && <p className="text-xs text-[#E32323] mt-1">{errors.firstName}</p>}
        </div>

        {/* Last Name */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-[#1F2A30] mb-1">Last Name</label>
          <input name="lastName" value={form.lastName} onChange={handleChange}
            className={inputClass(!!errors.lastName)} />
          {errors.lastName && <p className="text-xs text-[#E32323] mt-1">{errors.lastName}</p>}
        </div>

        {/* Email */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-[#1F2A30] mb-1">Email Address</label>
          <input name="email" type="email" value={form.email} onChange={handleChange}
            className={inputClass(!!errors.email)} />
          {errors.email === 'conflict' ? (
            <p className="text-xs text-[#E32323] mt-1">
              An account with this email already exists.{' '}
              <Link to="/login" className="underline font-medium">Login instead?</Link>
            </p>
          ) : errors.email ? (
            <p className="text-xs text-[#E32323] mt-1">{errors.email}</p>
          ) : null}
        </div>

        {/* Password */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-[#1F2A30] mb-1">Password</label>
          <div className="relative">
            <input name="password" type={showPassword ? 'text' : 'password'}
              value={form.password} onChange={handleChange}
              className={inputClass(!!errors.password)} />
            <button type="button" onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="flex gap-1.5 mt-2">
            {[0,1,2,3].map((i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${barColor(i)}`} />
            ))}
          </div>
          <ul className="mt-2 space-y-1">
            {rules.map((rule) => {
              const passed = rule.test(form.password);
              return (
                <li key={rule.label} className="flex items-center gap-1.5 text-xs">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    !form.password ? 'bg-gray-300' : passed ? 'bg-[#22925B]' : 'bg-gray-300'
                  }`} />
                  <span className={passed && form.password ? 'text-[#22925B]' : 'text-[#5C5D86]'}>
                    {rule.label}
                  </span>
                </li>
              );
            })}
          </ul>
          {errors.password && <p className="text-xs text-[#E32323] mt-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div className="mb-7">
          <label className="block text-sm font-medium text-[#1F2A30] mb-1">Confirm Password</label>
          <div className="relative">
            <input name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword} onChange={handleChange}
              className={inputClass(!!errors.confirmPassword)} />
            <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-[#E32323] mt-1">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!isFormFilled || loading}
          className={`w-full py-3.5 rounded-full text-sm font-semibold text-white transition-colors ${
            isFormFilled && !loading
              ? 'bg-[#22925B] hover:bg-[#1a7a4a] cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-[#5C5D86]">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="flex gap-3">
          <button className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-full py-3 text-sm text-[#1F2A30] hover:bg-gray-50">
            <img src="/google-icon.svg" alt="Google" className="w-4 h-4" />
            Continue with Google
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 border border-gray-200 rounded-full py-3 text-sm text-[#1F2A30] hover:bg-gray-50">
            <img src="/apple-icon.svg" alt="Apple" className="w-4 h-4" />
            Continue with Apple
          </button>
        </div>
        
        <p className="text-sm text-[#5C5D86] mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-[#22925B] font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
