// depreacted we use the secure version 


import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ORDER-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request body
    const { cartLines, customer, totals, attribution } = await req.json();
    logStep("Request received", { 
      cartLineCount: cartLines?.length, 
      customerEmail: customer?.email,
      total: totals?.total,
      hasAttribution: !!attribution
    });

    if (!cartLines || !customer || !totals) {
      throw new Error("Missing required fields: cartLines, customer, or totals");
    }

    // Validate customer data
    if (!customer.email || !customer.firstName || !customer.lastName) {
      throw new Error("Customer email, firstName, and lastName are required");
    }

    // Calculate totals in cents
    const subtotalCents = Math.round(totals.subtotal * 100);
    const discountCents = Math.round(totals.discount * 100);
    const totalCents = Math.round(totals.total * 100);

    logStep("Calculated amounts", { subtotalCents, discountCents, totalCents });

    // Generate unique order number with customer name
    const customerName = `${customer.firstName} ${customer.lastName}`;
    const orderNum = Math.floor(Math.random() * 9000) + 1000; // 4-digit number
    const orderNumber = `${customerName} - #77${orderNum}`;

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
      .from('orders')
      .insert({
        order_number: orderNumber,
        status: 'pending',
        subtotal_cents: subtotalCents,
        discount_cents: discountCents,
        total_cents: totalCents,
        customer_email: customer.email,
        customer_first_name: customer.firstName,
        customer_last_name: customer.lastName,
        customer_phone: customer.phone,
        payment_provider: 'stripe',
        billing_country: customer.country,
        billing_city: customer.city,
        billing_street_address: customer.streetAddress,
        billing_state: customer.state,
        billing_zip_code: customer.zipCode,
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
        utm_source: attribution?.utm_source || null,
        utm_medium: attribution?.utm_medium || null,
        utm_campaign: attribution?.utm_campaign || null,
        utm_term: attribution?.utm_term || null,
        utm_content: attribution?.utm_content || null,
        gclid: attribution?.gclid || null,
        fbclid: attribution?.fbclid || null,
        referrer: attribution?.referrer || null,
        landing_page: attribution?.landing_page || null,
        attribution_timestamp: attribution?.timestamp ? new Date(attribution.timestamp).toISOString() : null,
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    logStep("Order created", { orderId: order.id, orderNumber });

    // Get product details from database and validate all SKUs exist
    const skus = cartLines.map((line: any) => line.sku);
    const { data: products, error: productsError } = await supabaseClient
      .from('products')
      .select('*')
      .in('sku', skus);

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    // Validate all products exist before proceeding
    const missingSkus = skus.filter((sku: string) => !products?.find(p => p.sku === sku));
    if (missingSkus.length > 0) {
      throw new Error(`Products not found for SKUs: ${missingSkus.join(', ')}`);
    }

    // Prepare order items
    const orderItems = cartLines.map((line: any) => {
      const product = products?.find(p => p.sku === line.sku);
      return {
        order_id: order.id,
        product_id: product.id,
        sku: line.sku,
        title: line.title,
        price_cents: Math.round(line.msrp * 100),
        discount_cents: Math.round(line.discount * 100),
        is_gift: line.isGift || false,
      };
    });

    // Create order items - if this fails, the order will remain but that's better than partial data
    const { error: orderItemsError } = await supabaseClient
      .from('order_items')
      .insert(orderItems);

    if (orderItemsError) {
      // Delete the order if order items creation fails to maintain data integrity
      await supabaseClient
        .from('orders')
        .delete()
        .eq('id', order.id);
      
      throw new Error(`Failed to create order items: ${orderItemsError.message}`);
    }

    logStep("Order items created", { itemCount: orderItems.length });

    // Helper function to generate smart order description
    const generateOrderDescription = (cartLines: any[], customer: any) => {
      const courseItems = cartLines.filter(line => line.type === 'course' || line.type === 'group_coaching');
      const addonItems = cartLines.filter(line => line.type === 'addon');
      const giftItems = cartLines.filter(line => line.isGift);
      const customerName = `${customer.firstName} ${customer.lastName}`;

      if (cartLines.length === 1) {
        return `${cartLines[0].title} - ${customerName}`;
      }

      let description = '';
      if (courseItems.length > 0) {
        description += `${courseItems.length}-Course${courseItems.length > 1 ? '' : ''} Bundle`;
      }
      if (addonItems.length > 0) {
        description += courseItems.length > 0 ? ` + ${addonItems.length} Add-on${addonItems.length > 1 ? 's' : ''}` : `${addonItems.length} Add-on${addonItems.length > 1 ? 's' : ''}`;
      }
      if (giftItems.length > 0) {
        description += ` (${giftItems.length} Gift${giftItems.length > 1 ? 's' : ''})`;
      }
      
      return `${description} - ${customerName}`;
    };

    // Helper function to generate enriched metadata
    const generateMetadata = (cartLines: any[], customer: any, order: any, totals: any, attribution?: any) => {
      const courseItems = cartLines.filter(line => line.type === 'course' || line.type === 'group_coaching');
      const addonItems = cartLines.filter(line => line.type === 'addon');
      const giftItems = cartLines.filter(line => line.isGift);
      const totalSavings = totals.discount;

      const metadata: any = {
        source: "Dynamic Page",
        order_id: order.id,
        order_number: order.order_number,
        customer_name: `${customer.firstName} ${customer.lastName}`,
        customer_phone: customer.phone || '',
        customer_country: customer.country || '',
        // Marketing preferences
        sms_consent: customer.smsConsent ? 'true' : 'false',
        newsletter_opt_in: customer.newsletter ? 'true' : 'false',
        item_count: cartLines.length.toString(),
        course_count: courseItems.length.toString(),
        addon_count: addonItems.length.toString(),
        gift_count: giftItems.length.toString(),
        total_savings_cents: Math.round(totalSavings * 100).toString(),
        product_titles: cartLines.map(line => line.title).join(', ').substring(0, 450), // Keep under 500 char limit
        product_types: cartLines.map(line => line.type).join(', '),
      };

      // Add attribution data to metadata if available
      if (attribution) {
        if (attribution.utm_source) metadata.utm_source = attribution.utm_source;
        if (attribution.utm_medium) metadata.utm_medium = attribution.utm_medium;
        if (attribution.utm_campaign) metadata.utm_campaign = attribution.utm_campaign;
        if (attribution.gclid) metadata.gclid = attribution.gclid;
        if (attribution.fbclid) metadata.fbclid = attribution.fbclid;
        if (attribution.referrer) metadata.referrer = attribution.referrer.substring(0, 450);
      }

      return metadata;
    };

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists in Stripe
    const customers = await stripe.customers.list({ 
      email: customer.email, 
      limit: 1 
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing Stripe customer", { customerId });
    } else {
      // Create new Stripe customer
      const newCustomer = await stripe.customers.create({
        email: customer.email,
        name: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phone,
        address: {
          country: customer.country,
          city: customer.city,
          line1: customer.streetAddress,
          state: customer.state,
          postal_code: customer.zipCode,
        },
      });
      customerId = newCustomer.id;
      logStep("Created new Stripe customer", { customerId });
    }

    // Optional: retrieve Stripe account for debugging (helps verify key alignment)
    const account = await stripe.accounts.retrieve();

    // Create Stripe payment intent with automatic payment methods to support Payment Element
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      receipt_email: customer.email,
      metadata: generateMetadata(cartLines, customer, order, totals, attribution),
      description: generateOrderDescription(cartLines, customer),
    });

    logStep("Payment intent created", { 
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount 
    });

    // Update order with Stripe payment intent ID
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', order.id);

    if (updateError) {
      logStep("Warning: Failed to update order with payment intent", { error: updateError.message });
    }

    return new Response(JSON.stringify({
      success: true,
      orderId: order.id,
      orderNumber,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      livemode: paymentIntent.livemode,
      stripeAccountId: account.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    // Sanitize error message for security - don't expose sensitive details
    const sanitizedError = errorMessage.includes('Stripe') || errorMessage.includes('payment') 
      ? 'Payment processing error. Please try again.' 
      : 'An error occurred while processing your order. Please contact support.';
    
    return new Response(JSON.stringify({ 
      success: false,
      error: sanitizedError 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});