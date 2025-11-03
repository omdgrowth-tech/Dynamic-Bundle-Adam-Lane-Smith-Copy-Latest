import React, { useMemo, useEffect } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { CartLine, Totals } from "@/types/bundle";
import { CartPanel } from "@/components/bundle/CartPanel";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

interface CheckoutState {
  cartLines: CartLine[];
  totals: Totals;
  couponCode?: string;
}

const Checkout = () => {
  const location = useLocation();
  const state = location.state as CheckoutState;

  // Redirect to home if no cart data
  if (!state?.cartLines || state.cartLines.length === 0) {
    return <Navigate to="/" replace />;
  }

  const { cartLines, totals, couponCode } = state;

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Calculate course count for the cart panel
  const courseCount = useMemo(() => {
    return cartLines.filter((line) => {
      return line.type === "course" || line.type === "group_coaching";
    }).length;
  }, [cartLines]);

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <h1
          className="text-2xl sm:text-3xl lg:text-5xl font-besley font-medium mb-4 sm:mb-8 text-left px-2"
          style={{ color: "#3A515E" }}
        >
          Checkout
        </h1>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-8">
          {/* Checkout Form - Left Side - Mobile First */}
          <div className="lg:order-1 w-full">
            <CheckoutForm
              cartLines={cartLines}
              totals={totals}
              couponCode={couponCode}
              onBack={handleBack}
            />
          </div>

          {/* Your Bundle Panel - Right Side - Mobile Second */}
          <div className="lg:order-2 w-full">
            <CartPanel
              cartLines={cartLines}
              totals={totals}
              courseCount={courseCount}
              showProgress={false}
              showGiftSelection={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
