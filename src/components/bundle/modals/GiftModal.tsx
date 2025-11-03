import React from "react";
import { Product } from "@/types/bundle";
import { ProductCard } from "@/components/bundle/ProductCard";

interface GiftModalProps {
  readonly isOpen: boolean;
  readonly giftPool: readonly Product[];
  readonly selectedGifts: readonly string[];
  readonly allowedCount: number;
  readonly remainingGifts: number;
  readonly onToggleGift: (sku: string) => void;
  readonly onClose: () => void;
}

export const GiftModal = React.memo<GiftModalProps>(({
  isOpen,
  giftPool,
  selectedGifts,
  allowedCount,
  remainingGifts,
  onToggleGift,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="gift-modal-title">
      <div className="w-full max-w-4xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-200">
          <div className="flex-1">
            <h2 id="gift-modal-title" className="font-besley font-medium text-2xl sm:text-3xl mb-2" style={{ color: '#3A515E' }}>
              Select Your Free Gift
            </h2>
            <p className="font-outfit text-base text-neutral-900">
              You Qualify for {allowedCount} Free Gift{allowedCount !== 1 ? 's' : ''}: <span className="font-semibold">{selectedGifts.length} of {allowedCount} Selected</span>
            </p>
            <div className="mt-3 w-80 bg-neutral-200 rounded-full h-2">
              <div 
                className="bg-brand-orange h-2 rounded-full transition-all duration-300" 
                style={{ width: `${(selectedGifts.length / allowedCount) * 100}%` }}
                role="progressbar"
                aria-valuenow={selectedGifts.length}
                aria-valuemin={0}
                aria-valuemax={allowedCount}
                aria-label={`Gift selection progress: ${selectedGifts.length} of ${allowedCount} gifts selected`}
              ></div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-neutral-500 hover:text-neutral-800 p-2 touch-manipulation focus:outline-none focus:ring-2 focus:ring-brand-orange rounded" 
            aria-label="Close gift selection"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-6" style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f9fafb'
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {giftPool.map(p => (
              <ProductCard 
                key={p.sku} 
                product={p} 
                isSelected={selectedGifts.includes(p.sku)} 
                isGift={selectedGifts.includes(p.sku)}
                onToggle={onToggleGift} // Use gift toggle for both buttons
                onToggleGift={onToggleGift}
                canAddAsGift={true}
                disabledGift={!selectedGifts.includes(p.sku) && remainingGifts === 0}
                giftOnlyMode={true} // Enable gift-only mode
              />
            ))}
          </div>
        </div>

        <div className="border-t border-neutral-200 p-4 sm:p-6">
          <div className="flex items-center justify-end gap-2">
            <button 
              onClick={onClose} 
              className="rounded-xl px-6 py-3 border border-neutral-300 font-medium touch-manipulation focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

GiftModal.displayName = 'GiftModal';