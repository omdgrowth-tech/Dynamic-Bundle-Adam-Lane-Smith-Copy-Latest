-- Safe SQL script to add coupon fields to orders table
-- Run this in Supabase SQL Editor

-- Add coupon_code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'coupon_code'
    ) THEN
        ALTER TABLE orders ADD COLUMN coupon_code TEXT;
        RAISE NOTICE 'Added coupon_code column';
    ELSE
        RAISE NOTICE 'coupon_code column already exists';
    END IF;
END $$;

-- Add coupon_discount_cents column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'coupon_discount_cents'
    ) THEN
        ALTER TABLE orders ADD COLUMN coupon_discount_cents INTEGER DEFAULT 0;
        RAISE NOTICE 'Added coupon_discount_cents column';
    ELSE
        RAISE NOTICE 'coupon_discount_cents column already exists';
    END IF;
END $$;

-- Add comments to explain the fields
COMMENT ON COLUMN orders.coupon_code IS 'Coupon code applied to the order (e.g., LILAROSE10) - case insensitive';
COMMENT ON COLUMN orders.coupon_discount_cents IS 'Additional discount amount in cents from coupon code (applied on top of bundle discounts)';

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' 
AND column_name IN ('coupon_code', 'coupon_discount_cents')
ORDER BY column_name;
