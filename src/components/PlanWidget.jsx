import { useState } from 'react';
import UpgradeModal from './UpgradeModal';

/**
 * Props:
 *  - planName: string (e.g. "Starter")
 *  - productsUsed: number
 *  - productsLimit: number
 *  - commission: string (e.g. "4%")
 */
export default function PlanWidget({
  planName      = 'Starter',
  productsUsed  = 12,
  productsLimit = 30,
  commission    = '4%',
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 p-5 w-64">
        <p className="text-xs text-[#5C5D86] mb-1">Current Plan</p>
        <p className="text-lg font-bold text-[#1F2A30] mb-5">{planName}</p>

        <div className="space-y-2 text-sm mb-5">
          <div className="flex items-center justify-between">
            <span className="text-[#5C5D86]">Products Used</span>
            <span className="font-medium text-[#1F2A30]">
              {productsUsed}/{productsLimit}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#5C5D86]">Commission</span>
            <span className="font-medium text-[#1F2A30]">{commission}</span>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full py-2.5 rounded-full bg-[#22925B] text-white text-sm font-semibold hover:bg-[#1a7a4a] transition-colors"
        >
          Upgrade Plan
        </button>
      </div>

      {showModal && (
        <UpgradeModal
          variant="detailed"
          title="Upgrade to Pro Plan"
          benefits={['Custom domain', '150 Products', 'Marketing Tools', 'Lower Commission']}
          price="$9/month"
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
