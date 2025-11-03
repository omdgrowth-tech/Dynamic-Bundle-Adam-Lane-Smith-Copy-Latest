import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function logStep(step: string, data?: any) {
  console.log(`[capture-paypal-payment] ${step}`, data || "");
}

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  
  if (!clientId || !clientSecret) {
    console.log(`client id ${clientId} and client secret ${clientSecret}`);
    throw new Error("PayPal credentials not configured");
  }

  const auth = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const errorText = await response.text();
    logStep("PayPal auth failed", { status: response.status, error: errorText });
    throw new Error(`Failed to get PayPal access token: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting PayPal payment capture");

    const body = await req.json();
    const { paypalOrderId } = body;

    if (!paypalOrderId) {
      throw new Error("PayPal order ID is required");
    }

    logStep("Capturing payment", { paypalOrderId });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Capture the PayPal order
    const captureResponse = await fetch(
      `https://api-m.paypal.com/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      logStep("PayPal capture failed", errorText);
      throw new Error(`PayPal capture failed: ${errorText}`);
    }

    const captureData = await captureResponse.json();
    logStep("PayPal capture successful", { status: captureData.status });

    // Find our order by PayPal order ID
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("paypal_order_id", paypalOrderId)
      .single();

    if (orderError || !order) {
      logStep("Order not found", orderError);
      throw new Error("Order not found");
    }

    // Update order status based on PayPal capture status
    let newStatus = "pending";
    if (captureData.status === "COMPLETED") {
      newStatus = "paid";
    } else if (captureData.status === "DECLINED" || captureData.status === "FAILED") {
      newStatus = "failed";
    }

    // Extract PayPal fees from the capture response
    let paymentFeesCents = 0;
    try {
      // PayPal returns fees in purchase_units[].payments.captures[].seller_receivable_breakdown.paypal_fee
      const purchaseUnits = captureData.purchase_units || [];
      for (const unit of purchaseUnits) {
        const captures = unit.payments?.captures || [];
        for (const capture of captures) {
          const paypalFee = capture.seller_receivable_breakdown?.paypal_fee;
          if (paypalFee && paypalFee.value) {
            // PayPal fee is in dollars, convert to cents
            paymentFeesCents += Math.round(parseFloat(paypalFee.value) * 100);
          }
        }
      }
      logStep("Extracted PayPal fees", { paymentFeesCents });
    } catch (feeError) {
      logStep("Failed to extract PayPal fees", feeError);
      // Continue without fees rather than failing the entire capture
    }

    logStep("Updating order status and fees", { orderId: order.id, newStatus, paymentFeesCents });

    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({ 
        status: newStatus,
        payment_fees_cents: paymentFeesCents
      })
      .eq("id", order.id);

    if (updateError) {
      logStep("Failed to update order status", updateError);
      throw new Error("Failed to update order status");
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        status: newStatus,
        paypalCaptureId: captureData.id,
        paymentFeesCents,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    logStep("Error", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
