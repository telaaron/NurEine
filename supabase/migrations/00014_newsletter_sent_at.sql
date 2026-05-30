-- Migration: Add newsletter_sent_at to stories for deduplication
-- Prevents the same story from being sent as newsletter hero on consecutive days.

ALTER TABLE nureine_stories
ADD COLUMN IF NOT EXISTS newsletter_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN nureine_stories.newsletter_sent_at IS 'Timestamp when this story was last sent as newsletter hero. Used to prevent duplicate sends.';
