import { json, error } from '@sveltejs/kit';
// dynamic/private statt static: OPENAI_TTS_API_KEY ist optional (noch kein Key gesetzt) —
// static-Import würde sonst den Build crashen, sobald die Var fehlt.
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminRequest } from '$lib/server/auth';

const ELEVENLABS_API_KEY = env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = env.ELEVENLABS_VOICE_ID;
const OPENAI_TTS_API_KEY = env.OPENAI_TTS_API_KEY;
const SUPABASE_URL = env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY!;

// v3: unterstützt Audio-Tags ([warmly], [thoughtful pause] …) für ausdrucksstärkere,
// zur Story passende Betonung. Fallback v2 nur falls v3 mal nicht verfügbar.
const ELEVENLABS_MODEL = 'eleven_v3';
const AUDIO_BUCKET = 'story_audio';
const MAX_CHARS = 2000;

// Emotion (relief/wonder/hope/pride/warmth) → passender Eröffnungs-Audio-Tag + Grundton.
// Dezent: ein Tag am Anfang setzt den Ton, der Rest bleibt natürlich (kein Tag-Spam).
const EMOTION_TAGS: Record<string, string> = {
	relief: '[gently]',
	wonder: '[with quiet wonder]',
	hope: '[warmly]',
	pride: '[warmly]',
	warmth: '[warmly]'
};

/** Setzt einen dezenten Eröffnungs-Tag + eine Atempause nach dem ersten Satz. */
function withAudioTags(text: string, emotion: string | null): string {
	const opener = (emotion && EMOTION_TAGS[emotion]) || '[warmly]';
	// Nach dem ersten Satz eine kurze, natürliche Pause einfügen (max. 1×, dezent).
	const firstStop = text.search(/[.!?]\s/);
	if (firstStop > 20 && firstStop < text.length - 10) {
		const head = text.slice(0, firstStop + 1);
		const tail = text.slice(firstStop + 1).trimStart();
		return `${opener} ${head} [thoughtful pause] ${tail}`;
	}
	return `${opener} ${text}`;
}

/**
 * POST /api/admin/stories/[id]/generate-audio
 * Generiert Audio via ElevenLabs (oder OpenAI Fallback) für eine einzelne Story.
 * Nur für Admin-Tests und manuelles Nachgenerieren.
 */
export async function POST({ params, fetch, url, cookies }) {
  if (!verifyAdminRequest(cookies)) return json({ error: 'Unauthorized' }, { status: 401 });
  const storyId = params.id;
  // Token-Spar-Modus: 'summary' (default) liest nur die 4-Satz-Zusammenfassung
  // (~400 Zeichen), 'full' den ganzen Artikel. Default summary, damit Tests +
  // der Live-Betrieb nicht das ElevenLabs-Kontingent sprengen.
  const mode = url.searchParams.get('mode') === 'full' ? 'full' : 'summary';

  // 1. Story-Daten laden
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: story, error: fetchErr } = await supabase
    .from('nureine_stories')
    .select('id,title,body_markdown,summary,audio_url,emotion')
    .eq('id', storyId)
    .single();

  if (fetchErr || !story) {
    throw error(404, 'Story nicht gefunden');
  }

  const rawText = mode === 'full'
    ? (story.body_markdown || story.summary || '')
    : (story.summary || story.body_markdown || '');
  if (rawText.length < 60) {
    throw error(400, 'Zu wenig Text in der Story (min. 60 Zeichen)');
  }
  // Audio-Tags nach Story-Emotion (dezent) — nur fürs ausdrucksstärkere v3-Modell.
  const textToRead = ELEVENLABS_MODEL === 'eleven_v3'
    ? withAudioTags(rawText, story.emotion)
    : rawText;

  let audioUrl: string | null = null;
  let provider: string = 'none';

  // 2. ElevenLabs probieren
  if (ELEVENLABS_API_KEY) {
    const trimmed = trimToSentenceEnd(textToRead, MAX_CHARS);
    const ttsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb'}`;

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
    model: ELEVENLABS_MODEL,
    emotion: story.emotion ?? null,
    chars: textToRead.length,
    story_title: story.title
  });
}

/**
 * DELETE /api/admin/stories/[id]/generate-audio
 * Entfernt die Vertonung spurlos: löscht die MP3 aus dem Storage UND setzt
 * audio_url=null, sodass der Player im Artikel verschwindet.
 */
export async function DELETE({ params, cookies }) {
  if (!verifyAdminRequest(cookies)) return json({ error: 'Unauthorized' }, { status: 401 });
  const storyId = params.id;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  // Storage-Datei löschen (best-effort) …
  await supabase.storage.from(AUDIO_BUCKET).remove([`${storyId}.mp3`]).catch(() => {});
  // … und die Verknüpfung in der Story entfernen.
  const { error: updErr } = await supabase
    .from('nureine_stories')
    .update({ audio_url: null })
    .eq('id', storyId);
  if (updErr) return json({ error: 'DB-Update fehlgeschlagen' }, { status: 500 });
  return json({ success: true });
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
