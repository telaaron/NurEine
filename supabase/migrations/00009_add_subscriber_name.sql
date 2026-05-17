-- 00009: Add name column to subscribers
-- B2C is now completely free — we store name for personalization

ALTER TABLE nureine_subscribers ADD COLUMN IF NOT EXISTS name TEXT;
