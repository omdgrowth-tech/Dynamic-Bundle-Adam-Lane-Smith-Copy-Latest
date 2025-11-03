-- Add 50-min Private Consultation product to products table
INSERT INTO public.products (
  sku,
  title,
  description,
  price_cents,
  type,
  active,
  sort_order
) VALUES (
  'breakthrough-call',
  '50-min Private Consultation',
  'Receive a 50 minute video call with a Certified Attachment Coach to discuss your relationship, address your questions, and assess how attachment patterns are impacting your life. Get expert feedback and recommendations, plus a complete rundown of resources we offer to accelerate your transformation.',
  80000,
  'coaching_program',
  true,
  45
)
ON CONFLICT (sku) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  type = EXCLUDED.type,
  active = EXCLUDED.active,
  sort_order = EXCLUDED.sort_order;