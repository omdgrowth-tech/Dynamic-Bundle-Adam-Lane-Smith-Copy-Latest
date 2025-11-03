import React from "react";

interface GiftReminderModalProps {
  readonly isOpen: boolean;
  readonly availableGifts: number;
  readonly onSelectGifts: () => void;
  readonly onContinue: () => void;
  readonly onClose: () => void;
}

export const GiftReminderModal = React.memo<GiftReminderModalProps>(({
  isOpen,
  availableGifts,
  onSelectGifts,
  onContinue,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="gift-reminder-title">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 text-center">
        <h3 id="gift-reminder-title" className="text-lg font-semibold mb-3">
          Please do not forget your free gift(s)! 😊
        </h3>
        <p className="text-sm text-neutral-600 mb-6">
          You have {availableGifts} free gift{availableGifts !== 1 ? 's' : ''} available.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onSelectGifts} 
            className="flex-1 bg-mint-600 text-white py-2 px-4 rounded-xl hover:bg-mint-700 focus:outline-none focus:ring-2 focus:ring-mint-600"
          >
            Select Gifts
          </button>
          <button 
            onClick={onContinue} 
            className="flex-1 bg-neutral-200 text-neutral-700 py-2 px-4 rounded-xl hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            Continue Anyway
          </button>
        </div>
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-400 rounded p-1" 
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>
    </div>
  );
});

GiftReminderModal.displayName = 'GiftReminderModal';