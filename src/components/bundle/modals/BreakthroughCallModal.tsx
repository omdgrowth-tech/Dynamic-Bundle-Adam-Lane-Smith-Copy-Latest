import React from "react";
import { fmt } from "@/types/bundle";
import breakthroughCallImage from "@/assets/images/breakthrough-call.webp";

interface BreakthroughCallModalProps {
  readonly isOpen: boolean;
  readonly onAccept: () => void;
  readonly onDecline: () => void;
}

export const BreakthroughCallModal = React.memo<BreakthroughCallModalProps>(({
  isOpen,
  onAccept,
  onDecline
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="oto2-title">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Hero Image */}
        <div className="relative">
          <img 
            src={breakthroughCallImage} 
            alt="50-min Private Consultation with Certified Attachment Coach"
            className="w-full h-48 object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-slate-700 text-white rounded-full text-sm font-semibold mb-4">
            ONE TIME OFFER: 50% OFF!
          </div>

          {/* Title */}
          <h2 id="oto2-title" className="text-xl font-besley font-medium mb-4" style={{ color: '#243038' }}>
            50-min Private Consultation
          </h2>

          {/* Price Display */}
          <div className="mb-6">
            <div className="text-4xl font-bold text-green-500 mb-1">$397</div>
            <div className="text-lg text-gray-500 line-through">$800</div>
          </div>

          {/* Description */}
          <div className="text-gray-700 mb-6 leading-relaxed text-base font-outfit">
            <p className="mb-6">
              Receive a <span className="font-bold">50 minute video call</span> with a <span className="font-bold">Certified Attachment Coach</span> to discuss your relationship, address your questions, and assess how attachment patterns are impacting your life.
            </p>
            <p className="mb-6">
              Get <span className="font-bold">expert feedback and recommendations</span>, plus a complete rundown of resources we offer to accelerate your transformation.
            </p>
          </div>

          {/* Limited Notice */}
          <div className="mb-6 font-outfit">
            <div className="text-brand-orange font-bold text-lg mb-4">LIMITED SPOTS AVAILABLE</div>
            <div className="text-gray-700 text-base mb-2">
              This exclusive one-time rate is only available right now!
            </div>
            <div className="font-bold text-gray-900 text-base mb-4">
              ONCE YOU LEAVE IT&apos;S GONE FOR GOOD
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onAccept}
              className="w-full py-3 px-4 bg-brand-orange text-white font-semibold rounded-xl hover:bg-[hsl(var(--orange-700))] transition-colors text-sm shadow-md"
            >
              + Book Your Private Consultation
            </button>
            
            <button
              onClick={onDecline}
              className="w-full py-3 px-4 bg-[hsl(var(--neutral-600))] text-white font-medium rounded-xl hover:bg-[hsl(var(--neutral-700))] transition-colors text-sm shadow-md"
            >
              No, I&apos;ll pay more later.
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

BreakthroughCallModal.displayName = 'BreakthroughCallModal';
