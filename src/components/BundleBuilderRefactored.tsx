import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { performanceMonitor } from "@/utils/performance";
import { cartPersistence } from "@/utils/cartPersistence";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import shieldCheckIcon from "@/assets/images/shield-check.svg";

// Import types and utilities
import {
  Product,
  CartLine,
  Tier,
  Totals,
  fmt,
  round2,
  CONFIG,
  isCourse,
  isAddon,
  bySort,
  generateStructuredData,
} from "@/types/bundle";

// Import data
import { sampleProducts } from "@/data/products";

// Import components
import { ProductCard } from "@/components/bundle/ProductCard";
import { CartPanel } from "@/components/bundle/CartPanel";
import { PaymentLogos } from "@/components/bundle/PaymentLogos";
import { GiftReminderModal } from "@/components/bundle/modals/GiftReminderModal";
import { GiftModal } from "@/components/bundle/modals/GiftModal";
import { CheckoutModal } from "@/components/bundle/modals/CheckoutModal";
import { OneTimeOfferModal } from "@/components/bundle/modals/OneTimeOfferModal";
import { BreakthroughCallModal } from "@/components/bundle/modals/BreakthroughCallModal";
import { WaitlistModal } from "@/components/bundle/modals/WaitlistModal";
import breakthroughCallImage from "@/assets/images/breakthrough-call.webp";

/**
 * ALS Flash Sale – Bundle Builder - Refactored & Optimized
 * Clean, maintainable component architecture with separated concerns
 */
export default function BundleBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Performance monitoring in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const timer = setTimeout(() => {
        performanceMonitor.logMetrics();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  // State management with proper typing and persistence
  const [query, setQuery] = useState<string>("");
  const [selectedSkus, setSelectedSkus] = useState<readonly string[]>(() => {
    // Load from persisted cart on initial load
    const persistedCart = cartPersistence.loadCart();
    return persistedCart?.selectedSkus || [];
  });
  const [giftSkus, setGiftSkus] = useState<readonly string[]>(() => {
    // Load gift selections from persisted cart
    const persistedCart = cartPersistence.loadCart();
    return persistedCart?.giftSkus || [];
  });
  const [giftModalOpen, setGiftModalOpen] = useState<boolean>(false);
  const [showCheckoutPreview, setShowCheckoutPreview] =
    useState<boolean>(false);
  const [showGiftReminder, setShowGiftReminder] = useState<boolean>(false);
  const [showOneTimeOffer, setShowOneTimeOffer] = useState<boolean>(false);
  const [oto1Passed, setOto1Passed] = useState<boolean>(false);
  const [showOto2, setShowOto2] = useState<boolean>(false);
  const [oneTimeOfferSkus, setOneTimeOfferSkus] = useState<readonly string[]>(
    () => {
      // Load one-time offer selections from persisted cart
      const persistedCart = cartPersistence.loadCart();
      return persistedCart?.oneTimeOfferSkus || [];
    }
  );
  const [waitlistModalOpen, setWaitlistModalOpen] = useState<boolean>(false);
  const [selectedWaitlistProduct, setSelectedWaitlistProduct] =
    useState<Product | null>(null);

  // Persist cart state whenever it changes
  useEffect(() => {
    cartPersistence.saveCart(
      [...selectedSkus],
      [...giftSkus],
      [...oneTimeOfferSkus]
    );
  }, [selectedSkus, giftSkus, oneTimeOfferSkus]);

  // Memoized sorted products (performance optimization)
  const products = useMemo(() => {
    // Avoid recreating array on every render by checking if sampleProducts changed
    return sampleProducts.slice().sort(bySort);
  }, []);

  // Debounced search for better performance
  const debouncedQuery = useDebounce(query, 300);

  // Optimized search with debounced filtering (exclude breakthrough-call from catalog display)
  const catalogFiltered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const visibleProducts = products.filter(
      (p) => p.sku !== "breakthrough-call"
    );
    if (!q) return visibleProducts;
    return visibleProducts.filter((p) => {
      const titleMatch = p.title.toLowerCase().includes(q);
      const summaryMatch = p.summary.toLowerCase().includes(q);
      return titleMatch || summaryMatch;
    });
  }, [products, debouncedQuery]);

  // Memoized product selections for performance
  const selectedProducts = useMemo(
    () => products.filter((p) => selectedSkus.includes(p.sku)),
    [products, selectedSkus]
  );
  const selectedGifts = useMemo(
    () => products.filter((p) => giftSkus.includes(p.sku)),
    [products, giftSkus]
  );
  const courseCount = useMemo(
    () =>
      selectedProducts.filter(
        (p) => isCourse(p) && !oneTimeOfferSkus.includes(p.sku)
      ).length,
    [selectedProducts, oneTimeOfferSkus]
  );
  const addonCount = useMemo(
    () => selectedProducts.filter(isAddon).length,
    [selectedProducts]
  );
  const qualifyingCount = useMemo(
    () => (courseCount > 0 ? courseCount : addonCount),
    [courseCount, addonCount]
  );

  // Tier calculation with proper typing
  const tier = useMemo((): Tier | null => {
    let currentTier: Tier | null = null;
    for (const candidate of CONFIG.tiers) {
      if (qualifyingCount >= candidate.minCourses) {
        currentTier = candidate;
      }
    }
    return currentTier;
  }, [qualifyingCount]);
  const allowedGiftCount = courseCount === 0 ? 0 : tier?.giftCount ?? 0;
  const remainingGifts = Math.max(0, allowedGiftCount - giftSkus.length);

  // Auto-cleanup gifts when tier changes
  useEffect(() => {
    if (giftSkus.length > allowedGiftCount) {
      setGiftSkus((prev) => prev.slice(0, allowedGiftCount));
    }
  }, [allowedGiftCount, giftSkus.length]);
  const giftPool = useMemo(
    () => products.filter((p) => p.giftEligible && isAddon(p)),
    [products]
  );

  // Memoized event handlers for performance (prevents child re-renders)
  const toggleAddPaid = useCallback(
    (sku: string) => {
      if (giftSkus.includes(sku)) return;
      setSelectedSkus((prev) =>
        prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku]
      );
    },
    [giftSkus]
  );
  const toggleGift = useCallback(
    (sku: string) => {
      const isSelected = giftSkus.includes(sku);
      if (isSelected) {
        setGiftSkus((prev) => prev.filter((s) => s !== sku));
        return;
      }
      if (giftSkus.length >= allowedGiftCount) return;
      setSelectedSkus((prev) => prev.filter((s) => s !== sku));
      setGiftSkus((prev) => [...prev, sku]);
    },
    [giftSkus, allowedGiftCount]
  );

  const handleWaitlistClick = useCallback((product: Product) => {
    setSelectedWaitlistProduct(product);
    setWaitlistModalOpen(true);
  }, []);

  const handleWaitlistClose = useCallback(() => {
    setWaitlistModalOpen(false);
    setSelectedWaitlistProduct(null);
  }, []);

  const handleWaitlistSubmit = useCallback(
    (formData: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    }) => {
      // For now, just log the data - you can implement the actual submission later
      console.log("Waitlist form submitted:", formData);
      // Close modal after submission
      handleWaitlistClose();
    },
    [handleWaitlistClose]
  );

  // Optimized cart line calculation with proper typing and one-time offer discounts
  const cartLines = useMemo((): readonly CartLine[] => {
    const lines: CartLine[] = [];
    const scope = tier?.scope ?? "courses_only";
    const percentOff = tier?.percentOff ?? 0;

    // Add paid products
    for (const p of selectedProducts) {
      const eligible = scope === "entire_cart" ? true : isCourse(p);
      const bundleDiscount = eligible ? round2((percentOff / 100) * p.msrp) : 0;

      // Check if this product was added through one-time offer
      const isOneTimeOffer = oneTimeOfferSkus.includes(p.sku);
      let oneTimeOfferDiscount = 0;
      if (isOneTimeOffer) {
        // Special case: breakthrough-call has custom OTO pricing
        if (p.sku === "breakthrough-call") {
          oneTimeOfferDiscount = 403;
        } else {
          // Standard OTO is 50% off
          oneTimeOfferDiscount = round2(0.5 * p.msrp);
        }
      }

      // Apply the higher of the two discounts
      const discount = Math.max(bundleDiscount, oneTimeOfferDiscount);
      const net = round2(p.msrp - discount);

      lines.push({
        sku: p.sku,
        title: p.title,
        msrp: p.msrp,
        discount,
        net,
        type: p.type,
        isGift: false,
        isOTO: isOneTimeOffer,
      });
    }

    // Add gift products
    for (const p of selectedGifts) {
      lines.push({
        sku: p.sku,
        title: `${p.title} (Gift)`,
        msrp: p.msrp,
        discount: p.msrp,
        net: 0,
        type: p.type,
        isGift: true,
      });
    }
    return lines;
  }, [selectedProducts, selectedGifts, tier, oneTimeOfferSkus]);

  // Coupon state
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponApplied, setCouponApplied] = useState<boolean>(false);

  // Validate coupon
  const validateCoupon = useCallback((code: string): { valid: boolean; percentOff: number } => {
    const upperCode = code.toUpperCase();
    if (upperCode === "LILAROSE10") {
      return { valid: true, percentOff: 10 };
    }
    return { valid: false, percentOff: 0 };
  }, []);

  // Apply coupon handler
  const handleApplyCoupon = useCallback(() => {
    const validation = validateCoupon(couponCode);
    if (validation.valid) {
      setCouponApplied(true);
      toast({
        title: "Coupon applied!",
        description: `${validation.percentOff}% discount added to your order.`,
      });
    } else {
      setCouponApplied(false);
      toast({
        title: "Invalid coupon code",
        description: "Please check the code and try again.",
        variant: "destructive",
      });
    }
  }, [couponCode, validateCoupon, toast]);

  // Remove coupon handler
  const handleRemoveCoupon = useCallback(() => {
    setCouponCode("");
    setCouponApplied(false);
  }, []);

  // Optimized totals calculation
  const totals = useMemo((): Totals => {
    const paidLines = cartLines.filter((l) => !l.isGift);
    const subtotal = round2(paidLines.reduce((acc, l) => acc + l.msrp, 0));
    const discount = round2(paidLines.reduce((acc, l) => acc + l.discount, 0));

    // Calculate coupon discount if applied
    let couponDiscount = 0;
    if (couponApplied && couponCode) {
      const validation = validateCoupon(couponCode);
      if (validation.valid) {
        const subtotalAfterBundleDiscount = subtotal - discount;
        couponDiscount = round2((validation.percentOff / 100) * subtotalAfterBundleDiscount);
      }
    }

    const total = round2(subtotal - discount - couponDiscount);
    return {
      subtotal,
      discount,
      couponDiscount,
      total,
    };
  }, [cartLines, couponApplied, couponCode, validateCoupon]);


  // Memoized checkout handler
  const handleProceedToCheckout = useCallback(() => {
    if (allowedGiftCount > 0 && giftSkus.length < allowedGiftCount) {
      setShowGiftReminder(true);
      return;
    }
    setShowCheckoutPreview(true);
  }, [allowedGiftCount, giftSkus.length]);

  // Memoized clear search
  const clearSearch = useCallback(() => setQuery(""), []);

  // Memoized product lists for performance
  const courses = useMemo(
    () => catalogFiltered.filter(isCourse),
    [catalogFiltered]
  );
  const addons = useMemo(
    () => catalogFiltered.filter(isAddon),
    [catalogFiltered]
  );
  const waitlistProducts = useMemo(
    () => catalogFiltered.filter((p) => p.type === "waitlist"),
    [catalogFiltered]
  );

  // Remove item handler with proper typing
  const removeItem = useCallback((sku: string) => {
    setSelectedSkus((prev) => prev.filter((s) => s !== sku));
    setGiftSkus((prev) => prev.filter((s) => s !== sku));
    setOneTimeOfferSkus((prev) => prev.filter((s) => s !== sku)); // Also remove from one-time offer tracking
  }, []);

  // Modal handlers
  const closeGiftModal = useCallback(() => setGiftModalOpen(false), []);
  const closeCheckoutPreview = useCallback(() => {
    setShowCheckoutPreview(false);
    setOto1Passed(false); // Reset OTO1 passed flag when closing checkout preview
  }, []);
  const closeGiftReminder = useCallback(() => setShowGiftReminder(false), []);
  const openGiftModalFromReminder = useCallback(() => {
    setShowGiftReminder(false);
    setGiftModalOpen(true);
  }, []);
  const proceedFromReminder = useCallback(() => {
    setShowGiftReminder(false);
    setShowCheckoutPreview(true);
  }, []);

  // One-time offer modal handlers
  const closeOneTimeOffer = useCallback(() => setShowOneTimeOffer(false), []);
  const showOneTimeOfferModal = useCallback(() => {
    setShowCheckoutPreview(false);
    setShowOneTimeOffer(true);
  }, []);

  const handleReserveSingles = useCallback(() => {
    // Add singles assessment to cart with one-time offer tracking
    setSelectedSkus((prev) => [
      ...prev.filter((sku) => sku !== "ASSESSMENT_COUPLES"),
      "ASSESSMENT_SINGLES",
    ]);
    setOneTimeOfferSkus((prev) => [
      ...prev.filter((sku) => sku !== "ASSESSMENT_COUPLES"),
      "ASSESSMENT_SINGLES",
    ]);
    setShowOneTimeOffer(false);
    // Show checkout summary modal
    setShowCheckoutPreview(true);
  }, []);

  const handleReserveCouples = useCallback(() => {
    // Add couples assessment to cart with one-time offer tracking
    setSelectedSkus((prev) => [
      ...prev.filter((sku) => sku !== "ASSESSMENT_SINGLES"),
      "ASSESSMENT_COUPLES",
    ]);
    setOneTimeOfferSkus((prev) => [
      ...prev.filter((sku) => sku !== "ASSESSMENT_SINGLES"),
      "ASSESSMENT_COUPLES",
    ]);
    setShowOneTimeOffer(false);
    // Show checkout summary modal
    setShowCheckoutPreview(true);
  }, []);

  const handlePassAndPay = useCallback(() => {
    // Close modal, flag that user passed OTO1, and show checkout summary again
    setShowOneTimeOffer(false);
    setOto1Passed(true);
    setShowCheckoutPreview(true);
  }, []);

  // OTO2 handlers
  const showOto2Modal = useCallback(() => {
    setShowCheckoutPreview(false);
    setShowOto2(true);
  }, []);

  const handleAcceptOto2 = useCallback(() => {
    // Add breakthrough call to cart with one-time offer tracking
    setSelectedSkus((prev) => [...prev, "breakthrough-call"]);
    setOneTimeOfferSkus((prev) => [...prev, "breakthrough-call"]);
    setShowOto2(false);

    // Create the breakthrough call line with proper OTO tracking
    const breakthroughCallLine: CartLine = {
      sku: "breakthrough-call",
      title: "50-min Private Consultation",
      msrp: 800,
      discount: 403,
      net: 397,
      type: "consultation",
      isGift: false,
      isOTO: true, // This ensures proper OTO tracking
    };

    // Create updated cart lines with the new OTO item
    const updatedCartLines = [...cartLines, breakthroughCallLine];

    // Calculate updated totals
    const updatedTotals = {
      subtotal: totals.subtotal + 800,
      discount: totals.discount + 403,
      total: totals.total + 397,
    };

    // Navigate to checkout with the properly updated cart
    navigate("/checkout", {
      state: {
        cartLines: updatedCartLines,
        totals: updatedTotals,
        couponCode: couponApplied ? couponCode : undefined,
      },
    });
  }, [navigate, cartLines, totals, couponCode, couponApplied]);

  const handleDeclineOto2 = useCallback(() => {
    setShowOto2(false);
    navigate("/checkout", {
      state: {
        cartLines,
        totals,
        couponCode: couponApplied ? couponCode : undefined,
      },
    });
  }, [navigate, cartLines, totals, couponCode, couponApplied]);

  return (
    <ErrorBoundary>
      {/* SEO Meta Tags */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData(products, totals)),
        }}
      />

      <div className="min-h-screen bg-neutral-50 text-neutral-900">
        <header
          className="sticky top-0 z-50 w-full bg-brand-orange text-white"
          role="banner"
        >
          <div className="max-w-7xl mx-auto px-3 py-2.5 flex items-center justify-center font-bold">
            <div className="text-center text-sm sm:text-xs md:text-sm font-medium">
              <span className="block sm:inline mr-0 sm:mr-2 mb-1 sm:mb-0 text-sm sm:text-xs md:text-sm">
                SELECT 2 COURSES OR PROGRAMS AND GET 10% OFF
              </span>
              <span className="hidden md:inline mx-1.5" aria-hidden="true">
                |
              </span>
              <span className="block sm:inline text-sm sm:text-xs md:text-sm font-medium">
                <span className="block md:inline mt-1 md:mt-0">
                  3+ PROGRAMS FOR 20% OFF + 1 FREE GIFT
                </span>
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-3 py-3 sm:py-5 grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Product Catalog */}
          <section className="xl:col-span-8" aria-label="Product Catalog">
            {/* Search & Filters */}
            <div className="mb-3 sm:mb-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative w-full sm:w-full md:w-80 lg:w-full xl:w-80">
                <label htmlFor="product-search" className="sr-only">
                  Search Courses and Products
                </label>
                <input
                  id="product-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Courses and Products"
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 pl-9 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
                  aria-describedby={query ? "search-results-count" : undefined}
                />
                <div
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  aria-hidden="true"
                >
                  🔍
                </div>
              </div>
              {query && (
                <button
                  onClick={clearSearch}
                  className="text-xs text-neutral-600 underline whitespace-nowrap hover:text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-orange rounded"
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </div>

            {query && (
              <div
                id="search-results-count"
                className="sr-only"
                aria-live="polite"
              >
                Found {catalogFiltered.length} products matching "
                {debouncedQuery}"
              </div>
            )}

            {/* Courses Section */}
            <section className="mb-5 sm:mb-7" aria-labelledby="courses-heading">
              <h2
                id="courses-heading"
                className="text-2xl sm:text-4xl font-besley font-medium mb-1.5"
                style={{ color: "#3A515E" }}
              >
                Courses & Programs
              </h2>
              <p className="font-outfit text-xs sm:text-sm text-neutral-600 mb-5">
                These count towards your bundle discounts
              </p>
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5"
                role="list"
              >
                {courses.map((p) => (
                  <ProductCard
                    key={p.sku}
                    product={p}
                    isSelected={
                      selectedSkus.includes(p.sku) || giftSkus.includes(p.sku)
                    }
                    isGift={giftSkus.includes(p.sku)}
                    onToggle={toggleAddPaid}
                    canAddAsGift={false}
                    onWaitlistClick={handleWaitlistClick}
                  />
                ))}
                {waitlistProducts.map((p) => (
                  <ProductCard
                    key={p.sku}
                    product={p}
                    isSelected={false}
                    isGift={false}
                    onToggle={toggleAddPaid}
                    onWaitlistClick={handleWaitlistClick}
                  />
                ))}
              </div>
            </section>

            {/* Add-ons Section */}
            <section className="mb-5 sm:mb-7" aria-labelledby="addons-heading">
              <h2
                id="addons-heading"
                className="text-2xl sm:text-4xl font-besley font-medium mb-1.5"
                style={{ color: "#3A515E" }}
              >
                Downloads and Add-Ons
              </h2>
              <p className="font-outfit text-xs sm:text-sm text-neutral-600 mb-5">
                Choose as Gifts (free with bundles) or purchase separately
                (discounts apply!)
              </p>
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5"
                role="list"
              >
                {addons.map((p) => (
                  <ProductCard
                    key={p.sku}
                    product={p}
                    isSelected={
                      selectedSkus.includes(p.sku) || giftSkus.includes(p.sku)
                    }
                    isGift={giftSkus.includes(p.sku)}
                    onToggle={toggleAddPaid}
                    onToggleGift={toggleGift}
                    canAddAsGift={p.giftEligible}
                    disabledGift={!p.giftEligible || remainingGifts === 0}
                  />
                ))}
              </div>
            </section>
          </section>

          {/* Cart Panel */}
          <aside className="xl:col-span-4" aria-label="Shopping Cart">
            <CartPanel
              cartLines={cartLines}
              totals={totals}
              courseCount={courseCount}
              onRemove={removeItem}
              showGiftSelection={true}
              giftSkus={giftSkus}
              allowedGiftCount={allowedGiftCount}
              onSelectGifts={() => setGiftModalOpen(true)}
              couponCode={couponCode}
              couponApplied={couponApplied}
              onCouponChange={setCouponCode}
              onApplyCoupon={handleApplyCoupon}
              onRemoveCoupon={handleRemoveCoupon}
              checkoutButton={
                <button
                  onClick={handleProceedToCheckout}
                  disabled={cartLines.filter((l) => !l.isGift).length === 0}
                  className={`w-full font-outfit font-medium text-sm sm:text-base rounded-xl py-3 sm:py-3 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 ${cartLines.filter((l) => !l.isGift).length === 0
                      ? "bg-neutral-300 text-neutral-500 cursor-not-allowed focus:ring-neutral-400"
                      : "bg-brand-orange hover:bg-brand-orange/90 text-white focus:ring-brand-orange"
                    }`}
                  style={{ fontWeight: 500 }}
                  aria-label={`Proceed to checkout. Total: ${fmt(
                    totals.total
                  )}`}
                >
                  Proceed to checkout
                </button>
              }
              showProgress={true}
            />
          </aside>
        </main>

        {/* Modals */}
        <GiftReminderModal
          isOpen={showGiftReminder}
          availableGifts={allowedGiftCount - giftSkus.length}
          onSelectGifts={openGiftModalFromReminder}
          onContinue={proceedFromReminder}
          onClose={closeGiftReminder}
        />

        <GiftModal
          isOpen={giftModalOpen}
          giftPool={giftPool}
          selectedGifts={giftSkus}
          allowedCount={allowedGiftCount}
          remainingGifts={remainingGifts}
          onToggleGift={toggleGift}
          onClose={closeGiftModal}
        />

        <CheckoutModal
          isOpen={showCheckoutPreview}
          cartLines={cartLines}
          totals={totals}
          onClose={closeCheckoutPreview}
          onShowOneTimeOffer={showOneTimeOfferModal}
          oto1Passed={oto1Passed}
          onShowOto2={showOto2Modal}
        />

        <OneTimeOfferModal
          isOpen={showOneTimeOffer}
          cartLines={cartLines}
          totals={totals}
          onClose={closeOneTimeOffer}
          onReserveSingles={handleReserveSingles}
          onReserveCouples={handleReserveCouples}
          onPassAndPay={handlePassAndPay}
        />

        <BreakthroughCallModal
          isOpen={showOto2}
          onAccept={handleAcceptOto2}
          onDecline={handleDeclineOto2}
        />

        <WaitlistModal
          isOpen={waitlistModalOpen}
          product={selectedWaitlistProduct!}
          onClose={handleWaitlistClose}
          onSubmit={handleWaitlistSubmit}
        />
      </div>
    </ErrorBoundary>
  );
}
