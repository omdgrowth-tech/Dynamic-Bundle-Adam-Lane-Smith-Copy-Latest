-- Add PayPal support to orders table
ALTER TABLE public.orders 
ADD COLUMN payment_provider VARCHAR(20) DEFAULT 'stripe',
ADD COLUMN paypal_order_id VARCHAR(255);

-- Add index for PayPal order lookups
CREATE INDEX idx_orders_paypal_order_id ON public.orders(paypal_order_id) WHERE paypal_order_id IS NOT NULL;

-- Add check constraint to ensure valid payment providers
ALTER TABLE public.orders
ADD CONSTRAINT valid_payment_provider CHECK (payment_provider IN ('stripe', 'paypal'));