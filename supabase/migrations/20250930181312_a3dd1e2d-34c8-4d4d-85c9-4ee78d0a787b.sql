-- Add new column for group coaching count
ALTER TABLE orders 
ADD COLUMN total_group_coaching_count integer NOT NULL DEFAULT 0;