import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import './AuthPage.css';

const TOTAL_SECONDS = 10 * 60; // 10 minutes

const VerificationPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || 'your email';

  const [otp, setOtp] = useState(Array(6).fill(''));
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [expired, setExpired] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const updated = Array(6).fill('');
    pasted.split('').forEach((ch, i) => { updated[i] = ch; });
    setOtp(updated);
    const nextEmpty = updated.findIndex(v => v === '');
    const focusIdx = nextEmpty === -1 ? 5 : nextEmpty;
    inputRefs.current[focusIdx]?.focus();
  };

  const handleResend = () => {
    setOtp(Array(6).fill(''));
    setTimeLeft(TOTAL_SECONDS);
    setExpired(false);
    inputRefs.current[0]?.focus();
  };

  return (
    <AuthLayout>
      <div className="verify-inner">
        <div className="verify-icon-wrap">
          <svg width="93" height="93" viewBox="0 0 93 93" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M73.625 15.5H19.375C16.2919 15.5 13.335 16.7248 11.1549 18.9049C8.97477 21.085 7.75 24.0419 7.75 27.125V65.875C7.75 68.9581 8.97477 71.915 11.1549 74.0951C13.335 76.2752 16.2919 77.5 19.375 77.5H73.625C76.7081 77.5 79.665 76.2752 81.8451 74.0951C84.0252 71.915 85.25 68.9581 85.25 65.875V27.125C85.25 24.0419 84.0252 21.085 81.8451 18.9049C79.665 16.7248 76.7081 15.5 73.625 15.5ZM72.0362 23.25L49.2513 46.035C48.891 46.3982 48.4624 46.6865 47.9902 46.8832C47.518 47.0799 47.0115 47.1812 46.5 47.1812C45.9885 47.1812 45.482 47.0799 45.0098 46.8832C44.5376 46.6865 44.109 46.3982 43.7487 46.035L20.9637 23.25H72.0362ZM77.5 65.875C77.5 66.9027 77.0917 67.8883 76.365 68.615C75.6383 69.3417 74.6527 69.75 73.625 69.75H19.375C18.3473 69.75 17.3617 69.3417 16.635 68.615C15.9083 67.8883 15.5 66.9027 15.5 65.875V28.7137L38.285 51.4987C40.4647 53.6757 43.4194 54.8985 46.5 54.8985C49.5806 54.8985 52.5353 53.6757 54.715 51.4987L77.5 28.7137V65.875Z" fill="url(#paint0_linear_verify)"/>
            <defs>
              <linearGradient id="paint0_linear_verify" x1="46.5" y1="15.5" x2="46.5" y2="77.5" gradientUnits="userSpaceOnUse">
                <stop offset="0.524038" stopColor="#22925B"/>
                <stop offset="1" stopColor="#0A2C1B"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="verify-text">
          <h2 className="verify-title">Check your email</h2>
          <p className="verify-subtitle">
            We sent 6-digit verification code to <strong>{email}</strong>
          </p>
        </div>

        <div className="verify-otp-row" onPaste={handleOtpPaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              className={`otp-box${i === 0 && !digit ? ' otp-box--focused' : ''}${digit ? ' otp-box--filled' : ''}`}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleOtpKeyDown(i, e)}
              onFocus={e => e.target.select()}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        <div className="verify-footer">
          <p className={`verify-countdown${expired ? ' verify-countdown--expired' : ''}`}>
            {expired ? 'Code expired' : `Code expires in ${formatTime(timeLeft)}`}
          </p>
          <button type="button" className="verify-resend-btn" onClick={handleResend}>
            Resend
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerificationPage;
