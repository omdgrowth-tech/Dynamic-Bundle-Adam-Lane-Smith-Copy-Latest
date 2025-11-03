import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function logStep(step: string, data?: any) {
  console.log(`[create-paypal-order-secure] ${step}`, data || "");
}

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
    const { cartLines, customer, totals, attribution, couponCode } = body;

    logStep("Request data", { cartLines: cartLines?.length, customer: customer?.email, hasCoupon: !!couponCode });

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

    // Calculate amounts in cents using validated amounts
    const subtotalCents = Math.round(validation.calculatedSubtotal! * 100);
    const discountCents = Math.round(validation.calculatedDiscount! * 100);
    const couponDiscountCents = Math.round((validation.calculatedCouponDiscount || 0) * 100);
    const totalCents = Math.round(validation.calculatedTotal! * 100);

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
        coupon_discount_cents: couponDiscountCents,
        coupon_code: couponCode ? couponCode.toUpperCase() : null,
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

    // Prepare PayPal items using validated prices
    const paypalItems = cartLines.filter(line => !line.isGift).map((line: any) => {
      const product = PRODUCT_CATALOG.find(p => p.sku === line.sku)!;
      return {
        name: line.title,
        quantity: "1",
        unit_amount: {
          currency_code: "USD",
          value: product.msrp.toFixed(2),
        },
      };
    });

    const itemTotalCents = paypalItems.reduce((acc: number, item: any) => {
      return acc + Math.round(Number(item.unit_amount.value) * 100);
    }, 0);

    // Add coupon discount to PayPal breakdown
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
