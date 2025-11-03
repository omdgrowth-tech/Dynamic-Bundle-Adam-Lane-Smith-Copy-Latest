-- Create additional security measures to prevent any data exposure

-- Create a secure view for order access that enforces additional checks
CREATE OR REPLACE VIEW public.secure_orders AS
SELECT 
  id,
  order_number,
  status,
  total_cents,
  subtotal_cents,
  discount_cents,
  created_at,
  updated_at,
  user_id,
  -- Only expose customer data if user owns the order
  CASE 
    WHEN user_id = auth.uid() THEN customer_email
    ELSE NULL 
  END as customer_email,
  CASE 
    WHEN user_id = auth.uid() THEN customer_first_name
    ELSE NULL 
  END as customer_first_name,
  CASE 
    WHEN user_id = auth.uid() THEN customer_last_name
    ELSE NULL 
  END as customer_last_name,
  CASE 
    WHEN user_id = auth.uid() THEN customer_phone
    ELSE NULL 
  END as customer_phone,
  CASE 
    WHEN user_id = auth.uid() THEN billing_street_address
    ELSE NULL 
  END as billing_street_address,
  CASE 
    WHEN user_id = auth.uid() THEN billing_city
    ELSE NULL 
  END as billing_city,
  CASE 
    WHEN user_id = auth.uid() THEN billing_state
    ELSE NULL 
  END as billing_state,
  CASE 
    WHEN user_id = auth.uid() THEN billing_zip_code
    ELSE NULL 
  END as billing_zip_code,
  CASE 
    WHEN user_id = auth.uid() THEN billing_country
    ELSE NULL 
  END as billing_country,
  stripe_payment_intent_id
FROM orders
WHERE 
  -- Only show orders that belong to the authenticated user
  (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Grant access to the secure view
GRANT SELECT ON public.secure_orders TO authenticated;

-- Enable RLS on the view (though it has built-in security)
ALTER VIEW public.secure_orders SET (security_barrier = true);