-- Create products table for e-commerce backend
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku VARCHAR(255) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'course',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  customer_email VARCHAR(255) NOT NULL,
  customer_first_name VARCHAR(255),
  customer_last_name VARCHAR(255),
  customer_phone VARCHAR(255),
  billing_country VARCHAR(255),
  billing_city VARCHAR(255),
  billing_street_address TEXT,
  billing_state VARCHAR(255),
  billing_zip_code VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  sku VARCHAR(255) NOT NULL,
  title TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  is_gift BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for products (publicly readable)
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (active = true);

-- Create policies for orders (users can view their own orders)
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
USING (user_id = auth.uid() OR user_id IS NULL);

-- Create policies for order_items
CREATE POLICY "Users can view order items for their orders" 
ON public.order_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
  )
);

CREATE POLICY "Users can create order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert products from existing data
INSERT INTO public.products (sku, title, description, price_cents, type, sort_order) VALUES
('COURSE_ASSESSMENT_SINGLES', 'Attachment Assessment for Singles', 'Discover your attachment style and build healthier relationships', 7900, 'course', 1),
('COURSE_ASSESSMENT_COUPLES', 'Attachment Assessment for Couples', 'Strengthen your relationship through understanding attachment styles', 7900, 'course', 2),
('COURSE_BOOTCAMP', 'Attachment Bootcamp Course', 'Comprehensive course on attachment theory and relationship skills', 29700, 'course', 3),
('COURSE_LOVE_AVOIDANT_MAN', 'Love an Avoidant Man Course', 'Learn how to build secure connections with avoidant partners', 29700, 'course', 4),
('COURSE_SECURE_MARRIAGE', 'Secure Marriage Course', 'Build a lasting, secure marriage foundation', 39700, 'course', 5),
('COURSE_GROUP_COACHING', '6-Month Group Coaching', 'Intensive group coaching program for relationship transformation', 199700, 'coaching_program', 6),
('ADDON_CONVERSATION_CARDS', 'Conversation Cards', 'Relationship conversation starter cards', 3900, 'addon', 7),
('ADDON_FOUR_ATTACHMENT_GUIDE', 'Four Attachment Style Guide', 'Comprehensive guide to the four attachment styles', 1900, 'addon', 8),
('ADDON_HOW_TO_BOND_AVOIDANT', 'How to Bond with an Avoidant Man', 'Practical guide for connecting with avoidant partners', 1900, 'addon', 9),
('ADDON_HOW_TO_TALK_AVOIDANT', 'How to Talk to an Avoidant Man', 'Communication strategies for avoidant relationships', 1900, 'addon', 10);

-- Create index for better performance
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_active ON public.products(active);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);