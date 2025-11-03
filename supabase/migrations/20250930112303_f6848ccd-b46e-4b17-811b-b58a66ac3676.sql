-- Add order summary and aggregate columns to orders table
ALTER TABLE public.orders 
ADD COLUMN line_items_summary text,
ADD COLUMN total_courses_count integer NOT NULL DEFAULT 0,
ADD COLUMN total_assessments_count integer NOT NULL DEFAULT 0,
ADD COLUMN total_addons_count integer NOT NULL DEFAULT 0,
ADD COLUMN total_coaching_programs_count integer NOT NULL DEFAULT 0,
ADD COLUMN oto_offer_accepted boolean NOT NULL DEFAULT false,
ADD COLUMN oto_offer_product_sku varchar;

-- Add comments for documentation
COMMENT ON COLUMN public.orders.line_items_summary IS 'Comma-separated list of product titles in the order';
COMMENT ON COLUMN public.orders.total_courses_count IS 'Count of course products in the order';
COMMENT ON COLUMN public.orders.total_assessments_count IS 'Count of assessment products in the order';
COMMENT ON COLUMN public.orders.total_addons_count IS 'Count of addon products in the order';
COMMENT ON COLUMN public.orders.total_coaching_programs_count IS 'Count of coaching program products in the order';
COMMENT ON COLUMN public.orders.oto_offer_accepted IS 'Whether the one-time offer was accepted';
COMMENT ON COLUMN public.orders.oto_offer_product_sku IS 'SKU of the one-time offer product if accepted';