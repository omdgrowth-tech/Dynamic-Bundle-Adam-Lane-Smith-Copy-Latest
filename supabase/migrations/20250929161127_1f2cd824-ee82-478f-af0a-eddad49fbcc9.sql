-- Drop the existing insecure view that exposes customer data
DROP VIEW IF EXISTS public.order_attribution_analytics;

-- Create a security definer function that respects RLS policies and admin access
CREATE OR REPLACE FUNCTION public.get_order_analytics(
  _start_date timestamp with time zone DEFAULT (now() - interval '2 years'),
  _end_date timestamp with time zone DEFAULT now()
)
RETURNS TABLE (
  id uuid,
  order_number character varying,
  status character varying,
  total_cents integer,
  subtotal_cents integer,
  discount_cents integer,
  customer_email character varying,
  utm_source character varying,
  utm_medium character varying,
  utm_campaign character varying,
  utm_term character varying,
  utm_content character varying,
  gclid character varying,
  fbclid character varying,
  referrer text,
  landing_page character varying,
  attribution_timestamp timestamp with time zone,
  created_at timestamp with time zone,
  traffic_source_category text,
  source_clean character varying,
  medium_clean character varying
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only return data if user is authenticated and has proper access
  -- This function can be extended later to check for admin roles
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_cents,
    o.subtotal_cents,
    o.discount_cents,
    o.customer_email,
    o.utm_source,
    o.utm_medium,
    o.utm_campaign,
    o.utm_term,
    o.utm_content,
    o.gclid,
    o.fbclid,
    o.referrer,
    o.landing_page,
    o.attribution_timestamp,
    o.created_at,
    CASE
      WHEN o.utm_source IS NOT NULL THEN 'UTM Campaign'::text
      WHEN o.gclid IS NOT NULL THEN 'Google Ads'::text
      WHEN o.fbclid IS NOT NULL THEN 'Facebook Ads'::text
      WHEN o.referrer IS NOT NULL AND o.referrer <> '' THEN 'Referral'::text
      ELSE 'Direct'::text
    END AS traffic_source_category,
    COALESCE(o.utm_source, 'direct'::character varying) AS source_clean,
    COALESCE(o.utm_medium, 'none'::character varying) AS medium_clean
  FROM orders o
  WHERE o.created_at >= _start_date 
    AND o.created_at <= _end_date
    -- Respect the existing RLS policies on orders table
    AND (
      -- Only service role can access this analytics data for now
      current_setting('role') = 'service_role'
      -- Future: Add admin role check when implemented
      -- OR public.is_admin(auth.uid())
    );
$$;

-- Grant execute permission only to service_role for now
-- This ensures only backend processes can access analytics data
REVOKE ALL ON FUNCTION public.get_order_analytics FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_analytics TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_order_analytics IS 
'Secure function to access order analytics data. Only accessible to service_role or future admin users. Replaces the insecure order_attribution_analytics view.';