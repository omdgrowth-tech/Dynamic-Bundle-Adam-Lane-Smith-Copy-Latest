-- Security Enhancement: Fix INSERT policies and add input length constraints

-- Drop existing overly permissive INSERT policies
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;

-- Create secure INSERT policy for orders (restrict user_id to authenticated user)
CREATE POLICY "Users can create orders securely" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR 
  (auth.uid() IS NULL AND user_id IS NULL)
);

-- Create secure INSERT policy for order items (validate order ownership)
CREATE POLICY "Users can create order items securely" 
ON public.order_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (
      (orders.user_id = auth.uid()) OR 
      (orders.user_id IS NULL AND auth.uid() IS NULL)
    )
  )
);

-- Add length constraints to prevent oversized input abuse
ALTER TABLE public.orders 
  ADD CONSTRAINT orders_customer_first_name_length CHECK (length(customer_first_name) <= 100),
  ADD CONSTRAINT orders_customer_last_name_length CHECK (length(customer_last_name) <= 100),
  ADD CONSTRAINT orders_customer_email_length CHECK (length(customer_email) <= 255),
  ADD CONSTRAINT orders_customer_phone_length CHECK (length(customer_phone) <= 50),
  ADD CONSTRAINT orders_billing_city_length CHECK (length(billing_city) <= 100),
  ADD CONSTRAINT orders_billing_state_length CHECK (length(billing_state) <= 100),
  ADD CONSTRAINT orders_billing_country_length CHECK (length(billing_country) <= 100),
  ADD CONSTRAINT orders_billing_zip_code_length CHECK (length(billing_zip_code) <= 20),
  ADD CONSTRAINT orders_billing_street_address_length CHECK (length(billing_street_address) <= 500),
  ADD CONSTRAINT orders_order_number_length CHECK (length(order_number) <= 50);

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_title_length CHECK (length(title) <= 255),
  ADD CONSTRAINT order_items_sku_length CHECK (length(sku) <= 100);

ALTER TABLE public.products
  ADD CONSTRAINT products_title_length CHECK (length(title) <= 255),
  ADD CONSTRAINT products_sku_length CHECK (length(sku) <= 100),
  ADD CONSTRAINT products_description_length CHECK (length(description) <= 2000);