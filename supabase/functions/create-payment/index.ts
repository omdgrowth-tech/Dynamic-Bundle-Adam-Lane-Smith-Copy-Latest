import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Product SKU to Stripe price mapping
const SKU_TO_PRICE_MAP: Record<string, string> = {
  // Courses & Programs (count toward threshold)
  "COURSE_AVOIDANT_MAN": "price_1SBwrSKmAWN4VJPTa2BsdvfR", // How to Love an Avoidant Man - $497
  "COURSE_SECURE_MARRIAGE": "price_1SBwreKmAWN4VJPTglTJ4ZMx", // How to Build a Secure Marriage - $847
  "COURSE_ATTACHMENT_BOOTCAMP": "price_1SBwrzKmAWN4VJPTaBILdOM0", // Attachment Bootcamp - $497
  "ASSESSMENT_SINGLES": "price_1SBws9KmAWN4VJPTP0qPH0se", // Attachment Assessment Singles - $1,995
  "ASSESSMENT_COUPLES": "price_1SBwsMKmAWN4VJPTRifbW72D", // Attachment Assessment Couples - $3,990
  "GROUP_COACHING_6_MONTH": "price_1SBwsYKmAWN4VJPTVRnlXFmA", // Group Coaching 6-Month - $1,427
  
  // Add-ons (gift-eligible, don't count toward threshold)
  "GUIDE_4_STYLES": "price_1SBlPVKmAWN4VJPTcCE2ir65", // Four Attachment Style Guide - $196
  "MINI_TALK_AVOIDANT": "price_1SBlPIKmAWN4VJPTNtnzCTsj", // How To Talk To An Avoidant Man - $99
  "GUIDE_BOND_AVOIDANT": "price_1SBlP8KmAWN4VJPTERs1rzva", // How To Bond With An Avoidant Man - $49
  "CONVERSATION_CARDS": "price_1SBwshKmAWN4VJPTxazlzGbv", // 30 Conversation Cards - $49
};

// Course/Program SKUs that count toward discount threshold
const COURSE_PROGRAM_SKUS = new Set([
  "COURSE_AVOIDANT_MAN",
  "COURSE_SECURE_MARRIAGE", 
  "COURSE_ATTACHMENT_BOOTCAMP",
  "ASSESSMENT_SINGLES",
  "ASSESSMENT_COUPLES",
  "GROUP_COACHING_6_MONTH"
]);

// Helper function to calculate discount percentage based on tier
function getDiscountPercentage(courseCount: number, hasAddons: boolean): number {
  if (courseCount >= 3) {
    return 50; // Tier 3: 50% off entire cart
  } else if (courseCount >= 2) {
    return hasAddons ? 0 : 40; // Tier 2: 40% off courses only (0% for add-ons)
  } else if (courseCount >= 1) {
    return hasAddons ? 0 : 30; // Tier 1: 30% off courses only (0% for add-ons)
  }
  return 0;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { cartLines, customer } = await req.json();
    
    if (!cartLines || cartLines.length === 0) {
      throw new Error("No cart items provided");
    }

    console.log("Processing cart with items:", cartLines.map((line: any) => ({ sku: line.sku, isGift: line.isGift })));

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Separate cart items into paid items and gifts
    const paidItems = cartLines.filter((line: any) => !line.isGift);
    const giftItems = cartLines.filter((line: any) => line.isGift);

    // Calculate total amount with discounts applied
    let totalAmount = 0;
    
    paidItems.forEach((line: any) => {
      totalAmount += line.net * 100; // Convert to cents
    });

    console.log("Payment Intent amount:", totalAmount, "cents");

    // Find or create customer
    const customers = await stripe.customers.list({ email: customer.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const newCustomer = await stripe.customers.create({
        email: customer.email,
        name: customer.name,
        phone: customer.phone || undefined,
      });
      customerId = newCustomer.id;
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      customer: customerId,
      metadata: {
        customer_name: customer.name,
        customer_phone: customer.phone || "",
        cart_items: JSON.stringify(cartLines.map((item: any) => ({ 
          sku: item.sku, 
          title: item.title, 
          msrp: item.msrp, 
          discount: item.discount, 
          net: item.net, 
          isGift: item.isGift 
        }))),
        gift_items: giftItems.map((item: any) => item.sku).join(","),
      },
    });

    console.log("Payment Intent created:", paymentIntent.id);

    return new Response(JSON.stringify({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    // Sanitize error message for security - don't expose sensitive details
    const sanitizedError = error instanceof Error && (error.message.includes('Stripe') || error.message.includes('payment'))
      ? 'Payment processing error. Please try again.' 
      : 'Payment creation failed. Please contact support.';
    
    return new Response(JSON.stringify({ 
      error: sanitizedError 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});