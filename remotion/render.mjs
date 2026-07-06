#!/usr/bin/env node
/**
 * render.mjs — tägliches NurEine-Reel rendern (Remotion) + hochladen + einreihen.
 *
 * Pipeline (v3, Juli 2026):
 *   1. Story holen (per --slug von der API oder --data <json> für lokale Tests)
 *   2. Reel-Skript via DeepSeek (Hook ≤9 Wörter, Beats, VO-Text) — Fallback: regelbasiert
 *   3. Optional Voiceover via edge-tts (kostenlos, de-DE) mit Wort-Timestamps
 *   4. Szenen-Plan berechnen (Timings aus Textlänge, skaliert auf VO-Länge)
 *   5. Remotion rendert Komposition "ReelDaily" → MP4
 *   6. Upload nach Supabase Storage + Reel-Draft in nureine_social_posts
 *
 *   node render.mjs --base-url https://nureine.de --slug <slug> --out /tmp/reel.mp4 \
 *       [--vo | --no-vo] [--data story.json] \
 *       [--queue --story-id <id> --caption "…" --hashtags "#a,#b" --category klima]
 *
 * ENV: DEEPSEEK_API_KEY (Skript), SUPABASE_URL + SUPABASE_SERVICE_KEY (--queue),
 *      VO=1 (Voiceover an, Default AUS bis Stimm-Qualität abgenommen ist).
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { argv, env, exit } from 'node:process';
import { fileURLToPath } from 'node:url';

const FPS = 30;

function arg(name, def = null) {
	const i = argv.indexOf(`--${name}`);
	if (i === -1) return def;
	const v = argv[i + 1];
	return v && !v.startsWith('--') ? v : true;
}

// ── Extraktion (Fallbacks ohne LLM) ─────────────────────────────────────────

/** Held-Zahl + Einheit (Wort danach) aus Text. */
function extractNumber(text) {
	let m = text.match(/([−-]?\d[\d.,]*\s?(?:%|Mrd|Mio|Millionen|Milliarden|Tsd)?)\s+([A-Za-zÄÖÜäöüß]+)/);
	if (m) return { num: m[1].replace(/\s+/g, ' ').trim(), unit: m[2] };
	m = text.match(/[−-]?\d[\d.,]*\s?%/);
	if (m) return { num: m[0].replace(/\s/g, ''), unit: null };
	m = text.match(/\d[\d.,]*\s?(Mrd|Mio|Millionen|Milliarden|Tsd)\b/i);
	if (m) return { num: m[0], unit: null };
	m = text.match(/\d[\d.,]{2,}/);
	if (m) return { num: m[0], unit: null };
	return { num: null, unit: null };
}

function pickPunchWord(hook, heroNumber) {
	if (heroNumber && hook.includes(heroNumber)) return heroNumber;
	const strong = ['zum ersten Mal', 'verdoppelt', 'halbiert', 'gerettet', 'geheilt', 'besiegt', 'wächst', 'verschwindet', 'kostenlos'];
	for (const w of strong) {
		const i = hook.toLowerCase().indexOf(w.toLowerCase());
		if (i >= 0) return hook.slice(i, i + w.length);
	}
	const words = hook.split(/\s+/).filter((w) => w.length >= 6);
	return words[0] || '';
}

// ── Skript-Generierung (DeepSeek, Fallback regelbasiert) ────────────────────

function fallbackScript(story) {
	const hook = story.hook || story.title;
	const aufloesung = story.aufloesung || hook;
	return {
		hook,
		beats: [aufloesung].filter(Boolean),
		numberContext: aufloesung.length <= 90 ? aufloesung : aufloesung.slice(0, 87) + '…',
		vo: null
	};
}

async function generateScript(story) {
	const key = env.DEEPSEEK_API_KEY;
	if (!key) {
		console.log('kein DEEPSEEK_API_KEY — regelbasiertes Skript');
		return fallbackScript(story);
	}
	const prompt = `Du schreibst das Skript für ein 20-Sekunden-Instagram-Reel von "NurEine" (deutschsprachige Good-News-Plattform, Positionierung: "ehrlicher Fortschritt", belegt statt behauptet, warm aber nie kitschig, duzt).

STORY:
Titel: ${story.title}
Hook (Vorlage): ${story.hook}
Kern: ${story.aufloesung}
Region: ${story.region || '—'}
Quelle: ${story.source || '—'}

Liefere NUR ein JSON-Objekt (kein Markdown) mit exakt diesen Feldern:
{
  "hook": "Bildschirm-Hook, MAX 9 Wörter. Die überraschendste Konkretheit zuerst (Zahl, wenn vorhanden). Kein Clickbait ohne Substanz, keine Frage.",
  "beats": ["1-2 Zeilen à MAX 14 Wörter. Jede Zeile NEUE Info (Kontext/Warum es zählt) — den Hook NICHT wiederholen."],
  "numberContext": "Halbsatz MAX 12 Wörter, der die Kernzahl einordnet (was/wo/seit wann).",
  "vo": "Gesprochener Voiceover-Text, 40-55 Wörter: Hook-Satz → Kern → das überraschendste Detail → letzter Satz EXAKT: 'Schick das jemandem, der heute eine gute Nachricht braucht.' Kurze Hauptsätze, warm, klar, keine Superlativ-Floskeln."
}`;
	try {
		const r = await fetch('https://api.deepseek.com/chat/completions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
			body: JSON.stringify({
				model: 'deepseek-chat',
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.7,
				response_format: { type: 'json_object' }
			}),
			signal: AbortSignal.timeout(60000)
		});
		if (!r.ok) throw new Error(`DeepSeek ${r.status}`);
		const data = await r.json();
		const s = JSON.parse(data.choices[0].message.content);
		if (!s.hook || !Array.isArray(s.beats)) throw new Error('Skript unvollständig');
		s.beats = s.beats.filter(Boolean).slice(0, 2);
		return s;
	} catch (e) {
		console.log(`DeepSeek-Skript fehlgeschlagen (${e.message}) — regelbasiert`);
		return fallbackScript(story);
	}
}

// ── Voiceover (edge-tts) ────────────────────────────────────────────────────

function makeVoiceover(voText, slug) {
	const dir = fileURLToPath(new URL('./public/vo/', import.meta.url));
	mkdirSync(dir, { recursive: true });
	const mp3 = `${dir}${slug}.mp3`;
	const wordsPath = `/tmp/reel-words-${slug}.json`;
	const py = env.TTS_PYTHON || 'python3';
	try {
		execFileSync(py, [fileURLToPath(new URL('./scripts/tts.py', import.meta.url)), '--text', voText, '--out', mp3, '--words', wordsPath], { stdio: 'inherit', timeout: 120000 });
		const words = JSON.parse(readFileSync(wordsPath, 'utf8'));
		if (!words.length) throw new Error('keine Wort-Timestamps');
		return {
			voFile: `vo/${slug}.mp3`,
			words: words.map((w) => ({ t: w.t, start: Math.round(w.start * FPS), end: Math.round(w.end * FPS) })),
			voSeconds: words[words.length - 1].end + 0.4
		};
	} catch (e) {
		console.log(`Voiceover fehlgeschlagen (${e.message}) — Reel läuft mit Musik/Text`);
		return { voFile: null, words: null, voSeconds: 0 };
	}
}

// ── Szenen-Plan ─────────────────────────────────────────────────────────────

/** Lesedauer: ~2× laut lesen, geklemmt. */
function readFrames(text, min, max) {
	const sec = Math.min(max, Math.max(min, (text.length / 13) * 1.15));
	return Math.round(sec * FPS);
}

function buildScenes(story, script, vo) {
	const { num, unit } = extractNumber(`${story.title} ${script.hook} ${story.aufloesung || ''}`);
	const kicker = `GUTE NACHRICHT · ${(story.category || 'gemeinschaft').toUpperCase()}`;
	const scenes = [];
	let t = 0;
	const push = (sc, dur) => {
		scenes.push({ ...sc, start: t, dur });
		t += dur;
	};

	push({ kind: 'hook', text: script.hook, punch: pickPunchWord(script.hook, num), kicker }, readFrames(script.hook, 2.4, 3.4));
	if (num) {
		push({ kind: 'number', value: num, unit, context: script.numberContext || '' }, readFrames(script.numberContext || 'x'.repeat(40), 2.4, 3.4));
	}
	const beats = script.beats.length ? script.beats : [story.aufloesung];
	beats.forEach((b, i) => {
		// erstes Beat mit Story-Bild (falls vorhanden), weitere mit Figur
		push({ kind: 'beat', text: b, image: i === 0 ? story.image || null : null, pose: i % 2 === 0 ? 'point-side' : 'thinking' }, readFrames(b, 2.6, 4.2));
	});
	if (story.source) {
		push({ kind: 'proof', source: story.source, impact: story.impactScore ?? null }, 68);
	}
	push({ kind: 'end', share: story.shareHook || script.hook, cta: 'Schick’s jemandem, der das heute braucht', hasVo: !!vo.voFile }, 100);

	// Auf VO-Länge strecken: Szenen (außer Endcard) proportional skalieren, bis
	// die VO bequem VOR der Endcard endet (CTA bleibt „clean").
	if (vo.voSeconds > 0) {
		const endDur = scenes[scenes.length - 1].dur;
		const bodyTarget = Math.round(vo.voSeconds * FPS) + 10;
		const body = t - endDur;
		if (bodyTarget > body) {
			const scale = bodyTarget / body;
			let acc = 0;
			for (const sc of scenes) {
				if (sc.kind === 'end') {
					sc.start = acc;
				} else {
					sc.start = acc;
					sc.dur = Math.round(sc.dur * scale);
					acc += sc.dur;
				}
			}
			t = acc + endDur;
		}
	}
	return { scenes, duration: t, heroNum: num };
}

// ── Story holen ─────────────────────────────────────────────────────────────

async function fetchStory(baseUrl, slug) {
	const url = `${baseUrl.replace(/\/$/, '')}/api/reel-data/${slug}`;
	const r = await fetch(url);
	if (!r.ok) throw new Error(`reel-data ${r.status}`);
	return r.json();
}

// ── Upload + Queue ──────────────────────────────────────────────────────────

async function uploadToSupabase(mp4Path, slug) {
	const supa = env.SUPABASE_URL.replace(/\/$/, '');
	const key = env.SUPABASE_SERVICE_KEY;
	const bucket = env.REEL_BUCKET || 'story_images';
	const fname = `reels/${slug}-${statSync(mp4Path).size % 100000}.mp4`;
	const data = readFileSync(mp4Path);
	const r = await fetch(`${supa}/storage/v1/object/${bucket}/${fname}`, {
		method: 'POST',
		headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'video/mp4', 'x-upsert': 'true' },
		body: data
	});
	if (!r.ok) throw new Error(`Storage-Upload ${r.status}`);
	return `${supa}/storage/v1/object/public/${bucket}/${fname}`;
}

async function queueReel(storyId, videoUrl, caption, hashtags, category, hookType) {
	const supa = env.SUPABASE_URL.replace(/\/$/, '');
	const key = env.SUPABASE_SERVICE_KEY;
	const r = await fetch(`${supa}/rest/v1/nureine_social_posts`, {
		method: 'POST',
		headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
		body: JSON.stringify({
			story_id: storyId,
			platform: 'instagram',
			post_kind: 'reel',
			caption,
			hashtags,
			card_url: videoUrl,
			og_url: videoUrl,
			slide_urls: [videoUrl],
			hook_type: hookType || 'zahl',
			hook_style: 'image',
			category,
			is_carousel: false,
			status: 'draft',
			// sofort fällig — sonst findet publishDue (lte scheduled_for) den Draft nie
			scheduled_for: new Date().toISOString()
		})
	});
	if (!r.ok) throw new Error(`Queue-Insert ${r.status}`);
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
	const baseUrl = arg('base-url');
	const slug = arg('slug') || 'local-test';
	const out = arg('out') || `/tmp/reel-${slug}.mp4`;
	const dataFile = arg('data');

	const story = dataFile ? JSON.parse(readFileSync(dataFile, 'utf8')) : await fetchStory(baseUrl, slug);

	const script = await generateScript(story);
	console.log('skript:', JSON.stringify(script).slice(0, 240));

	// VO: Default AUS (Stimm-Qualität muss einmal abgenommen werden) — an per --vo oder VO=1.
	const voWanted = arg('no-vo') ? false : arg('vo') === true || env.VO === '1';
	const vo = voWanted && script.vo ? makeVoiceover(script.vo, slug) : { voFile: null, words: null, voSeconds: 0 };

	const { scenes, duration } = buildScenes(story, script, vo);

	// Musik deterministisch variieren (per Slug), damit der Feed nicht monoton klingt.
	let h = 0;
	for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
	const music = ['audio/hope-1.wav', 'audio/calm-1.wav'][h % 2];

	const props = {
		scenes,
		category: story.category || 'gemeinschaft',
		seed: slug,
		voFile: vo.voFile,
		musicFile: music,
		words: vo.words,
		durationInFrames: duration
	};
	const propsPath = `/tmp/reel-props-${slug}.json`;
	writeFileSync(propsPath, JSON.stringify(props));
	console.log(`szenen: ${scenes.map((s) => s.kind).join(' → ')} | ${Math.round(duration / FPS)}s | VO: ${vo.voFile ? 'ja' : 'nein'}`);

	execFileSync('npx', ['remotion', 'render', 'ReelDaily', out, `--props=${propsPath}`, '--log=error'], {
		stdio: 'inherit',
		cwd: fileURLToPath(new URL('.', import.meta.url))
	});
	console.log(`OK reel → ${out} (${Math.round(statSync(out).size / 1024)} KB)`);

	if (arg('upload') || arg('queue')) {
		const videoUrl = await uploadToSupabase(out, slug);
		console.log(`OK upload → ${videoUrl}`);
		if (arg('queue')) {
			const storyId = arg('story-id');
			if (!storyId) throw new Error('--queue braucht --story-id');
			const tags = (arg('hashtags') || '').split(',').map((t) => t.trim()).filter(Boolean);
			await queueReel(storyId, videoUrl, arg('caption') || '', tags, arg('category') || 'gemeinschaft', story.igHookType);
			console.log('OK reel-draft angelegt (status=draft)');
		}
	}
}

main().catch((e) => {
	console.error('FEHLER:', e.message);
	exit(1);
});
