import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Mail, BadgeCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sellerApi } from '../../lib/axios';
import OtpInput from '../../components/OtpInput';

const OTP_LENGTH      = 6;
const COUNTDOWN_START = 10 * 60;

const formatCountdown = (s) =>
  `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

export default function VerifyEmailPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { loginWithToken } = useAuth();

  const email = location.state?.email || '';

  const [otp, setOtp]             = useState(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(COUNTDOWN_START);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [status, setStatus]       = useState(null); // null | 'invalid_code' | 'expired' | 'locked' | 'success'

  useEffect(() => {
    if (status === 'success' || status === 'locked' || countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown, status]);

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (otp.every((d) => d !== '') && status !== 'locked' && !verifying) {
      handleVerify(otp.join(''));
    }
  }, [otp]);

  const handleVerify = async (code) => {
    if (verifying) return;
    if (code.length !== OTP_LENGTH) {
      setStatus('validation_error');
      return;
    }
    setVerifying(true);
    setStatus(null);

    try {
      // ✅ Call the real API
      const { data } = await sellerApi.post('/auth/verify-email', {
        email,
        code,
      });

      const { accessToken } = data.data;

      // ✅ Store the real token from the backend response
      loginWithToken(accessToken, data.data);

      setStatus('success');

      // ✅ Route based on signup intent set on the landing page
      setTimeout(() => {
        // ✅ After email verification, always go to role selection
        // Role selection calls /role/select which determines the setup flow
        navigate('/role/select');
      }, 2000);

    } catch (err) {
      const code = err.response?.data?.error?.code;
      setOtp(Array(OTP_LENGTH).fill(''));

      if (code === 'MAX_ATTEMPTS') {
        setStatus('locked');
      } else if (code === 'GONE') {
        setStatus('expired');
        setCountdown(0);
      } else if (code === 'INVALID_CODE') {
        const remaining = err.response?.data?.error?.attemptsRemaining ?? attemptsLeft - 1;
        setAttemptsLeft(remaining);
        setStatus('invalid_code');
      } else {
        setStatus('invalid_code');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setStatus(null);
    setOtp(Array(OTP_LENGTH).fill(''));
    try {
      await sellerApi.post('/auth/register', { email });
      setCountdown(COUNTDOWN_START);
      setAttemptsLeft(5);
    } catch {
      setCountdown(COUNTDOWN_START);
    } finally {
      setResending(false);
    }
  };

  const isLocked  = status === 'locked';
  const isSuccess = status === 'success';
  const hasError  = status === 'invalid_code' || status === 'expired';

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-linear-to-br from-gray-300 via-gray-200 to-green-100">
      <div className="w-full px-8 pt-6">
        <Link to="/" className="inline-flex items-center gap-1 text-[#1F2A30] text-sm hover:opacity-70">
          <ChevronLeft size={16} /> Home Page
        </Link>
      </div>

      <div className="mt-4 mb-6">
        <img src="/varanda-logo.png" alt="Varanda Mart" className="h-12 object-contain" />
      </div>

      <div className="w-full max-w-140 bg-white rounded-2xl shadow-sm px-10 py-16 mb-10">
        {isSuccess ? (
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <BadgeCheck size={48} className="text-[#22925B]" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-[#1F2A30] mb-2">Email verified</h2>
            <p className="text-sm text-[#5C5D86]">Congrats, your email has been verified!</p>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <Mail size={36} className="text-[#22925B]" strokeWidth={1.5} />
              </div>
            </div>

            <h1 className="text-xl font-bold text-[#1F2A30] text-center mb-1">Check your email</h1>
            <p className="text-sm text-[#5C5D86] text-center mb-8">
              We sent 6-digit verification code to{' '}
              <span className="font-medium text-[#1F2A30]">{email}</span>
            </p>

            <OtpInput
              value={otp}
              onChange={setOtp}
              error={hasError}
              disabled={isLocked || verifying}
            />

            <div className="text-center mt-4 space-y-1">
              {status === 'invalid_code' && (
                <p className="text-xs text-[#5C5D86]">
                  Incorrect code. {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
                </p>
              )}
              {status === 'expired' && (
                <p className="text-xs text-[#E32323]">Code expired. Please request a new one.</p>
              )}
              {isLocked && (
                <>
                  <p className="text-xs text-[#1F2A30] font-medium">Code locked</p>
                  <p className="text-xs text-[#5C5D86]">Too many attempts. Request a new code.</p>
                </>
              )}
              {!isLocked && status !== 'expired' && countdown > 0 && (
                <p className="text-xs text-[#5C5D86]">Code expires in {formatCountdown(countdown)}</p>
              )}
              <button
                onClick={handleResend}
                disabled={resending}
                className={`text-sm mt-1 transition-colors ${
                  isLocked ? 'text-[#22925B] hover:underline font-medium' : 'text-[#5C5D86] hover:text-[#22925B]'
                }`}
              >
                {resending ? 'Resending...' : 'Resend'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
