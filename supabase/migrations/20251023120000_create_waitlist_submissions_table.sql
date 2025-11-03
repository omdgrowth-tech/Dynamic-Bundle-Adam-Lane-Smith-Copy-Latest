-- Create waitlist_submissions table
CREATE TABLE waitlist_submissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    product_title text NOT NULL,
    product_sku text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX idx_waitlist_submissions_email ON waitlist_submissions(email);

-- Create index on product_sku for filtering by product
CREATE INDEX idx_waitlist_submissions_product_sku ON waitlist_submissions(product_sku);

-- Create index on created_at for date-based queries
CREATE INDEX idx_waitlist_submissions_created_at ON waitlist_submissions(created_at);

-- Enable Row Level Security
ALTER TABLE waitlist_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for the waitlist_submissions table
-- Allow service role to read and write
CREATE POLICY "Service role can do everything" ON waitlist_submissions
FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to insert their own submissions
CREATE POLICY "Users can insert waitlist submissions" ON waitlist_submissions
FOR INSERT WITH CHECK (true);

-- Allow authenticated users to read all submissions (for admin purposes)
CREATE POLICY "Authenticated users can read waitlist submissions" ON waitlist_submissions
FOR SELECT USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_waitlist_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_waitlist_submissions_updated_at
    BEFORE UPDATE ON waitlist_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_waitlist_submissions_updated_at();