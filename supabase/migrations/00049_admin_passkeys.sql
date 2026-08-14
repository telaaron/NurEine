-- Passkeys (WebAuthn) für den Admin-Login per Face ID / Touch ID.
-- Speichert NUR öffentliche Schlüssel — das Geheimnis (privater Schlüssel)
-- bleibt in der Secure Enclave des iPhones/Macs und verlässt das Gerät nie.
-- Single-Admin: user_handle ist konstant ('admin'), mehrere Geräte möglich.
CREATE TABLE IF NOT EXISTS nureine_admin_passkeys (
  id             text PRIMARY KEY,
  public_key     bytea NOT NULL,
  counter        bigint NOT NULL DEFAULT 0,
  transports     text[],
  device_label   text,
  user_handle    text NOT NULL DEFAULT 'admin',
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_used_at   timestamptz
);

CREATE TABLE IF NOT EXISTS nureine_webauthn_challenges (
  id           text PRIMARY KEY,
  challenge    text NOT NULL,
  kind         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE nureine_admin_passkeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE nureine_webauthn_challenges ENABLE ROW LEVEL SECURITY;
