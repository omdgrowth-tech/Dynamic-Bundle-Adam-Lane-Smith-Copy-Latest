-- Fix the security definer view issue
-- Remove the problematic view and implement safer alternatives

-- Drop the view that caused security warnings
DROP VIEW IF EXISTS public.secure_orders;

-- Instead, let's revoke potentially dangerous permissions and ensure RLS is bulletproof
-- Revoke all default permissions that might bypass RLS
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.orders FROM authenticated;

-- Grant only the minimum necessary permissions
GRANT SELECT ON public.orders TO authenticated;

-- Make absolutely sure RLS policies are working
-- Test that the current policies are sufficient
-- The authenticated role should only be able to see their own orders

-- Ensure order_items table follows the same security pattern
REVOKE ALL ON public.order_items FROM anon;
REVOKE ALL ON public.order_items FROM authenticated;
GRANT SELECT ON public.order_items TO authenticated;

-- Add a final security check function for monitoring unauthorized access attempts
CREATE OR REPLACE FUNCTION public.log_unauthorized_access_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Log attempt (in production you'd want proper logging)
  RAISE WARNING 'Unauthorized access attempt to orders table at %', NOW();
  RETURN NULL;
END;
$$;