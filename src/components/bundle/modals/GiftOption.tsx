import React, { useCallback } from "react";
import { Product, fmt } from "@/types/bundle";
import { MINI_IMAGE_MAP } from "@/data/products";

interface GiftOptionProps {
  readonly product: Product;
  readonly isSelected: boolean;
  readonly remainingGifts: number;
  readonly onToggleGift: (sku: string) => void;
}

export const GiftOption = React.memo<GiftOptionProps>(({
  product,
  isSelected,
  remainingGifts,
  onToggleGift
}) => {
  const handleToggle = useCallback(() => onToggleGift(product.sku), [onToggleGift, product.sku]);
  const miniImage = MINI_IMAGE_MAP[product.sku];

  return (
    <div className={`border rounded-2xl p-3 sm:p-4 transition-colors ${isSelected ? "border-emerald-300 bg-emerald-50" : "border-neutral-200"}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
          {miniImage ? (
            <img 
              src={miniImage} 
              alt={`${product.title} thumbnail`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center text-[10px] text-neutral-500 text-center px-1">
              {product.title.split(" ").slice(0, 2).join("\n")}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-besley font-medium text-sm sm:text-base leading-tight">
            {product.title}
          </h3>
          <p className="font-outfit text-xs text-neutral-500 my-1 line-clamp-2">
            {product.summary}
          </p>
          <div className="font-outfit text-xs text-neutral-400">
            {fmt(product.msrp)}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs bg-emerald-100 text-emerald-800 rounded-full px-2 py-1">
          Gift-eligible
        </span>
        <button 
          disabled={!isSelected && remainingGifts === 0} 
          onClick={handleToggle} 
          className={`text-sm rounded-xl px-4 py-2 border font-medium transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isSelected ? "border-emerald-600 text-emerald-700 hover:bg-emerald-50 focus:ring-emerald-600" : 
            remainingGifts === 0 ? "border-neutral-200 text-neutral-400 cursor-not-allowed" : 
            "border-brand-orange text-brand-orange hover:bg-brand-orange/10 focus:ring-brand-orange"
          }`} 
          style={{ fontWeight: 500 }} 
          aria-label={isSelected ? `Remove ${product.title} as gift` : `Select ${product.title} as gift`}
        >
          {isSelected ? "Remove" : "Select"}
        </button>
      </div>
    </div>
  );
});

GiftOption.displayName = 'GiftOption';