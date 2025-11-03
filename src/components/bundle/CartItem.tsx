import React, { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { CartLine, fmt } from "@/types/bundle";
import { MINI_IMAGE_MAP } from "@/data/products";

interface CartItemProps {
  readonly line: CartLine;
  readonly onRemove: (sku: string) => void;
}

export const CartItem = React.memo<CartItemProps>(({ line, onRemove }) => {
  const location = useLocation();
  const isCheckoutPage = location.pathname === "/checkout";
  const handleRemove = useCallback(
    () => onRemove(line.sku),
    [onRemove, line.sku]
  );
  const miniImage = MINI_IMAGE_MAP[line.sku];

  return (
    <div
      className="bg-white border border-neutral-200 rounded-2xl p-3 sm:p-4 hover:shadow-sm transition-shadow"
      role="listitem"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
          {miniImage ? (
            <img
              src={miniImage}
              alt={`${line.title} thumbnail`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
                e.currentTarget.onerror = null;
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
              <span className="text-base sm:text-lg" aria-hidden="true">
                {line.type === "course"
                  ? "📚"
                  : line.type === "group_coaching"
                  ? "👥"
                  : "🎁"}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-outfit font-medium text-sm sm:text-base text-neutral-900 leading-tight mb-1 truncate">
            {line.title}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
            {!line.isGift ? (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span
                  className="text-red-500 line-through font-outfit"
                  aria-label={`Original price ${fmt(line.msrp)}`}
                >
                  {fmt(line.msrp)}
                </span>
                <span
                  className="font-outfit font-medium text-emerald-500"
                  aria-label={`Discounted price ${fmt(line.net)}`}
                >
                  {fmt(line.net)}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span
                  className="text-red-500 line-through font-outfit"
                  aria-label={`Original price ${fmt(line.msrp)}`}
                >
                  {fmt(line.msrp)}
                </span>
                <span className="font-outfit font-medium text-emerald-600">
                  Free
                </span>
              </div>
            )}
          </div>
        </div>
        {!isCheckoutPage && (
          <button
            onClick={handleRemove}
            className="text-neutral-400 hover:text-neutral-600 p-1 touch-manipulation focus:outline-none focus:ring-2 focus:ring-brand-orange rounded"
            aria-label={`Remove ${line.title} from cart`}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
});

CartItem.displayName = "CartItem";
