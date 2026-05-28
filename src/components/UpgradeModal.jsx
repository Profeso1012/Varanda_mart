import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

/**
 * Props:
 *  - variant: 'simple' | 'detailed'
 *  - title: string
 *  - subtitle: string (simple only)
 *  - benefits: string[] (detailed only)
 *  - price: string (detailed only, e.g. "$9/month")
 *  - onClose: fn
 */
export default function UpgradeModal({
  variant   = 'simple',
  title     = 'Upgrade to Pro',
  subtitle  = 'Upgrade to Connect your custom domain',
  benefits  = ['Use your own domain'],
  price     = null,
  onClose,
}) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose?.();
    navigate('/pricing');
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-xl">

        <h2 className="text-xl font-bold text-[#1F2A30] text-center mb-1">{title}</h2>

        {variant === 'simple' && (
          <p className="text-sm text-[#5C5D86] text-center mb-6">{subtitle}</p>
        )}

        {variant === 'detailed' && (
          <p className="text-sm text-[#22925B] font-medium mb-4">Benefits</p>
        )}

        {/* Features list */}
        <ul className="space-y-2 mb-6">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-[#1F2A30]">
              <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Check size={11} className="text-[#22925B]" strokeWidth={3} />
              </span>
              {b}
            </li>
          ))}
        </ul>

        {price && (
          <p className="text-base font-bold text-[#1F2A30] mb-6">Price: {price}</p>
        )}

        <button
          onClick={handleUpgrade}
          className="w-full py-3 rounded-full bg-[#22925B] text-white text-sm font-semibold hover:bg-[#1a7a4a] transition-colors mb-3"
        >
          Upgrade Now
        </button>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-full bg-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
