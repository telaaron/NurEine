import { json, error } from '@sveltejs/kit';
// dynamic/private statt static: OPENAI_TTS_API_KEY ist optional (noch kein Key gesetzt) —
// static-Import würde sonst den Build crashen, sobald die Var fehlt.
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';

const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = env.ELEVENLABS_VOICE_ID;
const OPENAI_TTS_API_KEY = env.OPENAI_TTS_API_KEY;
const SUPABASE_URL = env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY!;

const ELEVENLABS_MODEL = 'eleven_multilingual_v2';
const AUDIO_BUCKET = 'story_audio';
const MAX_CHARS = 2000;

/**
 * POST /api/admin/stories/[id]/generate-audio
 * Generiert Audio via ElevenLabs (oder OpenAI Fallback) für eine einzelne Story.
 * Nur für Admin-Tests und manuelles Nachgenerieren.
 */
export async function POST({ params, fetch }) {
  const storyId = params.id;

  // 1. Story-Daten laden
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: story, error: fetchErr } = await supabase
    .from('nureine_stories')
    .select('id,title,body_markdown,summary,audio_url')
    .eq('id', storyId)
    .single();

  if (fetchErr || !story) {
    throw error(404, 'Story nicht gefunden');
  }

  const textToRead = story.body_markdown || story.summary || '';
  if (textToRead.length < 100) {
    throw error(400, 'Zu wenig Text in der Story (min. 100 Zeichen)');
  }

  let audioUrl: string | null = null;
  let provider: string = 'none';

  // 2. ElevenLabs probieren
  if (ELEVENLABS_API_KEY) {
    const trimmed = trimToSentenceEnd(textToRead, MAX_CHARS);
    const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID || '9BWtsMINqrJLrRnm1DdZ'}`;

    try {
      const resp = await fetch(ttsUrl, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: trimmed,
          model_id: ELEVENLABS_MODEL,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.1,
            speaker_boost: false
          }
        })
      });

      if (resp.ok) {
        const mp3Data = await resp.arrayBuffer();
        const fileName = `${storyId}.mp3`;

        // Upload nach Supabase Storage
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${AUDIO_BUCKET}/${fileName}`;
        const uploadResp = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'audio/mpeg'
          },
          body: mp3Data
        });

        if (uploadResp.ok || uploadResp.status === 200 || uploadResp.status === 201) {
          audioUrl = `${SUPABASE_URL}/storage/v1/object/public/${AUDIO_BUCKET}/${fileName}`;
          provider = 'elevenlabs';
        } else {
          console.error('[audio] Upload failed:', uploadResp.status, await uploadResp.text());
        }
      } else {
        console.warn('[audio] ElevenLabs failed:', resp.status, await resp.text().catch(() => ''));
      }
    } catch (e) {
      console.warn('[audio] ElevenLabs error:', e);
    }
  }

  // 3. Fallback: OpenAI TTS
  if (!audioUrl && OPENAI_TTS_API_KEY) {
    const trimmed = trimToSentenceEnd(textToRead, MAX_CHARS);
    try {
      const resp = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_TTS_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-tts',
          voice: 'nova',
          input: trimmed,
          response_format: 'mp3'
        })
      });

      if (resp.ok) {
        const mp3Data = await resp.arrayBuffer();
        const fileName = `${storyId}.mp3`;

        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${AUDIO_BUCKET}/${fileName}`;
        const uploadResp = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'audio/mpeg'
          },
          body: mp3Data
        });

        if (uploadResp.ok || uploadResp.status === 200 || uploadResp.status === 201) {
          audioUrl = `${SUPABASE_URL}/storage/v1/object/public/${AUDIO_BUCKET}/${fileName}`;
          provider = 'openai';
        }
      } else {
        console.warn('[audio] OpenAI TTS failed:', resp.status, await resp.text().catch(() => ''));
      }
    } catch (e) {
      console.warn('[audio] OpenAI TTS error:', e);
    }
  }

  if (!audioUrl) {
    throw error(500, 'Audio-Generierung fehlgeschlagen — weder ElevenLabs noch OpenAI verfügbar');
  }

  // 4. audio_url in DB speichern
  const { error: updateErr } = await supabase
    .from('nureine_stories')
    .update({ audio_url: audioUrl })
    .eq('id', storyId);

  if (updateErr) {
    console.error('[audio] DB update failed:', updateErr);
    throw error(500, 'Audio gespeichert aber DB-Update fehlgeschlagen');
  }

  return json({
    success: true,
    audio_url: audioUrl,
    provider,
    story_title: story.title
  });
}

function trimToSentenceEnd(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const searchFrom = Math.max(0, maxChars - 200);
  const lastPeriod = text.lastIndexOf('.', maxChars);
  const lastExcl = text.lastIndexOf('!', maxChars);
  const lastQues = text.lastIndexOf('?', maxChars);
  const cut = Math.max(lastPeriod, lastExcl, lastQues);
  if (cut > maxChars / 2) return text.slice(0, cut + 1);
  return text.slice(0, maxChars);
}
