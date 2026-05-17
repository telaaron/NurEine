-- 00010: Remove 'plus' from tier options — B2C is now entirely free
-- Only B2B remains as a paid option

-- Step 1: Migrate existing 'plus' subscribers to 'free'
UPDATE nureine_subscribers SET tier = 'free' WHERE tier = 'plus';

-- Step 2: Drop and recreate the CHECK constraint without 'plus'
ALTER TABLE nureine_subscribers DROP CONSTRAINT IF EXISTS nureine_subscribers_tier_check;
ALTER TABLE nureine_subscribers ADD CONSTRAINT nureine_subscribers_tier_check
  CHECK (tier IN ('free', 'b2b'));
