-- Fix security vulnerability: Remove dangerous null user_id access from orders table
-- This prevents authenticated users from accessing guest checkout data

-- Drop existing insecure policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view order items for their orders" ON public.order_items;

-- Create secure policy for viewing orders (only own orders with matching user_id)
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create secure policy for updating orders (only own orders with matching user_id)
CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create secure policy for viewing order items (only for orders the user owns)
CREATE POLICY "Users can view order items for their orders" 
ON public.order_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 
  FROM orders 
  WHERE orders.id = order_items.order_id 
  AND orders.user_id = auth.uid()
));

-- Create a secure function for guest order lookup (for order status pages)
-- This allows secure access to guest orders using order_number + customer_email
CREATE OR REPLACE FUNCTION public.get_guest_order_by_details(
  _order_number text,
  _customer_email text
)
RETURNS TABLE (
  id uuid,
  order_number varchar,
  status varchar,
  total_cents integer,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_cents,
    o.created_at
  FROM orders o
  WHERE o.order_number = _order_number 
  AND o.customer_email = _customer_email
  AND o.user_id IS NULL;
$$;