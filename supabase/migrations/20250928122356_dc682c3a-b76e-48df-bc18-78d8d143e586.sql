-- Test RLS effectiveness by temporarily switching to anon role and testing access
-- First, let's ensure RLS is working for normal users by creating a test

-- Create a test function to verify RLS works for anon users
CREATE OR REPLACE FUNCTION public.test_rls_as_anon()
RETURNS TABLE (
  can_access_orders boolean,
  row_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_role text;
  result_count bigint;
BEGIN
  -- Get current role
  SELECT current_setting('role') INTO old_role;
  
  -- Switch to anon role to test RLS
  SET LOCAL role = 'anon';
  
  -- Try to count orders (should be 0 if RLS working)
  SELECT COUNT(*) INTO result_count FROM orders;
  
  -- Reset role
  EXECUTE format('SET LOCAL role = %L', old_role);
  
  -- Return results
  RETURN QUERY SELECT (result_count > 0), result_count;
END;
$$;