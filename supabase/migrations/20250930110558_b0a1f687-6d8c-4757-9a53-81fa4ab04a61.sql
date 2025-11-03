-- Add marketing consent fields to orders table
ALTER TABLE public.orders 
ADD COLUMN marketing_consent_email boolean NOT NULL DEFAULT false,
ADD COLUMN marketing_consent_sms boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.marketing_consent_email IS 'Customer consent for email marketing';
COMMENT ON COLUMN public.orders.marketing_consent_sms IS 'Customer consent for SMS marketing';

-- Note: Line items are already tracked in the order_items table with order_id foreign key
-- The order_items table contains: product_id, title, sku, price_cents, discount_cents, is_gift