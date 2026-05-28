-- Add logo_url column to B2B clients table
-- Allows branding the B2B newsletter with the client's company logo
ALTER TABLE nureine_b2b_clients ADD COLUMN IF NOT EXISTS logo_url text;
