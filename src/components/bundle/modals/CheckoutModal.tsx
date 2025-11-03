import React from "react";
import { useNavigate } from "react-router-dom";
import { CartLine, Totals, fmt } from "@/types/bundle";
import { CheckoutItem } from "./CheckoutItem";
import { Row } from "@/components/bundle/utils/Row";

interface CheckoutModalProps {
  readonly isOpen: boolean;
  readonly cartLines: readonly CartLine[];
  readonly totals: Totals;
  readonly onClose: () => void;
  readonly onShowOneTimeOffer?: () => void;
  readonly oto1Passed?: boolean;
  readonly onShowOto2?: () => void;
}

export const CheckoutModal = React.memo<CheckoutModalProps>(
  ({
    isOpen,
    cartLines,
    totals,
    onClose,
    onShowOneTimeOffer,
    oto1Passed,
    onShowOto2,
  }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleContinueToPayment = () => {
      // Check if they already have ANY attachment assessment in their cart
      const hasAttachmentAssessment = cartLines.some(
        (line) =>
          line.sku === "ASSESSMENT_SINGLES" || line.sku === "ASSESSMENT_COUPLES"
      );

      // Check if they already have the breakthrough call in their cart
      const hasBreakthroughCall = cartLines.some(
        (line) => line.sku === "breakthrough-call"
      );

      if (hasAttachmentAssessment) {
        // If they already have an assessment, skip OTO1 and check for OTO2
        if (hasBreakthroughCall || oto1Passed) {
          // If they also have breakthrough call, or already passed OTO1, go to checkout
          navigate("/checkout", {
            state: { cartLines, totals },
          });
          onClose();
        } else {
          // Show OTO2 (breakthrough call) since they don't have it yet
          onShowOto2?.();
        }
      } else if (oto1Passed) {
        // User already passed/declined OTO1, now check for OTO2
        if (hasBreakthroughCall) {
          // They already have breakthrough call, go to checkout
          navigate("/checkout", {
            state: { cartLines, totals },
          });
          onClose();
        } else {
          // Show OTO2 (breakthrough call)
          onShowOto2?.();
        }
      } else {
        // First time, show OTO1 (assessment)
        onShowOneTimeOffer?.();
      }
    };

    return (
      <div
        className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-2 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
      >
        <div className="w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
          <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between">
            <h2
              id="checkout-modal-title"
              className="text-lg sm:text-xl font-semibold"
            >
              Checkout Summary
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-800 p-2 touch-manipulation focus:outline-none focus:ring-2 focus:ring-brand-orange rounded"
              aria-label="Close checkout summary"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 sm:p-5">
            <div className="space-y-2" role="list">
              {cartLines.map((line) => (
                <CheckoutItem key={line.sku} line={line} />
              ))}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={fmt(totals.subtotal)} />
              <Row label="Discounts" value={`- ${fmt(totals.discount)}`} />
              <Row
                label={<span className="font-semibold">Order Total</span>}
                value={
                  <span className="font-semibold">{fmt(totals.total)}</span>
                }
              />
            </div>
          </div>
          <div className="border-t border-neutral-200 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-xl px-6 py-3 border border-neutral-300 font-medium touch-manipulation focus:outline-none focus:ring-2 focus:ring-neutral-400"
              >
                Back
              </button>
              <button
                onClick={handleContinueToPayment}
                className="rounded-xl px-6 py-3 bg-brand-orange text-white font-semibold hover:bg-brand-orange/90 touch-manipulation focus:outline-none focus:ring-2 focus:ring-brand-orange"
                style={{ fontWeight: 500 }}
                aria-label={`Continue to payment. Total: ${fmt(totals.total)}`}
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CheckoutModal.displayName = "CheckoutModal";
