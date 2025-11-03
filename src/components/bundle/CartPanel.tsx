import React from "react";
import { CartLine, Totals, fmt } from "@/types/bundle";
import { CartItem } from "@/components/bundle/CartItem";
import { PaymentLogos } from "@/components/bundle/PaymentLogos";
import shieldCheckIcon from "@/assets/images/shield-check.svg";

interface CartPanelProps {
  readonly cartLines: readonly CartLine[];
  readonly totals: Totals;
  readonly courseCount: number;
  readonly onRemove?: (sku: string) => void;
  readonly showGiftSelection?: boolean;
  readonly giftSkus?: readonly string[];
  readonly allowedGiftCount?: number;
  readonly onSelectGifts?: () => void;
  readonly checkoutButton?: React.ReactNode;
  readonly showProgress?: boolean;
  readonly couponCode?: string;
  readonly couponApplied?: boolean;
  readonly onCouponChange?: (code: string) => void;
  readonly onApplyCoupon?: () => void;
  readonly onRemoveCoupon?: () => void;
}

export const CartPanel = React.memo<CartPanelProps>(
  ({
    cartLines,
    totals,
    courseCount,
    onRemove,
    showGiftSelection = false,
    giftSkus = [],
    allowedGiftCount = 0,
    onSelectGifts,
    checkoutButton,
    showProgress = true,
    couponCode = "",
    couponApplied = false,
    onCouponChange,
    onApplyCoupon,
    onRemoveCoupon,
  }) => {
    return (
      <div className="xl:sticky xl:top-5 bg-white rounded-xl shadow-lg border border-neutral-200 p-3 sm:p-5 w-full overflow-hidden">
        {/* Header */}
        <div className="mb-3 sm:mb-5">
          <h2
            className="font-besley font-medium text-xl sm:text-2xl mb-1"
            style={{ color: "#3A515E" }}
          >
            Your Bundle
          </h2>
        </div>

        {/* Unlock Badge */}
        {showProgress && (
          <div
            className={`mb-3 sm:mb-5 text-center rounded-xl p-2.5 sm:p-3 border transition-all duration-300 ${courseCount >= 3
              ? "border-[#06A24A]"
              : courseCount >= 2
                ? "border-[#4CA472B8]"
                : courseCount >= 1
                  ? "border-[#E7F7EE]"
                  : "border-neutral-200"
              }`}
            style={{
              backgroundColor:
                courseCount >= 3
                  ? "#06A24A"
                  : courseCount >= 2
                    ? "#4CA472B8"
                    : courseCount >= 1
                      ? "#E7F7EE"
                      : "#F5F5F5",
            }}
            role="status"
            aria-live="polite"
          >
            <div
              className={`font-outfit font-semibold text-sm sm:text-base ${courseCount >= 3
                ? "text-white"
                : courseCount >= 2
                  ? "text-white"
                  : courseCount >= 1
                    ? "text-[#5FCB8C]"
                    : "text-neutral-400"
                }`}
            >
              {cartLines.length === 0
                ? "UNLOCKED: 0% OFF"
                : courseCount >= 3
                  ? "UNLOCKED: 20% OFF + 1 FREE GIFT"
                  : courseCount >= 2
                    ? "UNLOCKED: 10% OFF"
                    : "UNLOCKED: 0% OFF"}
            </div>
          </div>
        )}

        {/* Progress Section */}
        {showProgress && (
          <div className="mb-4 sm:mb-6">
            {/* Program Count Line */}
            <div className="font-outfit text-sm text-neutral-900 mb-2">
              {courseCount === 0
                ? "Select 2 Courses or Programs and get 10% OFF"
                : courseCount === 1
                  ? "1 Program Selected"
                  : courseCount === 2
                    ? "2 Courses / Programs Selected: 10% OFF"
                    : courseCount >= 3
                      ? `${courseCount} Programs Selected: 20% OFF + 1 free gift`
                      : `${courseCount} Program${courseCount !== 1 ? "s" : ""
                      } Selected`}
            </div>

            {/* Progress Bar */}
            <div
              className="h-3 w-full rounded-full overflow-hidden mb-2"
              style={{ backgroundColor: "#F0F0F0" }}
            >
              <div
                className="h-full transition-all duration-300"
                style={{
                  backgroundColor: "#14E069",
                  width: `${Math.min((courseCount / 3) * 100, 100)}%`,
                }}
                role="progressbar"
                aria-valuenow={courseCount}
                aria-valuemin={0}
                aria-valuemax={3}
                aria-label={`Progress towards maximum discount: ${courseCount} of 3 programs selected`}
              />
            </div>

            {/* Next Incentive Line */}
            <div className="font-outfit text-sm text-neutral-900 mb-2">
              {courseCount === 0 ? (
                "Add 2 more for 10% OFF"
              ) : courseCount === 1 ? (
                "Add 1 more for 10% OFF"
              ) : courseCount === 2 ? (
                <>
                  Add 1 more Course / Program for{" "}
                  <span className="font-bold">20% OFF + 1 Free Gift</span>
                </>
              ) : courseCount >= 3 ? (
                <span className="font-bold">
                  BEST VALUE UNLOCKED: 20% OFF EVERYTHING + 1 FREE GIFT
                </span>
              ) : (
                "Add more Programs to unlock higher discounts"
              )}
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div
          className="space-y-3 mb-4 sm:mb-6 max-h-48 sm:max-h-60 lg:max-h-72 overflow-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#d1d5db #f9fafb",
          }}
          role="list"
        >
          {cartLines.length === 0 && (
            <div className="text-sm font-outfit text-neutral-500 text-center py-6 sm:py-8">
              Your bundle is empty. Add programs or courses to unlock discounts
              and up to three free gifts!
            </div>
          )}
          {cartLines.map((line) => (
            <CartItem key={line.sku} line={line} onRemove={onRemove} />
          ))}
        </div>

        {/* Gift Selection */}
        {showGiftSelection && allowedGiftCount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
            <div className="font-outfit font-medium text-base sm:text-lg text-neutral-900">
              Gifts: {giftSkus.length} / {allowedGiftCount}
            </div>
            <button
              onClick={onSelectGifts}
              className="font-outfit text-sm rounded-xl px-4 py-3 sm:py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors touch-manipulation w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-brand-orange"
              aria-label={`Select gifts. ${giftSkus.length} of ${allowedGiftCount} selected`}
            >
              Select Gift
            </button>
          </div>
        )}

        {/* Coupon Code Input */}
        {onCouponChange && onApplyCoupon && (
          <div className="mb-4 sm:mb-6">
            {!couponApplied ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => onCouponChange(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-white text-neutral-900 font-outfit text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  aria-label="Coupon code input"
                />
                <button
                  onClick={onApplyCoupon}
                  disabled={!couponCode.trim()}
                  className="font-outfit text-sm rounded-lg px-4 py-3 bg-orange-600 text-white hover:bg-orange-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-orange-500"
                  aria-label="Apply coupon"
                >
                  Apply
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-outfit text-sm font-medium text-emerald-700">
                    Coupon "{couponCode}" applied
                  </span>
                </div>
                {onRemoveCoupon && (
                  <button
                    onClick={onRemoveCoupon}
                    className="font-outfit text-xs text-emerald-700 hover:text-emerald-800 underline"
                    aria-label="Remove coupon"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Totals */}
        <div className="border-t border-neutral-200 pt-4 sm:pt-6 space-y-2 sm:space-y-3 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <span className="font-outfit text-lg font-normal text-neutral-500">
              Subtotal
            </span>
            <span className="font-outfit text-lg font-normal text-neutral-500">
              {fmt(totals.subtotal)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-outfit text-lg font-normal text-neutral-500">
              Discounts
            </span>
            <span className="font-outfit text-lg font-normal text-neutral-500">
              -{fmt(totals.discount)}
            </span>
          </div>
          {totals.couponDiscount && totals.couponDiscount > 0 && (
            <div className="flex items-center justify-between">
              <span className="font-outfit text-lg font-normal text-emerald-600">
                Coupon Discount
              </span>
              <span className="font-outfit text-lg font-normal text-emerald-600">
                -{fmt(totals.couponDiscount)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
            <span className="font-outfit text-lg font-semibold text-neutral-900">
              Total
            </span>
            <span className="font-outfit text-lg font-semibold text-neutral-900">
              {fmt(totals.total)}
            </span>
          </div>
        </div>

        {/* Custom Button (e.g., checkout) */}
        {checkoutButton}

        {/* Security Badge */}
        <div className="mt-4 sm:mt-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <img
              src={shieldCheckIcon}
              alt="Shield check"
              className="w-6 h-6"
              aria-hidden="true"
            />
            <span
              className="font-outfit text-base sm:text-lg"
              style={{ color: "#1C1C1C" }}
            >
              Secure Payment
            </span>
          </div>
          <PaymentLogos />
          <div className="text-xs font-outfit font-light text-neutral-500 text-center px-4 leading-relaxed">
            *Interest-free payments plans are offered by third party services
            and subject to individual eligibility
          </div>
        </div>
      </div>
    );
  }
);

CartPanel.displayName = "CartPanel";
