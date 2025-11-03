import React from "react";
import { CartLine, Totals } from "@/types/bundle";
import heroImage from "@/assets/images/attachment-assessment-singles.webp";
interface OneTimeOfferModalProps {
  readonly isOpen: boolean;
  readonly cartLines: readonly CartLine[];
  readonly totals: Totals;
  readonly onClose: () => void;
  readonly onReserveSingles: () => void;
  readonly onReserveCouples: () => void;
  readonly onPassAndPay: () => void;
}
export const OneTimeOfferModal = React.memo<OneTimeOfferModalProps>(({
  isOpen,
  onClose,
  onReserveSingles,
  onReserveCouples,
  onPassAndPay
}) => {
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="offer-modal-title">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Hero Image */}
        <div className="relative">
          <img src={heroImage} alt="Attachment Assessment for Singles" className="w-full h-48 object-cover" />
          
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-slate-700 text-white rounded-full text-sm font-semibold mb-4">
            ONE TIME OFFER: 50% OFF!
          </div>

          {/* Title */}
          <h2 id="offer-modal-title" className="text-xl font-bold text-gray-900 mb-4">
            Expert Attachment Assessment
          </h2>

          {/* Price Display */}
          <div className="mb-6">
            <div className="text-4xl font-bold text-green-500 mb-1">$987</div>
            <div className="text-lg text-gray-500 line-through">$1995</div>
          </div>

          {/* Description */}
          <div className="text-gray-700 mb-6 leading-relaxed">
            <p className="mb-4">
              Uncover your exact attachment style and break toxic relationship patterns forever. Get a private{" "}
              <span className="font-semibold">80-minute breakthrough</span> attachment assessment session with a 
              Certified Attachment Coach, plus a <span className="font-semibold">30-min relationship strategy session</span>. 
              Walk away knowing exactly why you struggle in love - and how to fix it.
            </p>
          </div>

          {/* Limited Notice */}
          <div className="mb-6">
            <div className="text-orange-600 font-bold text-sm mb-2">LIMITED SPOTS AVAILABLE</div>
            <div className="text-gray-600 text-sm mb-1">
              This exclusive offer expires when you close this page.
            </div>
            <div className="font-semibold text-gray-900 text-sm mb-2">
              Secure your spot now or pay full price later!
            </div>
            <div className="text-gray-600 text-sm">
              Couples need one assessment per partner.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button onClick={onReserveSingles} className="w-full py-3 px-4 bg-brand-orange text-white font-semibold rounded-xl hover:bg-[hsl(var(--orange-700))] transition-colors text-sm shadow-md">
              + Reserve Your Spot! (Singles)
            </button>
            
            <button onClick={onReserveCouples} className="w-full py-3 px-4 bg-brand-orange text-white font-semibold rounded-xl hover:bg-[hsl(var(--orange-700))] transition-colors text-sm shadow-md">
              + Reserve Your Spot! (Couples)
            </button>
            
            <button onClick={onPassAndPay} className="w-full py-3 px-4 bg-[hsl(var(--neutral-600))] text-white font-medium rounded-xl hover:bg-[hsl(var(--neutral-700))] transition-colors text-sm shadow-md">
              Pass, and pay more later...
            </button>
          </div>
        </div>
      </div>
    </div>;
});
OneTimeOfferModal.displayName = 'OneTimeOfferModal';