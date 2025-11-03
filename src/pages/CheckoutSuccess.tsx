import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Mail, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const provider = searchParams.get("provider");
  const token = searchParams.get("token"); // PayPal token
  const [loading, setLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    "paid" | "pending" | "failed" | null
  >(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 2000; // 2 seconds between retries

    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const confirm = async (retryCount = 0): Promise<void> => {
      // Handle PayPal payment capture
      if (provider === "paypal" && token) {
        try {
          const { data, error } = await supabase.functions.invoke(
            "capture-paypal-payment",
            {
              body: {
                paypalOrderId: token,
              },
            }
          );

          if (error || !data?.success) {
            toast.error(
              "We could not confirm your PayPal payment. Please contact support."
            );
            setPaymentStatus("failed");
            setLoading(false);
          } else {
            const status = data.status ?? "paid";

            // Retry if pending and we haven't exceeded max retries
            if (status === "pending" && retryCount < MAX_RETRIES) {
              console.log(
                `Payment pending, retrying... (${
                  retryCount + 1
                }/${MAX_RETRIES})`
              );
              setRetryAttempt(retryCount + 1);
              await delay(RETRY_DELAY);
              return confirm(retryCount + 1);
            }

            setOrderNumber(data.orderNumber ?? null);
            setPaymentStatus(status);
            setLoading(false);
          }
        } catch (err) {
          console.error("PayPal capture error:", err);
          toast.error(
            "An error occurred while processing your PayPal payment."
          );
          setPaymentStatus("failed");
          setLoading(false);
        }
        return;
      }

      // Handle Stripe payment confirmation
      if (!orderId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("confirm-order", {
        body: {
          orderId,
        },
      });

      if (error || !data?.success) {
        toast.error(
          "We could not confirm your order yet. If you were charged, your order will finalize shortly."
        );
        setPaymentStatus("failed");
        setLoading(false);
      } else {
        const status = data.status ?? "paid";

        // Retry if pending and we haven't exceeded max retries
        if (status === "pending" && retryCount < MAX_RETRIES) {
          console.log(
            `Payment pending, retrying... (${retryCount + 1}/${MAX_RETRIES})`
          );
          setRetryAttempt(retryCount + 1);
          await delay(RETRY_DELAY);
          return confirm(retryCount + 1);
        }

        setOrderNumber(data.orderNumber ?? null);
        setPaymentStatus(status);
        setLoading(false);
      }
    };
    confirm();
  }, [orderId, provider, token]);
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-neutral-600">
            {retryAttempt > 0
              ? `Verifying payment... (attempt ${retryAttempt}/5)`
              : "Processing your order..."}
          </p>
        </div>
      </div>
    );
  }
  // Render different UI based on payment status
  const renderStatusContent = () => {
    if (paymentStatus === "paid") {
      return (
        <>
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-besley text-brand-blue-gray mb-2">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-lg text-neutral-600">
              Thank you for your purchase. Your order has been confirmed.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {orderNumber && (
              <div className="bg-neutral-50 rounded-lg p-4">
                <p className="text-sm text-neutral-600 mb-1">Order Number:</p>
                <p className="font-mono text-sm text-brand-blue-gray">
                  {orderNumber}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-brand-orange mt-0.5" />
                <div>
                  <h3 className="font-medium text-brand-blue-gray">
                    Check Your Email
                  </h3>
                  <p className="text-sm text-neutral-600">
                    We've sent a confirmation email with your receipt and access
                    instructions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-brand-orange mt-0.5" />
                <div>
                  <h3 className="font-medium text-brand-blue-gray">
                    Access Your Content
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Follow the next steps in your email to get started on your
                    secure attachment journey.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link to="/">Return to Home</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <a href="mailto:support@adamlanesmith.com">Contact Support</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </>
      );
    }

    if (paymentStatus === "pending") {
      return (
        <>
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl font-besley text-brand-blue-gray mb-2">
              Payment Pending
            </CardTitle>
            <CardDescription className="text-lg text-neutral-600">
              Your payment is being processed. This may take a few minutes.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {orderNumber && (
              <div className="bg-neutral-50 rounded-lg p-4">
                <p className="text-sm text-neutral-600 mb-1">Order Number:</p>
                <p className="font-mono text-sm text-brand-blue-gray">
                  {orderNumber}
                </p>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-900 mb-2">What's Next?</h3>
              <ul className="text-sm text-yellow-800 space-y-2">
                <li>• Your payment is currently being verified</li>
                <li>
                  • You'll receive a confirmation email once it's complete
                </li>
                <li>• This usually takes just a few minutes</li>
                <li>
                  • If you don't hear from us within 30 minutes, please contact
                  support
                </li>
              </ul>
            </div>

            <div className="pt-6 border-t border-neutral-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link to="/">Return to Home</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <a href="mailto:support@adamlanesmith.com">Contact Support</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </>
      );
    }

    if (paymentStatus === "failed") {
      return (
        <>
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-besley text-brand-blue-gray mb-2">
              Payment Failed
            </CardTitle>
            <CardDescription className="text-lg text-neutral-600">
              We were unable to process your payment.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {orderNumber && (
              <div className="bg-neutral-50 rounded-lg p-4">
                <p className="text-sm text-neutral-600 mb-1">Order Number:</p>
                <p className="font-mono text-sm text-brand-blue-gray">
                  {orderNumber}
                </p>
              </div>
            )}

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-900 mb-2">What Happened?</h3>
              <ul className="text-sm text-red-800 space-y-2">
                <li>• Your payment could not be completed</li>
                <li>• No charges have been made to your account</li>
                <li>• You can try again with a different payment method</li>
                <li>• Contact support if you need assistance</li>
              </ul>
            </div>

            <div className="pt-6 border-t border-neutral-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link to="/">Try Again</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <a href="mailto:support@adamlanesmith.com">Contact Support</a>
                </Button>
              </div>
            </div>
          </CardContent>
        </>
      );
    }

    // Fallback if status is null or unknown
    return (
      <>
        <CardHeader className="text-center pb-8">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-neutral-600" />
          </div>
          <CardTitle className="text-2xl font-besley text-brand-blue-gray mb-2">
            Processing Order
          </CardTitle>
          <CardDescription className="text-lg text-neutral-600">
            We're verifying your payment information.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
            <p className="text-sm text-neutral-600">
              Please wait while we confirm your order. If this takes longer than
              expected, please contact support.
            </p>
          </div>

          <div className="pt-6 border-t border-neutral-200">
            <Button variant="outline" asChild className="w-full">
              <a href="mailto:support@adamlanesmith.com">Contact Support</a>
            </Button>
          </div>
        </CardContent>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg border-0">{renderStatusContent()}</Card>
        </div>
      </div>
    </div>
  );
};
export default CheckoutSuccess;
