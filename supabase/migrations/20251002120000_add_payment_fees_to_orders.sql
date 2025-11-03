-- Add payment fees column to orders table for tracking PayPal transaction fees
ALTER TABLE public.orders 
ADD COLUMN payment_fees_cents INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.payment_fees_cents IS 'Payment processing fees in cents (primarily for PayPal transactions)';

-- Add index for analytics queries involving payment fees
CREATE INDEX idx_orders_payment_fees ON public.orders(payment_fees_cents) WHERE payment_fees_cents > 0;

