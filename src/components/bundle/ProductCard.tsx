import React, { useCallback } from "react";
import { Product, fmt } from "@/types/bundle";
import { useWaitlistStatus } from "@/hooks/useWaitlistStatus";

const formatProductType = (type: Product["type"]): string => {
  if (type === "addon") {
    return "Add-on";
  }
  if (type === "waitlist") {
    return "Course";
  }
  const withSpaces = type.replace(/_/g, " ");
  return withSpaces
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

interface ProductCardProps {
  readonly product: Product;
  readonly isSelected: boolean;
  readonly isGift: boolean;
  readonly onToggle: (sku: string) => void;
  readonly canAddAsGift?: boolean;
  readonly onToggleGift?: (sku: string) => void;
  readonly disabledGift?: boolean;
  readonly giftOnlyMode?: boolean; // New prop for gift modal context
  readonly onWaitlistClick?: (product: Product) => void; // New prop for waitlist action
}

export const ProductCard = React.memo<ProductCardProps>(
  ({
    product,
    isSelected,
    isGift,
    onToggle,
    canAddAsGift,
    onToggleGift,
    disabledGift,
    giftOnlyMode = false,
    onWaitlistClick,
  }) => {
    const { isRegisteredForProduct } = useWaitlistStatus();
    const isAlreadyRegistered =
      (product.type === "waitlist" ||
        product.sku === "WAITLIST_SECURE_PARENTING") &&
      isRegisteredForProduct(product.sku);
    const handleToggle = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.blur();
        onToggle(product.sku);
      },
      [onToggle, product.sku]
    );

    const handleToggleGift = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.blur();
        onToggleGift?.(product.sku);
      },
      [onToggleGift, product.sku]
    );

    const handleWaitlistClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.currentTarget.blur();
        onWaitlistClick?.(product);
      },
      [onWaitlistClick, product]
    );

    return (
      <article
        className={`group overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 flex flex-col ${
          isGift
            ? "border-emerald-300 bg-emerald-50"
            : isSelected
            ? "border-brand-orange/50"
            : "border-neutral-200"
        }`}
        role="listitem"
      >
        <div className="h-28 sm:h-36 bg-gradient-to-br from-neutral-100 to-neutral-200 flex flex-col items-center justify-center text-neutral-500 relative overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={`${product.title} course thumbnail`}
              className="h-full w-full object-cover"
              style={{
                objectFit: "cover",
                objectPosition: "20% 10%",
              }}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
                e.currentTarget.onerror = null;
              }}
            />
          ) : (
            <div className="text-center p-2.5 sm:p-3">
              <div
                className="text-2xl sm:text-3xl mb-1.5 sm:mb-2"
                aria-hidden="true"
              >
                📚
              </div>
              <div className="font-besley font-medium text-xs sm:text-sm text-neutral-700 text-center leading-tight">
                {product.title}
              </div>
            </div>
          )}
          <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2">
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                product.type === "course"
                  ? "bg-purple-100 text-purple-700"
                  : product.type === "group_coaching"
                  ? "bg-purple-100 text-purple-700"
                  : product.type === "waitlist"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-mint-100 text-mint-700"
              }`}
            >
              {formatProductType(product.type)}
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-4 flex flex-col flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1.5 sm:gap-3 mb-2 sm:mb-3">
            <div className="flex-1">
              {product.link && product.link !== "#" ? (
                <a
                  href={product.link}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <h3
                    className="font-besley font-medium text-base sm:text-lg leading-tight"
                    style={{ color: "#3A515E" }}
                  >
                    {product.title}
                  </h3>
                </a>
              ) : (
                <h3
                  className="font-besley font-medium text-base sm:text-lg leading-tight"
                  style={{ color: "#3A515E" }}
                >
                  {product.title}
                </h3>
              )}
            </div>
            <div className="text-left sm:text-right">
              {/* Special pricing display for Attachment Assessment - Parenting */}
              {product.sku === "ASSESSMENT_PARENTING" && !giftOnlyMode ? (
                <div className="flex flex-col items-end gap-1">
                  <div className="font-outfit font-semibold text-sm text-neutral-400 line-through">
                    $1,995
                  </div>
                  <div className="font-outfit font-semibold text-lg text-green-600">
                    $1,197
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`font-outfit font-semibold text-base sm:text-lg ${
                      giftOnlyMode ? "text-neutral-400 line-through" : ""
                    }`}
                    style={{ color: giftOnlyMode ? "#9ca3af" : "#3A515E" }}
                  >
                    {product.type === "waitlist" ||
                    product.sku === "WAITLIST_SECURE_PARENTING"
                      ? "Coming Nov 6"
                      : fmt(product.msrp)}
                  </div>
                  {giftOnlyMode && (
                    <div className="font-outfit text-base font-semibold text-emerald-600">
                      FREE
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mb-3 sm:mb-4 flex-1">
            <p className="font-outfit text-xs sm:text-sm leading-relaxed text-neutral-600">
              {product.summary}
            </p>
            {product.link && product.link !== "#" && (
              <a
                href={product.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 font-outfit text-xs sm:text-sm text-brand-blue-gray underline hover:text-brand-orange transition-colors"
              >
                Learn more
              </a>
            )}
          </div>

          {/* Gift-eligible badge for add-ons - positioned above buttons */}
          {product.giftEligible && product.type === "addon" && (
            <div className="mb-3">
              <span className="font-outfit text-xs bg-mint-50 text-mint-700 border border-mint-100 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 font-medium">
                Gift-eligible
              </span>
            </div>
          )}

          <div
            className={`${
              product.type === "addon"
                ? "block"
                : "flex flex-row justify-between gap-2 sm:gap-3 mt-auto items-end"
            }`}
          >
            {product.type !== "addon" && (
              <div className="flex flex-wrap items-center gap-1.5">
                {product.countsTowardThreshold && (
                  <span className="font-outfit text-xs bg-mint-50 text-mint-700 border border-mint-100 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 font-medium">
                    Counts towards bundle
                  </span>
                )}
              </div>
            )}

            <div
              className={`flex items-center ${
                product.type === "addon" ? "w-full gap-2" : "gap-1.5 sm:gap-2"
              }`}
            >
              {/* Waitlist products show only waitlist button */}
              {product.type === "waitlist" ||
              product.sku === "WAITLIST_SECURE_PARENTING" ? (
                <button
                  onClick={
                    isAlreadyRegistered ? undefined : handleWaitlistClick
                  }
                  disabled={isAlreadyRegistered}
                  className={`w-full font-outfit font-medium text-sm rounded-lg px-4 py-3.5 border transition-colors flex items-center justify-center gap-1.5 touch-manipulation focus:outline-none ${
                    isAlreadyRegistered
                      ? "border-green-400 text-green-700 bg-green-50 cursor-not-allowed"
                      : "border-brand-orange text-white bg-brand-orange hover:bg-brand-orange/90 focus:ring-brand-orange"
                  }`}
                  style={{ fontWeight: 500 }}
                  aria-label={
                    isAlreadyRegistered
                      ? `Already joined waitlist for ${product.title}`
                      : `Join waitlist for ${product.title}`
                  }
                >
                  {isAlreadyRegistered ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Already Registered
                    </>
                  ) : (
                    "Get On Waitlist"
                  )}
                </button>
              ) : (
                <>
                  {canAddAsGift && onToggleGift && (
                    <button
                      onClick={handleToggleGift}
                      disabled={disabledGift && !isGift}
                      className={`flex items-center justify-center gap-1.5 text-sm rounded-lg px-4 py-3.5 border font-medium transition-colors touch-manipulation focus:outline-none ${
                        product.type === "addon" ? "flex-1" : ""
                      } ${
                        isGift
                          ? "bg-neutral-400 text-white border-neutral-400 focus:ring-neutral-400"
                          : disabledGift
                          ? "border-neutral-200 text-neutral-400 bg-neutral-50 cursor-not-allowed"
                          : "border-brand-blue-gray text-brand-blue-gray bg-white hover:bg-neutral-50 focus:ring-brand-blue-gray"
                      }`}
                      style={{ fontWeight: 500 }}
                      aria-label={
                        isGift
                          ? `Remove ${product.title} as gift`
                          : `Add ${product.title} as gift`
                      }
                    >
                      <span className="font-outfit font-medium">
                        {isGift ? "Added gift" : "Add as gift"}
                      </span>
                    </button>
                  )}
                  {!giftOnlyMode && (
                    <button
                      onClick={handleToggle}
                      disabled={isGift}
                      className={`font-outfit font-medium text-sm rounded-lg px-4 py-3.5 border transition-colors flex items-center justify-center gap-1.5 touch-manipulation focus:outline-none ${
                        product.type === "addon" ? "flex-1" : ""
                      } ${
                        isSelected && !isGift
                          ? "border-brand-orange text-brand-orange bg-brand-orange/20 focus:ring-brand-orange"
                          : isGift
                          ? "border-neutral-200 text-neutral-400 bg-neutral-50 cursor-not-allowed"
                          : "border-brand-orange text-white bg-brand-orange hover:bg-brand-orange/90 focus:ring-brand-orange"
                      }`}
                      style={{ fontWeight: 500 }}
                      aria-label={
                        isSelected && !isGift
                          ? `Remove ${product.title} from bundle`
                          : isGift
                          ? `${product.title} selected as gift`
                          : `Add ${product.title} to bundle`
                      }
                    >
                      {isSelected && !isGift ? (
                        <>Added to Bundle</>
                      ) : isGift ? (
                        <>Gift Selected</>
                      ) : (
                        <>+ Add to Bundle</>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }
);

ProductCard.displayName = "ProductCard";
