import React from "react";
import { CartLine, fmt } from "@/types/bundle";

interface CheckoutItemProps {
  readonly line: CartLine;
}

export const CheckoutItem = React.memo<CheckoutItemProps>(({ line }) => (
  <div
    className="flex items-start justify-between text-sm border-b border-neutral-100 py-3 gap-3"
    role="listitem"
  >
    <div className="flex-1 min-w-0">
      <div className="font-medium leading-tight truncate">{line.title}</div>
      <div className="text-xs text-neutral-500 mt-1">
        {line.isGift
          ? "Gift"
          : line.type === "group_coaching"
          ? "Coaching Program"
          : line.type === "assessment"
          ? "Assessment"
          : line.type === "course"
          ? "Course"
          : "Add-on"}
      </div>
    </div>
    {!line.isGift ? (
      <div className="text-right flex-shrink-0">
        <div className="line-through text-neutral-400 text-xs">
          {fmt(line.msrp)}
        </div>
        {line.discount > 0 && (
          <div className="text-neutral-600 text-xs">- {fmt(line.discount)}</div>
        )}
        <div className="font-semibold text-sm">{fmt(line.net)}</div>
      </div>
    ) : (
      <div className="text-emerald-700 font-semibold text-sm flex-shrink-0">
        FREE
      </div>
    )}
  </div>
));

CheckoutItem.displayName = "CheckoutItem";
