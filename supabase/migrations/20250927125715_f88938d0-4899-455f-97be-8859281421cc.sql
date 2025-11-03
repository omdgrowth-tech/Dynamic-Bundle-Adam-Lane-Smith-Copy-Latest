-- Add missing foreign key constraint for data integrity
ALTER TABLE public.order_items 
ADD CONSTRAINT fk_order_items_product_id 
FOREIGN KEY (product_id) REFERENCES public.products(id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON public.orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);

-- Clean up the orphaned order (order with no items)
DELETE FROM public.orders WHERE id = 'b27a6747-0a8f-49cc-b7ea-3af0f0ddc0f3';