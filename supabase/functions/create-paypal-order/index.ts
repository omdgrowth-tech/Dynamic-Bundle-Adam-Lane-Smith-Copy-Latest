// depreacted we use the secure version 


import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";




const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function logStep(step: string, data?: any) {
  console.log(`[create-paypal-order] ${step}`, data || "");
}

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");
  
  if (!clientId || !clientSecret) {
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

// Generate order description
function generateOrderDescription(cartLines: any[], customerName?: string): string {
  const itemCount = cartLines.length;
  const itemNames = cartLines.slice(0, 2).map(line => line.title).join(", ");
  const more = itemCount > 2 ? ` and ${itemCount - 2} more` : "";
  const customer = customerName ? ` for ${customerName}` : "";
  return `Order${customer}: ${itemNames}${more}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting PayPal order creation");

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

    const body = await req.json();
    const { cartLines, customer, totals, attribution } = body;

    logStep("Request data", { cartLines: cartLines?.length, customer: customer?.email });

    // Validate required fields
    if (!cartLines || !Array.isArray(cartLines) || cartLines.length === 0) {
      throw new Error("Cart lines are required");
    }

    if (!customer || !customer.email) {
      throw new Error("Customer email is required");
    }

    if (!totals || typeof totals.total !== "number") {
      throw new Error("Order totals are required");
    }

    // Calculate amounts in cents
    const subtotalCents = Math.round((totals.subtotal || 0) * 100);
    const discountCents = Math.round((totals.discount || 0) * 100);
    const totalCents = Math.round(totals.total * 100);

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    logStep("Creating order in database", { orderNumber, totalCents });

    // Calculate product type counts and line items summary
    const lineItemsSummary = cartLines.map((line: any) => line.title).join(", ");
    const coursesCount = cartLines.filter((line: any) => line.type === "course").length;
    const assessmentsCount = cartLines.filter((line: any) => line.type === "assessment").length;
    const addonsCount = cartLines.filter((line: any) => line.type === "addon").length;
    const groupCoachingCount = cartLines.filter((line: any) => line.type === "group_coaching").length;
    const consultationsCount = cartLines.filter((line: any) => line.type === "consultation").length;
    
    // Check for OTO offer
    const otoItem = cartLines.find((line: any) => line.isOTO === true);

    // Create order in database
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_email: customer.email,
        customer_first_name: customer.firstName,
        customer_last_name: customer.lastName,
        customer_phone: customer.phone,
        billing_street_address: customer.streetAddress,
        billing_city: customer.city,
        billing_state: customer.state,
        billing_zip_code: customer.zipCode,
        billing_country: customer.country,
        subtotal_cents: subtotalCents,
        discount_cents: discountCents,
        total_cents: totalCents,
        status: "pending",
        payment_provider: "paypal",
        // Marketing consent
        marketing_consent_email: customer.newsletter || false,
        marketing_consent_sms: customer.smsConsent || false,
        // Line items summary and counts
        line_items_summary: lineItemsSummary,
        total_courses_count: coursesCount,
        total_assessments_count: assessmentsCount,
        total_addons_count: addonsCount,
        total_group_coaching_count: groupCoachingCount,
        total_consultations_count: consultationsCount,
        oto_offer_accepted: !!otoItem,
        oto_offer_product_sku: otoItem?.sku || null,
        // Attribution data
        utm_source: attribution?.utm_source,
        utm_medium: attribution?.utm_medium,
        utm_campaign: attribution?.utm_campaign,
        utm_term: attribution?.utm_term,
        utm_content: attribution?.utm_content,
        gclid: attribution?.gclid,
        fbclid: attribution?.fbclid,
        referrer: attribution?.referrer,
        landing_page: attribution?.landing_page,
        attribution_timestamp: attribution?.timestamp ? new Date(attribution.timestamp).toISOString() : null,
      })
      .select()
      .single();

    if (orderError) {
      logStep("Order creation failed", orderError);
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    logStep("Order created", { orderId: order.id });

    // Fetch product details from database
    const skus = cartLines.map(line => line.sku);
    const { data: products, error: productsError } = await supabaseClient
      .from("products")
      .select("*")
      .in("sku", skus);

    if (productsError) {
      logStep("Failed to fetch products", productsError);
      throw new Error("Failed to fetch product details");
    }

    // Create order items
    const orderItems = cartLines.map((line: any) => {
      const product = products?.find(p => p.sku === line.sku);
      // Use 'net' for price_cents (the final price after discount)
      // and 'discount' for discount_cents (the discount amount)
      return {
        order_id: order.id,
        product_id: product?.id,
        sku: line.sku,
        title: line.title,
        price_cents: Math.round((line.net || line.price || 0) * 100),
        discount_cents: Math.round((line.discount || 0) * 100),
        is_gift: line.isGift || false,
      };
    });

    const { error: itemsError } = await supabaseClient
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      logStep("Failed to create order items", itemsError);
      // Clean up the order
      await supabaseClient.from("orders").delete().eq("id", order.id);
      throw new Error("Failed to create order items");
    }

    logStep("Order items created");

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const description = generateOrderDescription(cartLines, customer.firstName);

    // Prepare PayPal items with robust numeric pricing and consistent totals
    const paypalItems = cartLines.map((line: any) => {
      const priceCandidate =
        line?.price ??
        (line?.net != null && line?.discount != null
          ? Number(line.net) + Number(line.discount)
          : line?.net);
      const gross = Number(priceCandidate);
      if (!Number.isFinite(gross)) {
        throw new Error(`Invalid item price for SKU ${line?.sku || line?.title}`);
      }
      return {
        name: line.title,
        quantity: "1",
        unit_amount: {
          currency_code: "USD",
          value: gross.toFixed(2),
        },
      };
    });

    const itemTotalCents = paypalItems.reduce((acc: number, item: any) => {
      return acc + Math.round(Number(item.unit_amount.value) * 100);
    }, 0);

    const computedDiscountCents = Math.max(0, itemTotalCents - totalCents);
    const computedTotalCents = itemTotalCents - computedDiscountCents;

    const paypalOrderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: order.id,
          description: description,
          custom_id: orderNumber,
          amount: {
            currency_code: "USD",
            value: (computedTotalCents / 100).toFixed(2),
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: (itemTotalCents / 100).toFixed(2),
              },
              discount: computedDiscountCents > 0 ? {
                currency_code: "USD",
                value: (computedDiscountCents / 100).toFixed(2),
              } : undefined,
            },
          },
          items: paypalItems,
        },
      ],
      application_context: {
        brand_name: "Your Brand",
        user_action: "PAY_NOW",
        return_url: `${req.headers.get("origin")}/checkout/success?provider=paypal`,
        cancel_url: `${req.headers.get("origin")}/checkout/cancel?provider=paypal`,
      },
    };

    logStep("Creating PayPal order");

    const paypalResponse = await fetch("https://api-m.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paypalOrderData),
    });

    if (!paypalResponse.ok) {
      const errorText = await paypalResponse.text();
      logStep("PayPal order creation failed", errorText);
      throw new Error(`PayPal order creation failed: ${errorText}`);
    }

    const paypalOrder = await paypalResponse.json();
    logStep("PayPal order created", { paypalOrderId: paypalOrder.id });

    // Update order with PayPal order ID
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update({ paypal_order_id: paypalOrder.id })
      .eq("id", order.id);

    if (updateError) {
      logStep("Failed to update order with PayPal ID", updateError);
    }

    // Find the approval URL
    const approvalUrl = paypalOrder.links?.find((link: any) => link.rel === "approve")?.href;

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        paypalOrderId: paypalOrder.id,
        approvalUrl,
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
