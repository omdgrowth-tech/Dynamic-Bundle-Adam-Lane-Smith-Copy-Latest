-- Add attribution tracking columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS gclid VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fbclid VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS landing_page VARCHAR(500);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS attribution_timestamp TIMESTAMP WITH TIME ZONE;

-- Create analytics view for order attribution reporting
CREATE OR REPLACE VIEW public.order_attribution_analytics AS
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

-- Add indexes for better analytics query performance
CREATE INDEX IF NOT EXISTS idx_orders_utm_source ON public.orders(utm_source) WHERE utm_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_utm_campaign ON public.orders(utm_campaign) WHERE utm_campaign IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_gclid ON public.orders(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_fbclid ON public.orders(fbclid) WHERE fbclid IS NOT NULL;