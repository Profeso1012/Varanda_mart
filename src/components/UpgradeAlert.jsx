import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import UpgradeModal from './UpgradeModal';

/**
 * Props:
 *  - used: number (e.g. 28)
 *  - limit: number (e.g. 30)
 *  - resource: string (e.g. "products")
 *  - upgradeTo: string (e.g. "pro")
 *  - upgradeLimit: number (e.g. 150)
 */
export default function UpgradeAlert({
  used        = 28,
  limit       = 30,
  resource    = 'products',
  upgradeTo   = 'pro',
  upgradeLimit = 150,
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-[#D4A853] rounded-xl p-5 max-w-xs">
        <div className="flex justify-center mb-2">
          <AlertTriangle size={22} className="text-[#F59E0B]" />
        </div>
        <p className="text-sm font-semibold text-[#1F2A30] text-center mb-1">
          You have used {used} of {limit} {resource}
        </p>
        <p className="text-xs text-[#1F2A30]/80 text-center mb-4">
          Upgrade to {upgradeTo} to list {upgradeLimit} {resource}
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-2 rounded-full bg-[#22925B] text-white text-sm font-semibold hover:bg-[#1a7a4a] transition-colors"
        >
          Upgrade
        </button>
      </div>

      {showModal && (
        <UpgradeModal
          variant="simple"
          title={`Upgrade to ${upgradeTo.charAt(0).toUpperCase() + upgradeTo.slice(1)}`}
          subtitle={`Upgrade to list ${upgradeLimit} ${resource}`}
          benefits={[`List up to ${upgradeLimit} ${resource}`, 'Custom Domain', 'Advanced Analytics']}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
