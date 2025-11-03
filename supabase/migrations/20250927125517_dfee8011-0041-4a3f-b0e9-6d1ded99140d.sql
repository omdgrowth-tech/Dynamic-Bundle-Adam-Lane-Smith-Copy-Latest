-- Update existing product SKUs to match frontend data and add missing products
UPDATE public.products SET sku = 'COURSE_AVOIDANT_MAN' WHERE sku = 'COURSE_LOVE_AVOIDANT_MAN';
UPDATE public.products SET sku = 'COURSE_ATTACHMENT_BOOTCAMP' WHERE sku = 'COURSE_BOOTCAMP';
UPDATE public.products SET sku = 'ASSESSMENT_SINGLES' WHERE sku = 'COURSE_ASSESSMENT_SINGLES';
UPDATE public.products SET sku = 'ASSESSMENT_COUPLES' WHERE sku = 'COURSE_ASSESSMENT_COUPLES';
UPDATE public.products SET sku = 'GROUP_COACHING_6_MONTH' WHERE sku = 'COURSE_GROUP_COACHING';
UPDATE public.products SET sku = 'GUIDE_4_STYLES' WHERE sku = 'ADDON_FOUR_ATTACHMENT_GUIDE';
UPDATE public.products SET sku = 'MINI_TALK_AVOIDANT' WHERE sku = 'ADDON_HOW_TO_TALK_AVOIDANT';
UPDATE public.products SET sku = 'GUIDE_BOND_AVOIDANT' WHERE sku = 'ADDON_HOW_TO_BOND_AVOIDANT';
UPDATE public.products SET sku = 'CONVERSATION_CARDS' WHERE sku = 'ADDON_CONVERSATION_CARDS';

-- Update prices to match frontend data (converting from dollars to cents)
UPDATE public.products SET price_cents = 49700 WHERE sku = 'COURSE_AVOIDANT_MAN';
UPDATE public.products SET price_cents = 84700 WHERE sku = 'COURSE_SECURE_MARRIAGE';
UPDATE public.products SET price_cents = 49700 WHERE sku = 'COURSE_ATTACHMENT_BOOTCAMP';
UPDATE public.products SET price_cents = 199500 WHERE sku = 'ASSESSMENT_SINGLES';
UPDATE public.products SET price_cents = 399000 WHERE sku = 'ASSESSMENT_COUPLES';
UPDATE public.products SET price_cents = 142700 WHERE sku = 'GROUP_COACHING_6_MONTH';
UPDATE public.products SET price_cents = 19600 WHERE sku = 'GUIDE_4_STYLES';
UPDATE public.products SET price_cents = 9900 WHERE sku = 'MINI_TALK_AVOIDANT';
UPDATE public.products SET price_cents = 4900 WHERE sku = 'GUIDE_BOND_AVOIDANT';
UPDATE public.products SET price_cents = 4900 WHERE sku = 'CONVERSATION_CARDS';

-- Update product types to match frontend
UPDATE public.products SET type = 'coaching_program' WHERE sku IN ('ASSESSMENT_SINGLES', 'ASSESSMENT_COUPLES', 'GROUP_COACHING_6_MONTH');
UPDATE public.products SET type = 'addon' WHERE sku IN ('GUIDE_4_STYLES', 'MINI_TALK_AVOIDANT', 'GUIDE_BOND_AVOIDANT', 'CONVERSATION_CARDS');

-- Update descriptions to match frontend
UPDATE public.products SET 
  title = 'How to Love an Avoidant Man',
  description = 'Discover the attachment-driven approach that helps avoidant men fall deeply in love. Dive deep into avoidant behaviors and how to reverse them through bonding and connection.'
WHERE sku = 'COURSE_AVOIDANT_MAN';

UPDATE public.products SET 
  title = 'How to Build a Secure Marriage',
  description = 'Learn how to resolve recurring conflicts, rebuild trust & intimacy, activate deep neurochemical bonding and build a happy, fulfilling marriage that lasts a lifetime.'
WHERE sku = 'COURSE_SECURE_MARRIAGE';

UPDATE public.products SET 
  title = 'Attachment Bootcamp',
  description = 'The complete system to rebuilding your attachment style and breaking free from restrictive relationships and lifelong insecurities.'
WHERE sku = 'COURSE_ATTACHMENT_BOOTCAMP';

UPDATE public.products SET 
  title = 'Attachment Assessment - Singles Only',
  description = 'An 80-min private Coach-led Assessment and 30-min Relationship Strategy call to identify your attachment style & insecure patterns, and plan a breakthrough.'
WHERE sku = 'ASSESSMENT_SINGLES';

UPDATE public.products SET 
  title = 'Attachment Assessment - Couples',
  description = 'Two 80-min private Coach-led Assessments and 30-min Relationship Strategy calls to help couples transform their attachment together.'
WHERE sku = 'ASSESSMENT_COUPLES';

UPDATE public.products SET 
  title = 'Group Coaching - 6 Month Membership',
  description = 'Featuring 12 live Adam-led exclusive masterclasses per week and a thriving global community, this program offers extensive support & transformation.'
WHERE sku = 'GROUP_COACHING_6_MONTH';

UPDATE public.products SET 
  title = 'Four Attachment Style Guide',
  description = 'The Ultimate Attachment reference bundle – featuring 4 in-depth guides on each of the attachment styles.'
WHERE sku = 'GUIDE_4_STYLES';

UPDATE public.products SET 
  title = 'How To Talk To An Avoidant Man',
  description = 'This mini course includes scripts and setups to connect with an avoidant without triggering withdrawal.'
WHERE sku = 'MINI_TALK_AVOIDANT';

UPDATE public.products SET 
  title = 'How To Bond With An Avoidant Man',
  description = 'A detailed guide and step-by-step bonding framework for bonding with avoidant partners.'
WHERE sku = 'GUIDE_BOND_AVOIDANT';

UPDATE public.products SET 
  title = '30 Conversation Cards',
  description = 'Expert-crafted, detailed conversation prompts to practice curiosity, safety, and shared meaning.'
WHERE sku = 'CONVERSATION_CARDS';