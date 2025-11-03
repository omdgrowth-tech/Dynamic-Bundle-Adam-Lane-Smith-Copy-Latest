-- Fix function search path security warning
DROP FUNCTION IF EXISTS public.log_unauthorized_access_attempt();

CREATE OR REPLACE FUNCTION public.log_unauthorized_access_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Log attempt (in production you'd want proper logging)
  RAISE WARNING 'Unauthorized access attempt to orders table at %', NOW();
  RETURN NULL;
END;
$$;