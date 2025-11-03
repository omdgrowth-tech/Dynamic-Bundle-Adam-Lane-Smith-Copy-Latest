import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get all active products
    const { data: products, error } = await supabaseClient
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_order');

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    // Transform products to match the existing format
    const transformedProducts = products?.map(product => ({
      id: product.id,
      sku: product.sku,
      title: product.title,
      description: product.description,
      msrp: product.price_cents / 100, // Convert cents to dollars
      type: product.type,
      sort: product.sort_order,
      giftEligible: product.type === 'addon', // Add-ons are gift eligible
    })) || [];

    return new Response(JSON.stringify({
      success: true,
      products: transformedProducts
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching products:', errorMessage);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});