-- Add new column for consultation count on orders
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS total_consultations_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.orders.total_consultations_count IS 'Count of consultation products in the order';


