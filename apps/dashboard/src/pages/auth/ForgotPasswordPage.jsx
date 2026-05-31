import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ChevronLeft, Mail, BadgeCheck } from 'lucide-react';
import { sellerApi } from '../../lib/axios';
import OtpInput from '../../components/OtpInput';



const OTP_LENGTH = 6;
const COUNTDOWN_START = 10 * 60; // 10 minutes

const passwordRules = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'Contains an uppercase letter', test: (p) => /[A-Z]/.test(p) },
    { label: 'Contains a number', test: (p) => /\d/.test(p) },
    { label: 'Contains a special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const getStrengthScore = (p) => passwordRules.filter((r) => r.test(p)).length;

export default function ForgotPasswordPage() {
    const navigate = useNavigate();

    // step: 'email' | 'otp' | 'new-password' | 'success'
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState('');

    //  Step 1 state
    const [emailError, setEmailError] = useState('');
    const [sendingCode, setSendingCode] = useState(false);

    // Step 2 state
    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
    const [otpError, setOtpError] = useState('');
    const [countdown, setCountdown] = useState(COUNTDOWN_START);
    const [resending, setResending] = useState(false);
    // const inputRefs                 = useRef([]);

    // Set 3 state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Countdown timer for Otp step
    useEffect(() => {
        if (step != 'otp') return;
        if (countdown <= 0) return;
        const id = setInterval(() => setCountdown((c) => c - 1), 1000);
        return () => clearInterval(id);
    }, [step, countdown]);

    useEffect(() => {
        if (step !== 'otp') return;
        if (countdown <= 0) return;
        if (otp.every((digit) => digit !== '')) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setOtpError('');
             
            setStep('new-password');
        }
    }, [otp, step, countdown]);

    const formatCountdown = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return (`${m}:${s}`);
    };

    // Step 1: Send reset code
    const handleSendCode = async () => {
        if (!email.trim()) {
            setEmailError('Email is required');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError('Enter a valid email address');
            return;
        }
        setSendingCode(true);
        try {
          // ✅ Real API call — always returns 200 even if email not found (no enumeration)
          await sellerApi.post('/auth/forgot-password', { email });
          setCountdown(COUNTDOWN_START);
          setOtp(Array(OTP_LENGTH).fill(''));
          setStep('otp');
        } catch {
          setEmailError('Something went wrong. Please try again.');
        } finally {
          setSendingCode(false);
        }
      };

    // Step 2: Resend reset code
    const handleResend = async () => {
      setResending(true);
      try {
        await sellerApi.post('/auth/forgot-password', { email });
        setCountdown(COUNTDOWN_START);
        setOtp(Array(OTP_LENGTH).fill(''));
        setOtpError('');
      } catch {
        setOtpError('Failed to resend. Try again.');
      } finally {
        setResending(false);
      }
    };

    // Step 3: set new password
    const strengthScore = getStrengthScore(newPassword);

    const barColour = (index) => {
        if (newPassword.length === 0) return 'bg-gray-300';
        if (strengthScore === 1) return index === 0 ? 'bg-red-500' : 'bg-gray-300';
        if (strengthScore === 2) return index <= 1 ? 'bg-yellow-400' : 'bg-gray-300';
        if (strengthScore === 3) return index <= 2 ? 'bg-[#22925B]' : 'bg-gray-300';
        if (strengthScore === passwordRules.length) return 'bg-[#22925B]';
        return 'bg-gray-300';
    };

    const handleSetPassword = async () => {
  if (otp.some((digit) => digit === '')) { setPasswordError('Enter the complete reset code'); return; }
  if (strengthScore < passwordRules.length) { setPasswordError('Password does not meet all requirements'); return; }
  if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return; }
  setSubmitting(true);
  setPasswordError('');
  try {
    // ✅ Real API call with all 3 required fields
    await sellerApi.post('/auth/reset-password', {
      email,
      code:        otp.join(''),
      newPassword,
    });
    setStep('success');
    setTimeout(() => {
      navigate('/login', {
        state: { successMessage: 'Password updated. You can now login' },
      });
    }, 2500);
  } catch (err) {
    const code = err.response?.data?.error?.code;
    if (code === 'INVALID_CODE') setPasswordError('The OTP code is incorrect.');
    else if (code === 'GONE')    setPasswordError('The OTP has expired. Request a new one.');
    else if (code === 'VALIDATION_ERROR') setPasswordError(err.response?.data?.error?.message || 'Password does not meet all requirements.');
    else                         setPasswordError('Something went wrong. Please try again.');
  } finally {
    setSubmitting(false);
  }
};

    const isPasswordReady = newPassword && confirmPassword &&
        strengthScore === passwordRules.length && newPassword === confirmPassword;
    // ── Shared wrapper ──
  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-linear-to-br from-gray-300 via-gray-200 to-green-100">

      {/* Back link */}
      <div className="w-full px-8 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-[#1F2A30] text-sm hover:opacity-70 transition-opacity"
        >
          <ChevronLeft size={16} />
          Home Page
        </Link>
      </div>

      {/* Logo — hidden on success step to match design */}
      {step !== 'success' && (
        <div className="mt-4 mb-6">
          <img src="/varanda-logo.png" alt="Varanda Mart" className="h-12 object-contain" />
        </div>
      )}

      {step === 'success' && <div className="mt-10" />}

      {/* ════════════════════════════════════════
          STEP 1 — Enter email
      ════════════════════════════════════════ */}
      {step === 'email' && (
        <div className="w-full max-w-140 bg-white rounded-2xl shadow-sm px-10 py-16 mb-10">
          <h1 className="text-2xl font-bold text-[#1F2A30] text-center mb-2">
            Forgot password
          </h1>
          <p className="text-sm text-[#5C5D86] text-center mb-10">
            Please enter your email address below to send code
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#1F2A30] mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
              className={`w-full border rounded-lg px-4 py-3 text-sm text-[#1F2A30] outline-none transition-colors ${
                emailError
                  ? 'border-[#E32323] focus:border-[#E32323]'
                  : 'border-gray-200 focus:border-[#22925B]'
              }`}
            />
            {emailError && (
              <p className="text-xs text-[#E32323] mt-1">{emailError}</p>
            )}
          </div>

          <button
            onClick={handleSendCode}
            disabled={!email.trim() || sendingCode}
            className={`w-full py-3.5 rounded-full text-sm font-semibold text-white transition-colors ${
              email.trim() && !sendingCode
                ? 'bg-[#22925B] hover:bg-[#1a7a4a] cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {sendingCode ? 'Sending...' : 'Send Reset Code'}
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 2 — OTP verification
      ════════════════════════════════════════ */}
      {step === 'otp' && (
        <div className="w-full max-w-140 bg-white rounded-2xl shadow-sm px-10 py-16 mb-10">

          {/* Email icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <Mail size={36} className="text-[#22925B]" strokeWidth={1.5} />
            </div>
          </div>

          <h1 className="text-xl font-bold text-[#1F2A30] text-center mb-1">
            Check your email
          </h1>
          <p className="text-sm text-[#5C5D86] text-center mb-8">
            Enter the code we sent to reset your password
          </p>

          <div className="mb-4">
            <OtpInput
              value={otp}
              onChange={setOtp}
              error={!!otpError}
              disabled={false}
            />
          </div>

          {otpError && (
            <p className="text-xs text-[#E32323] text-center mb-3">{otpError}</p>
          )}

          {/* Countdown + Resend */}
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-xs text-[#5C5D86]">
                Code expires in {formatCountdown(countdown)}
              </p>
            ) : (
              <p className="text-xs text-[#5C5D86]">Code expired</p>
            )}
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-[#5C5D86] hover:text-[#22925B] mt-1 transition-colors"
            >
              {resending ? 'Resending...' : 'Resend'}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 3 — New password
      ════════════════════════════════════════ */}
      {step === 'new-password' && (
        <div className="w-full max-w-140 bg-white rounded-2xl shadow-sm px-10 py-10 mb-10">
          <h1 className="text-2xl font-bold text-[#1F2A30] text-center mb-1">
            Input new password
          </h1>
          <p className="text-sm text-[#5C5D86] text-center mb-8">
            Input new password in order to login
          </p>

          {/* New Password */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-[#1F2A30] mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-12 text-sm text-[#1F2A30] outline-none focus:border-[#22925B] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Strength bars */}
            <div className="flex gap-1.5 mt-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${barColour(i)}`}
                />
              ))}
            </div>

            {/* Rules */}
            <ul className="mt-2 space-y-1">
              {passwordRules.map((rule) => {
                const passed = rule.test(newPassword);
                return (
                  <li key={rule.label} className="flex items-center gap-1.5 text-xs">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      newPassword.length === 0 ? 'bg-gray-300'
                      : passed ? 'bg-[#22925B]' : 'bg-gray-300'
                    }`} />
                    <span className={passed && newPassword.length > 0 ? 'text-[#22925B]' : 'text-[#5C5D86]'}>
                      {rule.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Confirm New Password */}
          <div className="mb-7">
            <label className="block text-sm font-medium text-[#1F2A30] mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                className={`w-full border rounded-lg px-4 py-3 pr-12 text-sm text-[#1F2A30] outline-none transition-colors ${
                  passwordError && passwordError.includes('match')
                    ? 'border-[#E32323] focus:border-[#E32323]'
                    : 'border-gray-200 focus:border-[#22925B]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs text-[#E32323] mt-1">{passwordError}</p>
            )}
          </div>

          <button
            onClick={handleSetPassword}
            disabled={!isPasswordReady || submitting}
            className={`w-full py-3.5 rounded-full text-sm font-semibold text-white transition-colors ${
              isPasswordReady && !submitting
                ? 'bg-[#22925B] hover:bg-[#1a7a4a] cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Saving...' : isPasswordReady ? 'Set New Password' : 'Continue'}
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════
          STEP 4 — Success
      ════════════════════════════════════════ */}
      {step === 'success' && (
        <div className="w-full max-w-140 bg-white rounded-2xl shadow-sm px-10 py-20 mb-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <BadgeCheck size={48} className="text-[#22925B]" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-[#1F2A30] mb-2">
            Password setup completed
          </h2>
          <p className="text-sm text-[#5C5D86]">
            Your password has been set up
          </p>
        </div>
      )}

    </div>
  );
}
