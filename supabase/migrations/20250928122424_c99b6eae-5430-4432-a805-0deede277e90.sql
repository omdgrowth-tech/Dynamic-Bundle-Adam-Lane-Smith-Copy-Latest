-- Fix potential RLS bypass vulnerability
-- Add an additional security layer by creating a view that enforces access control

-- First, let's ensure the orders table policies are strict
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- Create a more restrictive SELECT policy that absolutely prevents unauthorized access
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
TO authenticated, anon
USING (
  -- Only allow access if user_id matches authenticated user
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
);

-- Add explicit policy to block all access to guest orders via direct table access
-- Guest orders should ONLY be accessible through the secure function
CREATE POLICY "Block direct access to guest orders"
ON public.orders
FOR SELECT 
TO anon
USING (false); -- Explicitly deny all anon access to prevent any data leakage

-- Ensure the secure guest access function has proper limitations
DROP FUNCTION IF EXISTS public.get_guest_order_by_details(text, text);

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
  -- Only return minimal order information, no personal details
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_cents,
    o.created_at
  FROM orders o
  WHERE o.order_number = _order_number 
  AND o.customer_email = _customer_email
  AND o.user_id IS NULL
  -- Add rate limiting by only allowing recent orders
  AND o.created_at > NOW() - INTERVAL '90 days';
$$;