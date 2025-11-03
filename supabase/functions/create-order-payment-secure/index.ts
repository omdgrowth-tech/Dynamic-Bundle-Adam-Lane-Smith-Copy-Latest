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
  console.log(`[CREATE-ORDER-PAYMENT-SECURE] ${step}${detailsStr}`);
};

// ============================================
// HARDCODED PRODUCT CATALOG
// ============================================
interface Product {
  readonly sku: string;
  readonly title: string;
  readonly type: "course" | "group_coaching" | "assessment" | "addon" | "consultation" | "waitlist";
  readonly msrp: number;
  readonly countsTowardThreshold: boolean;
  readonly giftEligible: boolean;
}

const PRODUCT_CATALOG: readonly Product[] = [
  {
    sku: "COURSE_AVOIDANT_MAN",
    title: "How to Love an Avoidant Man",
    type: "course",
    msrp: 497,
    countsTowardThreshold: true,
    giftEligible: false,
  },
  {
    sku: "COURSE_SECURE_MARRIAGE",
    title: "How to Build a Secure Marriage",
    type: "course",
    msrp: 847,
    countsTowardThreshold: true,
    giftEligible: false,
  },
  {
    sku: "COURSE_ATTACHMENT_BOOTCAMP",
    title: "The Attachment Bootcamp",
    type: "course",
    msrp: 497,
    countsTowardThreshold: true,
    giftEligible: false,
  },
  {
    sku: "GROUP_COACHING_6_MONTH",
    title: "Group Coaching - 6 Month Membership",
    type: "group_coaching",
    msrp: 1427,
    countsTowardThreshold: true,
    giftEligible: false,
  },
  {
    sku: "ASSESSMENT_SINGLES",
    title: "Attachment Assessment - Singles Only",
    type: "assessment",
    msrp: 1995,
    countsTowardThreshold: true,
    giftEligible: false,
  },
  {
    sku: "ASSESSMENT_COUPLES",
    title: "Attachment Assessment - Couples",
    type: "assessment",
    msrp: 3990,
    countsTowardThreshold: true,
    giftEligible: false,
  },
  {
    sku: "ASSESSMENT_PARENTING",
    title: "Attachment Assessment - Parenting",
    type: "assessment",
    msrp: 1197,
    countsTowardThreshold: true,
    giftEligible: false,
  },
  {
    sku: "CONVERSATION_CARDS",
    title: "30 Conversation Cards",
    type: "addon",
    msrp: 49,
    countsTowardThreshold: false,
    giftEligible: true,
  },
  {
    sku: "GUIDE_4_STYLES",
    title: "Four Attachment Style Guides",
    type: "addon",
    msrp: 196,
    countsTowardThreshold: false,
    giftEligible: true,
  },
  {
    sku: "GUIDE_BOND_AVOIDANT",
    title: "How To Bond With An Avoidant Man",
    type: "addon",
    msrp: 49,
    countsTowardThreshold: false,
    giftEligible: true,
  },
  {
    sku: "MINI_TALK_AVOIDANT",
    title: "How To Talk To An Avoidant Man",
    type: "addon",
    msrp: 49,
    countsTowardThreshold: false,
    giftEligible: true,
  },
  {
    sku: "breakthrough-call",
    title: "50-min Private Consultation",
    type: "consultation",
    msrp: 800,
    countsTowardThreshold: true,
    giftEligible: false,
  },
  {
    sku: "WAITLIST_SECURE_PARENTING",
    title: "Secure Parenting: From Chaos to Calm",
    type: "waitlist",
    msrp: 0,
    countsTowardThreshold: false,
    giftEligible: false,
  },
];

// ============================================
// TIER CONFIGURATION
// ============================================
interface Tier {
  readonly id: number;
  readonly minCourses: number;
  readonly percentOff: number;
  readonly scope: "courses_only" | "entire_cart";
  readonly giftCount: number;
}

const TIERS: readonly Tier[] = [
  {
    id: 1,
    minCourses: 1,
    percentOff: 0,
    scope: "entire_cart",
    giftCount: 0,
  },
  {
    id: 2,
    minCourses: 2,
    percentOff: 10,
    scope: "entire_cart",
    giftCount: 0,
  },
  {
    id: 3,
    minCourses: 3,
    percentOff: 20,
    scope: "entire_cart",
    giftCount: 1,
  },
];

// ============================================
// COUPON CONFIGURATION
// ============================================
const VALID_COUPONS = {
  "LILAROSE10": {
    code: "LILAROSE10",
    percentOff: 10,
    description: "10% off entire order"
  }
} as const;

const validateCoupon = (code?: string): { valid: boolean; percentOff: number } => {
  if (!code) return { valid: false, percentOff: 0 };

  const upperCode = code.toUpperCase();
  const coupon = VALID_COUPONS[upperCode as keyof typeof VALID_COUPONS];

  if (!coupon) return { valid: false, percentOff: 0 };

  return { valid: true, percentOff: coupon.percentOff };
};

// ============================================
// VALIDATION HELPERS
// ============================================
const round2 = (n: number) => Math.round(n * 100) / 100;

const isCourse = (type: string): boolean => {
  return type === "course" || type === "group_coaching" || type === "assessment" || type === "consultation";
};

const getTier = (courseCount: number): Tier | null => {
  let currentTier: Tier | null = null;
  for (const candidate of TIERS) {
    if (courseCount >= candidate.minCourses) {
      currentTier = candidate;
    }
  }
  return currentTier;
};

interface CartLineInput {
  sku: string;
  title: string;
  msrp: number;
  discount: number;
  net: number;
  type: string;
  isGift: boolean;
  isOTO?: boolean;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  calculatedSubtotal?: number;
  calculatedDiscount?: number;
  calculatedTotal?: number;
  calculatedCouponDiscount?: number;
}

function validateCart(cartLines: CartLineInput[], providedTotals: any, couponCode?: string): ValidationResult {
  logStep("Starting cart validation", { couponCode });

  // Step 1: Validate all SKUs exist in catalog
  for (const line of cartLines) {
    const product = PRODUCT_CATALOG.find(p => p.sku === line.sku);
    if (!product) {
      logStep("Validation failed: Unknown SKU", { sku: line.sku });
      return { valid: false, error: "Invalid product in cart" };
    }

    // Validate MSRP matches catalog (unless it's a gift)
    if (!line.isGift && Math.abs(product.msrp - line.msrp) > 0.01) {
      logStep("Validation failed: MSRP mismatch", {
        sku: line.sku,
        expected: product.msrp,
        provided: line.msrp
      });
      return { valid: false, error: "Invalid pricing detected" };
    }
  }

  // Step 2: Calculate expected discounts
  const paidLines = cartLines.filter(l => !l.isGift);
  const giftLines = cartLines.filter(l => l.isGift);

  // Count courses for tier determination (exclude OTO items from tier calculation)
  const courseCount = paidLines.filter(line => {
    const product = PRODUCT_CATALOG.find(p => p.sku === line.sku);
    const isOTO = line.isOTO === true;
    return product && isCourse(product.type) && !isOTO;
  }).length;

  const tier = getTier(courseCount);
  const percentOff = tier?.percentOff ?? 0;
  const scope = tier?.scope ?? "courses_only";

  logStep("Tier determined", { courseCount, tier: tier?.id, percentOff });

  // Step 3: Validate each line item's discount
  for (const line of paidLines) {
    const product = PRODUCT_CATALOG.find(p => p.sku === line.sku)!;

    // Calculate expected discount
    const eligible = scope === "entire_cart" ? true : isCourse(product.type);
    const bundleDiscount = eligible ? round2((percentOff / 100) * product.msrp) : 0;

    // Check for OTO discount
    const isOTO = line.isOTO === true;
    let otoDiscount = 0;
    if (isOTO) {
      // Special case: breakthrough-call has custom OTO pricing ($403 discount for $397 final)
      if (product.sku === "breakthrough-call") {
        otoDiscount = 403;
      } else {
        // Standard OTO is 50% off
        otoDiscount = round2(0.5 * product.msrp);
      }
    }

    // Final discount is the higher of the two
    const expectedDiscount = Math.max(bundleDiscount, otoDiscount);
    const expectedNet = round2(product.msrp - expectedDiscount);

    // Allow small rounding differences (2 cents)
    const discountDiff = Math.abs(expectedDiscount - line.discount);
    const netDiff = Math.abs(expectedNet - line.net);

    if (discountDiff > 0.02 || netDiff > 0.02) {
      logStep("Validation failed: Discount mismatch", {
        sku: line.sku,
        expectedDiscount,
        providedDiscount: line.discount,
        expectedNet,
        providedNet: line.net,
        isOTO
      });
      return { valid: false, error: "Invalid discount calculation" };
    }
  }

  // Step 4: Validate gift items
  for (const line of giftLines) {
    const product = PRODUCT_CATALOG.find(p => p.sku === line.sku)!;

    if (!product.giftEligible) {
      logStep("Validation failed: Item not gift eligible", { sku: line.sku });
      return { valid: false, error: "Invalid gift item" };
    }

    // Gifts should have full discount
    if (Math.abs(line.discount - product.msrp) > 0.01 || line.net !== 0) {
      logStep("Validation failed: Invalid gift pricing", {
        sku: line.sku,
        expectedDiscount: product.msrp,
        providedDiscount: line.discount
      });
      return { valid: false, error: "Invalid gift pricing" };
    }
  }

  // Step 5: Validate allowed gift count
  const allowedGiftCount = courseCount === 0 ? 0 : (tier?.giftCount ?? 0);
  if (giftLines.length > allowedGiftCount) {
    logStep("Validation failed: Too many gifts", {
      allowed: allowedGiftCount,
      provided: giftLines.length
    });
    return { valid: false, error: "Too many free gifts" };
  }

  // Step 6: Validate coupon and calculate coupon discount
  const couponValidation = validateCoupon(couponCode);
  let calculatedCouponDiscount = 0;

  if (couponValidation.valid) {
    logStep("Coupon validated", { code: couponCode, percentOff: couponValidation.percentOff });
    // Coupon applies to the total after bundle discounts
    const subtotalAfterBundleDiscount = round2(paidLines.reduce((acc, l) => acc + l.msrp, 0)) - round2(paidLines.reduce((acc, l) => acc + l.discount, 0));
    calculatedCouponDiscount = round2((couponValidation.percentOff / 100) * subtotalAfterBundleDiscount);
  } else if (couponCode) {
    logStep("Validation failed: Invalid coupon", { code: couponCode });
    return { valid: false, error: "Invalid coupon code" };
  }

  // Step 7: Validate totals
  const calculatedSubtotal = round2(paidLines.reduce((acc, l) => acc + l.msrp, 0));
  const calculatedDiscount = round2(paidLines.reduce((acc, l) => acc + l.discount, 0));
  const calculatedTotal = round2(calculatedSubtotal - calculatedDiscount - calculatedCouponDiscount);

  const subtotalDiff = Math.abs(calculatedSubtotal - providedTotals.subtotal);
  const discountDiff = Math.abs(calculatedDiscount - providedTotals.discount);
  const couponDiscountDiff = Math.abs(calculatedCouponDiscount - (providedTotals.couponDiscount || 0));
  const totalDiff = Math.abs(calculatedTotal - providedTotals.total);

  if (subtotalDiff > 0.02 || discountDiff > 0.02 || couponDiscountDiff > 0.02 || totalDiff > 0.02) {
    logStep("Validation failed: Totals mismatch", {
      calculated: {
        subtotal: calculatedSubtotal,
        discount: calculatedDiscount,
        couponDiscount: calculatedCouponDiscount,
        total: calculatedTotal
      },
      provided: providedTotals,
      differences: {
        subtotal: subtotalDiff,
        discount: discountDiff,
        couponDiscount: couponDiscountDiff,
        total: totalDiff
      }
    });
    return { valid: false, error: "Invalid order totals" };
  }

  logStep("Cart validation successful", {
    calculatedSubtotal,
    calculatedDiscount,
    calculatedCouponDiscount,
    calculatedTotal
  });

  return {
    valid: true,
    calculatedSubtotal,
    calculatedDiscount,
    calculatedCouponDiscount,
    calculatedTotal,
  };
}

// ============================================
// MAIN HANDLER
// ============================================
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
    const { cartLines, customer, totals, attribution, couponCode } = await req.json();
    logStep("Request received", {
      cartLineCount: cartLines?.length,
      customerEmail: customer?.email,
      total: totals?.total,
      hasAttribution: !!attribution,
      hasCoupon: !!couponCode
    });

    if (!cartLines || !customer || !totals) {
      throw new Error("Missing required fields: cartLines, customer, or totals");
    }

    // Validate customer data
    if (!customer.email || !customer.firstName || !customer.lastName) {
      throw new Error("Customer email, firstName, and lastName are required");
    }

    // ============================================
    // SECURITY VALIDATION
    // ============================================
    const validation = validateCart(cartLines, totals, couponCode);
    if (!validation.valid) {
      logStep("Security validation failed", { error: validation.error });
      return new Response(JSON.stringify({
        success: false,
        error: validation.error || "Payment validation failed. Please refresh and try again."
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Calculate totals in cents using validated amounts
    const subtotalCents = Math.round(validation.calculatedSubtotal! * 100);
    const discountCents = Math.round(validation.calculatedDiscount! * 100);
    const couponDiscountCents = Math.round((validation.calculatedCouponDiscount || 0) * 100);
    const totalCents = Math.round(validation.calculatedTotal! * 100);

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
        coupon_discount_cents: couponDiscountCents,
        coupon_code: couponCode ? couponCode.toUpperCase() : null,
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
