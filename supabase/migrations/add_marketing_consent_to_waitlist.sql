-- Add marketing consent fields to waitlist_submissions table

ALTER TABLE waitlist_submissions 
ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS marketing_consent boolean DEFAULT false NOT NULL;

-- Add comment to document the fields
COMMENT ON COLUMN waitlist_submissions.terms_accepted IS 'User has accepted Terms & Conditions and Privacy Policy';
COMMENT ON COLUMN waitlist_submissions.marketing_consent IS 'User has opted in to receive marketing communications';
