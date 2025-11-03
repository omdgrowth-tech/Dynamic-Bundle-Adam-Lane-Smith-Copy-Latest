import React, { useState, useEffect, useRef } from "react";
import { contactPersistence } from "@/utils/cartPersistence";
import { getAttributionData } from "@/utils/utm-tracking";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRateLimit } from "@/hooks/useRateLimit";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { CartLine, Totals } from "@/types/bundle";
import {
  COUNTRIES,
  getStatesForCountry,
  requiresState,
  requiresZip,
  getStateLabel,
  getZipLabel,
} from "@/data/countries";
import {
  getAvailablePaymentMethods,
  getStripePaymentMethodOrder,
  getExternalPaymentMethods,
} from "@/utils/paymentMethods";

// Declare PayPal SDK types
declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: () => Promise<string>;
        onApprove: (data: { orderID: string }) => Promise<void>;
        onError?: (err: unknown) => void;
        style?: {
          layout?: string;
          color?: string;
          shape?: string;
          label?: string;
        };
      }) => {
        render: (selector: string) => Promise<void>;
      };
    };
  }
}
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

// Dynamic schema that adjusts based on country selection
const createCheckoutSchema = (selectedCountry?: string) => {
  const requiresStateField = selectedCountry
    ? requiresState(selectedCountry)
    : true;
  const requiresZipField = selectedCountry
    ? requiresZip(selectedCountry)
    : true;
  return z.object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .max(100, "First name must be less than 100 characters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .max(100, "Last name must be less than 100 characters"),
    email: z
      .string()
      .email("Please enter a valid email address")
      .max(255, "Email must be less than 255 characters"),
    phone: z
      .string()
      .min(1, "Phone number is required")
      .max(50, "Phone number must be less than 50 characters"),
    country: z
      .string()
      .min(1, "Please select your country")
      .max(100, "Country must be less than 100 characters"),
    city: z
      .string()
      .min(1, "City is required")
      .max(100, "City must be less than 100 characters"),
    streetAddress: z
      .string()
      .max(500, "Street address must be less than 500 characters")
      .optional(),
    state: requiresStateField
      ? z
        .string()
        .min(1, `${getStateLabel(selectedCountry || "")} is required`)
        .max(
          100,
          `${getStateLabel(
            selectedCountry || ""
          )} must be less than 100 characters`
        )
      : z.string().optional(),
    zipCode: requiresZipField
      ? z
        .string()
        .min(1, `${getZipLabel(selectedCountry || "")} is required`)
        .max(
          20,
          `${getZipLabel(
            selectedCountry || ""
          )} must be less than 20 characters`
        )
      : z.string().optional(),
    termsAccepted: z
      .boolean()
      .refine((val) => val, "You must accept the terms and conditions"),
    smsConsent: z.boolean().optional(),
    newsletter: z.boolean().optional(),
    ageConfirmation: z
      .boolean()
      .refine((val) => val, "You must confirm you are at least 18 years old"),
  });
};
type CheckoutFormData = z.infer<ReturnType<typeof createCheckoutSchema>>;
interface CheckoutFormProps {
  cartLines: readonly CartLine[];
  totals: Totals;
  couponCode?: string;
  onBack: () => void;
}
const PaymentInner: React.FC<{
  orderId: string;
  country: string;
  currency?: string;
  onBack: () => void;
  paymentRateLimit: ReturnType<typeof useRateLimit>;
  toast: ReturnType<typeof useToast>["toast"];
  onPaymentSubmit: React.MutableRefObject<(() => Promise<void>) | null>;
}> = ({
  orderId,
  country,
  currency = "usd",
  onBack,
  paymentRateLimit,
  toast,
  onPaymentSubmit,
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);

    // Get available payment methods for this location
    const availablePaymentMethods = React.useMemo(() => {
      return getAvailablePaymentMethods(country, currency);
    }, [country, currency]);
    const stripePaymentMethods = React.useMemo(() => {
      return getStripePaymentMethodOrder(country, currency);
    }, [country, currency]);
    const onSubmit = React.useCallback(async () => {
      if (!stripe || !elements) {
        toast({
          title: "Payment Setup Error",
          description: "Payment system is not ready. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Check rate limit before proceeding
      if (!paymentRateLimit.canProceed) {
        const remainingTime = paymentRateLimit.getRemainingTime();
        const minutes = Math.ceil(remainingTime / (60 * 1000));
        toast({
          title: "Too Many Attempts",
          description: `Please wait ${minutes} minutes before trying again.`,
          variant: "destructive",
        });
        return;
      }
      setIsLoading(true);

      // Record the payment attempt
      const canContinue = paymentRateLimit.recordAttempt();
      if (!canContinue) {
        setIsLoading(false);
        toast({
          title: "Payment Attempt Limit",
          description: "Please wait before trying again.",
          variant: "destructive",
        });
        return;
      }
      try {
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/checkout/success?order_id=${orderId}`,
          },
        });
        if (error) {
          console.error("Payment error:", error);
          toast({
            title: "Payment Error",
            description:
              error.message || "Unable to process payment. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Payment error:", error);
        toast({
          title: "Payment Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, [stripe, elements, paymentRateLimit, toast, orderId]);

    // Expose the onSubmit function to parent
    React.useEffect(() => {
      onPaymentSubmit.current = onSubmit;
    }, [onSubmit, onPaymentSubmit]);
    return (
      <div className="mb-6">
        {/* Payment Methods Info */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Available payment methods for {country}:
          </div>
          <div className="flex flex-wrap gap-2">
            {availablePaymentMethods.map((method) => (
              <div
                key={method.id}
                className="inline-flex items-center px-3 py-1 bg-emerald-50 text-xs font-medium text-emerald-700 rounded-full border border-emerald-200"
                title={method.description}
              >
                {method.name}
              </div>
            ))}
          </div>
          {availablePaymentMethods.length === 0 && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              No payment methods available for your location. Please contact
              support.
            </div>
          )}
        </div>

        {/* Stripe Payment Element */}
        {stripePaymentMethods.length > 0 && (
          <div className="border rounded-lg p-4">
            <PaymentElement
              options={{
                paymentMethodOrder: stripePaymentMethods,
                terms: {
                  card: "never",
                  ideal: "never",
                  sepaDebit: "never",
                  sofort: "never",
                  bancontact: "never",
                },
              }}
              onReady={() =>
                console.log(
                  "PaymentElement is ready with methods:",
                  stripePaymentMethods
                )
              }
              onLoaderStart={() => console.log("PaymentElement loader started")}
              onLoadError={(error) =>
                console.error("PaymentElement load error:", error)
              }
            />
          </div>
        )}

        {/* External Payment Methods (like PayPal) */}
        {getExternalPaymentMethods(country, currency).length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Other payment options:
            </div>
            <div className="space-y-2">
              {getExternalPaymentMethods(country, currency).map((method) => (
                <button
                  key={method.id}
                  className="w-full p-3 border border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-left group"
                  onClick={() => {
                    toast({
                      title: "Coming Soon",
                      description: `${method.name} integration will be available soon!`,
                    });
                  }}
                >
                  <div className="font-medium group-hover:text-orange-600">
                    {method.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {method.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
const PaymentSection: React.FC<{
  orderId: string;
  clientSecret: string;
  country: string;
  currency?: string;
  onBack: () => void;
  paymentRateLimit: ReturnType<typeof useRateLimit>;
  toast: ReturnType<typeof useToast>["toast"];
  onPaymentSubmit: React.MutableRefObject<(() => Promise<void>) | null>;
}> = ({
  orderId,
  clientSecret,
  country,
  currency = "usd",
  onBack,
  paymentRateLimit,
  toast,
  onPaymentSubmit,
}) => {
    return (
      <Elements
        key={clientSecret} // Force remount when clientSecret changes
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#ff8a00",
              borderRadius: "8px",
            },
          },
        }}
      >
        <PaymentInner
          orderId={orderId}
          country={country}
          currency={currency}
          onBack={onBack}
          paymentRateLimit={paymentRateLimit}
          toast={toast}
          onPaymentSubmit={onPaymentSubmit}
        />
      </Elements>
    );
  };
const PaymentForm = ({ cartLines, totals, couponCode, onBack }: CheckoutFormProps) => {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [paymentProvider, setPaymentProvider] = useState<"stripe" | "paypal">(
    "stripe"
  );
  const { toast } = useToast();
  const paymentSubmitRef = React.useRef<(() => Promise<void>) | null>(null);
  const [isSettingUpStripe, setIsSettingUpStripe] = useState(false);

  // Rate limiting for payment attempts
  const paymentRateLimit = useRateLimit("payment-attempts", {
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000,
    cooldownMs: 10 * 60 * 1000,
  });
  const [selectedCountry, setSelectedCountry] = useState("");
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(createCheckoutSchema(selectedCountry)),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: (() => {
      // Load persisted contact info if available
      const persistedContact = contactPersistence.loadContact();
      return {
        firstName: persistedContact?.firstName || "",
        lastName: persistedContact?.lastName || "",
        email: persistedContact?.email || "",
        phone: persistedContact?.phone || "",
        country: persistedContact?.country || "",
        city: persistedContact?.city || "",
        streetAddress: persistedContact?.streetAddress || "",
        state: persistedContact?.state || "",
        zipCode: persistedContact?.zipCode || "",
        termsAccepted: false,
        newsletter: persistedContact?.newsletter || false,
        smsConsent: persistedContact?.smsConsent || false,
        ageConfirmation: false,
      };
    })(),
  });

  // Update schema when country changes
  React.useEffect(() => {
    const currentCountry = form.watch("country");
    if (currentCountry !== selectedCountry) {
      setSelectedCountry(currentCountry);
      // Clear state and zip if new country doesn't require them
      if (!requiresState(currentCountry)) {
        form.setValue("state", "");
      }
      if (!requiresZip(currentCountry)) {
        form.setValue("zipCode", "");
      }
    }
  }, [form.watch("country")]);

  // Persist contact info when form values change
  useEffect(() => {
    const subscription = form.watch((data) => {
      // Only save if we have meaningful data
      if (data.firstName || data.lastName || data.email) {
        contactPersistence.saveContact({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          country: data.country,
          city: data.city,
          streetAddress: data.streetAddress,
          state: data.state,
          zipCode: data.zipCode,
          newsletter: data.newsletter,
          smsConsent: data.smsConsent,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Removed automatic PaymentIntent creation; it is triggered manually via button
  // handleStripeSetup is defined below, after createOrderAndPaymentIntent

  // Update payment intent when form data changes (optional - for updating shipping address)
  // This is commented out because Stripe doesn't require all details upfront
  // React.useEffect(() => {
  //   ... monitoring form changes ...
  // }, [watchedValues, clientSecret, form]);

  // Remove the old getPaymentMethodsForCountry function since we now use the new system
  // const getPaymentMethodsForCountry = (country: string) => {
  //   const paymentMethods = ["card"];
  //   if (country === "US") {
  //     paymentMethods.push("klarna", "affirm", "cashapp");
  //   }
  //   return paymentMethods;
  // };

  const createOrderAndPaymentIntent = React.useCallback(
    async (data: CheckoutFormData) => {
      console.log("Creating order and payment intent...");
      try {
        // Get attribution data for tracking
        const attributionData = getAttributionData();
        console.log("Attribution data:", attributionData);

        // Send only actual customer input; backend validates required fields
        const customerData = {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          country: data.country,
          city: data.city,
          streetAddress: data.streetAddress,
          state: data.state,
          zipCode: data.zipCode,
          smsConsent: !!data.smsConsent,
          newsletter: !!data.newsletter,
        };
        const { data: response, error } = await supabase.functions.invoke(
          "create-order-payment-secure",
          {
            body: {
              cartLines,
              totals,
              attribution: attributionData,
              customer: customerData,
              couponCode: couponCode || undefined,
            },
          }
        );
        console.log("Edge function response:", {
          response,
          error,
        });
        if (error) {
          throw new Error(error.message || "Failed to create order");
        }
        if (!response?.success) {
          throw new Error(response?.error || "Failed to create order");
        }

        // Debug: verify Stripe account/mode alignment
        // These logs help diagnose 401s from Elements when keys are mismatched
        console.log(
          "[Stripe Debug] publishableKey",
          "pk_test_51RCHvTKmAWN4VJPTdCp9llrYvHmg4M4K8CUoxiNLDKgOg97v2ZtgGZgkDBZPpSocCBf2dxP2o2FLhVLwE1Jqhzkd00pR5y47GZ"
        );
        console.log(
          "[Stripe Debug] server.stripeAccountId",
          response.stripeAccountId
        );
        console.log("[Stripe Debug] paymentIntent.livemode", response.livemode);
        console.log(
          "[Stripe Debug] clientSecret received:",
          !!response.clientSecret
        );
        setClientSecret(response.clientSecret);
        setOrderId(response.orderId);
        console.log("Payment setup complete:", {
          orderId: response.orderId,
          hasClientSecret: !!response.clientSecret,
        });
      } catch (error) {
        console.error("Order creation error:", error);
        toast({
          title: "Order Creation Error",
          description:
            error instanceof Error
              ? error.message
              : "Unable to create order. Please try again.",
          variant: "destructive",
        });
      }
    },
    [cartLines, totals, toast]
  );

  const handleStripeSetup = React.useCallback(async () => {
    const data = form.getValues();
    const needsState = data.country ? requiresState(data.country) : true;
    const needsZip = data.country ? requiresZip(data.country) : true;
    const hasRequired = Boolean(
      data.firstName &&
      data.firstName.trim() &&
      data.lastName &&
      data.lastName.trim() &&
      data.email &&
      data.email.trim() &&
      data.country &&
      data.country.trim() &&
      data.phone &&
      data.phone.trim() &&
      data.city &&
      data.city.trim() &&
      (!needsState || (data.state && data.state.trim())) &&
      (!needsZip || (data.zipCode && data.zipCode.trim()))
    );
    if (!hasRequired) {
      toast({
        title: "Missing information",
        description:
          "Please complete all required fields before continuing to payment.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSettingUpStripe(true);
      await createOrderAndPaymentIntent(data);
    } finally {
      setIsSettingUpStripe(false);
    }
  }, [form, toast, createOrderAndPaymentIntent]);
  const paypalButtonsRef = useRef<HTMLDivElement>(null);
  const paypalButtonsRendered = useRef(false);
  const [isPayPalLoading, setIsPayPalLoading] = useState(false);

  // Initialize PayPal buttons when provider is selected
  useEffect(() => {
    // Only render once when switching to PayPal
    if (
      paymentProvider === "paypal" &&
      paypalButtonsRef.current &&
      window.paypal &&
      !paypalButtonsRendered.current
    ) {
      console.log("Rendering PayPal buttons...");
      paypalButtonsRendered.current = true;
      window.paypal
        .Buttons({
          createOrder: async () => {
            console.log("Creating PayPal order...");
            setIsPayPalLoading(true);
            try {
              const formData = form.getValues();
              const attributionData = getAttributionData();
              const { data: response, error } = await supabase.functions.invoke(
                "create-paypal-order-secure",
                {
                  body: {
                    cartLines,
                    totals,
                    attribution: attributionData,
                    couponCode: couponCode || undefined,
                    customer: {
                      email: formData.email,
                      firstName: formData.firstName,
                      lastName: formData.lastName,
                      phone: formData.phone,
                      country: formData.country,
                      city: formData.city,
                      streetAddress: formData.streetAddress || "",
                      state: formData.state,
                      zipCode: formData.zipCode,
                      smsConsent: !!formData.smsConsent,
                      newsletter: !!formData.newsletter,
                    },
                  },
                }
              );
              console.log("PayPal order response:", {
                response,
                error,
              });
              if (error) {
                throw new Error(
                  error.message || "Failed to create PayPal order"
                );
              }
              if (!response?.success || !response?.paypalOrderId) {
                throw new Error(
                  response?.error || "Failed to create PayPal order"
                );
              }
              return response.paypalOrderId;
            } catch (error) {
              console.error("PayPal order creation error:", error);
              toast({
                title: "PayPal Order Error",
                description:
                  error instanceof Error
                    ? error.message
                    : "Unable to create PayPal order. Please try again.",
                variant: "destructive",
              });
              throw error;
            } finally {
              setIsPayPalLoading(false);
            }
          },
          onApprove: async (data) => {
            console.log("PayPal payment approved, capturing...", data);
            setIsPayPalLoading(true);
            try {
              const { data: response, error } = await supabase.functions.invoke(
                "capture-paypal-payment",
                {
                  body: {
                    paypalOrderId: data.orderID,
                  },
                }
              );
              console.log("PayPal capture response:", {
                response,
                error,
              });
              if (error) {
                throw new Error(error.message || "Failed to capture payment");
              }
              if (!response?.success) {
                throw new Error(response?.error || "Failed to capture payment");
              }

              // Redirect to success page
              window.location.href = `/checkout/success?order_id=${response.orderId}&provider=paypal`;
            } catch (error) {
              console.error("PayPal capture error:", error);
              toast({
                title: "Payment Capture Error",
                description:
                  error instanceof Error
                    ? error.message
                    : "Unable to complete payment. Please contact support.",
                variant: "destructive",
              });
            } finally {
              setIsPayPalLoading(false);
            }
          },
          onError: (err) => {
            console.error("PayPal button error:", err);
            setIsPayPalLoading(false);
            toast({
              title: "PayPal Error",
              description:
                "An error occurred with PayPal. Please try again or use another payment method.",
              variant: "destructive",
            });
          },
          style: {
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "paypal",
          },
        })
        .render("#paypal-button-container");
    }

    // Reset the rendered flag when switching away from PayPal
    if (paymentProvider !== "paypal") {
      paypalButtonsRendered.current = false;
    }
  }, [paymentProvider]);
  return (
    <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-3 sm:p-6 w-full">
      <Form {...form}>
        <form className="space-y-4 sm:space-y-6">
          {/* Billing Details */}
          <div>
            <h3
              className="text-base sm:text-lg font-besley font-semibold mb-3 sm:mb-4"
              style={{
                color: "#3A515E",
              }}
            >
              Confirm Your Billing Details
            </h3>

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-outfit">First name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-outfit">Last name *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-outfit">Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-outfit">
                      Phone number *
                    </FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Country */}
            <div className="mb-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-outfit">
                      Country / Region *
                    </FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCountry(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border border-neutral-200 shadow-lg max-h-60 overflow-y-auto z-50">
                        {COUNTRIES.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* City */}
            <div className="mb-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-outfit">Town / City *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Street Address */}
            <div className="mb-4">
              <FormField
                control={form.control}
                name="streetAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-outfit">
                      Street address
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* State and ZIP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {requiresState(selectedCountry) && (
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => {
                    const states = getStatesForCountry(selectedCountry);
                    const stateLabel = getStateLabel(selectedCountry);
                    return (
                      <FormItem>
                        <FormLabel className="font-outfit">
                          {stateLabel} *
                        </FormLabel>
                        {states.length > 0 ? (
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={`Select ${stateLabel.toLowerCase()}`}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border border-neutral-200 shadow-lg max-h-60 overflow-y-auto z-50">
                              {states.map((state) => (
                                <SelectItem key={state.code} value={state.code}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <FormControl>
                            <Input
                              {...field}
                              placeholder={`Enter ${stateLabel.toLowerCase()}`}
                            />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}

              {requiresZip(selectedCountry) && (
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => {
                    const zipLabel = getZipLabel(selectedCountry);
                    return (
                      <FormItem>
                        <FormLabel className="font-outfit">
                          {zipLabel} *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={`Enter ${zipLabel.toLowerCase()}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Payment Method</h3>

            {/* Payment Provider Selection */}
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentProvider("stripe")}
                className={`flex-1 p-3 border-2 rounded-lg transition-colors ${paymentProvider === "stripe"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-300 hover:border-gray-400"
                  }`}
              >
                <div className="font-medium">Credit/Debit Card</div>
                <div className="text-sm text-gray-600">
                  Visa, Mastercard, Amex
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPaymentProvider("paypal")}
                className={`flex-1 p-3 border-2 rounded-lg transition-colors ${paymentProvider === "paypal"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-300 hover:border-gray-400"
                  }`}
              >
                <div className="font-medium">PayPal</div>
                <div className="text-sm text-gray-600">Pay with PayPal</div>
              </button>
            </div>

            {/* Stripe Payment Section */}
            {paymentProvider === "stripe" && (
              <>
                {!clientSecret ? (
                  <div className="border rounded-lg p-4 text-center space-y-3">
                    {!(
                      form.watch("firstName") &&
                      form.watch("lastName") &&
                      form.watch("email") &&
                      form.watch("country") &&
                      form.watch("phone") &&
                      form.watch("city") &&
                      (!requiresState(form.watch("country")) ||
                        form.watch("state")) &&
                      (!requiresZip(form.watch("country")) ||
                        form.watch("zipCode"))
                    ) ? (
                      <p className="text-sm text-gray-600">
                        Complete all required fields to continue to payment.
                      </p>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleStripeSetup}
                        disabled={isSettingUpStripe}
                        className="w-full bg-orange-600 text-white font-semibold py-3 text-sm sm:text-base disabled:opacity-50"
                        size="lg"
                      >
                        {isSettingUpStripe
                          ? "Preparing payment..."
                          : "Continue to Payment"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <PaymentSection
                    orderId={orderId}
                    clientSecret={clientSecret}
                    country={form.watch("country")}
                    currency="usd"
                    onBack={onBack}
                    paymentRateLimit={paymentRateLimit}
                    toast={toast}
                    onPaymentSubmit={paymentSubmitRef}
                  />
                )}
              </>
            )}

            {/* PayPal Payment Section */}
            {paymentProvider === "paypal" && (
              <div className="border rounded-lg p-4">
                {!window.paypal ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600">Loading PayPal...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      Click the PayPal button below to be redirected and
                      complete your payment securely on PayPal.
                    </p>
                    <div
                      ref={paypalButtonsRef}
                      id="paypal-button-container"
                    ></div>
                    {isPayPalLoading && (
                      <div className="mt-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Processing...</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-4">
            <p
              className="text-sm font-outfit-light"
              style={{
                color: "#808080",
              }}
            >
              Your personal data will be used to process your order, support
              your experience throughout this website, and for other purposes
              described in our{" "}
              <a
                href="https://adamlanesmith.com/privacy-policy/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 underline cursor-pointer hover:text-orange-600"
              >
                privacy policy
              </a>
              .
            </p>

            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel
                      className="text-sm font-outfit"
                      style={{
                        color: "#808080",
                      }}
                    >
                      I have read and agree to the website{" "}
                      <a
                        href="https://adamlanesmith.com/terms-conditions/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-500 underline cursor-pointer hover:text-orange-600"
                      >
                        terms and conditions
                      </a>{" "}
                      and{" "}
                      <a
                        href="https://adamlanesmith.com/privacy-policy/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-500 underline cursor-pointer hover:text-orange-600"
                      >
                        privacy policy
                      </a>
                      *
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="smsConsent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel
                      className="text-sm font-outfit"
                      style={{
                        color: "#808080",
                      }}
                    >
                      I agree to receive service-related text messages{" "}
                      <span
                        className="text-xs block"
                        style={{
                          color: "#808080",
                        }}
                      >
                        (message & data rates may apply, text "stop" to opt-out
                        at any time)
                      </span>
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newsletter"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel
                      className="text-sm font-outfit"
                      style={{
                        color: "#808080",
                      }}
                    >
                      Sign me up for the Newsletter to receive special offers &
                      promotions
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ageConfirmation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel
                      className="text-sm font-outfit"
                      style={{
                        color: "#808080",
                      }}
                    >
                      I confirm I'm at least 18 years old at the time of
                      purchase*
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Action Buttons - Only show for Stripe */}
          <div className="pt-4 sm:pt-6 space-y-3">
            {paymentProvider === "stripe" && (
              <Button
                type="button"
                onClick={async () => {
                  const isValid = await form.trigger();
                  if (!isValid) {
                    toast({
                      title: "Please complete all required fields",
                      description:
                        "Make sure all required information is filled in correctly.",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (paymentSubmitRef.current) {
                    await paymentSubmitRef.current();
                  } else {
                    toast({
                      title: "Payment Setup Error",
                      description:
                        "Payment system is not ready. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={
                  !clientSecret ||
                  !form.formState.isValid ||
                  form.formState.isSubmitting ||
                  !form.watch("termsAccepted") ||
                  !form.watch("ageConfirmation") ||
                  paymentRateLimit.isBlocked
                }
                className="w-full bg-orange-600 text-white font-semibold py-3 text-sm sm:text-base disabled:opacity-50"
                size="lg"
              >
                {paymentRateLimit.isBlocked
                  ? `Wait ${Math.ceil(
                    paymentRateLimit.getRemainingTime() / (60 * 1000)
                  )} min`
                  : form.formState.isSubmitting
                    ? "Processing..."
                    : "PLACE ORDER"}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="w-full"
            >
              Back to Bundle
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
export const CheckoutForm: React.FC<CheckoutFormProps> = (props) => {
  return <PaymentForm {...props} />;
};
