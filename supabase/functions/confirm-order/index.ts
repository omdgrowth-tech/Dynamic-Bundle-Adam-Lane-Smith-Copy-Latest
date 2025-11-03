import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) => {
  console.log(`[CONFIRM-ORDER] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ success: false, error: "Missing orderId" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    log("Confirming order", { orderId });

    // Init Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, order_number, status, stripe_payment_intent_id")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      throw new Error(`Order not found: ${orderErr?.message ?? "unknown"}`);
    }

    // If already paid, return early
    if (order.status === "paid") {
      log("Order already paid", { orderId });
      return new Response(JSON.stringify({ success: true, status: "paid", orderNumber: order.order_number }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Verify with Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    if (!order.stripe_payment_intent_id) {
      throw new Error("Order missing stripe_payment_intent_id");
    }

    const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id, {
      expand: ['latest_charge.balance_transaction']
    });
    log("Retrieved PI", { id: pi.id, status: pi.status });

    let newStatus = order.status;
    if (pi.status === "succeeded") {
      newStatus = "paid";
    } else if (pi.status === "requires_payment_method" || pi.status === "canceled") {
      newStatus = "failed";
    } else {
      newStatus = "pending";
    }

    // Extract Stripe fees from balance transaction
    let paymentFeesCents = 0;
    try {
      if (pi.latest_charge && typeof pi.latest_charge === 'object') {
        const charge = pi.latest_charge as any;
        if (charge.balance_transaction && typeof charge.balance_transaction === 'object') {
          const balanceTransaction = charge.balance_transaction as any;
          // Stripe balance transaction fee is already in cents
          paymentFeesCents = balanceTransaction.fee || 0;
          log("Extracted Stripe fees", { paymentFeesCents });
        }
      }
    } catch (feeError) {
      log("Failed to extract Stripe fees", feeError);
      // Continue without fees rather than failing the entire confirmation
    }

    // Update order with status and fees
    const { error: updateErr } = await supabase
      .from("orders")
      .update({ 
        status: newStatus,
        payment_fees_cents: paymentFeesCents
      })
      .eq("id", order.id);

    if (updateErr) {
      throw new Error(`Failed to update order: ${updateErr.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, status: newStatus, orderNumber: order.order_number }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log("ERROR", { msg });
    return new Response(JSON.stringify({ success: false, error: "Unable to confirm order" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});


