-- 00012: B2B branding configuration
-- Adds per-client white-label settings as JSONB

ALTER TABLE nureine_b2b_clients
  ADD COLUMN IF NOT EXISTS branding_config jsonb
  DEFAULT '{"show_logo": true, "show_branding": true, "branding_text": null}'::jsonb;

-- Set default for existing rows
UPDATE nureine_b2b_clients
  SET branding_config = '{"show_logo": true, "show_branding": true, "branding_text": null}'::jsonb
  WHERE branding_config IS NULL;
