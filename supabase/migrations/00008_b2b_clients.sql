-- 00008: B2B client management
-- Adds b2b_clients table and delivery_log table

-- B2B clients table
CREATE TABLE IF NOT EXISTS nureine_b2b_clients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name text NOT NULL,
    contact_name text,
    contact_email text,
    contact_phone text,
    status text NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'pilot', 'paid', 'churned')),
    pilot_ends_at timestamptz,
    mrr_value numeric DEFAULT 499 NOT NULL,
    integration_type text NOT NULL DEFAULT 'email' CHECK (integration_type IN ('email', 'webhook', 'iframe')),
    integration_target text NOT NULL,
    invoice_status text DEFAULT 'offen' CHECK (invoice_status IN ('bezahlt', 'offen', 'storniert')),
    notes text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Delivery log tracks B2B newsletter deliveries
CREATE TABLE IF NOT EXISTS nureine_delivery_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    b2b_client_id uuid REFERENCES nureine_b2b_clients(id) ON DELETE CASCADE,
    story_id uuid REFERENCES nureine_stories(id) ON DELETE SET NULL,
    integration_type text NOT NULL,
    integration_target text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    status_code integer,
    error_message text,
    sent_at timestamptz DEFAULT now() NOT NULL
);

-- Add delivery_log tracking to newsletter_sends for B2B correlation
ALTER TABLE nureine_newsletter_sends ADD COLUMN IF NOT EXISTS b2b_client_id uuid REFERENCES nureine_b2b_clients(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE nureine_b2b_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE nureine_delivery_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access these tables
CREATE POLICY "Service role full access" ON nureine_b2b_clients
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON nureine_delivery_log
    FOR ALL USING (true) WITH CHECK (true);
