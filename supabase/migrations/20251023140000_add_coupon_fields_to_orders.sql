-- Add coupon fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS coupon_discount_cents INTEGER DEFAULT 0;

-- Add comment to explain the fields
COMMENT ON COLUMN orders.coupon_code IS 'Coupon code applied to the order (e.g., LILAROSE10)';
COMMENT ON COLUMN orders.coupon_discount_cents IS 'Additional discount amount in cents from coupon code (applied on top of bundle discounts)';
