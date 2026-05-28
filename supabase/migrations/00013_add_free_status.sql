-- 00013: Add 'free' status for B2B clients (no pilot, no pricing, always free)

ALTER TABLE nureine_b2b_clients
  DROP CONSTRAINT IF EXISTS nureine_b2b_clients_status_check;

ALTER TABLE nureine_b2b_clients
  ADD CONSTRAINT nureine_b2b_clients_status_check
  CHECK (status IN ('lead', 'pilot', 'paid', 'churned', 'free'));
