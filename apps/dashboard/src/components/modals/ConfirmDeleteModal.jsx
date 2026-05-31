import { X } from 'lucide-react';

/**
 * Reusable confirmation modal for delete actions
 * Mobile-friendly with proper touch targets
 */
export default function ConfirmDeleteModal({ isOpen, title, message, itemName, onConfirm, onCancel, isDeleting = false }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1F2A30]">{title}</h2>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-sm text-[#5C5D86] mb-2">{message}</p>
          {itemName && (
            <p className="text-sm font-semibold text-[#1F2A30] bg-gray-50 px-3 py-2 rounded-lg">
              {itemName}
            </p>
          )}
        </div>

        {/* Warning */}
        <div className="bg-red-50 border border-red-100 rounded-lg px-4 py-3 mb-6">
          <p className="text-xs text-red-600">
            ⚠️ This action cannot be undone. The item will be permanently deleted.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-full bg-gray-100 text-[#5C5D86] text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
