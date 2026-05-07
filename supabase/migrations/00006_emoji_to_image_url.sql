-- Migration 00006: Replace emoji column with image_url
-- The emoji approach is replaced by AI-generated story images stored in Supabase Storage.

-- Drop the old emoji column, add image_url
ALTER TABLE nureine_stories
  DROP COLUMN IF EXISTS emoji,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add a storage bucket policy note (the bucket itself must be created via Supabase dashboard
-- or Management API; this migration just documents the requirement):
-- Bucket: story_images (Public)
-- Required policy: SELECT for public (so images load on the frontend)
-- Required policy: INSERT for service_role (so the pipeline can upload)
