-- Drop and recreate the analytics view without security definer
DROP VIEW IF EXISTS public.order_attribution_analytics;

-- Create analytics view for order attribution reporting (without security definer)
CREATE VIEW public.order_attribution_analytics WITH (security_invoker=true) AS
SELECT 
  id,
  order_number,
  status,
  total_cents,
  subtotal_cents,
  discount_cents,
  customer_email,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_term,
  utm_content,
  gclid,
  fbclid,
  referrer,
  landing_page,
  attribution_timestamp,
  created_at,
  CASE 
    WHEN utm_source IS NOT NULL THEN 'UTM Campaign'
    WHEN gclid IS NOT NULL THEN 'Google Ads'
    WHEN fbclid IS NOT NULL THEN 'Facebook Ads'
    WHEN referrer IS NOT NULL AND referrer != '' THEN 'Referral'
    ELSE 'Direct'
  END as traffic_source_category,
  COALESCE(utm_source, 'direct') as source_clean,
  COALESCE(utm_medium, 'none') as medium_clean
FROM public.orders
WHERE created_at >= NOW() - INTERVAL '2 years';