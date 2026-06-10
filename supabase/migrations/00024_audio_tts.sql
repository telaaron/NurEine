-- ============================================================
-- 00024: Audio-TTS — ElevenLabs/gpt-4o-mini-tts Vorlesen
-- ============================================================
-- Fügt audio_url zu nureine_stories hinzu.
-- Nur Top-2-Stories nach Wirkungsindex erhalten Audio.
-- ============================================================

ALTER TABLE nureine_stories
  ADD COLUMN IF NOT EXISTS audio_url TEXT;

COMMENT ON COLUMN nureine_stories.audio_url IS 'Öffentliche URL zur MP3-Vorlesedatei. Nur für Top-2-Stories pro Tag gesetzt.';
