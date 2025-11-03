import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaitlistData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    product: string;
    productSku?: string;
    termsAccepted: boolean;
    marketingConsent: boolean;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({
            success: false,
            error: "Method not allowed"
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 405,
        });
    }

    try {
        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Parse the request body
        const body: WaitlistData = await req.json();

        // Validate required fields
        const { firstName, lastName, email, phone, product, productSku, termsAccepted, marketingConsent } = body;

        if (!firstName || !lastName || !email || !phone || !product) {
            return new Response(JSON.stringify({
                success: false,
                error: "Missing required fields"
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        // Validate terms acceptance
        if (!termsAccepted) {
            return new Response(JSON.stringify({
                success: false,
                error: "You must accept the Terms & Conditions and Privacy Policy"
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        // Insert waitlist submission into database
        const { data, error } = await supabaseClient
            .from('waitlist_submissions')
            .insert({
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone,
                product_title: product,
                product_sku: productSku || null,
                terms_accepted: termsAccepted,
                marketing_consent: marketingConsent || false,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to insert waitlist submission: ${error.message}`);
        }

        console.log("Waitlist submission stored successfully:", data);

        return new Response(JSON.stringify({
            success: true,
            message: "Waitlist submission successful",
            data: {
                id: data.id,
                created_at: data.created_at
            }
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error submitting to waitlist:', errorMessage);

        return new Response(JSON.stringify({
            success: false,
            error: "Failed to submit waitlist entry"
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});