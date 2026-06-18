-- iOS app push tokens. Registered by the app on launch (after the user grants
-- permission); the daily push job (api/cron/push) sends the morning story to
-- every active token via APNs.
--
-- Security: RLS on, no public policies → only the service-role key (server)
-- can read/write. The app registers through /api/app/register-token, which
-- uses the service client. Mirrors the subscribers-table access model.
CREATE TABLE IF NOT EXISTS nureine_device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,            -- APNs device token (hex)
  platform text NOT NULL DEFAULT 'ios',  -- ios | android (future)
  categories text[] DEFAULT '{}',        -- optional topic filter (empty = all)
  active boolean NOT NULL DEFAULT true,   -- set false on APNs 410 Unregistered
  last_pushed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_active
  ON nureine_device_tokens (active) WHERE active = true;

ALTER TABLE nureine_device_tokens ENABLE ROW LEVEL SECURITY;
-- No policies: locked to the service role, same as nureine_subscribers.
