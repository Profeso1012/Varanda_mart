import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BadgeCheck, Loader } from 'lucide-react';
import { sellerApi } from '../../lib/axios';

export default function CheckoutPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();

  // Flutterwave redirects back with ?status=successful&plan_activated=true
  const planActivated  = searchParams.get('plan_activated') === 'true';
  const status         = searchParams.get('status'); // 'successful' | 'cancelled'

  const [checking,      setChecking]      = useState(true);
  const [subscription,  setSubscription]  = useState(null);
  const [paymentFailed, setPaymentFailed] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (status === 'cancelled') {
        setChecking(false);
        setPaymentFailed(true);
        return;
      }

      try {
        // Fetch current subscription to confirm it's active
        const { data } = await sellerApi.get('/subscriptions/current');
        setSubscription(data.data.subscription);
      } catch {
        setPaymentFailed(true);
      } finally {
        setChecking(false);
      }
    };

    verify();
  }, []);

  // Auto-redirect to setup after success
  useEffect(() => {
    if (subscription?.status === 'ACTIVE' || subscription?.status === 'TRIAL') {
      const timer = setTimeout(() => navigate('/setup'), 3000);
      return () => clearTimeout(timer);
    }
  }, [subscription]);

  const formatDate = (iso) => iso
    ? new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
        .format(new Date(iso))
    : null;

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-white to-green-50 flex flex-col items-center justify-center px-4">

      <img src="/varanda-logo.png" alt="Varanda Mart" className="h-12 object-contain mb-10" />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-10 flex flex-col items-center text-center">

        {/* Checking */}
        {checking && (
          <>
            <Loader size={48} className="text-[#22925B] animate-spin mb-4" />
            <p className="text-lg font-medium text-[#1F2A30]">Confirming your plan...</p>
            <p className="text-sm text-[#5C5D86] mt-2">Please wait a moment</p>
          </>
        )}

        {/* Payment failed / cancelled */}
        {!checking && paymentFailed && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#E32323" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1F2A30] mb-2">Payment not completed</h2>
            <p className="text-sm text-[#5C5D86] mb-8">
              Your payment was cancelled or failed. No charges were made.
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="w-full py-3 rounded-full bg-[#22925B] text-white text-sm font-semibold hover:bg-[#1a7a4a] transition-colors mb-3"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 rounded-full bg-gray-100 text-[#5C5D86] text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {/* Success */}
        {!checking && subscription && (
          <>
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <BadgeCheck size={52} className="text-[#22925B]" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-bold text-[#1F2A30] mb-2">
              Your free trial has started
            </h2>
            <p className="text-sm text-[#5C5D86] mb-1">
              Plan: {subscription.tier?.charAt(0) + subscription.tier?.slice(1).toLowerCase()}
            </p>
            {subscription.trialEndsAt && (
              <p className="text-sm text-[#5C5D86] mb-8">
                Trial Ends: {formatDate(subscription.trialEndsAt)}
              </p>
            )}
            <p className="text-xs text-[#5C5D86] mb-6">Redirecting you to setup...</p>
            <button
              onClick={() => navigate('/setup')}
              className="w-full py-3 rounded-full bg-[#22925B] text-white text-sm font-semibold hover:bg-[#1a7a4a] transition-colors mb-3"
            >
              Set Up Your Store
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 rounded-full bg-gray-100 text-[#5C5D86] text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
